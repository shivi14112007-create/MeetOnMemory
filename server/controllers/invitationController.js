// server/controllers/invitationController.js
import Invitation from "../models/invitationModel.js";
import Membership from "../models/membershipModel.js";
import Organization from "../models/organizationModel.js";
import userModel from "../models/userModel.js";
import crypto from "crypto";

/**
 * Generate unique invitation token
 */
const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * ✅ Create Invitation
 * POST /api/invitations
 */
export const createInvitation = async (req, res) => {
  try {
    const { organizationId, email, role, message, expiresIn } = req.body;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    if (!organizationId || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Organization ID and email are required." });
    }

    const userId = req.user.id;

    // Check if organization exists
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    // Check if user is admin or owner
    const membership = await Membership.findOne({
      user: userId,
      organization: organizationId,
      role: "admin",
      status: "active",
    });

    const isOwner = organization.owner.toString() === userId.toString();

    if (!membership && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to create invitations." });
    }

    // Check if email already has an active membership
    const existingUser = await userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const existingMembership = await Membership.findOne({
        user: existingUser._id,
        organization: organizationId,
        status: "active",
      });

      if (existingMembership) {
        return res
          .status(400)
          .json({ success: false, message: "User is already a member of this organization." });
      }
    }

    // Check if there's a pending invitation for this email
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      organization: organizationId,
      status: "pending",
    });

    if (existingInvitation) {
      return res
        .status(409)
        .json({ success: false, message: "Pending invitation already exists for this email." });
    }

    // Calculate expiration time (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresIn || 7));

    // Create invitation
    const invitation = await Invitation.create({
      organization: organizationId,
      email: email.toLowerCase(),
      invitedBy: userId,
      token: generateInvitationToken(),
      role: role || "member",
      status: "pending",
      expiresAt,
      message: message || "",
    });

    res.status(201).json({
      success: true,
      message: "Invitation created successfully.",
      invitation,
    });
  } catch (error) {
    console.error("❌ Error creating invitation:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Duplicate invitation not allowed." });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get Organization Invitations
 * GET /api/invitations/organization/:organizationId
 */
export const getOrganizationInvitations = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { status } = req.query;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found." });
    }

    // Check if user is admin or owner
    const membership = await Membership.findOne({
      user: req.user.id,
      organization: organizationId,
      role: "admin",
      status: "active",
    });

    const isOwner = organization.owner.toString() === req.user.id.toString();

    if (!membership && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to view invitations." });
    }

    const filter = { organization: organizationId };
    if (status) {
      filter.status = status;
    }

    const invitations = await Invitation.find(filter)
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, invitations });
  } catch (error) {
    console.error("❌ Error fetching invitations:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get User's Invitations
 * GET /api/invitations/user
 */
export const getUserInvitations = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const invitations = await Invitation.find({
      email: user.email,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("organization", "name slug description logo")
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, invitations });
  } catch (error) {
    console.error("❌ Error fetching user invitations:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Accept Invitation
 * POST /api/invitations/:token/accept
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const invitation = await Invitation.findOne({ token }).populate(
      "organization"
    );

    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found." });
    }

    if (invitation.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Invitation is not in pending status." });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      return res
        .status(400)
        .json({ success: false, message: "Invitation has expired." });
    }

    // Verify email matches
    const user = await userModel.findById(req.user.id);

    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res
        .status(403)
        .json({ success: false, message: "Invitation is not for this user." });
    }

    // Check if user already has an active membership
    const existingMembership = await Membership.findOne({
      user: req.user.id,
      organization: invitation.organization._id,
      status: "active",
    });

    if (existingMembership) {
      return res
        .status(400)
        .json({ success: false, message: "Already a member of this organization." });
    }

    // Update invitation status
    invitation.status = "accepted";
    invitation.acceptedBy = req.user.id;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Create membership
    const newMembership = await Membership.create({
      user: req.user.id,
      organization: invitation.organization._id,
      role: invitation.role,
      status: "active",
    });

    // Update user model for backward compatibility
    await userModel.findByIdAndUpdate(req.user.id, {
      role: invitation.role,
      organization: invitation.organization._id,
      hasCompletedOnboarding: true,
    });

    res.status(200).json({
      success: true,
      message: "Invitation accepted successfully.",
      invitation,
      membership: newMembership,
    });
  } catch (error) {
    console.error("❌ Error accepting invitation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Reject Invitation
 * POST /api/invitations/:token/reject
 */
export const rejectInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found." });
    }

    if (invitation.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Invitation is not in pending status." });
    }

    // Verify email matches
    const user = await userModel.findById(req.user.id);

    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res
        .status(403)
        .json({ success: false, message: "Invitation is not for this user." });
    }

    // Update invitation status
    invitation.status = "rejected";
    await invitation.save();

    res.status(200).json({
      success: true,
      message: "Invitation rejected successfully.",
      invitation,
    });
  } catch (error) {
    console.error("❌ Error rejecting invitation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Revoke Invitation
 * DELETE /api/invitations/:id
 */
export const revokeInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }

    const invitation = await Invitation.findById(id).populate("organization");

    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found." });
    }

    // Check if user is admin or owner
    const membership = await Membership.findOne({
      user: req.user.id,
      organization: invitation.organization._id,
      role: "admin",
      status: "active",
    });

    const isOwner =
      invitation.organization.owner.toString() === req.user.id.toString();

    if (!membership && !isOwner) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to revoke invitations." });
    }

    if (invitation.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Can only revoke pending invitations." });
    }

    invitation.status = "revoked";
    await invitation.save();

    res.status(200).json({
      success: true,
      message: "Invitation revoked successfully.",
      invitation,
    });
  } catch (error) {
    console.error("❌ Error revoking invitation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get Invitation by Token
 * GET /api/invitations/:token
 */
export const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate("organization", "name slug description logo")
      .populate("invitedBy", "name email");

    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found." });
    }

    if (invitation.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Invitation is not in pending status." });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      return res
        .status(400)
        .json({ success: false, message: "Invitation has expired." });
    }

    res.status(200).json({ success: true, invitation });
  } catch (error) {
    console.error("❌ Error fetching invitation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
