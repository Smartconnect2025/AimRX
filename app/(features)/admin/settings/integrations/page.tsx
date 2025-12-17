"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, CheckCircle2, Loader2, Eye, EyeOff, TestTube } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@core/supabase";

interface PharmacyBackend {
  id: string;
  pharmacy_id: string;
  pharmacy_name?: string;
  api_url: string;
  api_key_encrypted: string;
  store_id: string;
  is_active: boolean;
}

export default function IntegrationsPage() {
  const [backends, setBackends] = useState<PharmacyBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  useEffect(() => {
    loadBackends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBackends = async () => {
    try {
      const { data, error } = await supabase
        .from("pharmacy_backends")
        .select(`
          *,
          pharmacies!pharmacy_backends_pharmacy_id_fkey(name)
        `)
        .eq("system_type", "DigitalRx")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map the data to include pharmacy name
      const backendsWithNames = data?.map((backend) => ({
        ...backend,
        pharmacy_name: backend.pharmacies?.name || "Unknown Pharmacy"
      })) || [];

      setBackends(backendsWithNames);
    } catch (error) {
      console.error("Error loading backends:", error);
      toast.error("Failed to load API configurations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (backendId: string, currentActive: boolean) => {
    try {
      // If activating, deactivate all others first
      if (!currentActive) {
        await supabase
          .from("pharmacy_backends")
          .update({ is_active: false })
          .eq("system_type", "DigitalRx");
      }

      // Toggle this one
      const { error } = await supabase
        .from("pharmacy_backends")
        .update({ is_active: !currentActive })
        .eq("id", backendId);

      if (error) throw error;

      toast.success(
        !currentActive
          ? "Configuration activated - all prescriptions will now use this API key"
          : "Configuration deactivated - system will fall back to demo key"
      );
      loadBackends();
    } catch (error) {
      console.error("Error toggling backend:", error);
      toast.error("Failed to update configuration");
    }
  };

  const handleTestConnection = async (backend: PharmacyBackend) => {
    setIsTesting(backend.id);

    try {
      toast.info("Testing connection...", {
        description: "Sending test request to DigitalRx API",
      });

      const testPayload = {
        StoreID: backend.store_id,
        RxNumber: "TEST-" + Date.now(),
        PatientFirstName: "Test",
        PatientLastName: "Connection",
        DateOfBirth: "1990-01-01",
        DrugName: "Connection Test",
        Directions: "Test connection only",
        Quantity: 30,
        DaysSupply: 30,
        Refills: 0,
        PrescriberFirstName: "Test",
        PrescriberLastName: "Doctor",
        PrescriberNPI: "1234567890",
      };

      const response = await fetch(`${backend.api_url}/RxWebRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": backend.api_key_encrypted,
        },
        body: JSON.stringify(testPayload),
      });

      // Log test result
      await fetch("/api/admin/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "API_CONNECTION_TEST",
          details: `Tested ${backend.pharmacy_name} (Store ${backend.store_id}) - Status: ${response.status}`,
          status: response.ok ? "success" : "info",
        }),
      });

      if (response.ok) {
        toast.success("Connection successful!", {
          description: `${backend.pharmacy_name} is working properly`,
        });
      } else {
        toast.warning("Connection test completed", {
          description: `Status: ${response.status} - Check API logs for details`,
        });
      }
    } catch (error) {
      console.error("Test error:", error);
      toast.error("Connection test failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(null);
    }
  };

  const toggleShowKey = (backendId: string) => {
    setShowKeys(prev => ({ ...prev, [backendId]: !prev[backendId] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const activeBackend = backends.find(b => b.is_active);
  const envFallback = !activeBackend;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">API Integrations</h1>
        <p className="text-muted-foreground">
          Manage DigitalRx API configurations per pharmacy
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Current Active Configuration
          </CardTitle>
          <CardDescription>
            Which API key is currently being used for prescription submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {envFallback ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Using Demo/Sandbox Key</p>
                <p className="text-sm text-muted-foreground">
                  From environment variables (.env file) - Store ID: 190190
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">{activeBackend.pharmacy_name}</p>
                <p className="text-sm text-muted-foreground">
                  Store ID: {activeBackend.store_id}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pharmacy Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pharmacy API Configurations</CardTitle>
              <CardDescription>
                Each pharmacy&apos;s DigitalRx API settings are configured when creating the pharmacy
              </CardDescription>
            </div>
            <Button onClick={() => window.location.href = '/admin/pharmacy-management'}>
              Manage Pharmacies
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {backends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pharmacy API configurations found.</p>
              <p className="text-sm mt-2">Create a pharmacy with DigitalRx backend to see it here</p>
              <Button
                className="mt-4"
                onClick={() => window.location.href = '/admin/pharmacy-management'}
              >
                Create First Pharmacy
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {backends.map((backend) => (
                <Card key={backend.id} className={backend.is_active ? "border-green-500 dark:border-green-700" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{backend.pharmacy_name}</h3>
                          {backend.is_active && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            <span className="font-medium">Store ID:</span> {backend.store_id}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">API URL:</span> {backend.api_url}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">API Key:</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {showKeys[backend.id] ? backend.api_key_encrypted : maskKey(backend.api_key_encrypted)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleShowKey(backend.id)}
                              className="h-6 w-6 p-0"
                            >
                              {showKeys[backend.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${backend.id}`} className="text-sm">
                            {backend.is_active ? "Active" : "Inactive"}
                          </Label>
                          <Switch
                            id={`active-${backend.id}`}
                            checked={backend.is_active}
                            onCheckedChange={() => handleToggleActive(backend.id, backend.is_active)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(backend)}
                          disabled={isTesting === backend.id}
                        >
                          {isTesting === backend.id ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="mr-2 h-3 w-3" />
                              Test
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Create Pharmacy:</strong> When you create a pharmacy and select DigitalRx backend, you enter the API key and Store ID</p>
          <p><strong>2. Automatic Setup:</strong> The API configuration is automatically created and linked to that pharmacy</p>
          <p><strong>3. Switch Active Config:</strong> Toggle between pharmacies to change which API key is used for prescriptions</p>
          <p><strong>4. Test Anytime:</strong> Use the &quot;Test&quot; button to verify the connection works</p>
          <p><strong>5. Safe Fallback:</strong> If no configuration is active, system uses demo key from .env file</p>
        </CardContent>
      </Card>
    </div>
  );
}
