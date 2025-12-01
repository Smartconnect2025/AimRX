"use client";

import { useState, useEffect } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Key, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_API_KEY = "digitalrx_live_abcdef123456xyz789qwerty456789";

export default function AdminSettingsPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("digitalrx_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      // Set default key if none exists
      localStorage.setItem("digitalrx_api_key", DEFAULT_API_KEY);
      setApiKey(DEFAULT_API_KEY);
    }
  }, []);

  // Mask API key for display (show first 6 and last 3 characters)
  const getMaskedApiKey = (key: string) => {
    if (!key || key.length < 12) return "••••••••••••••••";
    const prefix = key.substring(0, 16);
    const suffix = key.substring(key.length - 3);
    return `${prefix}••••••••••••${suffix}`;
  };

  const handleTestConnection = async () => {
    setIsTesting(true);

    // Simulate API call
    setTimeout(() => {
      setIsTesting(false);
      toast.success("Connection successful!", {
        description: "Successfully connected to DigitalRx API",
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    }, 1500);
  };

  const handleOpenModal = () => {
    setNewApiKey("");
    setIsModalOpen(true);
  };

  const handleSaveNewKey = () => {
    if (!newApiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    // Save to localStorage
    localStorage.setItem("digitalrx_api_key", newApiKey);
    setApiKey(newApiKey);
    setIsModalOpen(false);

    toast.success("API key updated successfully!", {
      description: "Your new API key has been saved",
    });
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            DigitalRx Integration Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your DigitalRx API credentials and connection
          </p>
        </div>

        {/* API Key Section */}
        <div className="bg-white border border-border rounded-lg p-6 space-y-6">
          {/* Current API Key */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">API Key Configuration</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-key">Current API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="current-key"
                  value={getMaskedApiKey(apiKey)}
                  readOnly
                  className="font-mono text-sm bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={handleOpenModal}
                  className="whitespace-nowrap"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Rotate Key
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This key is used to send prescriptions to DigitalRx
              </p>
            </div>

            {/* Test Connection */}
            <div className="pt-4">
              <Button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full sm:w-auto"
              >
                {isTesting ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                About DigitalRx Integration
              </p>
              <p className="text-sm text-blue-700">
                DigitalRx is used to process and route e-prescriptions to
                pharmacies. Your API key authenticates all prescription
                submissions. Keep this key secure and rotate it regularly.
              </p>
            </div>
          </div>

          {/* API Status */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold text-sm text-gray-700">API Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Environment</p>
                <p className="text-sm font-medium">Production</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">API Version</p>
                <p className="text-sm font-medium">v2.1</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rotate API Key Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate / Update API Key</DialogTitle>
            <DialogDescription>
              Enter your new DigitalRx API key below. The old key will be
              replaced immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-key">New API Key</Label>
              <Input
                id="new-key"
                type="text"
                placeholder="digitalrx_live_..."
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Paste your new API key from the DigitalRx dashboard
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                Make sure to save your old key before rotating. Once updated,
                the old key will no longer work.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewKey}>Save New Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DefaultLayout>
  );
}
