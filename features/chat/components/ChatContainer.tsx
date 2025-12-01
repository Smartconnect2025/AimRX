"use client";

import React, { useEffect, useState, useRef } from "react";
import { envConfig } from "@/core/config/envConfig";
import { ClientChatService } from "../services/clientChatService";

// Import CometChat CSS
import "@cometchat/chat-uikit-react/css-variables.css";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle } from "lucide-react";

import {
  CometChatUIKit,
  UIKitSettingsBuilder,
  CometChatMessageComposer,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatUsers,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";

interface ChatContainerProps {
  currentUserId: string;
  currentUserName: string;
  targetUserId?: string;
  _targetUserName?: string;
  groupId?: string;
  _groupName?: string;
  _showContacts?: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  currentUserId,
  currentUserName,
  targetUserId,
  _targetUserName,
  groupId,
  _groupName,
  _showContacts = false,
}) => {
  const [user, setUser] = useState<CometChat.User | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<CometChat.User | undefined>(
    undefined,
  );
  const [selectedGroup, setSelectedGroup] = useState<
    CometChat.Group | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const initializationAttempted = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasRetriedWithForceRecreate = useRef(false);

  // Reset initialization flag when user changes
  useEffect(() => {
    initializationAttempted.current = false;
    hasRetriedWithForceRecreate.current = false;
    setIsInitialized(false);
    setUser(undefined);
    setError(null);
  }, [currentUserId, currentUserName]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Prevent multiple initialization attempts
        if (initializationAttempted.current || isInitialized) {
          return;
        }

        if (isLoggingIn) {
          return;
        }

        // Check if user is already set
        if (user) {
          return;
        }

        initializationAttempted.current = true;
        setIsLoggingIn(true);

        // First initialize CometChat UIKit
        const UIKitSettings = new UIKitSettingsBuilder()
          .setAppId(envConfig.NEXT_PUBLIC_COMETCHAT_APP_ID)
          .setRegion(envConfig.NEXT_PUBLIC_COMETCHAT_REGION)
          .setAuthKey(envConfig.NEXT_PUBLIC_COMETCHAT_AUTH_KEY)
          .subscribePresenceForAllUsers()
          .build();

        await CometChatUIKit.init(UIKitSettings);

        // Get or create CometChat auth token for this user
        const authTokenResult = await ClientChatService.getOrCreateAuthToken(
          currentUserId,
          currentUserName,
        );

        if (!authTokenResult.success || !authTokenResult.authToken) {
          throw new Error(authTokenResult.error || "Failed to get auth token");
        }

        // Check if user is already logged in
        const loggedInUser = await CometChatUIKit.getLoggedinUser();

        if (loggedInUser) {
          // Check if it's the same user
          if (loggedInUser.getUid() === currentUserId) {
            setUser(loggedInUser);
            setIsInitialized(true);
            return;
          } else {
            await CometChatUIKit.logout();
            // Add a small delay to ensure logout completes
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Login with auth token
        try {
          const user = await CometChatUIKit.loginWithAuthToken(
            authTokenResult.authToken,
          );
          setUser(user);
          setIsInitialized(true);
        } catch (loginError: unknown) {
          // Handle LOGIN_IN_PROGRESS error
          const error = loginError as { code?: number; name?: string };
          if (error?.code === -1 && error?.name === "LOGIN_IN_PROGRESS") {
            // Wait a bit and try again
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const user = await CometChatUIKit.loginWithAuthToken(
              authTokenResult.authToken,
            );
            setUser(user);
            setIsInitialized(true);
          } else {
            throw loginError;
          }
        }
      } catch (error) {
        console.error("[ChatContainer] Chat initialization error:", error);

        // If we haven't retried yet, try with forceRecreate
        if (!hasRetriedWithForceRecreate.current) {
          hasRetriedWithForceRecreate.current = true;

          try {
            // Get new auth token with forceRecreate
            const authTokenResult =
              await ClientChatService.getOrCreateAuthToken(
                currentUserId,
                currentUserName,
                undefined,
                undefined,
                true, // forceRecreate
              );

            if (!authTokenResult.success || !authTokenResult.authToken) {
              throw new Error(
                authTokenResult.error || "Failed to recreate auth token",
              );
            }

            // Give CometChat a moment to propagate the new user/token
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Retry login with new token
            try {
              const user = await CometChatUIKit.loginWithAuthToken(
                authTokenResult.authToken,
              );
              setUser(user);
              setIsInitialized(true);
              setIsLoading(false);
              setIsLoggingIn(false);
              return; // Success, exit early
            } catch (retryLoginError: unknown) {
              // Handle LOGIN_IN_PROGRESS error on retry
              const error = retryLoginError as { code?: number; name?: string };
              if (error?.code === -1 && error?.name === "LOGIN_IN_PROGRESS") {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const user = await CometChatUIKit.loginWithAuthToken(
                  authTokenResult.authToken,
                );
                setUser(user);
                setIsInitialized(true);
                setIsLoading(false);
                setIsLoggingIn(false);
                return; // Success, exit early
              } else {
                throw retryLoginError;
              }
            }
          } catch (retryError) {
            console.error(
              "[ChatContainer] Retry with forceRecreate failed:",
              retryError,
            );
          }
        }

        setError("Failed to initialize chat. Please refresh the page.");
      } finally {
        setIsLoading(false);
        setIsLoggingIn(false);
      }
    };

    initialize();

    // Cleanup function
    return () => {
      // Reset initialization flag if component unmounts
      if (isLoggingIn) {
        initializationAttempted.current = false;
      }
    };
    // We intentionally omit isLoggingIn, isInitialized, and user from dependencies
    // because they are internal state that should not trigger re-initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, currentUserName]);

  // Fetch target user or group when user is logged in
  useEffect(() => {
    if (user) {
      if (targetUserId) {
        // Fetch target user directly (userId IS the CometChat UID)
        const fetchTargetUser = async () => {
          try {
            const targetUser = await CometChat.getUser(targetUserId);
            setSelectedUser(targetUser);
          } catch {
            // User fetching failed, will handle gracefully
          }
        };

        fetchTargetUser();
      } else if (groupId) {
        // Fetch target group for group chat
        CometChat.getGroup(groupId).then(
          (targetGroup) => {
            setSelectedGroup(targetGroup);
          },
          () => {
            // Group fetching failed, will show empty state
          },
        );
      }
    }
  }, [user, targetUserId, groupId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-background">
        <div className="text-center px-4">
          <div className="text-destructive mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col rounded-lg overflow-hidden">
      {user ? (
        <div className="flex-1 flex min-h-0">
          <div
            className={`${selectedUser || selectedGroup ? "hidden md:flex" : "flex"} w-full md:w-80 border-r border-border bg-background flex-col`}
          >
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <CometChatUsers
                onItemClick={(user: CometChat.User) => {
                  setSelectedUser(user);
                  setSelectedGroup(undefined);
                }}
              />
            </div>
          </div>

          <div
            className={`${selectedUser || selectedGroup ? "flex" : "hidden md:flex"} flex-1 flex-col bg-background`}
          >
            {selectedUser || selectedGroup ? (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="md:hidden bg-background border-b border-border p-3 flex items-center">
                  <button
                    onClick={() => {
                      setSelectedUser(undefined);
                      setSelectedGroup(undefined);
                    }}
                    className="mr-3 p-1 hover:bg-slate-100 rounded"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {selectedUser?.getName() || selectedGroup?.getName()}
                    </h3>
                    {selectedUser && (
                      <p className="text-xs text-slate-500">
                        {selectedUser.getStatus() === "online"
                          ? "Online"
                          : "Offline"}
                      </p>
                    )}
                  </div>
                </div>

                <CometChatMessageHeader
                  user={selectedUser}
                  group={selectedGroup}
                />
                <div
                  className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0"
                  style={{ display: "flex", flexDirection: "column-reverse" }}
                >
                  <CometChatMessageList
                    user={selectedUser}
                    group={selectedGroup}
                  />
                </div>
                <CometChatMessageComposer
                  user={selectedUser}
                  group={selectedGroup}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Select a Contact
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a contact from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
