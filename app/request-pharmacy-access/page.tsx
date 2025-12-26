"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function RequestPharmacyAccessPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pharmacyName: "",
    ownerName: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseState: "",
    deaNumber: "",
    ncpdpNumber: "",
    pharmacyAddress: "",
    city: "",
    state: "",
    zipCode: "",
    yearsInBusiness: "",
    compoundingExperience: "",
    monthlyCapacity: "",
    specializations: "",
    accreditations: "",
    currentSystem: "",
    systemVersion: "",
    integrationType: "",
    hearAboutUs: "",
    additionalInfo: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Send form data to backend API or email
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      toast.success("Request submitted successfully! We'll contact you within 24-48 hours.");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#00AEEF] overflow-hidden flex flex-col relative py-8">
      {/* Subtle animated helix/DNA background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Header */}
      <div className="text-center mb-6 z-10">
        {/* HIPAA Trust Badge - Top Center on mobile, Top Right on desktop */}
        <div className="flex justify-center md:justify-end mb-4 px-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-2xl border-2 border-green-500/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">HIPAA Compliant</div>
                <div className="text-[10px] text-gray-600">Secure & Private</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <img
            src="https://i.imgur.com/r65O4DB.png"
            alt="AIM Medical Technologies"
            className="h-[120px] mb-2"
          />
          <h1 className="text-3xl font-bold text-white drop-shadow-2xl">AIM Marketplace</h1>
          <p className="text-lg text-white/90 font-semibold">Pharmacy Network Application</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex items-center justify-center px-4 z-10">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Back to Login */}
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-[#1E3A8A] hover:text-[#2563EB] mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply to Join Our Network</h2>
              <p className="text-sm text-gray-600">Fill out the form below and our team will review your application within 24-48 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pharmacy Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Pharmacy Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="pharmacyName" className="text-sm font-medium">Pharmacy Name *</Label>
                    <Input
                      id="pharmacyName"
                      name="pharmacyName"
                      value={formData.pharmacyName}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerName" className="text-sm font-medium">Owner/Director Name *</Label>
                    <Input
                      id="ownerName"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Licensing & Credentials */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Licensing & Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="licenseNumber" className="text-sm font-medium">Pharmacy License Number *</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="licenseState" className="text-sm font-medium">License State *</Label>
                    <Input
                      id="licenseState"
                      name="licenseState"
                      value={formData.licenseState}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="deaNumber" className="text-sm font-medium">DEA Number *</Label>
                    <Input
                      id="deaNumber"
                      name="deaNumber"
                      value={formData.deaNumber}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ncpdpNumber" className="text-sm font-medium">NCPDP Number</Label>
                    <Input
                      id="ncpdpNumber"
                      name="ncpdpNumber"
                      value={formData.ncpdpNumber}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="accreditations" className="text-sm font-medium">Accreditations (e.g., PCAB, ACHC)</Label>
                    <Input
                      id="accreditations"
                      name="accreditations"
                      placeholder="List your accreditations"
                      value={formData.accreditations}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="pharmacyAddress" className="text-sm font-medium">Pharmacy Address *</Label>
                    <Input
                      id="pharmacyAddress"
                      name="pharmacyAddress"
                      value={formData.pharmacyAddress}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="zipCode" className="text-sm font-medium">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Compounding Capabilities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Compounding Capabilities</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="yearsInBusiness" className="text-sm font-medium">Years in Business *</Label>
                      <Input
                        id="yearsInBusiness"
                        name="yearsInBusiness"
                        type="number"
                        value={formData.yearsInBusiness}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="compoundingExperience" className="text-sm font-medium">Compounding Experience (Years) *</Label>
                      <Input
                        id="compoundingExperience"
                        name="compoundingExperience"
                        type="number"
                        value={formData.compoundingExperience}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="monthlyCapacity" className="text-sm font-medium">Monthly Compounding Capacity</Label>
                    <Input
                      id="monthlyCapacity"
                      name="monthlyCapacity"
                      placeholder="e.g., 500-1000 prescriptions per month"
                      value={formData.monthlyCapacity}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="specializations" className="text-sm font-medium">Specializations *</Label>
                    <Input
                      id="specializations"
                      name="specializations"
                      placeholder="e.g., Peptides, PRP, Hormone Therapy, Stem Cell"
                      value={formData.specializations}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* System & Integration Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">System & Integration Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="currentSystem" className="text-sm font-medium">Current Pharmacy System *</Label>
                      <Input
                        id="currentSystem"
                        name="currentSystem"
                        placeholder="e.g., PioneerRx, QS/1, Liberty"
                        value={formData.currentSystem}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="systemVersion" className="text-sm font-medium">System Version</Label>
                      <Input
                        id="systemVersion"
                        name="systemVersion"
                        placeholder="e.g., 10.2.5"
                        value={formData.systemVersion}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="integrationType" className="text-sm font-medium">Preferred Integration Type</Label>
                    <Input
                      id="integrationType"
                      name="integrationType"
                      placeholder="e.g., API, HL7, Direct Integration"
                      value={formData.integrationType}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Additional Information</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="hearAboutUs" className="text-sm font-medium">How did you hear about AIM?</Label>
                    <Input
                      id="hearAboutUs"
                      name="hearAboutUs"
                      value={formData.hearAboutUs}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="additionalInfo" className="text-sm font-medium">Additional Information</Label>
                    <Textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      rows={4}
                      placeholder="Tell us more about your pharmacy and why you'd like to join the AIM network"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold bg-[#1E3A8A] hover:bg-[#1E3A8A] text-white shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(30,58,138,0.6)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Application...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By submitting this form, you agree to our Terms of Service and Privacy Policy. We will review your application and contact you within 24-48 hours.
              </p>

              {/* Contact Information */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-center text-gray-700 font-medium mb-2">
                  Need help or have questions?
                </p>
                <p className="text-sm text-center text-gray-600">
                  Call us at <a href="tel:+1-800-AIM-MEDS" className="font-bold text-[#1E3A8A] hover:text-[#2563EB]">1-800-AIM-MEDS</a>
                </p>
                <p className="text-xs text-center text-gray-500 mt-1">
                  (Monday - Friday, 9 AM - 6 PM EST)
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-white/70 text-xs z-10">
        By invitation only • Built exclusively for AIM Medical Technologies
      </div>
    </div>
  );
}
