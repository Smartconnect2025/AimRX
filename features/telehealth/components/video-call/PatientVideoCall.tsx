"use client";

import React, { useEffect, useState } from "react";
import {
  CometChatUIKit,
  UIKitSettingsBuilder,
  CometChatOngoingCall,
  CometChatCallEvents,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { envConfig } from "@/core/config/envConfig";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import CameraPreview from "./CameraPreview";
import { ClientChatService } from "@/features/chat/services/clientChatService";

interface AppointmentData {
  id: string;
  datetime: string;
  duration: number;
  type: string;
  reason: string;
  provider: {
    userId: string;
    name: string;
    specialty: string;
    avatarUrl?: string;
  };
  patient: {
    userId: string;
    name: string;
    age: number | null;
    avatarUrl?: string;
  };
}

interface PatientVideoCallProps {
  appointmentId: string;
  currentUserId: string;
  currentUserName: string;
}

const PatientVideoCall: React.FC<PatientVideoCallProps> = ({
  appointmentId,
  currentUserId,
  currentUserName,
}) => {
  const router = useRouter();
  const [cometChatUser, setCometChatUser] = useState<
    CometChat.User | undefined
  >(undefined);
  const [cometChatInitialized, setCometChatInitialized] =
    useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<CometChat.Call | null>(null);
  const [callStatus, setCallStatus] = useState<
    "waiting" | "connected" | "ended" | "error"
  >("waiting");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appointmentData, setAppointmentData] =
    useState<AppointmentData | null>(null);
  const hasRetriedWithForceRecreate = React.useRef(false);

  // Fetch appointment data and initialize CometChat
  useEffect(() => {
    const initialize = async () => {
      try {
        // Fetch appointment data
        const appointmentResponse = await fetch(
          `/api/appointments/${appointmentId}`,
        );
        if (!appointmentResponse.ok) {
          throw new Error("Failed to fetch appointment data");
        }
        const appointmentResult = await appointmentResponse.json();

        if (!appointmentResult.success || !appointmentResult.data) {
          throw new Error("Invalid appointment data");
        }

        setAppointmentData(appointmentResult.data);

        // Initialize CometChat UIKit
        const UIKitSettings = new UIKitSettingsBuilder()
          .setAppId(envConfig.NEXT_PUBLIC_COMETCHAT_APP_ID)
          .setRegion(envConfig.NEXT_PUBLIC_COMETCHAT_REGION)
          .setAuthKey(envConfig.NEXT_PUBLIC_COMETCHAT_AUTH_KEY)
          .subscribePresenceForAllUsers()
          .build();

        await CometChatUIKit.init(UIKitSettings);

        // Get or create auth token for current user (patient)
        const authTokenResult = await ClientChatService.ensureUser(
          currentUserId,
          currentUserName,
        );

        if (!authTokenResult.success || !authTokenResult.authToken) {
          throw new Error("Failed to get CometChat auth token");
        }

        // Check if already logged in
        const loggedInUser = await CometChatUIKit.getLoggedinUser();
        const expectedUid = currentUserId; // User ID IS the CometChat UID

        if (loggedInUser) {
          if (loggedInUser.getUid() === expectedUid) {
            // Already logged in as correct user
            setCometChatUser(loggedInUser);
            setCometChatInitialized(true);
            setIsLoading(false);
            return;
          } else {
            // Wrong user, logout first
            await CometChatUIKit.logout();
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Login with auth token
        try {
          const user = await CometChatUIKit.loginWithAuthToken(
            authTokenResult.authToken,
          );
          setCometChatUser(user);
          setCometChatInitialized(true);
          setIsLoading(false);
        } catch (loginError: unknown) {
          // Handle LOGIN_IN_PROGRESS error
          const error = loginError as { code?: number; name?: string };
          if (error?.code === -1 && error?.name === "LOGIN_IN_PROGRESS") {
            // Wait a bit and try again
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const user = await CometChatUIKit.loginWithAuthToken(
              authTokenResult.authToken,
            );
            setCometChatUser(user);
            setCometChatInitialized(true);
            setIsLoading(false);
          } else {
            throw loginError;
          }
        }
      } catch (error) {
        console.error("Initialization failed:", error);

        // If we haven't retried yet, try with forceRecreate
        if (!hasRetriedWithForceRecreate.current) {
          hasRetriedWithForceRecreate.current = true;

          try {
            // Get new auth token with forceRecreate
            const authTokenResult = await ClientChatService.ensureUser(
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
              setCometChatUser(user);
              setCometChatInitialized(true);
              setIsLoading(false);
              return; // Success, exit early
            } catch (retryLoginError: unknown) {
              // Handle LOGIN_IN_PROGRESS error on retry
              const error = retryLoginError as { code?: number; name?: string };
              if (error?.code === -1 && error?.name === "LOGIN_IN_PROGRESS") {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const user = await CometChatUIKit.loginWithAuthToken(
                  authTokenResult.authToken,
                );
                setCometChatUser(user);
                setCometChatInitialized(true);
                setIsLoading(false);
                return; // Success, exit early
              } else {
                throw retryLoginError;
              }
            }
          } catch (retryError) {
            console.error(
              "[PatientVideoCall] Retry with forceRecreate failed:",
              retryError,
            );
          }
        }

        setCallStatus("error");
        setIsLoading(false);
        toast.error(
          "Failed to initialize video call. Please refresh the page.",
        );
      }
    };

    initialize();
  }, [appointmentId, currentUserId, currentUserName]);

  // Set up call event listeners
  useEffect(() => {
    if (!cometChatInitialized) return;

    // Listen for incoming calls and auto-answer them
    const callListener = new CometChat.CallListener({
      onIncomingCallReceived: (call: CometChat.Call) => {
        // Auto-accept the call
        CometChat.acceptCall(call.getSessionId()).then(
          (acceptedCall) => {
            setCallStatus("connected");
            setActiveCall(acceptedCall);
          },
          (error) => {
            console.error("Failed to accept call:", error);
            toast("Failed to join the call");
          },
        );
      },
      onIncomingCallCancelled: () => {
        setCallStatus("waiting");
        setActiveCall(null);
      },
    });

    CometChat.addCallListener("PATIENT_CALL_LISTENER", callListener);

    // Handle call ended events
    const callEndedSub = CometChatCallEvents.ccCallEnded.subscribe(() => {
      setCallStatus("ended");
      setActiveCall(null);
    });

    // Clean up listeners
    return () => {
      CometChat.removeCallListener("PATIENT_CALL_LISTENER");
      callEndedSub?.unsubscribe();
    };
  }, [cometChatInitialized]);

  // Handle call error
  const handleCallError = (error: CometChat.CometChatException) => {
    console.error("Call error:", error);
    toast("Call error occurred. Please try again.");
    setCallStatus("waiting");
    setActiveCall(null);
  };

  const handleCancel = () => {
    router.push("/");
  };

  // Format appointment date and time
  const formatAppointmentDateTime = (datetime: string) => {
    const date = new Date(datetime);
    const dateString = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const timeString = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { dateString, timeString };
  };

  if (isLoading || !cometChatUser || !appointmentData) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-slate-600">
            {appointmentData ? "Connecting..." : "Loading appointment..."}
          </p>
        </div>
      </div>
    );
  }

  const { dateString, timeString } = formatAppointmentDateTime(
    appointmentData.datetime,
  );

  return (
    <div className="w-full">
      {callStatus === "connected" && activeCall ? (
        <div className="w-full h-screen absolute top-0 left-0 z-50">
          <CometChatOngoingCall
            sessionID={activeCall.getSessionId()}
            onError={handleCallError}
          />
        </div>
      ) : callStatus === "ended" ? (
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-col space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                <Card className="w-full mx-auto relative animate-scale-in border-0 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Video className="h-6 w-6 text-slate-500" />
                      </div>

                      <h1 className="text-2xl font-bold text-slate-900 mb-3">
                        Meeting Ended
                      </h1>

                      <p className="text-slate-600 text-lg pb-4">
                        Your session with{" "}
                        <span className="text-teal-500">
                          {appointmentData.provider.name}
                        </span>{" "}
                        has ended.
                      </p>

                      <Button
                        onClick={() => router.push("/")}
                        size="lg"
                        className="flex items-center gap-2 px-8 py-6 text-lg"
                      >
                        Go Home
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      ) : callStatus === "error" ? (
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-col space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                <Card className="w-full mx-auto relative animate-scale-in border-0 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                        <Video className="h-6 w-6 text-red-500" />
                      </div>

                      <h1 className="text-2xl font-bold text-slate-900 mb-3">
                        Connection Error
                      </h1>

                      <p className="text-slate-600 text-lg pb-4">
                        Failed to initialize video call. Please refresh the page
                        and try again.
                      </p>

                      <Button
                        onClick={() => window.location.reload()}
                        size="lg"
                        className="flex items-center gap-2 px-8 py-6 text-lg"
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto max-w-8xl py-4 px-4">
          <div className="flex flex-col space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex justify-between items-center pl-6 mt-auto">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="bg-white text-slate-700 hover:bg-slate-200 shadow px-4 py-2"
                      aria-label="Go Back"
                    >
                      Go Back
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="animate-scale-in !bg-white border-0">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave the call?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to leave this call?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="flex-1">
                        No, stay
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="flex-1 bg-destructive hover:bg-destructive/90"
                      >
                        Yes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
                <div className="w-full lg:w-1/2 lg:flex-shrink-0">
                  <div className="w-full aspect-video bg-slate-50 rounded-xl overflow-hidden">
                    <CameraPreview />
                  </div>
                </div>

                <div className="w-full lg:w-1/2 flex flex-col items-center text-center">
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                    Waiting Room
                  </h1>

                  <p className="text-slate-600 text-lg mb-6">
                    You are joining a session with{" "}
                    <span className="text-teal-500 font-semibold">
                      {appointmentData.provider.name}
                    </span>
                  </p>

                  <div className="flex items-center justify-center lg:justify-start mb-6">
                    <Clock className="h-4 w-4 text-slate-600 mr-2" />
                    <span className="text-slate-600/80 font-medium">
                      {dateString}, {timeString} ({appointmentData.duration}{" "}
                      min)
                    </span>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start text-teal-500 font-medium text-base bg-teal-50/50 px-6 py-3 rounded-full mb-4">
                    <span className="mr-3">Connecting</span>
                    <div className="flex items-center justify-center space-x-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-[pulse_1.5s_ease-in-out_0s_infinite]"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-[pulse_1.5s_ease-in-out_0.2s_infinite]"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-[pulse_1.5s_ease-in-out_0.4s_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVideoCall;
