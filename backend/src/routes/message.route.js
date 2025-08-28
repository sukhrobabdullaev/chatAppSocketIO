import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  deleteMessage,
  getMessagesSince,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.get("/:id/poll", protectRoute, getMessagesSince);

router.post("/send/:id", protectRoute, sendMessage);
router.delete("/:id", protectRoute, deleteMessage);

export default router;
