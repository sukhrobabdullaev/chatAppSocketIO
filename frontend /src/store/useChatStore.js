import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  pollingInterval: null,
  lastPollTimestamp: null,
  isPolling: false,
  pollingConfig: {
    enabled: true,
    intervalMs: 3000,
    maxRetries: 3,
  },

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

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data, lastPollTimestamp: Date.now() });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Poll for new messages
  pollForMessages: async (userId) => {
    const { lastPollTimestamp, pollingConfig } = get();
    if (!pollingConfig.enabled) return;

    try {
      const res = await axiosInstance.get(`/messages/${userId}/poll`, {
        params: { since: lastPollTimestamp },
      });

      if (res.data.messages?.length) {
        const { messages } = get();
        const newMessages = res.data.messages.filter(
          (newMsg) =>
            !messages.some((existingMsg) => existingMsg._id === newMsg._id)
        );

        if (newMessages.length > 0) {
          set({ messages: [...messages, ...newMessages] });
        }
      }

      // Always update lastPollTimestamp with server time
      set({ lastPollTimestamp: res.data.timestamp });
    } catch (error) {
      console.error("Error polling for messages:", error);
    }
  },

  // Start polling for messages
  startPolling: (userId) => {
    const { stopPolling, pollingConfig } = get();
    stopPolling();
    if (!pollingConfig.enabled) return;

    // Long-poll loop
    let aborted = false;

    const loop = async () => {
      if (aborted) return;
      await get().pollForMessages(userId);
      if (aborted) return;
      // Immediately start next long poll
      loop();
    };

    // Mark as polling and kick off the loop
    set({ isPolling: true, lastPollTimestamp: Date.now() });
    // Store a stopper function in pollingInterval for compatibility
    const stopper = () => {
      aborted = true;
    };
    set({ pollingInterval: stopper });
    loop();
  },

  // Stop polling for messages
  stopPolling: () => {
    const { pollingInterval } = get();
    if (typeof pollingInterval === "function") {
      pollingInterval();
    }
    set({ pollingInterval: null, isPolling: false });
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set({
        messages: get().messages.filter((message) => message._id !== messageId),
      });
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  setSelectedUser: (selectedUser) => {
    const { stopPolling, startPolling } = get();

    // Stop polling for previous user
    stopPolling();

    // Start polling for new user if selected and polling is enabled
    if (selectedUser && get().pollingConfig.enabled) {
      startPolling(selectedUser._id);
    }

    set({ selectedUser });
  },
}));
