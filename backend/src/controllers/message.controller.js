import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }

    // If message has an image, delete it from cloudinary
    if (message.image) {
      const publicId = message.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessagesSince = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const { since } = req.query;
    const myId = req.user._id;

    const SINCE_TS = since ? new Date(parseInt(since)) : null;
    const TIMEOUT_MS = 25000; // long-poll timeout (~25s)
    const POLL_INTERVAL_MS = 1500; // check every 1.5s
    const endTime = Date.now() + TIMEOUT_MS;

    let intervalId;
    let finished = false;

    const buildQuery = () => {
      const base = {
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      };
      if (SINCE_TS) {
        base.createdAt = { $gt: SINCE_TS };
      }
      return base;
    };

    const finalize = (payload) => {
      if (finished) return;
      finished = true;
      if (intervalId) clearInterval(intervalId);
      res.status(200).json(payload);
    };

    const checkAndRespond = async () => {
      try {
        const messages = await Message.find(buildQuery()).sort({
          createdAt: 1,
        });
        if (messages.length > 0) {
          return finalize({
            messages,
            timestamp: Date.now(),
            hasNewMessages: true,
          });
        }
        if (Date.now() >= endTime) {
          return finalize({
            messages: [],
            timestamp: Date.now(),
            hasNewMessages: false,
          });
        }
      } catch (err) {
        if (!finished) {
          finished = true;
          if (intervalId) clearInterval(intervalId);
          console.log("Error in getMessagesSince controller: ", err.message);
          return res.status(500).json({ error: "Internal server error" });
        }
      }
    };

    // If no since provided, return immediately (initial sync)
    if (!SINCE_TS) {
      const messages = await Message.find(buildQuery()).sort({ createdAt: 1 });
      return res.status(200).json({
        messages,
        timestamp: Date.now(),
        hasNewMessages: messages.length > 0,
      });
    }

    // First immediate check, then interval
    await checkAndRespond();
    if (!finished) {
      intervalId = setInterval(checkAndRespond, POLL_INTERVAL_MS);
    }

    // Cleanup if client disconnects
    req.on("close", () => {
      if (!finished) {
        finished = true;
        if (intervalId) clearInterval(intervalId);
      }
    });
  } catch (error) {
    console.log("Error in getMessagesSince controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
