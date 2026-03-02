"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, ShieldCheck, Eye, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";

interface SuperAdmin {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in: string | null;
  pharmacies: Array<{
    pharmacy_id: string;
    pharmacies: { name: string; slug: string } | null;
  }>;
}

export const SuperAdminsManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<SuperAdmin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/super-admins");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      } else {
        toast.error("Failed to fetch admins");
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to fetch admins");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const special = "!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += special.charAt(Math.floor(Math.random() * special.length));
    pwd += Math.floor(Math.random() * 10);
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/super-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Super admin created successfully");
        setIsFormOpen(false);
        setFormData({ email: "", password: "", full_name: "" });
        fetchAdmins();
      } else {
        toast.error(result.error || "Failed to create admin");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error("Failed to create admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;

    try {
      const response = await fetch("/api/admin/super-admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: deletingAdmin.user_id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Admin access removed");
        setDeletingAdmin(null);
        fetchAdmins();
      } else {
        toast.error(result.error || "Failed to remove admin");
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      toast.error("Failed to remove admin");
    }
  };

  return (
    <>
      <div className="container max-w-5xl mx-auto py-6 space-y-6 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
              Super Admins
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Platform-level administrators with full access to all pharmacies and settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchAdmins}
              variant="outline"
              className="border border-border"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setFormData({ email: "", password: "", full_name: "" });
                setShowPassword(false);
                setIsFormOpen(true);
              }}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-admin"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Super Admin
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Linked Pharmacies</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No super admins found.
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.user_id} data-testid={`row-admin-${admin.user_id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[#1E3A8A]" />
                        <div>
                          <div className="font-medium" data-testid={`text-admin-email-${admin.user_id}`}>
                            {admin.email}
                          </div>
                          {admin.full_name && (
                            <div className="text-sm text-muted-foreground">{admin.full_name}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.pharmacies.length > 0 ? (
                          admin.pharmacies.map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {(p.pharmacies as { name: string } | null)?.name || "Unknown"}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Platform only</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {admin.last_sign_in
                          ? new Date(admin.last_sign_in).toLocaleDateString()
                          : "Never"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingAdmin(admin)}
                        className="border border-border text-destructive hover:text-destructive"
                        data-testid={`button-delete-admin-${admin.user_id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-white border border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Super Admin</DialogTitle>
            <DialogDescription>
              This creates a platform-level admin with full access to all pharmacies and settings — same privileges as your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="e.g., John Smith"
                value={formData.full_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                data-testid="input-full-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Strong password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className="border border-border whitespace-nowrap"
                  data-testid="button-generate-password"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="border border-border"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.email || !formData.password}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-submit-create"
            >
              {isSubmitting ? "Creating..." : "Create Super Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingAdmin} onOpenChange={() => setDeletingAdmin(null)}>
        <AlertDialogContent className="bg-white border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for{" "}
              <strong>{deletingAdmin?.email}</strong>? This will revoke their platform-level
              admin privileges and unlink them from any pharmacies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
