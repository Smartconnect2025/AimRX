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

  // Load doctors from Supabase
  const loadDoctors = useCallback(async () => {
    setLoading(true);
    const { data: providersData, error } = await supabase
      .from("providers")
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        created_at,
        users!inner(email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading doctors:", error);
      toast.error("Failed to load doctors");
      setLoading(false);
      return;
    }

    if (providersData) {
      const formattedDoctors = providersData.map((provider: {
        id: string;
        user_id: string;
        first_name: string;
        last_name: string;
        created_at: string;
        users: { email: string } | { email: string }[];
      }) => ({
        id: provider.id,
        user_id: provider.user_id,
        first_name: provider.first_name,
        last_name: provider.last_name,
        email: Array.isArray(provider.users) ? provider.users[0]?.email : provider.users?.email,
        created_at: provider.created_at,
        status: "Active",
      }));
      setDoctors(formattedDoctors);
    }
    setLoading(false);
  }, [supabase]);

  // Reset doctor password
  const handleResetPassword = async (doctorId: string, email: string) => {
    try {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to send password reset email");
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
                        onClick={() => handleResetPassword(doctor.id, doctor.email)}
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
    </div>
  );
}
