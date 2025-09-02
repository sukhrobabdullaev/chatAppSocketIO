import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { createSocket } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  // SSE removed in favor of WebSocket
  ws: {
    socket: null,
    isConnected: false,
  },
  // WebSocket state removed

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async userId => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data, sse: { ...get().sse, lastTimestamp: Date.now() } });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Use WebSocket instead (preserve names for components)
  startPolling: async () => {
    const { ws } = get();
    if (ws.socket) return;
    let attempts = 0;
    const connect = async () => {
      let token;
      try {
        const res = await axiosInstance.get("/auth/ws-token");
        token = res.data?.token;
      } catch (_) {}
      const socket = createSocket(token);

      socket.onopen = () => {
        attempts = 0;
        set({ ws: { socket, isConnected: true } });
      };
      socket.onclose = () => {
        set({ ws: { socket: null, isConnected: false } });
        // simple backoff reconnect
        const timeout = Math.min(1000 * 2 ** attempts, 15000);
        attempts += 1;
        setTimeout(connect, timeout);
      };
      socket.onerror = () => set({ ws: { socket, isConnected: false } });

      socket.onmessage = evt => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "message:new" && msg.payload) {
            const current = get().messages;
            if (!current.some(m => m._id === msg.payload._id)) {
              set({ messages: [...current, msg.payload] });
            }
          }
        } catch (_) {}
      };

      set({ ws: { socket, isConnected: false } });
    };

    connect();
  },

  stopPolling: () => {
    const { ws } = get();
    if (ws.socket) ws.socket.close();
    set({ ws: { socket: null, isConnected: false } });
  },

  sendMessage: async messageData => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  deleteMessage: async messageId => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set({
        messages: get().messages.filter(message => message._id !== messageId),
      });
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  setSelectedUser: selectedUser => {
    const { stopPolling, startPolling } = get();
    stopPolling();
    if (selectedUser) startPolling();
    set({ selectedUser });
  },

  // Keep sending via HTTP only for clarity
}));
