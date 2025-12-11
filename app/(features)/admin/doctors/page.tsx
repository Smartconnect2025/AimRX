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
import { Plus, Search, Edit, Key, Power, Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@core/supabase";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/core/utils/phone";
import { validatePassword } from "@/core/utils/password-validation";
import { PasswordRequirements } from "@/components/ui/password-requirements";
import { HipaaNotice } from "@/components/ui/hipaa-notice";

interface Doctor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  is_active: boolean;
}

export default function ManageDoctorsPage() {
  const supabase = createClient();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  // Load doctors from Supabase
  const loadDoctors = useCallback(async () => {
    setLoading(true);

    try {
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, user_id, first_name, last_name, email, phone_number, created_at, is_active")
        .order("created_at", { ascending: false });

      if (providersError) {
        console.error("Error loading providers:", providersError);
        toast.error("Failed to load doctors");
        setLoading(false);
        return;
      }

      if (providersData) {
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

  // Invite new doctor
  const handleInviteDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate passwords match
      if (inviteFormData.password !== inviteFormData.confirmPassword) {
        toast.error("Passwords do not match");
        setIsSubmitting(false);
        return;
      }

      // Validate password strength
      const validation = validatePassword(inviteFormData.password);
      if (!validation.isValid) {
        toast.error("Password does not meet all requirements");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/admin/invite-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: inviteFormData.firstName,
          lastName: inviteFormData.lastName,
          email: inviteFormData.email,
          phone: inviteFormData.phone || null,
          password: inviteFormData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite doctor");
      }

      toast.success(`Doctor invited! Credentials sent to ${inviteFormData.email}`);
      setInviteFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setIsInviteModalOpen(false);
      await loadDoctors();
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
    });
    setIsEditModalOpen(true);
  };

  // Reset password
  const handleResetPassword = async (userId: string, email: string) => {
    try {
      const newPassword = "Doctor2025!";

      const response = await fetch("/api/admin/reset-doctor-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success(`Password reset! New password sent to ${email}`);
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
      const { error } = await supabase
        .from("providers")
        .delete()
        .eq("id", doctorToDelete.id);

      if (error) throw error;

      toast.success("Doctor deleted successfully");
      setIsDeleteDialogOpen(false);
      setDoctorToDelete(null);
      await loadDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error("Failed to delete doctor");
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const getStatusCount = (status: string) => {
    if (status === "all") return doctors.length;
    if (status === "active") return doctors.filter((d) => d.is_active).length;
    if (status === "inactive") return doctors.filter((d) => !d.is_active).length;
    return 0;
  };

  // Password validation for invite form
  const passwordValidation = validatePassword(inviteFormData.password);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Manage Providers
          </h1>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Invite New Provider
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div>
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

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Active: {getStatusCount("active")}
          </Badge>
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Inactive: {getStatusCount("inactive")}
          </Badge>
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
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(doctor.user_id, doctor.email)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300"
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
                                ? "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 hover:border-orange-300"
                                : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
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
                            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
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

      {/* Invite Provider Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Provider</DialogTitle>
            <DialogDescription>
              Add a new provider to the platform. They will receive login credentials via email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteDoctor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={inviteFormData.firstName}
                onChange={(e) =>
                  setInviteFormData({ ...inviteFormData, firstName: e.target.value })
                }
                required
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={inviteFormData.lastName}
                onChange={(e) =>
                  setInviteFormData({ ...inviteFormData, lastName: e.target.value })
                }
                required
                placeholder="Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={inviteFormData.email}
                onChange={(e) =>
                  setInviteFormData({ ...inviteFormData, email: e.target.value })
                }
                required
                placeholder="doctor@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={inviteFormData.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setInviteFormData({ ...inviteFormData, phone: formatted });
                }}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={inviteFormData.password}
                  onChange={(e) =>
                    setInviteFormData({ ...inviteFormData, password: e.target.value })
                  }
                  required
                  placeholder="Create a strong password"
                  className="pr-10"
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
              {inviteFormData.password && (
                <PasswordRequirements
                  requirements={passwordValidation.requirements}
                  className="mt-3"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={inviteFormData.confirmPassword}
                  onChange={(e) =>
                    setInviteFormData({ ...inviteFormData, confirmPassword: e.target.value })
                  }
                  required
                  placeholder="Re-enter password"
                  minLength={8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                The doctor will receive a welcome email with their login credentials.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update doctor information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditDoctor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name *</Label>
              <Input
                id="editFirstName"
                value={editFormData.firstName}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, firstName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name *</Label>
              <Input
                id="editLastName"
                value={editFormData.lastName}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, lastName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editFormData.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setEditFormData({ ...editFormData, phone: formatted });
                }}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
    </div>
  );
}
