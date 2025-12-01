/**
 * Main Chat Page
 * Shows chat interface based on user role and context
 */

"use client";

import React from "react";
import { useUser } from "@/core/auth";
import ChatWrapper from "@/features/chat/components/ChatWrapper";
import { generateDisplayNameFromUser } from "@/core/services/chat/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import DefaultLayout from "@/components/layout/DefaultLayout";

export default function ChatPage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="container mx-auto max-w-7xl py-8 px-4">
          <div className="bg-card rounded-lg shadow-sm border border-border h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading chat...</p>
            </div>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!user) {
    return (
      <DefaultLayout>
        <div className="container mx-auto max-w-7xl py-8 px-4">
          <div className="bg-card rounded-lg shadow-sm border border-border h-[calc(100vh-200px)] flex items-center justify-center p-8">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please log in to access chat functionality.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Get display name for chat
  const displayName = generateDisplayNameFromUser(user);

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="bg-card rounded-lg shadow-sm border border-border h-[calc(100vh-200px)]">
          <ChatWrapper currentUserId={user.id} currentUserName={displayName} />
        </div>
      </div>
    </DefaultLayout>
  );
}
