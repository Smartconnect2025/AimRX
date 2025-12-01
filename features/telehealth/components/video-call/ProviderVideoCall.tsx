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
import { Video, Loader2, Clock, Shield, X, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
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

interface ProviderVideoCallProps {
  appointmentId: string;
  currentUserId: string;
  currentUserName: string;
}

const ProviderVideoCall: React.FC<ProviderVideoCallProps> = ({
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
    "idle" | "calling" | "connected" | "ended" | "error"
  >("idle");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [callError, setCallError] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] =
    useState<AppointmentData | null>(null);
  const [patientCometChatUid, setPatientCometChatUid] = useState<string>("");
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

        // Patient's user ID IS the CometChat UID (no prefix needed)
        const patientUid = appointmentResult.data.patient.userId;
        setPatientCometChatUid(patientUid);

        // Initialize CometChat UIKit
        const UIKitSettings = new UIKitSettingsBuilder()
          .setAppId(envConfig.NEXT_PUBLIC_COMETCHAT_APP_ID)
          .setRegion(envConfig.NEXT_PUBLIC_COMETCHAT_REGION)
          .setAuthKey(envConfig.NEXT_PUBLIC_COMETCHAT_AUTH_KEY)
          .subscribePresenceForAllUsers()
          .build();

        await CometChatUIKit.init(UIKitSettings);

        // Get or create auth token for current user (provider)
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
              "[ProviderVideoCall] Retry with forceRecreate failed:",
              retryError,
            );
          }
        }

        setCallError(
          "Failed to initialize video call. Please refresh the page.",
        );
        setCallStatus("error");
        setIsLoading(false);
        toast.error("Failed to initialize video call");
      }
    };

    initialize();
  }, [appointmentId, currentUserId, currentUserName]);

  // Set up call event listeners
  useEffect(() => {
    if (!cometChatInitialized) return;

    // Listen for call events
    const callListener = new CometChat.CallListener({
      onOutgoingCallAccepted: (call: CometChat.Call) => {
        setCallStatus("connected");
        setActiveCall(call);
        setIsLoading(false);
        setCallError(null);
      },
      onOutgoingCallRejected: () => {
        setCallStatus("error");
        setActiveCall(null);
        setIsLoading(false);
        setCallError("Patient declined the call");
      },
      onIncomingCallCancelled: () => {
        setCallStatus("idle");
        setActiveCall(null);
        setIsLoading(false);
      },
    });

    CometChat.addCallListener("PROVIDER_CALL_LISTENER", callListener);

    // Call event subscriptions
    const callAcceptedSub = CometChatCallEvents.ccCallAccepted.subscribe(
      (call: CometChat.Call) => {
        setCallStatus("connected");
        setActiveCall(call);
        setIsLoading(false);
        setCallError(null);
        toast("Call connected successfully");
      },
    );

    const callEndedSub = CometChatCallEvents.ccCallEnded.subscribe(() => {
      setCallStatus("ended");
      setActiveCall(null);
      setIsLoading(false);
    });

    const callRejectedSub = CometChatCallEvents.ccCallRejected.subscribe(() => {
      setCallStatus("error");
      setActiveCall(null);
      setIsLoading(false);
      setCallError("Patient is not available");
    });

    const outgoingCallSub = CometChatCallEvents.ccOutgoingCall.subscribe(() => {
      setCallStatus("calling");
      setCallError(null);
    });

    // Clean up listeners
    return () => {
      CometChat.removeCallListener("PROVIDER_CALL_LISTENER");
      callAcceptedSub?.unsubscribe();
      callEndedSub?.unsubscribe();
      callRejectedSub?.unsubscribe();
      outgoingCallSub?.unsubscribe();
    };
  }, [cometChatInitialized]);

  // Function to initiate a video call
  const startMeeting = () => {
    if (!patientCometChatUid) {
      setCallError("Patient information not available");
      setCallStatus("error");
      return;
    }

    setIsLoading(true);
    setCallError(null);
    const call = new CometChat.Call(
      patientCometChatUid,
      CometChat.CALL_TYPE.VIDEO,
      CometChat.RECEIVER_TYPE.USER,
    );

    CometChat.initiateCall(call).then(
      (outgoingCall) => {
        setActiveCall(outgoingCall);
        setCallStatus("calling");
      },
      (error) => {
        console.error("Failed to initiate call:", error);
        setCallStatus("error");
        setCallError("Failed to start call. Please try again.");
        setIsLoading(false);
      },
    );
  };

  // Function to retry the call
  const retryCall = () => {
    setCallStatus("idle");
    setCallError(null);
    setActiveCall(null);
    setIsLoading(false);
  };

  // Function to end a call
  const endCall = () => {
    if (!activeCall) return;

    CometChat.endCall(activeCall.getSessionId()).then(
      () => {
        setCallStatus("idle");
        setActiveCall(null);
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to end call:", error);
        toast("Failed to end call");
      },
    );
  };

  // Handle call error
  const handleCallError = (error: CometChat.CometChatException) => {
    console.error("Call error:", error);
    setCallStatus("error");
    setCallError("Connection error occurred");
    setActiveCall(null);
    setIsLoading(false);
    toast("Call error occurred. You can try again.");
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
        <div className="mx-auto max-w-5xl py-16">
          <div className="rounded-lg bg-white px-6 pb-10 shadow-sm">
            <div className="flex flex-col space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                <Card className="w-full mx-auto relative animate-scale-in border-0 shadow-none">
                  <CardContent className="p-6 pt-14">
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
                          {appointmentData.patient.name}
                        </span>{" "}
                        has ended.
                      </p>

                      <div className="flex gap-3">
                        <Button
                          onClick={retryCall}
                          variant="outline"
                          size="lg"
                          className="flex items-center gap-2 px-8 py-6 text-lg"
                        >
                          <Video className="h-5 w-5" />
                          Start New Meeting
                        </Button>
                        <Button
                          onClick={() => router.push("/")}
                          size="lg"
                          className="flex items-center gap-2 px-8 py-6 text-lg"
                        >
                          Go Home
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      ) : callStatus === "calling" ? (
        <div className="mx-auto max-w-5xl py-16">
          <div className="rounded-lg bg-white px-6 pb-10 shadow-sm">
            <div className="flex flex-col space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                <Card className="w-full mx-auto relative animate-scale-in border-0 shadow-none">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-12 right-4 z-50 bg-white text-slate-700 hover:bg-slate-200 shadow"
                        aria-label="Cancel Call"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="animate-scale-in !bg-white border-0">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel the call?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this call?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="flex-1">
                          No, continue
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={endCall}
                          className="flex-1 bg-destructive hover:bg-destructive/90"
                        >
                          Yes, cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <CardContent className="pt-14">
                    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                        <Video className="h-6 w-6 text-blue-500" />
                      </div>

                      <h1 className="text-2xl font-bold text-slate-900 mb-3">
                        Calling Patient
                      </h1>

                      <p className="text-slate-600 text-lg mb-4">
                        Connecting with{" "}
                        <span className="text-blue-500">
                          {appointmentData.patient.name}
                        </span>
                      </p>

                      <div className="flex items-center text-blue-500 font-medium text-base bg-blue-50/50 px-6 py-2 rounded-full mb-2">
                        <span className="mr-2 pt-2">Calling</span>
                        <div className="flex items-center justify-center space-x-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-[pulse_1.5s_ease-in-out_0s_infinite]"></div>
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-[pulse_1.5s_ease-in-out_0.2s_infinite]"></div>
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-[pulse_1.5s_ease-in-out_0.4s_infinite]"></div>
                        </div>
                      </div>

                      <p className="text-slate-400 text-sm pb-2">
                        Waiting for patient to join the call...
                      </p>

                      <div className="w-full aspect-video bg-slate-50 rounded-lg overflow-hidden">
                        <CameraPreview />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Info Header */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 flex items-center justify-center">
                        <Image
                          src="/logo.svg"
                          alt="TeleHealth Logo"
                          width={120}
                          height={32}
                          priority
                          className="w-auto h-8"
                        />
                      </div>
                      <div>
                        <h1 className="text-base font-semibold text-primary">
                          TeleHealth Connect
                        </h1>
                        <div className="flex items-center">
                          <Badge
                            variant="outline"
                            className="bg-slate-50 text-xs text-slate-700 flex items-center gap-1 h-6 px-2"
                          >
                            <Shield className="h-3 w-3" />
                            <span>HIPAA-Compliant</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-primary/90">
                          {appointmentData.patient.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {appointmentData.patient.age
                            ? `Age ${appointmentData.patient.age} • `
                            : ""}
                          {appointmentData.reason}
                        </p>
                      </div>

                      <div className="flex flex-col text-xs space-y-1">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-primary mr-1" />
                          <span className="text-primary/80 font-medium">
                            {dateString}, {timeString} (
                            {appointmentData.duration} min)
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Video className="h-3 w-3 text-primary mr-1" />
                          <span className="text-primary/80 font-medium">
                            {appointmentData.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : callStatus === "error" ? (
        <div className="mx-auto max-w-5xl py-16">
          <div className="rounded-lg bg-white px-6 pb-10 shadow-sm">
            <div className="flex flex-col space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                <Card className="w-full mx-auto relative animate-scale-in border-0 shadow-none">
                  <CardContent className="p-6 pt-14">
                    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                      </div>

                      <h1 className="text-2xl font-bold text-slate-900 mb-3">
                        Call Failed
                      </h1>

                      <p className="text-slate-600 text-lg mb-4">
                        {callError || "Unable to connect with patient"}
                      </p>

                      <div className="flex gap-3 mt-2">
                        <Button
                          onClick={retryCall}
                          size="lg"
                          className="flex items-center gap-2 px-8 py-6 text-lg"
                        >
                          <Video className="h-5 w-5" />
                          Try Again
                        </Button>
                        <Button
                          onClick={() => router.push("/")}
                          variant="outline"
                          size="lg"
                          className="flex items-center gap-2 px-8 py-6 text-lg"
                        >
                          Go Home
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Info Header */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 flex items-center justify-center">
                        <Image
                          src="/logo.svg"
                          alt="TeleHealth Logo"
                          width={120}
                          height={32}
                          priority
                          className="w-auto h-8"
                        />
                      </div>
                      <div>
                        <h1 className="text-base font-semibold text-primary">
                          TeleHealth Connect
                        </h1>
                        <div className="flex items-center">
                          <Badge
                            variant="outline"
                            className="bg-slate-50 text-xs text-slate-700 flex items-center gap-1 h-6 px-2"
                          >
                            <Shield className="h-3 w-3" />
                            <span>HIPAA-Compliant</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-primary/90">
                          {appointmentData.patient.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {appointmentData.patient.age
                            ? `Age ${appointmentData.patient.age} • `
                            : ""}
                          {appointmentData.reason}
                        </p>
                      </div>

                      <div className="flex flex-col text-xs space-y-1">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-primary mr-1" />
                          <span className="text-primary/80 font-medium">
                            {dateString}, {timeString} (
                            {appointmentData.duration} min)
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Video className="h-3 w-3 text-primary mr-1" />
                          <span className="text-primary/80 font-medium">
                            {appointmentData.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl py-16">
          <div className="rounded-lg bg-white px-6 pb-10 shadow-sm">
            <div className="flex flex-col space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                <Card className="w-full mx-auto relative animate-scale-in border-0 shadow-none">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-12 right-4 z-50 bg-white text-slate-700 hover:bg-slate-200 shadow"
                        aria-label="Cancel Session"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="animate-scale-in !bg-white border-0">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Leave the session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to leave this session?
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

                  <CardContent className="pt-14">
                    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                        <Video className="h-6 w-6 text-blue-500" />
                      </div>

                      <h1 className="text-2xl font-bold text-slate-900 mb-3">
                        Provider Session
                      </h1>

                      <p className="text-slate-600 text-lg mb-4">
                        You are starting a session with{" "}
                        <span className="text-blue-500">
                          {appointmentData.patient.name}
                        </span>
                      </p>

                      <Button
                        onClick={startMeeting}
                        size="lg"
                        className="flex items-center gap-3 px-6 my-4 text-base bg-blue-500 hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Starting Meeting...
                          </>
                        ) : (
                          <>
                            <Video className="h-5 w-5" />
                            Start Meeting
                          </>
                        )}
                      </Button>

                      <div className="w-full aspect-video bg-slate-50 rounded-lg overflow-hidden">
                        <CameraPreview />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Info Header */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 flex items-center justify-center">
                        <Image
                          src="/logo.svg"
                          alt="TeleHealth Logo"
                          width={120}
                          height={32}
                          priority
                          className="w-auto h-8"
                        />
                      </div>
                      <div>
                        <h1 className="text-base font-semibold text-primary">
                          TeleHealth Connect
                        </h1>
                        <div className="flex items-center">
                          <Badge
                            variant="outline"
                            className="bg-slate-50 text-xs text-slate-700 flex items-center gap-1 h-6 px-2"
                          >
                            <Shield className="h-3 w-3" />
                            <span>HIPAA-Compliant</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-primary/90">
                          {appointmentData.patient.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {appointmentData.patient.age
                            ? `Age ${appointmentData.patient.age} • `
                            : ""}
                          {appointmentData.reason}
                        </p>
                      </div>

                      <div className="flex flex-col text-xs space-y-1">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-primary mr-1" />
                          <span className="text-primary/80 font-medium">
                            {dateString}, {timeString} (
                            {appointmentData.duration} min)
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Video className="h-3 w-3 text-primary mr-1" />
                          <span className="text-primary/80 font-medium">
                            {appointmentData.type}
                          </span>
                        </div>
                      </div>
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

export default ProviderVideoCall;
