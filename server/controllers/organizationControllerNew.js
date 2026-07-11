// server/controllers/organizationControllerNew.js
import Organization from "../models/organizationModel.js";
import Membership from "../models/membershipModel.js";
import userModel from "../models/userModel.js";
import crypto from "crypto";

/**
 * Generate a unique slug from organization name
 */
const generateSlug = (name) => {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const randomSuffix = crypto.randomBytes(3).toString("hex");
  return `${baseSlug}-${randomSuffix}`;
};

/**
 * ✅ Create Organization
 * POST /api/organizations
 */
export const createOrganization = async (req, res) => {
  try {
    const { name, description, logo, visibility, metadata } = req.body;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Organization name is required." });
    }

    const userId = req.user.id;
    const orgName = name.trim();

    // Check if organization with same name exists (case-insensitive)
    const existingOrg = await Organization.findOne({
      name: { $regex: `^${orgName}$`, $options: "i" },
    });

    if (existingOrg) {
      return res
        .status(409)
        .json({ success: false, message: "Organization with this name already exists." });
    }

    // Generate unique slug
    const slug = generateSlug(orgName);

    // Create organization
    const organization = await Organization.create({
      name: orgName,
      slug,
      description: description || "",
      logo: logo || "",
      visibility: visibility || "private",
      owner: userId,
      metadata: metadata || {},
    });

    // Create admin membership for the owner
    await Membership.create({
      user: userId,
      organization: organization._id,
      role: "admin",
      status: "active",
    });

    // Update user model for backward compatibility
    await userModel.findByIdAndUpdate(userId, {
      role: "admin",
      organization: organization._id,
      hasCompletedOnboarding: true,
    });

    res.status(201).json({
      success: true,
      message: "Organization created successfully.",
      organization,
    });
  } catch (error) {
    console.error("❌ Error creating organization:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Organization slug already exists." });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get All Organizations
 * GET /api/organizations
 */
export const getOrganizations = async (req, res) => {
  try {
    const { visibility, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (visibility) {
      filter.visibility = visibility;
    }

    const organizations = await Organization.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("name slug description logo visibility owner createdAt");

    const total = await Organization.countDocuments(filter);

    res.status(200).json({
      success: true,
      organizations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching organizations:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get Organization by ID or Slug
 * GET /api/organizations/:idOrSlug
 */
export const getOrganizationById = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    const organization = await Organization.findOne({
      $or: [{ _id: idOrSlug }, { slug: idOrSlug }],
    }).populate("owner", "name email");

    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    res.status(200).json({ success: true, organization });
  } catch (error) {
    console.error("❌ Error fetching organization:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Update Organization
 * PUT /api/organizations/:id
 */
export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, logo, visibility, metadata } = req.body;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    // Check if user is owner or admin
    const membership = await Membership.findOne({
      user: req.user.id,
      organization: id,
      role: "admin",
      status: "active",
    });

    if (!membership && organization.owner.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to update this organization." });
    }

    // Update fields
    if (name) organization.name = name.trim();
    if (description !== undefined) organization.description = description;
    if (logo !== undefined) organization.logo = logo;
    if (visibility) organization.visibility = visibility;
    if (metadata) organization.metadata = metadata;

    await organization.save();

    res.status(200).json({
      success: true,
      message: "Organization updated successfully.",
      organization,
    });
  } catch (error) {
    console.error("❌ Error updating organization:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Delete Organization
 * DELETE /api/organizations/:id
 */
export const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    // Only owner can delete
    if (organization.owner.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to delete this organization." });
    }

    // Delete all memberships
    await Membership.deleteMany({ organization: id });

    // Delete organization
    await Organization.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Error deleting organization:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get Organization Members
 * GET /api/organizations/:id/members
 */
export const getOrganizationMembers = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    // Check if user is a member
    const membership = await Membership.findOne({
      user: req.user.id,
      organization: id,
      status: "active",
    });

    if (!membership) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this organization." });
    }

    // Get all active memberships with user details
    const memberships = await Membership.find({
      organization: id,
      status: "active",
    })
      .populate("user", "name email profilePic isAccountVerified createdAt")
      .sort({ joinedAt: -1 });

    const members = memberships.map((m) => ({
      _id: m.user._id,
      name: m.user.name,
      email: m.user.email,
      profilePic: m.user.profilePic,
      isAccountVerified: m.user.isAccountVerified,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    res.status(200).json({
      success: true,
      members,
      organizationName: organization.name,
    });
  } catch (error) {
    console.error("❌ Error fetching organization members:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
