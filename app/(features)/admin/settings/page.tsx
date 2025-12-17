"use client";

import { useState, useEffect } from "react";
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
import { Key, CheckCircle2, AlertCircle, Copy, Send, Building2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@core/supabase";

const DEFAULT_API_KEY = "digitalrx_live_abcdef123456xyz789qwerty456789";

interface PharmacyBackend {
  id: string;
  pharmacy_id: string;
  store_id: string;
  api_key_encrypted: string;
  is_active: boolean;
  pharmacies: {
    name: string;
  } | null;
}

export default function AdminSettingsPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isTestingH2H, setIsTestingH2H] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [pharmacyBackends, setPharmacyBackends] = useState<PharmacyBackend[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  // Load API key from localStorage on mount and set webhook URL
  useEffect(() => {
    const storedKey = localStorage.getItem("digitalrx_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      // Set default key if none exists
      localStorage.setItem("digitalrx_api_key", DEFAULT_API_KEY);
      setApiKey(DEFAULT_API_KEY);
    }

    // Set webhook URL based on current domain
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      setWebhookUrl(`${baseUrl}/api/webhook/digitalrx`);
    }

    // Load pharmacy backends from database
    loadPharmacyBackends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPharmacyBackends = async () => {
    try {
      const { data, error } = await supabase
        .from("pharmacy_backends")
        .select(`
          id,
          pharmacy_id,
          store_id,
          api_key_encrypted,
          is_active,
          pharmacies!pharmacy_backends_pharmacy_id_fkey(name)
        `)
        .eq("system_type", "DigitalRx")
        .order("is_active", { ascending: false });

      if (error) throw error;

      // Type cast since Supabase returns correct shape but TS doesn't infer it properly
      setPharmacyBackends((data as unknown as PharmacyBackend[]) || []);
    } catch (error) {
      console.error("Error loading pharmacy backends:", error);
    }
  };

  const maskPharmacyKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  const toggleShowKey = (backendId: string) => {
    setShowKeys(prev => ({ ...prev, [backendId]: !prev[backendId] }));
  };

  // Mask API key for display (show first 6 and last 3 characters)
  const getMaskedApiKey = (key: string) => {
    if (!key || key.length < 12) return "••••••••••••••••";
    const prefix = key.substring(0, 16);
    const suffix = key.substring(key.length - 3);
    return `${prefix}••••••••••••${suffix}`;
  };

  const handleTestConnection = async () => {
    setIsTesting(true);

    try {
      // Check if API key is configured
      if (!apiKey || apiKey === DEFAULT_API_KEY) {
        toast.error("No credentials configured", {
          description: "Please set a valid DigitalRx API key first",
          icon: <AlertCircle className="h-5 w-5" />,
        });
        setIsTesting(false);
        return;
      }

      console.log("Testing DigitalRx connection via API route...");

      // Call our server-side API route to test the connection
      const response = await fetch("/api/admin/test-digitalrx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();
      console.log("Test connection response:", data);

      if (data.success) {
        const now = new Date().toLocaleTimeString();
        toast.success("Connected successfully! ✓", {
          description: `Last tested: ${now}`,
          icon: <CheckCircle2 className="h-5 w-5" />,
          duration: 5000,
        });
      } else {
        toast.error("Connection failed", {
          description: data.error || "Unable to reach DigitalRx API",
          icon: <AlertCircle className="h-5 w-5" />,
        });
      }
    } catch (error) {
      console.error("Test connection error:", error);
      toast.error("Connection failed", {
        description: error instanceof Error ? error.message : "Unable to reach DigitalRx API",
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } finally {
      setIsTesting(false);
    }
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

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied!", {
      description: "Paste this into your DigitalRx dashboard",
    });
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);

    try {
      // Get a random prescription from the database to test with
      const response = await fetch("/api/webhook/digitalrx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queue_id: "RX-TEST-9999",
          new_status: "shipped",
          tracking_number: "1Z999AA10123456784",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Webhook test successful!", {
          description: "Status update received and processed",
          icon: <CheckCircle2 className="h-5 w-5" />,
        });
      } else {
        toast.warning("Test sent, but prescription not found", {
          description: "Create a prescription first to test with real data",
        });
      }
    } catch {
      toast.error("Webhook test failed", {
        description: "Could not connect to webhook endpoint",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleTestH2H = async () => {
    setIsTestingH2H(true);

    try {
      toast.info("Testing H2H DigitalRx connection...", {
        description: "This is a connectivity test only",
      });

      // Test direct connection to DigitalRx API without saving to database
      const DIGITALRX_API_KEY = process.env.NEXT_PUBLIC_DIGITALRX_API_KEY || "";
      const DIGITALRX_BASE_URL = "https://www.dbswebserver.com/DBSRestApi/API";

      // Just test the connection by trying to reach the API
      const testPayload = {
        StoreID: "190190",
        VendorName: "SmartRx Test",
        Patient: {
          FirstName: "Test",
          LastName: "Patient",
          DOB: "1980-01-01",
          Sex: "M",
        },
        Doctor: {
          DoctorFirstName: "Test",
          DoctorLastName: "Doctor",
          DoctorNpi: "1234567890",
        },
        RxClaim: {
          RxNumber: `TEST-${Date.now()}`,
          DrugName: "Test Medication",
          Qty: "30",
          DateWritten: new Date().toISOString().split('T')[0],
        },
      };

      const response = await fetch(`${DIGITALRX_BASE_URL}/RxWebRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": DIGITALRX_API_KEY,
        },
        body: JSON.stringify(testPayload),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      // Log the test result to system logs without creating an error
      await fetch("/api/admin/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "H2H_CONNECTION_TEST",
          details: `Connection test to DigitalRx API - Status: ${response.status}`,
          status: response.ok ? "success" : "info",
          user_name: "Admin",
        }),
      });

      if (response.ok) {
        toast.success("H2H DigitalRx connection successful!", {
          description: `API responded with status ${response.status}`,
          icon: <CheckCircle2 className="h-5 w-5" />,
          duration: 5000,
        });
        console.log("✅ H2H Connection Test:", { status: response.status, data });
      } else {
        toast.warning("H2H DigitalRx connection test completed", {
          description: `Status ${response.status} - Check API logs for details`,
          duration: 5000,
        });
        console.log("⚠️ H2H Connection Test:", { status: response.status, data });
      }
    } catch (error) {
      // Log as info, not error, since this is just a test
      await fetch("/api/admin/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "H2H_CONNECTION_TEST",
          details: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          status: "info",
          user_name: "Admin",
        }),
      }).catch(() => {});

      toast.info("H2H DigitalRx connection test completed", {
        description: "Could not reach API - Check API logs for details",
      });
      console.log("ℹ️ H2H Connection Test:", error);
    } finally {
      setIsTestingH2H(false);
    }
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            DigitalRx Integration Settings
          </h1>
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
            <div className="pt-4 flex gap-2">
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
              <Button
                onClick={handleTestH2H}
                disabled={isTestingH2H}
                variant="outline"
                className="w-full sm:w-auto bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                {isTestingH2H ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                    Testing H2H...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Test Live H2H DigitalRx
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

        {/* Webhook Configuration Section */}
        <div className="bg-white border border-border rounded-lg p-6 space-y-6 mt-6">
          <div className="flex items-center gap-2 pb-4 border-b">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Webhook Configuration</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  readOnly
                  className="font-mono text-sm bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyWebhookUrl}
                  className="whitespace-nowrap"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste this URL into your DigitalRx dashboard to receive automatic status updates
              </p>
            </div>

            {/* Test Webhook */}
            <div className="pt-2">
              <Button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {isTestingWebhook ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Testing Webhook...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Test Webhook
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Webhook Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-900">
                How Webhooks Work
              </p>
              <p className="text-sm text-green-700">
                When DigitalRx or your pharmacy updates a prescription status (approved, packed, shipped, delivered),
                they will send a POST request to this webhook URL. The system automatically updates the prescription
                in real-time without any manual intervention.
              </p>
            </div>
          </div>

          {/* Webhook Payload Example */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold text-sm text-gray-700">Expected Payload Format</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">
{`{
  "queue_id": "RX-ABC123-4567",
  "new_status": "shipped",
  "tracking_number": "1Z999AA10123456784"
}`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Valid statuses: submitted, billing, approved, packed, shipped, delivered
            </p>
          </div>
        </div>

        {/* Pharmacy API Keys Section - Shows API keys from database */}
        {pharmacyBackends.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-6 space-y-6 mt-6">
            <div className="flex items-center gap-2 pb-4 border-b">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Pharmacy API Configurations</h2>
            </div>

            <div className="space-y-3">
              {pharmacyBackends.map((backend) => (
                <div
                  key={backend.id}
                  className={`p-4 rounded-lg border ${
                    backend.is_active
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">
                          {backend.pharmacies?.name || "Unknown Pharmacy"}
                        </h3>
                        {backend.is_active && (
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium">Store ID:</span>{" "}
                          {backend.store_id}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">API Key:</span>
                          <code className="text-xs bg-white px-2 py-1 rounded border">
                            {showKeys[backend.id]
                              ? backend.api_key_encrypted
                              : maskPharmacyKey(backend.api_key_encrypted)}
                          </code>
                          <button
                            onClick={() => toggleShowKey(backend.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {showKeys[backend.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Pharmacy API Keys
                </p>
                <p className="text-sm text-blue-700">
                  These API keys are configured per pharmacy. When you create a pharmacy
                  with DigitalRx integration, the API key is automatically saved here.
                  Only one pharmacy can be active at a time for prescription submissions.
                </p>
              </div>
            </div>
          </div>
        )}
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
    </>
  );
}
