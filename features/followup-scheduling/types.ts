export interface TimeSlot {
  id: string;
  date: Date;
  time: string;
  isAvailable: boolean;
}

export interface FollowupModalProps {
  providerName: string;
  isOpen: boolean;
  onClose: () => void;
  onBook: (slot: TimeSlot) => void;
  timeSlots: TimeSlot[];
}

export interface FollowupState {
  showModal: boolean;
  selectedSlot: TimeSlot | null;
  providerName: string;
} 