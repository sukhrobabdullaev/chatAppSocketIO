import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const socketAuth = async (socket, next) => {
  try {
    // Try to get token from auth object first, then from cookies
    let token = socket.handshake.auth?.token;

    if (!token) {
      // Parse cookies from headers
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = {};
      cookieHeader.split("; ").forEach(chunk => {
        if (!chunk) return;
        const idx = chunk.indexOf("=");
        if (idx === -1) return;
        cookies[decodeURIComponent(chunk.slice(0, idx))] = decodeURIComponent(chunk.slice(idx + 1));
      });
      token = cookies.jwt;
    }

    if (!token) {
      console.log("Socket auth: No token found");
      return next(new Error("No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("Socket auth: User not found");
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    console.log(`Socket auth: User ${socket.userId} authenticated`);
    next();
  } catch (error) {
    console.log("Socket auth error:", error.message);
    next(new Error("Authentication failed"));
  }
};
