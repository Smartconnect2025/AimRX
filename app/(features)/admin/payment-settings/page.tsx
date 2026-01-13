"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentCredentials {
  id?: string;
  apiLoginId: string;
  transactionKey: string;
  publicClientKey: string;
  signatureKey: string;
  environment: "sandbox" | "live";
  isVerified: boolean;
  lastVerifiedAt: string | null;
  verificationError: string | null;
}

export default function AdminPaymentSettingsPage() {
  const [credentials, setCredentials] = useState<PaymentCredentials>({
    apiLoginId: "",
    transactionKey: "",
    publicClientKey: "",
    signatureKey: "",
    environment: "sandbox",
    isVerified: false,
    lastVerifiedAt: null,
    verificationError: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTransactionKey, setShowTransactionKey] = useState(false);
  const [showSignatureKey, setShowSignatureKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing credentials
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/payment-credentials");

      if (response.ok) {
        const data = await response.json();
        if (data.credentials) {
          setCredentials({
            ...data.credentials,
            // Don't show actual keys for security - show masked version
            transactionKey: data.credentials.transactionKey || "",
            signatureKey: data.credentials.signatureKey || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
      toast.error("Failed to load payment credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PaymentCredentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleEnvironmentToggle = () => {
    const newEnv = credentials.environment === "sandbox" ? "live" : "sandbox";
    setCredentials((prev) => ({ ...prev, environment: newEnv }));
    setHasChanges(true);
  };

  const handleTestConnection = async () => {
    // Validate required fields
    if (!credentials.apiLoginId || !credentials.transactionKey) {
      toast.error("Please enter API Login ID and Transaction Key");
      return;
    }

    try {
      setTesting(true);
      const response = await fetch("/api/admin/payment-credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiLoginId: credentials.apiLoginId,
          transactionKey: credentials.transactionKey,
          environment: credentials.environment,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Connection successful! Credentials are valid.", {
          icon: <CheckCircle2 className="h-5 w-5" />,
        });
        setCredentials((prev) => ({
          ...prev,
          isVerified: true,
          lastVerifiedAt: new Date().toISOString(),
          verificationError: null,
        }));
      } else {
        toast.error(`Connection failed: ${data.error || "Invalid credentials"}`, {
          icon: <XCircle className="h-5 w-5" />,
        });
        setCredentials((prev) => ({
          ...prev,
          isVerified: false,
          verificationError: data.error || "Connection test failed",
        }));
      }
    } catch (error) {
      console.error("Test connection error:", error);
      toast.error("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!credentials.apiLoginId || !credentials.transactionKey) {
      toast.error("API Login ID and Transaction Key are required");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/payment-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Payment credentials saved successfully!", {
          description: "Keys are encrypted and stored securely.",
        });
        setHasChanges(false);
        loadCredentials(); // Reload to get masked keys
      } else {
        toast.error(`Failed to save: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save payment credentials");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          {credentials.isVerified ? (
            <Badge className="bg-green-500">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              Setup Required
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Configure AMRX Authorize.Net merchant credentials for payment processing
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authorize.Net Credentials</CardTitle>
          <CardDescription>
            Enter your Authorize.Net API credentials from the merchant interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Toggle */}
          <div className="space-y-2">
            <Label>Environment</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant={credentials.environment === "sandbox" ? "default" : "outline"}
                onClick={handleEnvironmentToggle}
                className="flex-1"
              >
                Sandbox (Test Mode)
              </Button>
              <Button
                type="button"
                variant={credentials.environment === "live" ? "default" : "outline"}
                onClick={handleEnvironmentToggle}
                className="flex-1"
              >
                Live (Production)
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {credentials.environment === "sandbox"
                ? "Use sandbox for testing with fake credit cards"
                : "⚠️ Live mode will process real payments"}
            </p>
          </div>

          {/* API Login ID */}
          <div className="space-y-2">
            <Label htmlFor="apiLoginId">
              API Login ID
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="apiLoginId"
              type="text"
              placeholder="Enter API Login ID"
              value={credentials.apiLoginId}
              onChange={(e) => handleInputChange("apiLoginId", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Find this in: Account → Settings → Security Settings → API Credentials & Keys
            </p>
          </div>

          {/* Transaction Key */}
          <div className="space-y-2">
            <Label htmlFor="transactionKey">
              Transaction Key
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="transactionKey"
                type={showTransactionKey ? "text" : "password"}
                placeholder="Enter Transaction Key"
                value={credentials.transactionKey}
                onChange={(e) => handleInputChange("transactionKey", e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowTransactionKey(!showTransactionKey)}
              >
                {showTransactionKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ This key is encrypted when saved and cannot be retrieved later
            </p>
          </div>

          {/* Public Client Key */}
          <div className="space-y-2">
            <Label htmlFor="publicClientKey">Public Client Key</Label>
            <Input
              id="publicClientKey"
              type="text"
              placeholder="Enter Public Client Key"
              value={credentials.publicClientKey}
              onChange={(e) => handleInputChange("publicClientKey", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Required for Accept Hosted payment form
            </p>
          </div>

          {/* Signature Key */}
          <div className="space-y-2">
            <Label htmlFor="signatureKey">Signature Key (For Webhooks)</Label>
            <div className="relative">
              <Input
                id="signatureKey"
                type={showSignatureKey ? "text" : "password"}
                placeholder="Enter Signature Key"
                value={credentials.signatureKey}
                onChange={(e) => handleInputChange("signatureKey", e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowSignatureKey(!showSignatureKey)}
              >
                {showSignatureKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Used to verify webhook notifications from Authorize.Net
            </p>
          </div>

          {/* Verification Status */}
          {credentials.lastVerifiedAt && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Last verified: {new Date(credentials.lastVerifiedAt).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          {credentials.verificationError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{credentials.verificationError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !credentials.apiLoginId || !credentials.transactionKey}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Where to find your Authorize.Net credentials:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Log in to your Authorize.Net merchant account</li>
            <li>Go to: Account → Settings → Security Settings</li>
            <li>Click "API Credentials & Keys"</li>
            <li>Copy your API Login ID and Transaction Key</li>
            <li>Click "Manage Public Client Key" to get the public key</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Security Note:</strong> All sensitive keys are encrypted using AES-256-GCM
            before being stored in the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
