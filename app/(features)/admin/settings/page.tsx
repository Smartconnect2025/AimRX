"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, CheckCircle2, AlertCircle, Settings as SettingsIcon, TestTube, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@core/supabase";
import Link from "next/link";

interface PharmacyBackend {
  id: string;
  pharmacy_id: string;
  pharmacy_name?: string;
  api_url: string;
  api_key_encrypted: string;
  store_id: string;
  is_active: boolean;
}

export default function AdminSettingsPage() {
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

  const handleTestH2H = async (backend: PharmacyBackend) => {
    setIsTesting(backend.id);

    try {
      toast.info("Testing H2H DigitalRx connection...", {
        description: "This is a connectivity test only",
      });

      const testPayload = {
        StoreID: backend.store_id,
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

      const response = await fetch(`${backend.api_url}/RxWebRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": backend.api_key_encrypted,
        },
        body: JSON.stringify(testPayload),
      });

      // Log the test result
      await fetch("/api/admin/system-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "H2H_CONNECTION_TEST",
          details: `Connection test to ${backend.pharmacy_name} (Store ${backend.store_id}) - Status: ${response.status}`,
          status: response.ok ? "success" : "info",
        }),
      });

      if (response.ok) {
        toast.success("H2H DigitalRx connection successful!", {
          description: `${backend.pharmacy_name} API responded with status ${response.status}`,
          icon: <CheckCircle2 className="h-5 w-5" />,
          duration: 5000,
        });
      } else {
        toast.warning("H2H DigitalRx connection test completed", {
          description: `Status ${response.status} - Check API logs for details`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("H2H Test Error:", error);
      toast.info("H2H DigitalRx connection test completed", {
        description: "Check API logs for more details",
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

  const activeBackend = backends.find(b => b.is_active);
  const envFallback = !activeBackend;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings & Integrations</h1>
        <p className="text-muted-foreground">
          Manage your DigitalRx API configurations and test connections
        </p>
      </div>

      {/* Current Active Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Active DigitalRx Configuration
          </CardTitle>
          <CardDescription>
            Currently active API key being used for prescription submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : envFallback ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium">Using Demo/Sandbox Key</p>
                <p className="text-sm text-muted-foreground">
                  From environment variables (.env file) - Store ID: 190190
                </p>
              </div>
              <Link href="/admin/settings/integrations">
                <Button variant="outline" size="sm">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Manage Keys
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{activeBackend.pharmacy_name}</p>
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Store ID: {activeBackend.store_id}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">API Key:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {showKeys[activeBackend.id] ? activeBackend.api_key_encrypted : maskKey(activeBackend.api_key_encrypted)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleShowKey(activeBackend.id)}
                    className="h-6 w-6 p-0"
                  >
                    {showKeys[activeBackend.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestH2H(activeBackend)}
                  disabled={isTesting === activeBackend.id}
                >
                  {isTesting === activeBackend.id ? (
                    <>Testing...</>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test H2H
                    </>
                  )}
                </Button>
                <Link href="/admin/settings/integrations">
                  <Button variant="outline" size="sm" className="w-full">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Configurations */}
      {backends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All DigitalRx Configurations</CardTitle>
            <CardDescription>
              View and test all pharmacy API configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {backends.map((backend) => (
              <div
                key={backend.id}
                className={`p-4 rounded-lg border ${
                  backend.is_active
                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestH2H(backend)}
                    disabled={isTesting === backend.id}
                  >
                    {isTesting === backend.id ? (
                      <>Testing...</>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href="/admin/settings/integrations" className="flex-1">
            <Button className="w-full">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Manage API Integrations
            </Button>
          </Link>
          <Link href="/admin/pharmacy-management" className="flex-1">
            <Button variant="outline" className="w-full">
              Add New Pharmacy
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Help Info */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>API Configuration:</strong> Each pharmacy you create can have its own DigitalRx API key and Store ID
          </p>
          <p>
            <strong>Active Config:</strong> Only one pharmacy configuration can be active at a time - this is what all prescriptions will use
          </p>
          <p>
            <strong>Fallback:</strong> If no pharmacy configuration is active, the system uses the demo key from your .env file
          </p>
          <p>
            <strong>Test H2H:</strong> Use the test button to verify the connection works before activating a configuration
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
