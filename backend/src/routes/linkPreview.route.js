import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getLinkPreview } from "../controllers/linkPreview.controller.js";

const router = express.Router();

router.post("/preview", protectRoute, getLinkPreview);

export default router;
