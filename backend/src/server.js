import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
// import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
// import { app, server } from "./lib/socket.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT;
// const __dirname = path.resolve();

app.use(express.json({ limit: "50mb" })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // For form data
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/messages", messageRoutes);

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

app.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
