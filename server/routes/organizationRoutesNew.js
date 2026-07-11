// server/routes/organizationRoutesNew.js
import express from "express";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getOrganizationMembers,
} from "../controllers/organizationControllerNew.js";
import userAuth from "../middleware/userAuth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

// All routes require authentication
router.use(userAuth);

// Organization CRUD routes
router.post("/", createOrganization);
router.get("/", getOrganizations);
router.get("/:idOrSlug", getOrganizationById);
router.put("/:id", updateOrganization);
router.delete("/:id", deleteOrganization);

// Organization members
router.get("/:id/members", getOrganizationMembers);

export default router;
