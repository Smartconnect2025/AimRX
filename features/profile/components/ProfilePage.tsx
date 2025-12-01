"use client";

import { useProfile } from "../hooks/useProfile";
import { PersonalInformationForm } from "./PersonalInformationForm";
import { ContactInformationForm } from "./ContactInformationForm";
import { SecurityForm } from "./SecurityForm";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { SubscriptionManagementSection } from "./SubscriptionManagementSection";
import { PROFILE_MESSAGES } from "../constants/constants";

export function ProfilePage() {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            {PROFILE_MESSAGES.LOADING}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-500">
            {PROFILE_MESSAGES.NOT_FOUND}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="space-y-8">
          {/* Personal Information Section */}
          <PersonalInformationForm profile={profile} />

          {/* Contact Information Section */}
          <ContactInformationForm profile={profile} />

          {/* Subscription Management Section */}
          <SubscriptionManagementSection />

          {/* Security Section */}
          <SecurityForm />

          {/* Delete Account Section */}
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}
