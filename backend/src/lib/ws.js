import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const userSockets = new Map(); // userId -> Set<WebSocket>
let wss;

const parseCookies = (cookieHeader = "") => {
  const cookies = {};
  cookieHeader.split("; ").forEach(chunk => {
    if (!chunk) return;
    const idx = chunk.indexOf("=");
    if (idx === -1) return;
    cookies[decodeURIComponent(chunk.slice(0, idx))] = decodeURIComponent(chunk.slice(idx + 1));
  });
  return cookies;
};

export const setupWebSocket = server => {
  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    if (!req.url || !req.url.startsWith("/ws")) return socket.destroy();
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = parseCookies(req.headers.cookie).jwt || url.searchParams.get("token");
      if (!token) return socket.destroy();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) return socket.destroy();
      req.user = user;
      wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req));
    } catch (_) {
      socket.destroy();
    }
  });

  wss.on("connection", (ws, req) => {
    const userId = req.user._id.toString();
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(ws);

    ws.on("close", () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(ws);
        if (!set.size) userSockets.delete(userId);
      }
    });
  });
};

const safeSend = (ws, data) => {
  try {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
  } catch (_) {}
};

export const broadcastMessage = message => {
  if (!message) return;
  const senderId = String(message.senderId);
  const receiverId = String(message.receiverId);
  const packet = { type: "message:new", payload: message };
  const recvSet = userSockets.get(receiverId);
  if (recvSet) recvSet.forEach(s => safeSend(s, packet));
  const sendSet = userSockets.get(senderId);
  if (sendSet) sendSet.forEach(s => safeSend(s, packet));
};
