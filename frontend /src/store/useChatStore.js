import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
// WebSocket client removed

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  sse: {
    eventSource: null,
    lastTimestamp: null,
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

  // Use SSE for new messages (method name kept for component compatibility)
  startPolling: userId => {
    const { stopPolling, sse } = get();
    stopPolling();

    const baseUrl = import.meta.env.MODE === "development" ? "http://localhost:3000/api/v1" : "/api/v1";
    const since = sse.lastTimestamp || Date.now();
    const url = `${baseUrl}/messages/${userId}/stream?since=${since}`;

    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => {
      set({ sse: { ...get().sse, isConnected: true, eventSource: es } });
    };

    es.addEventListener("messages", ev => {
      try {
        const { messages, timestamp } = JSON.parse(ev.data);
        if (Array.isArray(messages) && messages.length) {
          const current = get().messages;
          const incoming = messages;
          const deduped = incoming.filter(m => !current.some(e => e._id === m._id));
          if (deduped.length) set({ messages: [...current, ...deduped] });
        }
        if (timestamp) set({ sse: { ...get().sse, lastTimestamp: timestamp } });
      } catch (_) {}
    });

    es.onerror = () => {
      set({ sse: { ...get().sse, isConnected: false } });
    };

    set({ sse: { ...get().sse, eventSource: es, isConnected: false } });
  },

  stopPolling: () => {
    const { sse } = get();
    if (sse.eventSource && typeof sse.eventSource.close === "function") {
      sse.eventSource.close();
    }
    set({ sse: { eventSource: null, lastTimestamp: sse.lastTimestamp, isConnected: false } });
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
    if (selectedUser) startPolling(selectedUser._id);
    set({ selectedUser });
  },

  // WebSocket methods removed
}));
