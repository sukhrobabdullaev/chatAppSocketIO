import { useChatStore } from "../store/useChatStore";
// polling removed

const ChatHeader = () => {
  const { selectedUser } = useChatStore();
  // polling removed

  if (!selectedUser) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b border-base-300">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={selectedUser.profilePic || "/avatar.png"}
            alt={selectedUser.fullName}
            className="size-10 object-cover rounded-full"
          />
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-white"></span>
        </div>
        <div>
          <h3 className="font-semibold">{selectedUser.fullName}</h3>
          <p className="text-sm text-gray-500">Online</p>
        </div>
      </div>

      {/* polling removed from header */}
    </div>
  );
};

export default ChatHeader;
