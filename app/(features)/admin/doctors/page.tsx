"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Key, Power, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { createClient } from "@core/supabase";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/core/utils/phone";

interface Doctor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  physical_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  billing_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  tax_id: string | null;
  payment_details: {
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    routing_number: string;
    account_type: string;
    swift_code?: string;
  } | null;
  payment_method: string | null;
  payment_schedule: string | null;
  commission_rate: string | null;
  created_at: string;
  is_active: boolean;
}

interface AccessRequestFormData {
  npiNumber?: string;
  medicalLicense?: string;
  licenseState?: string;
  specialty?: string;
  practiceName?: string;
  practiceAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  yearsInPractice?: string;
  patientsPerMonth?: string;
  interestedIn?: string;
  hearAboutUs?: string;
  additionalInfo?: string;
}

interface AccessRequest {
  id: string;
  type: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  form_data: AccessRequestFormData;
  created_at: string;
}

export default function ManageDoctorsPage() {
  const supabase = createClient();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"providers" | "pending">("providers");

  // Access Requests (Pending Approval)
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [filteredAccessRequests, setFilteredAccessRequests] = useState<AccessRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");

  // View Details Modal
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<AccessRequest | null>(null);

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [inviteFormData, setInviteFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
    physicalAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
    },
    billingAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
    },
    taxId: "",
    paymentDetails: {
      bank_name: "",
      account_holder_name: "",
      account_number: "",
      routing_number: "",
      account_type: "checking",
      swift_code: "",
    },
    paymentMethod: "bank_transfer",
    paymentSchedule: "monthly",
    commissionRate: "",
  });

  // Reset invite form to empty state
  const resetInviteForm = () => {
    setInviteFormData({
      firstName: "",
      lastName: "",
      companyName: "",
      email: "",
      phone: "",
      password: "",
      physicalAddress: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
      },
      billingAddress: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
      },
      taxId: "",
      paymentDetails: {
        bank_name: "",
        account_holder_name: "",
        account_number: "",
        routing_number: "",
        account_type: "checking",
        swift_code: "",
      },
      paymentMethod: "bank_transfer",
      paymentSchedule: "monthly",
      commissionRate: "",
    });
    setShowPassword(false);
    setApprovingRequestId(null);
  };

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    physicalAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
    },
    billingAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
    },
    taxId: "",
    paymentDetails: {
      bank_name: "",
      account_holder_name: "",
      account_number: "",
      routing_number: "",
      account_type: "checking",
      swift_code: "",
    },
    paymentMethod: "bank_transfer",
    paymentSchedule: "monthly",
    commissionRate: "",
  });

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  // Reset Password Dialog
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [doctorToResetPassword, setDoctorToResetPassword] = useState<Doctor | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Reject Dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<AccessRequest | null>(null);

  // Load doctors from Supabase
  const loadDoctors = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch all providers
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, user_id, first_name, last_name, email, phone_number, physical_address, billing_address, tax_id, payment_details, payment_method, payment_schedule, commission_rate, created_at, is_active")
        .order("created_at", { ascending: false });

      if (providersError) {
        console.error("Error loading providers:", providersError);
        toast.error("Failed to load doctors");
        setLoading(false);
        return;
      }

      if (providersData) {
        // Show all providers in the providers tab
        // The pending tab will show only pending access requests
        setDoctors(providersData);
        setFilteredDoctors(providersData);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Load access requests
  const loadAccessRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch("/api/access-requests?type=doctor&status=pending");
      const data = await response.json();

      if (data.success) {
        setAccessRequests(data.requests || []);
        setFilteredAccessRequests(data.requests || []);
      } else {
        toast.error("Failed to load access requests");
      }
    } catch (error) {
      console.error("Error loading access requests:", error);
      toast.error("Failed to load access requests");
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // Filter doctors
  useEffect(() => {
    let filtered = doctors;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((doctor) => doctor.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((doctor) => !doctor.is_active);
    }

    setFilteredDoctors(filtered);
  }, [searchQuery, statusFilter, doctors]);

  // Filter pending access requests
  useEffect(() => {
    let filtered = accessRequests;

    // Apply search filter
    if (pendingSearchQuery) {
      filtered = filtered.filter(
        (request) =>
          request.first_name?.toLowerCase().includes(pendingSearchQuery.toLowerCase()) ||
          request.last_name?.toLowerCase().includes(pendingSearchQuery.toLowerCase()) ||
          request.email?.toLowerCase().includes(pendingSearchQuery.toLowerCase())
      );
    }

    // Note: All pending requests have the same status, so no status filter needed
    // But we keep the filter UI for consistency
    setFilteredAccessRequests(filtered);
  }, [pendingSearchQuery, accessRequests]);

  // Invite new doctor
  const handleInviteDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/invite-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: inviteFormData.firstName,
          lastName: inviteFormData.lastName,
          companyName: inviteFormData.companyName || null,
          email: inviteFormData.email,
          phone: inviteFormData.phone || null,
          password: inviteFormData.password,
          physicalAddress: inviteFormData.physicalAddress,
          billingAddress: inviteFormData.billingAddress,
          taxId: inviteFormData.taxId || null,
          paymentDetails: inviteFormData.paymentDetails,
          paymentMethod: inviteFormData.paymentMethod,
          paymentSchedule: inviteFormData.paymentSchedule,
          commissionRate: inviteFormData.commissionRate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite doctor");
      }

      toast.success(`Doctor invited! Credentials sent to ${inviteFormData.email}`);

      // If this invitation came from approving an access request, mark it as approved
      if (approvingRequestId) {
        try {
          const approveResponse = await fetch(`/api/access-requests/${approvingRequestId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve" }),
          });

          if (!approveResponse.ok) {
            console.error("Failed to update access request status");
          }
        } catch (error) {
          console.error("Error updating access request:", error);
        }

        // Switch to providers tab to show the newly approved provider
        setActiveTab("providers");
      }

      resetInviteForm();
      setIsInviteModalOpen(false);

      // Reload both lists
      await loadDoctors();
      await loadAccessRequests();
    } catch (error) {
      console.error("Error inviting doctor:", error);
      toast.error(error instanceof Error ? error.message : "Failed to invite doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit doctor
  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("providers")
        .update({
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          email: editFormData.email,
          phone_number: editFormData.phone || null,
          physical_address: editFormData.physicalAddress,
          billing_address: editFormData.billingAddress,
          tax_id: editFormData.taxId || null,
          payment_details: editFormData.paymentDetails,
          payment_method: editFormData.paymentMethod,
          payment_schedule: editFormData.paymentSchedule,
          commission_rate: editFormData.commissionRate || null,
        })
        .eq("id", editingDoctor.id);

      if (error) throw error;

      toast.success("Doctor updated successfully");
      setIsEditModalOpen(false);
      setEditingDoctor(null);
      await loadDoctors();
    } catch (error) {
      console.error("Error updating doctor:", error);
      toast.error("Failed to update doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setEditFormData({
      firstName: doctor.first_name || "",
      lastName: doctor.last_name || "",
      email: doctor.email || "",
      phone: doctor.phone_number || "",
      physicalAddress: {
        street: doctor.physical_address?.street || "",
        city: doctor.physical_address?.city || "",
        state: doctor.physical_address?.state || "",
        zip: doctor.physical_address?.zip || "",
        country: doctor.physical_address?.country || "USA",
      },
      billingAddress: {
        street: doctor.billing_address?.street || "",
        city: doctor.billing_address?.city || "",
        state: doctor.billing_address?.state || "",
        zip: doctor.billing_address?.zip || "",
        country: doctor.billing_address?.country || "USA",
      },
      taxId: doctor.tax_id || "",
      paymentDetails: {
        bank_name: doctor.payment_details?.bank_name || "",
        account_holder_name: doctor.payment_details?.account_holder_name || "",
        account_number: doctor.payment_details?.account_number || "",
        routing_number: doctor.payment_details?.routing_number || "",
        account_type: doctor.payment_details?.account_type || "checking",
        swift_code: doctor.payment_details?.swift_code || "",
      },
      paymentMethod: doctor.payment_method || "bank_transfer",
      paymentSchedule: doctor.payment_schedule || "monthly",
      commissionRate: doctor.commission_rate || "",
    });
    setIsEditModalOpen(true);
  };

  // Open reset password dialog
  const openResetPasswordDialog = (doctor: Doctor) => {
    setDoctorToResetPassword(doctor);
    setNewPassword("");
    setShowNewPassword(false);
    setIsResetPasswordDialogOpen(true);
  };

  // Generate password for reset dialog
  const generateResetPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    password = password.split('').sort(() => Math.random() - 0.5).join('');
    setNewPassword(password);
    setShowNewPassword(true);
    toast.success("Secure password generated!");
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!doctorToResetPassword || !newPassword) return;

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch("/api/admin/reset-provider-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: doctorToResetPassword.email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success(data.message || "Password reset successfully");
      setIsResetPasswordDialogOpen(false);
      setDoctorToResetPassword(null);
      setNewPassword("");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    }
  };

  // Toggle active status
  const handleToggleActive = async (doctor: Doctor) => {
    try {
      const { error } = await supabase
        .from("providers")
        .update({ is_active: !doctor.is_active })
        .eq("id", doctor.id);

      if (error) throw error;

      toast.success(
        `Doctor ${!doctor.is_active ? "activated" : "deactivated"} successfully`
      );
      await loadDoctors();
    } catch (error) {
      console.error("Error toggling doctor status:", error);
      toast.error("Failed to update doctor status");
    }
  };

  // Delete doctor
  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;

    try {
      console.log("Attempting to delete doctor:", doctorToDelete);

      // First, delete the auth user via the admin endpoint
      if (doctorToDelete.email) {
        console.log("Calling delete API with email:", doctorToDelete.email);
        const response = await fetch(
          `/api/admin/delete-provider?email=${encodeURIComponent(doctorToDelete.email)}`,
          {
            method: "DELETE",
          }
        );

        console.log("Delete API response status:", response.status);

        if (!response.ok) {
          const data = await response.json();
          console.error("Delete API error response:", data);
          throw new Error(data.details || data.error || "Failed to delete user account");
        }

        const successData = await response.json();
        console.log("Delete API success:", successData);
      }

      // Then delete from providers table (will cascade to related records)
      // Note: This may already be deleted by cascade, so we ignore "not found" errors
      console.log("Deleting from providers table, ID:", doctorToDelete.id);
      const { error } = await supabase
        .from("providers")
        .delete()
        .eq("id", doctorToDelete.id);

      if (error) {
        console.error("Provider table delete error:", error);
        // Only throw if it's not a "not found" error (may already be cascade deleted)
        if (!error.message.includes("not found") && error.code !== "PGRST116") {
          throw error;
        }
      }

      toast.success("Doctor deleted successfully");
      setIsDeleteDialogOpen(false);
      setDoctorToDelete(null);
      await loadDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete doctor");
    }
  };

  useEffect(() => {
    loadDoctors();
    loadAccessRequests();
  }, [loadDoctors, loadAccessRequests]);

  // Handle access request approval - prefill invite form
  const handleApproveRequest = (request: AccessRequest) => {
    // Store the request ID so we can approve it after successful invitation
    setApprovingRequestId(request.id);

    // Prefill the invite form with data from the access request
    setInviteFormData({
      firstName: request.first_name || "",
      lastName: request.last_name || "",
      companyName: request.form_data.practiceName || "",
      email: request.email || "",
      phone: request.phone || "",
      password: "", // User will generate or enter password
      physicalAddress: {
        street: request.form_data.practiceAddress || "",
        city: request.form_data.city || "",
        state: request.form_data.state || "",
        zip: request.form_data.zipCode || "",
        country: "USA",
      },
      billingAddress: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
      },
      taxId: "",
      paymentDetails: {
        bank_name: "",
        account_holder_name: "",
        account_number: "",
        routing_number: "",
        account_type: "checking",
        swift_code: "",
      },
      paymentMethod: "bank_transfer",
      paymentSchedule: "monthly",
      commissionRate: "",
    });

    // Open invite modal (stay on current tab)
    setIsInviteModalOpen(true);
  };

  // Open view details modal
  const handleViewDetails = (request: AccessRequest) => {
    setViewingRequest(request);
    setIsViewDetailsModalOpen(true);
  };

  // Handle access request rejection - open confirmation dialog
  const handleRejectRequest = (request: AccessRequest) => {
    setRequestToReject(request);
    setIsRejectDialogOpen(true);
  };

  // Confirm rejection
  const confirmRejectRequest = async () => {
    if (!requestToReject) return;

    try {
      const response = await fetch(`/api/access-requests/${requestToReject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: null }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to reject request");
      }

      toast.success("Request rejected");
      setIsRejectDialogOpen(false);
      setRequestToReject(null);
      await loadAccessRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject request");
    }
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return doctors.length;
    if (status === "active") return doctors.filter((d) => d.is_active).length;
    if (status === "inactive") return doctors.filter((d) => !d.is_active).length;
    return 0;
  };

  // Generate secure random password
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill rest with random characters (total length: 12)
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setInviteFormData({
      ...inviteFormData,
      password: password
    });
    setShowPassword(true);
    toast.success("Secure password generated!");
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Manage Providers
        </h1>
        <Button
          onClick={() => {
            resetInviteForm();
            setIsInviteModalOpen(true);
          }}
          className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Invite New Provider
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("providers")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "providers"
              ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Providers ({doctors.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "pending"
              ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending Approval ({accessRequests.length})
        </button>
      </div>

      {activeTab === "providers" && (
        <>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({getStatusCount("all")})</SelectItem>
              <SelectItem value="active">Active ({getStatusCount("active")})</SelectItem>
              <SelectItem value="inactive">Inactive ({getStatusCount("inactive")})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading doctors...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Doctor Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Date Added</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No doctors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </TableCell>
                      <TableCell>{doctor.email || "N/A"}</TableCell>
                      <TableCell>{doctor.phone_number || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(doctor.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            doctor.is_active
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {doctor.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(doctor)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResetPasswordDialog(doctor)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                          >
                            <Key className="h-3.5 w-3.5 mr-1.5" />
                            Reset
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(doctor)}
                            className={
                              doctor.is_active
                                ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 hover:text-yellow-700 border-yellow-200 hover:border-yellow-300"
                                : "bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-700 border-green-200 hover:border-green-300"
                            }
                          >
                            <Power className="h-3.5 w-3.5 mr-1.5" />
                            {doctor.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDoctorToDelete(doctor);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
        </>
      )}

      {/* Pending Approval Tab */}
      {activeTab === "pending" && (
        <>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={pendingSearchQuery}
                onChange={(e) => setPendingSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter - Disabled for pending tab but kept for UI consistency */}
            <div className="w-64">
              <Select value="pending" disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending ({accessRequests.length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg overflow-hidden">
            {loadingRequests ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading requests...</p>
                </div>
              </div>
            ) : filteredAccessRequests.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {accessRequests.length === 0 ? "No pending access requests" : "No requests found"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Submitted</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccessRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          Dr. {request.first_name} {request.last_name}
                        </TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>{request.phone || "N/A"}</TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(request)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Invite Provider Modal */}
      <Dialog
        open={isInviteModalOpen}
        onOpenChange={(open) => {
          setIsInviteModalOpen(open);
          if (!open) {
            resetInviteForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Invite New Provider</DialogTitle>
            <DialogDescription>
              Add a new provider to the platform. They will receive login credentials via email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteDoctor} className="space-y-3 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-xs">First Name *</Label>
                <Input
                  id="firstName"
                  value={inviteFormData.firstName}
                  onChange={(e) =>
                    setInviteFormData({ ...inviteFormData, firstName: e.target.value })
                  }
                  required
                  placeholder="John"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs">Last Name *</Label>
                <Input
                  id="lastName"
                  value={inviteFormData.lastName}
                  onChange={(e) =>
                    setInviteFormData({ ...inviteFormData, lastName: e.target.value })
                  }
                  required
                  placeholder="Doe"
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="companyName" className="text-xs">Company Name (Optional)</Label>
              <Input
                id="companyName"
                value={inviteFormData.companyName}
                onChange={(e) =>
                  setInviteFormData({ ...inviteFormData, companyName: e.target.value })
                }
                placeholder="ABC Medical Clinic"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteFormData.email}
                  onChange={(e) =>
                    setInviteFormData({ ...inviteFormData, email: e.target.value })
                  }
                  required
                  placeholder="doctor@example.com"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={inviteFormData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setInviteFormData({ ...inviteFormData, phone: formatted });
                  }}
                  placeholder="+1 (555) 123-4567"
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-xs">Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={inviteFormData.password}
                    onChange={(e) =>
                      setInviteFormData({ ...inviteFormData, password: e.target.value })
                    }
                    required
                    placeholder="Create a strong password"
                    className="pr-10 h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className="px-3 h-9"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Physical Address Section */}
            <div className="border-t pt-3 mt-3">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Physical Address</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="physicalStreet" className="text-xs">Street Address</Label>
                  <Input
                    id="physicalStreet"
                    value={inviteFormData.physicalAddress.street}
                    onChange={(e) =>
                      setInviteFormData({
                        ...inviteFormData,
                        physicalAddress: {
                          ...inviteFormData.physicalAddress,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="123 Main St"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="physicalCity" className="text-xs">City</Label>
                    <Input
                      id="physicalCity"
                      value={inviteFormData.physicalAddress.city}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          physicalAddress: {
                            ...inviteFormData.physicalAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="New York"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="physicalState" className="text-xs">State</Label>
                    <Input
                      id="physicalState"
                      value={inviteFormData.physicalAddress.state}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          physicalAddress: {
                            ...inviteFormData.physicalAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="NY"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="physicalZip" className="text-xs">ZIP</Label>
                    <Input
                      id="physicalZip"
                      value={inviteFormData.physicalAddress.zip}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          physicalAddress: {
                            ...inviteFormData.physicalAddress,
                            zip: e.target.value,
                          },
                        })
                      }
                      placeholder="10001"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="physicalCountry" className="text-xs">Country</Label>
                    <Input
                      id="physicalCountry"
                      value={inviteFormData.physicalAddress.country}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          physicalAddress: {
                            ...inviteFormData.physicalAddress,
                            country: e.target.value,
                          },
                        })
                      }
                      placeholder="USA"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="border-t pt-3 mt-3">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Billing Address (for provider payments)</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="billingStreet" className="text-xs">Street Address</Label>
                  <Input
                    id="billingStreet"
                    value={inviteFormData.billingAddress.street}
                    onChange={(e) =>
                      setInviteFormData({
                        ...inviteFormData,
                        billingAddress: {
                          ...inviteFormData.billingAddress,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="123 Main St"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="billingCity" className="text-xs">City</Label>
                    <Input
                      id="billingCity"
                      value={inviteFormData.billingAddress.city}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          billingAddress: {
                            ...inviteFormData.billingAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="New York"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingState" className="text-xs">State</Label>
                    <Input
                      id="billingState"
                      value={inviteFormData.billingAddress.state}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          billingAddress: {
                            ...inviteFormData.billingAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="NY"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingZip" className="text-xs">ZIP</Label>
                    <Input
                      id="billingZip"
                      value={inviteFormData.billingAddress.zip}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          billingAddress: {
                            ...inviteFormData.billingAddress,
                            zip: e.target.value,
                          },
                        })
                      }
                      placeholder="10001"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCountry" className="text-xs">Country</Label>
                    <Input
                      id="billingCountry"
                      value={inviteFormData.billingAddress.country}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          billingAddress: {
                            ...inviteFormData.billingAddress,
                            country: e.target.value,
                          },
                        })
                      }
                      placeholder="USA"
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="taxId" className="text-xs">Tax ID / EIN</Label>
                  <Input
                    id="taxId"
                    value={inviteFormData.taxId}
                    onChange={(e) =>
                      setInviteFormData({ ...inviteFormData, taxId: e.target.value })
                    }
                    placeholder="XX-XXXXXXX"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            <div className="border-t pt-3 mt-3">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Payment Information (how we pay you)</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="paymentMethod" className="text-xs">Payment Method</Label>
                    <Select
                      value={inviteFormData.paymentMethod}
                      onValueChange={(value) =>
                        setInviteFormData({ ...inviteFormData, paymentMethod: value })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer (ACH)</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentSchedule" className="text-xs">Payment Schedule</Label>
                    <Select
                      value={inviteFormData.paymentSchedule}
                      onValueChange={(value) =>
                        setInviteFormData({ ...inviteFormData, paymentSchedule: value })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="commissionRate" className="text-xs">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    value={inviteFormData.commissionRate}
                    onChange={(e) =>
                      setInviteFormData({ ...inviteFormData, commissionRate: e.target.value })
                    }
                    placeholder="e.g., 20% or $50 per prescription"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="bankName" className="text-xs">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={inviteFormData.paymentDetails.bank_name}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          paymentDetails: {
                            ...inviteFormData.paymentDetails,
                            bank_name: e.target.value,
                          },
                        })
                      }
                      placeholder="Chase Bank"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountHolderName" className="text-xs">Account Holder Name</Label>
                    <Input
                      id="accountHolderName"
                      value={inviteFormData.paymentDetails.account_holder_name}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          paymentDetails: {
                            ...inviteFormData.paymentDetails,
                            account_holder_name: e.target.value,
                          },
                        })
                      }
                      placeholder="Dr. John Doe"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="accountNumber" className="text-xs">Account Number</Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      value={inviteFormData.paymentDetails.account_number}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          paymentDetails: {
                            ...inviteFormData.paymentDetails,
                            account_number: e.target.value,
                          },
                        })
                      }
                      placeholder="********1234"
                      className="h-9 tracking-wider"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber" className="text-xs">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      value={inviteFormData.paymentDetails.routing_number}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          paymentDetails: {
                            ...inviteFormData.paymentDetails,
                            routing_number: e.target.value,
                          },
                        })
                      }
                      placeholder="021000021"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="accountType" className="text-xs">Account Type</Label>
                    <Select
                      value={inviteFormData.paymentDetails.account_type}
                      onValueChange={(value) =>
                        setInviteFormData({
                          ...inviteFormData,
                          paymentDetails: {
                            ...inviteFormData.paymentDetails,
                            account_type: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="swiftCode" className="text-xs">SWIFT Code (Optional)</Label>
                    <Input
                      id="swiftCode"
                      value={inviteFormData.paymentDetails.swift_code}
                      onChange={(e) =>
                        setInviteFormData({
                          ...inviteFormData,
                          paymentDetails: {
                            ...inviteFormData.paymentDetails,
                            swift_code: e.target.value,
                          },
                        })
                      }
                      placeholder="For international"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-800">
                The doctor will receive a welcome email with their login credentials.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
                disabled={isSubmitting}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 h-9"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Inviting..." : "Invite Doctor"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update doctor information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditDoctor} className="space-y-3 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editFirstName" className="text-xs">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={editFormData.firstName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, firstName: e.target.value })
                  }
                  required
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="editLastName" className="text-xs">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={editFormData.lastName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, lastName: e.target.value })
                  }
                  required
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editEmail" className="text-xs">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  required
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="editPhone" className="text-xs">Phone</Label>
                <Input
                  id="editPhone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setEditFormData({ ...editFormData, phone: formatted });
                  }}
                  placeholder="+1 (555) 123-4567"
                  className="h-9"
                />
              </div>
            </div>

            {/* Physical Address Section */}
            <div className="border-t pt-3 mt-3">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Physical Address</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="editPhysicalStreet" className="text-xs">Street Address</Label>
                  <Input
                    id="editPhysicalStreet"
                    value={editFormData.physicalAddress.street}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        physicalAddress: {
                          ...editFormData.physicalAddress,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="123 Main St"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="editPhysicalCity" className="text-xs">City</Label>
                    <Input
                      id="editPhysicalCity"
                      value={editFormData.physicalAddress.city}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          physicalAddress: {
                            ...editFormData.physicalAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="New York"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhysicalState" className="text-xs">State</Label>
                    <Input
                      id="editPhysicalState"
                      value={editFormData.physicalAddress.state}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          physicalAddress: {
                            ...editFormData.physicalAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="NY"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhysicalZip" className="text-xs">ZIP</Label>
                    <Input
                      id="editPhysicalZip"
                      value={editFormData.physicalAddress.zip}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          physicalAddress: {
                            ...editFormData.physicalAddress,
                            zip: e.target.value,
                          },
                        })
                      }
                      placeholder="10001"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhysicalCountry" className="text-xs">Country</Label>
                    <Input
                      id="editPhysicalCountry"
                      value={editFormData.physicalAddress.country}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          physicalAddress: {
                            ...editFormData.physicalAddress,
                            country: e.target.value,
                          },
                        })
                      }
                      placeholder="USA"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="border-t pt-3 mt-3">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Billing Address (for provider payments)</h3>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="editBillingStreet" className="text-xs">Street Address</Label>
                  <Input
                    id="editBillingStreet"
                    value={editFormData.billingAddress.street}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        billingAddress: {
                          ...editFormData.billingAddress,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="123 Main St"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="editBillingCity" className="text-xs">City</Label>
                    <Input
                      id="editBillingCity"
                      value={editFormData.billingAddress.city}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          billingAddress: {
                            ...editFormData.billingAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="New York"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editBillingState" className="text-xs">State</Label>
                    <Input
                      id="editBillingState"
                      value={editFormData.billingAddress.state}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          billingAddress: {
                            ...editFormData.billingAddress,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="NY"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editBillingZip" className="text-xs">ZIP</Label>
                    <Input
                      id="editBillingZip"
                      value={editFormData.billingAddress.zip}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          billingAddress: {
                            ...editFormData.billingAddress,
                            zip: e.target.value,
                          },
                        })
                      }
                      placeholder="10001"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editBillingCountry" className="text-xs">Country</Label>
                    <Input
                      id="editBillingCountry"
                      value={editFormData.billingAddress.country}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          billingAddress: {
                            ...editFormData.billingAddress,
                            country: e.target.value,
                          },
                        })
                      }
                      placeholder="USA"
                      className="h-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editTaxId" className="text-xs">Tax ID / EIN</Label>
                  <Input
                    id="editTaxId"
                    value={editFormData.taxId}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, taxId: e.target.value })
                    }
                    placeholder="XX-XXXXXXX"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            <div className="border-t pt-3 mt-3">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Payment Information (how we pay you)</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="editPaymentMethod" className="text-xs">Payment Method</Label>
                    <Select
                      value={editFormData.paymentMethod}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, paymentMethod: value })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer (ACH)</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editPaymentSchedule" className="text-xs">Payment Schedule</Label>
                    <Select
                      value={editFormData.paymentSchedule}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, paymentSchedule: value })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="editCommissionRate" className="text-xs">Commission Rate (%)</Label>
                  <Input
                    id="editCommissionRate"
                    value={editFormData.commissionRate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, commissionRate: e.target.value })
                    }
                    placeholder="e.g., 20% or $50 per prescription"
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="editBankName" className="text-xs">Bank Name</Label>
                    <Input
                      id="editBankName"
                      value={editFormData.paymentDetails.bank_name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          paymentDetails: {
                            ...editFormData.paymentDetails,
                            bank_name: e.target.value,
                          },
                        })
                      }
                      placeholder="Chase Bank"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editAccountHolderName" className="text-xs">Account Holder Name</Label>
                    <Input
                      id="editAccountHolderName"
                      value={editFormData.paymentDetails.account_holder_name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          paymentDetails: {
                            ...editFormData.paymentDetails,
                            account_holder_name: e.target.value,
                          },
                        })
                      }
                      placeholder="Dr. John Doe"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="editAccountNumber" className="text-xs">Account Number</Label>
                    <Input
                      id="editAccountNumber"
                      type="text"
                      value={editFormData.paymentDetails.account_number}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          paymentDetails: {
                            ...editFormData.paymentDetails,
                            account_number: e.target.value,
                          },
                        })
                      }
                      placeholder="********1234"
                      className="h-9 tracking-wider"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRoutingNumber" className="text-xs">Routing Number</Label>
                    <Input
                      id="editRoutingNumber"
                      value={editFormData.paymentDetails.routing_number}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          paymentDetails: {
                            ...editFormData.paymentDetails,
                            routing_number: e.target.value,
                          },
                        })
                      }
                      placeholder="021000021"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="editAccountType" className="text-xs">Account Type</Label>
                    <Select
                      value={editFormData.paymentDetails.account_type}
                      onValueChange={(value) =>
                        setEditFormData({
                          ...editFormData,
                          paymentDetails: {
                            ...editFormData.paymentDetails,
                            account_type: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editSwiftCode" className="text-xs">SWIFT Code (Optional)</Label>
                    <Input
                      id="editSwiftCode"
                      value={editFormData.paymentDetails.swift_code}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          paymentDetails: {
                            ...editFormData.paymentDetails,
                            swift_code: e.target.value,
                          },
                        })
                      }
                      placeholder="For international"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
                className="h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9">
                {isSubmitting ? "Updating..." : "Update Doctor"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Dr. {doctorToDelete?.first_name}{" "}
              {doctorToDelete?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDoctor}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Access Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the access request from Dr. {requestToReject?.first_name}{" "}
              {requestToReject?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRejectRequest}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for Dr. {doctorToResetPassword?.first_name} {doctorToResetPassword?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateResetPassword}
                  className="px-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordDialogOpen(false);
                setDoctorToResetPassword(null);
                setNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword || newPassword.length < 6}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Access Request Details Modal */}
      <Dialog open={isViewDetailsModalOpen} onOpenChange={setIsViewDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Access Request Details</DialogTitle>
            <DialogDescription>
              Review the provider access request information
            </DialogDescription>
          </DialogHeader>

          {viewingRequest && (
            <div className="space-y-6 py-4">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">First Name</Label>
                    <p className="text-sm font-medium">{viewingRequest.first_name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Last Name</Label>
                    <p className="text-sm font-medium">{viewingRequest.last_name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Email</Label>
                    <p className="text-sm font-medium">{viewingRequest.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Phone</Label>
                    <p className="text-sm font-medium">{viewingRequest.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Medical Credentials */}
              {viewingRequest.form_data && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Medical Credentials</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-600">NPI Number</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.npiNumber || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Medical License</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.medicalLicense || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">License State</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.licenseState || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Specialty</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.specialty || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Practice Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Practice Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-600">Practice Name</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.practiceName || "N/A"}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-600">Practice Address</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.practiceAddress || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">City</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.city || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">State</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.state || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">ZIP Code</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.zipCode || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Years in Practice</Label>
                        <p className="text-sm font-medium">{viewingRequest.form_data.yearsInPractice || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(viewingRequest.form_data.patientsPerMonth ||
                    viewingRequest.form_data.interestedIn ||
                    viewingRequest.form_data.hearAboutUs ||
                    viewingRequest.form_data.additionalInfo) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Additional Information</h3>
                      <div className="space-y-3">
                        {viewingRequest.form_data.patientsPerMonth && (
                          <div>
                            <Label className="text-xs text-gray-600">Patients Per Month</Label>
                            <p className="text-sm font-medium">{viewingRequest.form_data.patientsPerMonth}</p>
                          </div>
                        )}
                        {viewingRequest.form_data.interestedIn && (
                          <div>
                            <Label className="text-xs text-gray-600">Interested In</Label>
                            <p className="text-sm font-medium">{viewingRequest.form_data.interestedIn}</p>
                          </div>
                        )}
                        {viewingRequest.form_data.hearAboutUs && (
                          <div>
                            <Label className="text-xs text-gray-600">How They Heard About Us</Label>
                            <p className="text-sm font-medium">{viewingRequest.form_data.hearAboutUs}</p>
                          </div>
                        )}
                        {viewingRequest.form_data.additionalInfo && (
                          <div>
                            <Label className="text-xs text-gray-600">Additional Information</Label>
                            <p className="text-sm font-medium whitespace-pre-wrap">{viewingRequest.form_data.additionalInfo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submission Date */}
              <div className="pt-4 border-t">
                <Label className="text-xs text-gray-600">Submitted On</Label>
                <p className="text-sm font-medium">
                  {new Date(viewingRequest.created_at).toLocaleString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsViewDetailsModalOpen(false)}
            >
              Close
            </Button>
            {viewingRequest && (
              <Button
                onClick={() => {
                  setIsViewDetailsModalOpen(false);
                  handleApproveRequest(viewingRequest);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve & Invite
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
