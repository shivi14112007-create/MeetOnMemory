// server/routes/notificationRoutes.js
import express from "express";
import userAuth from "../middleware/userAuth.js";
import { apiLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", userAuth, apiLimiter, getNotifications);
notificationRouter.get("/unread-count", userAuth, apiLimiter, getUnreadCount);
notificationRouter.patch("/:id/read", userAuth, writeLimiter, markAsRead);
notificationRouter.patch(
  "/mark-all-read",
  userAuth,
  writeLimiter,
  markAllAsRead,
);
notificationRouter.delete("/:id", userAuth, writeLimiter, deleteNotification);

export default notificationRouter;
