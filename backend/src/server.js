import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./lib/db.js";
import { sendMessage } from "./controllers/message.controller.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import linkPreviewRoutes from "./routes/linkPreview.route.js";
import { socketAuth } from "./middlewares/socketAuth.middleware.js";

dotenv.config();
const app = express();
const server = createServer(app);

const PORT = process.env.PORT;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});
// Apply auth middleware
io.use(socketAuth);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/link", linkPreviewRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Chat App API is running!" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Handle connections
io.on("connection", socket => {
  console.log(`User ${socket.userId} connected`);

  // Join user to their own room
  socket.join(socket.userId);

  // Handle joining a chat room
  socket.on("join-chat", otherUserId => {
    const roomName = [socket.userId, otherUserId].sort().join("-");
    socket.join(roomName);
    console.log(`User ${socket.userId} joined chat with ${otherUserId}`);
  });

  // Handle sending messages
  socket.on("send-message", async data => {
    try {
      console.log("Socket received message:", data);

      // Create a mock request object for the sendMessage controller
      const mockReq = {
        body: { text: data.text, image: data.image },
        params: { id: data.receiverId },
        user: { _id: socket.userId },
      };

      // Create a mock response object
      let messageData = null;
      const mockRes = {
        status: code => ({
          json: data => {
            messageData = data;
            return data;
          },
        }),
      };

      // Use the existing sendMessage controller
      await sendMessage(mockReq, mockRes);

      if (messageData) {
        console.log("Broadcasting message:", messageData);
        // Broadcast to both users
        const roomName = [socket.userId, data.receiverId].sort().join("-");
        io.to(roomName).emit("new-message", messageData);
      } else {
        console.log("No message data to broadcast");
      }
    } catch (error) {
      console.error("Socket send-message error:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
