import mongoose from "mongoose";
import Webhook from "../models/Webhook.js";
import Membership from "../models/membershipModel.js";
import Organization from "../models/organizationModel.js";

// Helper to verify user permissions (must be Owner or Admin of the target Organization)
const hasAdminPermission = async (userId, organizationId) => {
  if (!organizationId) return false;

  try {
    const org = await Organization.findById(organizationId);
    if (!org) return false;

    // Check if user is the direct owner of the organization
    if (org.owner.toString() === userId.toString()) {
      return true;
    }

    // Check if user has an active admin membership role
    const membership = await Membership.findOne({
      user: userId,
      organization: organizationId,
      role: "admin",
      status: "active",
    }).lean();

    return !!membership;
  } catch (err) {
    console.error("Error checking permissions:", err);
    return false;
  }
};

/**
 * 🟢 Register a new Webhook subscription
 * POST /api/webhooks
 */
export const createWebhook = async (req, res) => {
  try {
    const { targetUrl, events, secret, organizationId } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!targetUrl || !targetUrl.trim()) {
      return res.status(400).json({ success: false, message: "Target URL is required." });
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return res.status(400).json({ success: false, message: "Target URL must start with http:// or https://." });
    }

    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: "Valid Organization ID is required." });
    }

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, message: "At least one event trigger must be specified." });
    }

    // Validate events list
    const validEvents = ["meeting.created", "mom.generated", "policy.updated"];
    const invalidEvents = events.filter((e) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid event triggers: ${invalidEvents.join(", ")}. Valid triggers: ${validEvents.join(", ")}`,
      });
    }

    // Authorization check
    const isAuthorized = await hasAdminPermission(userId, organizationId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Only organization owners and admins can configure webhooks.",
      });
    }

    const webhookData = {
      organizationId,
      targetUrl: targetUrl.trim(),
      events,
      isActive: true,
    };

    if (secret && secret.trim()) {
      webhookData.secret = secret.trim();
    }

    const webhook = await Webhook.create(webhookData);

    return res.status(201).json({
      success: true,
      message: "Webhook registered successfully.",
      webhook: {
        _id: webhook._id,
        organizationId: webhook.organizationId,
        targetUrl: webhook.targetUrl,
        events: webhook.events,
        secret: webhook.secret,
        isActive: webhook.isActive,
      },
    });
  } catch (error) {
    console.error("❌ createWebhook Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create webhook." });
  }
};

/**
 * 🟢 Get webhook subscriptions for an organization
 * GET /api/webhooks?organizationId=xxx
 */
export const getWebhooks = async (req, res) => {
  try {
    const { organizationId } = req.query;
    const userId = req.user?.id || req.user?._id;

    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ success: false, message: "Valid Organization ID is required." });
    }

    // Authorization check
    const isAuthorized = await hasAdminPermission(userId, organizationId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Only organization owners and admins can view webhooks.",
      });
    }

    const webhooks = await Webhook.find({ organizationId }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, webhooks });
  } catch (error) {
    console.error("❌ getWebhooks Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch webhooks." });
  }
};

/**
 * 🟢 Update webhook subscription details
 * PATCH /api/webhooks/:id
 */
export const updateWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUrl, events, secret, isActive } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Valid Webhook ID is required." });
    }

    const webhook = await Webhook.findById(id);
    if (!webhook) {
      return res.status(404).json({ success: false, message: "Webhook subscription not found." });
    }

    // Authorization check
    const isAuthorized = await hasAdminPermission(userId, webhook.organizationId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Only organization owners and admins can modify webhooks.",
      });
    }

    // Validations
    if (targetUrl !== undefined) {
      if (!targetUrl.trim()) {
        return res.status(400).json({ success: false, message: "Target URL cannot be empty." });
      }
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        return res.status(400).json({ success: false, message: "Target URL must start with http:// or https://." });
      }
      webhook.targetUrl = targetUrl.trim();
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ success: false, message: "At least one event trigger must be specified." });
      }
      const validEvents = ["meeting.created", "mom.generated", "policy.updated"];
      const invalidEvents = events.filter((e) => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid event triggers: ${invalidEvents.join(", ")}`,
        });
      }
      webhook.events = events;
    }

    if (secret !== undefined) {
      if (!secret.trim()) {
        return res.status(400).json({ success: false, message: "Secret key cannot be empty." });
      }
      webhook.secret = secret.trim();
    }

    if (isActive !== undefined) {
      webhook.isActive = !!isActive;
    }

    await webhook.save();

    return res.status(200).json({
      success: true,
      message: "Webhook updated successfully.",
      webhook,
    });
  } catch (error) {
    console.error("❌ updateWebhook Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update webhook." });
  }
};

/**
 * 🟢 Delete webhook subscription
 * DELETE /api/webhooks/:id
 */
export const deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Valid Webhook ID is required." });
    }

    const webhook = await Webhook.findById(id);
    if (!webhook) {
      return res.status(404).json({ success: false, message: "Webhook subscription not found." });
    }

    // Authorization check
    const isAuthorized = await hasAdminPermission(userId, webhook.organizationId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Only organization owners and admins can delete webhooks.",
      });
    }

    await webhook.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Webhook deleted successfully.",
    });
  } catch (error) {
    console.error("❌ deleteWebhook Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete webhook." });
  }
};
