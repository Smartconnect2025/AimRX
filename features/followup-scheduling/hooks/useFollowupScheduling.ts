"use client";

import { useState, useCallback } from "react";
import { TimeSlot } from "../types";
import { generateTimeSlots } from "../utils/generateTimeSlots";
import { toast } from "sonner";

export function useFollowupScheduling() {
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [providerName, setProviderName] = useState("");

  const timeSlots = generateTimeSlots();

  const showFollowupModal = useCallback((provider: string) => {
    setProviderName(provider);
    setShowModal(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setSelectedSlot(null);
  }, []);

  const handleBook = useCallback((slot: TimeSlot) => {
    // Mock booking - in real app, this would make an API call
    toast.success(`Follow-up appointment booked for ${slot.time} on ${slot.date.toLocaleDateString()}`);
    setShowModal(false);
    setSelectedSlot(null);
  }, []);

  return {
    showModal,
    selectedSlot,
    providerName,
    timeSlots,
    showFollowupModal,
    handleClose,
    handleBook,
  };
} 