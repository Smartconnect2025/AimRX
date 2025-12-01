"use client";

import React, { useEffect, useState, useRef } from "react";
import { Video } from "lucide-react";

const CameraPreview = () => {
  const [error, setError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get available video devices
  useEffect(() => {
    const getVideoDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput",
        );
        setVideoDevices(videoInputs);

        // Select the first device by default
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Error getting video devices:", err);
      }
    };

    getVideoDevices();
  }, [selectedDeviceId]);

  // Get media stream when device changes
  useEffect(() => {
    if (!selectedDeviceId) return;

    const getMediaStream = async () => {
      try {
        // Stop previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedDeviceId
              ? { exact: selectedDeviceId }
              : undefined,
          },
          audio: false,
        });

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Unable to access camera");
      }
    };

    getMediaStream();

    // Cleanup function to stop the stream when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId]);

  if (error) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <Video className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Camera selector overlay */}
      {videoDevices.length > 1 && (
        <div className="absolute top-2 right-2 z-10">
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-black/50 text-white text-xs px-2 py-1 rounded-2xl border border-white/20 backdrop-blur-sm"
          >
            {videoDevices.map((device) => (
              <option
                key={device.deviceId}
                value={device.deviceId}
                className="bg-black text-white"
              >
                {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default CameraPreview;
