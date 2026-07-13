import express from "express";
import userAuth from "../middleware/userAuth.js";
import { apiLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
} from "../controllers/webhookController.js";

const router = express.Router();

// Apply global rate limiting to webhook routes
router.use(apiLimiter);

// Apply authentication middleware to all routes
router.use(userAuth);

// Create Webhook Subscription
router.post("/", writeLimiter, createWebhook);

// Get Webhooks for an Organization
router.get("/", getWebhooks);

// Update Webhook Subscription
router.patch("/:id", writeLimiter, updateWebhook);

// Delete Webhook Subscription
router.delete("/:id", writeLimiter, deleteWebhook);

export default router;
