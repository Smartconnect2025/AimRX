"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { MapPin, Eye, Trash2, UserPlus, Search, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BaseTableManagement } from "./BaseTableManagement";
import { getOptimizedAvatarUrl } from "@core/services/storage/avatarStorage";

import type { Provider } from "../types";
import { ProviderDetailView } from "./ProviderDetailView";
import { ProviderFormDialog } from "./ProviderFormDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

export const ProvidersManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/providers");
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      } else {
        toast.error("Failed to fetch providers");
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to fetch providers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const filteredProviders = providers.filter((provider) => {
    const fullName =
      `${provider.first_name || ""} ${provider.last_name || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      provider.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || provider.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border border-border"
          >
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 border border-border"
          >
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderTableHeaders = () => (
    <>
      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
        Provider
      </th>
      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
        Specialization
      </th>
      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
        Contact
      </th>
      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
        Location
      </th>
      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
        License
      </th>
      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
        NPI Number
      </th>
      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
        Verified
      </th>
      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
        Status
      </th>
      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
        Actions
      </th>
    </>
  );

  const renderTableRow = (provider: Provider) => (
    <>
      <td className="p-4 align-middle">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={
                provider.avatar_url
                  ? getOptimizedAvatarUrl(provider.avatar_url, 40)
                  : ""
              }
              alt={`${provider.first_name || ""} ${provider.last_name || ""}`}
            />
            <AvatarFallback className="text-sm">
              {provider.first_name && provider.last_name
                ? `${provider.first_name[0]}${provider.last_name[0]}`.toUpperCase()
                : "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium">
              {provider.first_name && provider.last_name
                ? `${provider.first_name} ${provider.last_name}`
                : ""}
            </div>
            <div className="text-sm text-muted-foreground">
              {provider.email || ""}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 align-middle">
        {provider.specialty ? (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border border-border"
          >
            {provider.specialty}
          </Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </td>
      <td className="p-4 align-middle">
        {provider.phone_number ? (
          <span className="text-sm">{provider.phone_number}</span>
        ) : (
          <span className="text-muted-foreground">No phone</span>
        )}
      </td>
      <td className="p-4 align-middle">
        {provider.licensed_states && provider.licensed_states.length > 0 ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            {provider.licensed_states.join(", ")}
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </td>
      <td className="p-4 align-middle">
        {provider.medical_licenses && provider.medical_licenses.length > 0 ? (
          <div className="flex flex-col gap-1">
            {provider.medical_licenses.map((license, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{license.state}</span>: {license.licenseNumber}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">No licenses</span>
        )}
      </td>
      <td className="p-4 align-middle">
        {provider.npi_number ? (
          <span className="text-sm font-mono">{provider.npi_number}</span>
        ) : (
          <span className="text-muted-foreground">Not provided</span>
        )}
      </td>
      <td className="p-4 align-middle">
        {provider.is_verified ? (
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Not Verified</span>
          </div>
        )}
      </td>
      <td className="p-4 align-middle">{getStatusBadge(provider.status)}</td>
      <td className="p-4 align-middle text-right">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedProvider(provider)}
            className="border border-border"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeletingProvider(provider)}
            className="border border-border"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </>
  );

  const handleDelete = async () => {
    if (!deletingProvider) return;
    try {
      const response = await fetch(
        `/api/admin/providers/${deletingProvider.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: false }),
        },
      );

      if (response.ok) {
        toast.success("Provider deactivated successfully");
        setDeletingProvider(null);
        fetchProviders();
      } else {
        toast.error("Failed to deactivate provider");
      }
    } catch (error) {
      console.error("Error deactivating provider:", error);
      toast.error("Failed to deactivate provider");
    }
  };

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const response = await fetch("/api/admin/providers/revalidate", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        fetchProviders();
      } else {
        toast.error("Failed to revalidate providers");
      }
    } catch (error) {
      console.error("Error revalidating providers:", error);
      toast.error("Failed to revalidate providers");
    } finally {
      setIsRevalidating(false);
    }
  };

  return (
    <>
      <div className="container max-w-5xl mx-auto py-6 space-y-6 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Provider Management
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRevalidate}
              disabled={isRevalidating}
              variant="outline"
              className="border border-border"
            >
              {isRevalidating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Revalidating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Revalidate All
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Search providers by name, specialty..."
                className="pl-12 h-11 rounded-lg border-gray-200 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchProviders}
              className="h-11 w-11 border-gray-200 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <BaseTableManagement
          data={filteredProviders}
          isLoading={isLoading}
          renderTableHeaders={renderTableHeaders}
          renderTableRow={renderTableRow}
          getItemKey={(provider) => provider.id}
          emptyStateMessage="No providers found"
        />
      </div>

      {/* Dialogs */}
      <Dialog
        open={!!selectedProvider}
        onOpenChange={() => setSelectedProvider(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-transparent border-none">
          {selectedProvider && (
            <ProviderDetailView
              provider={selectedProvider as Provider}
              onClose={() => setSelectedProvider(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingProvider}
        onOpenChange={() => setDeletingProvider(null)}
      >
        <AlertDialogContent className="bg-white border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &ldquo;
              {deletingProvider?.first_name} {deletingProvider?.last_name}
              &rdquo;? This will set their status to inactive but won&apos;t
              delete their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Provider Form */}
      <ProviderFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchProviders}
      />
    </>
  );
};
