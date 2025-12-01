"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the chat container with SSR disabled
const ChatContainer = dynamic(() => import("./ChatContainer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[90vh] md:h-screen w-full bg-slate-50">
      <div className="flex flex-col items-center space-y-4 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground text-center">
          Loading chat...
        </p>
      </div>
    </div>
  ),
});

interface ChatWrapperProps {
  currentUserId: string;
  currentUserName: string;
  targetUserId?: string;
  _targetUserName?: string;
  groupId?: string;
  _groupName?: string;
  _showContacts?: boolean;
}

const ChatWrapper: React.FC<ChatWrapperProps> = (props) => {
  return <ChatContainer {...props} />;
};

export default ChatWrapper;
