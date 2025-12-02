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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createClient } from "@core/supabase";
import { toast } from "sonner";

interface Doctor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  status: string;
}

export default function ManageDoctorsPage() {
  const supabase = createClient();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Load doctors from Supabase
  const loadDoctors = useCallback(async () => {
    setLoading(true);

    try {
      // First, get all providers
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, user_id, first_name, last_name, created_at, email")
        .order("created_at", { ascending: false });

      if (providersError) {
        console.error("Error loading providers:", providersError);
        toast.error("Failed to load doctors");
        setLoading(false);
        return;
      }

      if (providersData) {
        const formattedDoctors = providersData.map((provider) => ({
          id: provider.id,
          user_id: provider.user_id,
          first_name: provider.first_name,
          last_name: provider.last_name,
          email: provider.email || "No email",
          created_at: provider.created_at,
          status: "Active",
        }));
        setDoctors(formattedDoctors);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Reset doctor password
  const handleResetPassword = async (doctorId: string, email: string) => {
    try {
      const newPassword = "Doctor123!";

      // Call API to reset password
      const response = await fetch("/api/admin/reset-doctor-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: doctorId,
          email: email,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success(`Password reset! New password sent to ${email}`);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password"
      );
    }
  };

  // Invite new doctor
  const handleInviteDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const defaultPassword = "Welcome123!";

      // Call the API to create the doctor
      const response = await fetch("/api/admin/invite-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          password: defaultPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite doctor");
      }

      toast.success(
        `Doctor invited successfully! Login credentials sent to ${formData.email}`
      );

      // Reset form and close modal
      setFormData({ firstName: "", lastName: "", email: "", phone: "" });
      setIsInviteModalOpen(false);

      // Reload doctors list
      await loadDoctors();
    } catch (error) {
      console.error("Error inviting doctor:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to invite doctor"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Manage Doctors
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage provider accounts
            </p>
          </div>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Invite New Doctor
          </Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No doctors found
                  </TableCell>
                </TableRow>
              ) : (
                doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </TableCell>
                    <TableCell>{doctor.email}</TableCell>
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
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        {doctor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(doctor.user_id, doctor.email)}
                      >
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Invite Doctor Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Doctor</DialogTitle>
            <DialogDescription>
              Add a new doctor to the platform. They will receive login credentials via email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteDoctor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
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
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
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
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Default Password:</strong> Welcome123!
                <br />
                Login credentials will be sent to the doctor&apos;s email.
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
    </div>
  );
}
