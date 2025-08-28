import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  deleteMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
// polling endpoint removed

router.post("/send/:id", protectRoute, sendMessage);
router.delete("/:id", protectRoute, deleteMessage);

export default router;
