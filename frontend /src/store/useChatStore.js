import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { createSocket } from "../lib/socket";

// Helper function to get WS token
const getWSToken = async () => {
  try {
    const res = await axiosInstance.get("/auth/ws-token");
    return res.data?.token;
  } catch (error) {
    console.error("Failed to get WS token:", error);
    return null;
  }
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  // socket
  socket: null,
  isConnected: false,

  // Connect to Socket.IO
  connectSocket: async () => {
    const { socket } = get();
    if (socket) return;

    try {
      // Get token
      const token = await getWSToken();
      if (!token) {
        console.error("No token available for Socket.IO connection");
        return;
      }

      const newSocket = createSocket(token);

      newSocket.on("connect", () => {
        set({ socket: newSocket, isConnected: true });
        console.log("Connected to Socket.IO");
      });

      newSocket.on("disconnect", () => {
        set({ isConnected: false });
        console.log("Disconnected from Socket.IO");
      });

      newSocket.on("connect_error", error => {
        console.error("Socket.IO connection error:", error);
        set({ isConnected: false });
      });

      newSocket.on("new-message", message => {
        console.log("Received new message:", message);
        const { messages } = get();
        if (!messages.some(m => m._id === message._id)) {
          set({ messages: [...messages, message] });
        }
      });

      set({ socket: newSocket });
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  },

  // Join a chat room
  joinChat: otherUserId => {
    const { socket } = get();
    if (socket) {
      socket.emit("join-chat", otherUserId);
    }
  },

  // Send message via Socket.IO
  sendMessageSocket: messageData => {
    const { selectedUser, socket } = get();
    if (socket && selectedUser) {
      socket.emit("send-message", {
        receiverId: selectedUser._id,
        text: messageData.text,
        image: messageData.image,
      });
    }
  },

  // Disconnect
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
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

  getMessages: async userId => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async messageData => {
    const { selectedUser, socket } = get();
    if (socket && selectedUser) {
      // Use Socket.IO for real-time messaging
      socket.emit("send-message", {
        receiverId: selectedUser._id,
        text: messageData.text,
        image: messageData.image,
      });
    } else {
      // Fallback to HTTP if Socket.IO not connected
      try {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
        set({ messages: [...get().messages, res.data] });
      } catch (error) {
        toast.error(error.response.data.message);
      }
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
    const { joinChat } = get();
    set({ selectedUser });
    if (selectedUser) {
      joinChat(selectedUser._id);
    }
  },
}));
