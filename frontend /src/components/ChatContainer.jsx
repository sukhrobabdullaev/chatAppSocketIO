import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import LinkPreview from "./LinkPreview";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { detectUrls } from "../lib/linkUtils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);
  }, [selectedUser._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId);
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${
              message.senderId === authUser._id
                ? "justify-end"
                : "justify-start"
            }`}
            ref={messageEndRef}
            onMouseEnter={() => setHoveredMessage(message._id)}
            onMouseLeave={() => setHoveredMessage(null)}
          >
            <div className="flex items-end gap-2 max-w-[80%] relative group">
              {message.senderId !== authUser._id && (
                <div className="size-8 rounded-full border flex-shrink-0">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt="profile pic"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              )}

              <div className="flex flex-col relative">
                <div className="text-xs opacity-50 mb-1 px-1">
                  {formatMessageTime(message.createdAt)}
                </div>
                <div
                  className={`
                  rounded-2xl px-4 py-2 max-w-xs lg:max-w-md break-words relative
                  ${
                    message.senderId === authUser._id
                      ? "bg-primary text-primary-content ml-auto"
                      : "bg-base-200 text-base-content"
                  }
                `}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="max-w-[200px] rounded-lg mb-2"
                    />
                  )}
                  {message.text && (
                    <div>
                      <p className="text-sm">{message.text}</p>
                      {/* Render link previews for detected URLs */}
                      {detectUrls(message.text).map((url, index) => (
                        <LinkPreview
                          key={`${message._id}-${index}`}
                          url={url}
                        />
                      ))}
                    </div>
                  )}

                  {/* Delete button - only show for user's own messages */}
                  {message.senderId === authUser._id &&
                    hoveredMessage === message._id && (
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="absolute -top-2 -right-2 bg-error text-error-content rounded-full p-1 text-xs hover:bg-error/80 transition-colors shadow-lg"
                        title="Delete message"
                      >
                        <X size={14} />
                      </button>
                    )}
                </div>
              </div>

              {message.senderId === authUser._id && (
                <div className="size-8 rounded-full border flex-shrink-0">
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt="profile pic"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
