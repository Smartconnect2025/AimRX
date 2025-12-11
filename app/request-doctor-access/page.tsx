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

export default function RequestDoctorAccessPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    npiNumber: "",
    medicalLicense: "",
    licenseState: "",
    practiceName: "",
    practiceAddress: "",
    city: "",
    state: "",
    zipCode: "",
    yearsInPractice: "",
    specialty: "",
    patientsPerMonth: "",
    interestedIn: "",
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
    } catch (error) {
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
          <div className="text-6xl drop-shadow-2xl animate-pulse" style={{ color: "#00AEEF", textShadow: "0 0 30px rgba(0, 174, 239, 0.6)" }}>✝</div>
          <h1 className="text-3xl font-bold text-white drop-shadow-2xl">AIM Marketplace</h1>
          <p className="text-lg text-white/90 font-semibold">Provider Access Request</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex items-center justify-center px-4 z-10">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Back to Login */}
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-[#00AEEF] hover:text-[#0098D4] mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Provider Access</h2>
              <p className="text-sm text-gray-600">Fill out the form below and our team will review your application within 24-48 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
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

              {/* Medical Credentials */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Medical Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="npiNumber" className="text-sm font-medium">NPI Number *</Label>
                    <Input
                      id="npiNumber"
                      name="npiNumber"
                      value={formData.npiNumber}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="medicalLicense" className="text-sm font-medium">Medical License Number *</Label>
                    <Input
                      id="medicalLicense"
                      name="medicalLicense"
                      value={formData.medicalLicense}
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
                    <Label htmlFor="specialty" className="text-sm font-medium">Specialty *</Label>
                    <Input
                      id="specialty"
                      name="specialty"
                      placeholder="e.g., Family Medicine, Anti-Aging"
                      value={formData.specialty}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Practice Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Practice Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="practiceName" className="text-sm font-medium">Practice Name *</Label>
                    <Input
                      id="practiceName"
                      name="practiceName"
                      value={formData.practiceName}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="practiceAddress" className="text-sm font-medium">Practice Address *</Label>
                    <Input
                      id="practiceAddress"
                      name="practiceAddress"
                      value={formData.practiceAddress}
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
                  <div className="space-y-1">
                    <Label htmlFor="yearsInPractice" className="text-sm font-medium">Years in Practice *</Label>
                    <Input
                      id="yearsInPractice"
                      name="yearsInPractice"
                      type="number"
                      value={formData.yearsInPractice}
                      onChange={handleChange}
                      required
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
                    <Label htmlFor="patientsPerMonth" className="text-sm font-medium">Estimated Patients Per Month</Label>
                    <Input
                      id="patientsPerMonth"
                      name="patientsPerMonth"
                      type="number"
                      value={formData.patientsPerMonth}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="interestedIn" className="text-sm font-medium">What treatments are you interested in?</Label>
                    <Input
                      id="interestedIn"
                      name="interestedIn"
                      placeholder="e.g., Peptides, PRP, Stem Cell Therapy"
                      value={formData.interestedIn}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
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
                className="w-full h-12 text-lg font-bold bg-[#00AEEF] hover:bg-[#00AEEF] text-white shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,174,239,0.6)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Request...
                  </>
                ) : (
                  "Submit Access Request"
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By submitting this form, you agree to our Terms of Service and Privacy Policy. We will review your application and contact you within 24-48 hours.
              </p>

              {/* Contact Information */}
              <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                <p className="text-sm text-center text-gray-700 font-medium mb-2">
                  Need help or have questions?
                </p>
                <p className="text-sm text-center text-gray-600">
                  Call us at <a href="tel:+1-800-AIM-MEDS" className="font-bold text-[#00AEEF] hover:text-[#0098D4]">1-800-AIM-MEDS</a>
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
