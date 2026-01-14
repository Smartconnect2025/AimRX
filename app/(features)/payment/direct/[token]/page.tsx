"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentDetails {
  id: string;
  totalAmountCents: number;
  consultationFeeCents: number;
  medicationCostCents: number;
  patientName: string;
  patientEmail: string;
  providerName: string;
  description: string;
  paymentStatus: string;
  expiresAt: string;
  prescriptionMedication?: string;
}

export default function DirectPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid payment link");
      setLoading(false);
      return;
    }

    loadPaymentDetails();
  }, [token]);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/details/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load payment details");
        return;
      }

      // Extract payment details from response
      const paymentData = data.payment || data;

      if (paymentData.paymentStatus === "completed") {
        router.push(`/payment/success/${token}`);
        return;
      }

      setPaymentDetails(paymentData);
    } catch (err) {
      setError("Failed to load payment details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpirationDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpirationDate(e.target.value);
    if (formatted.replace(/\//g, "").length <= 4) {
      setExpirationDate(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, "");
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
      toast.error("Please enter a valid card number");
      return;
    }

    if (!expirationDate || expirationDate.length !== 5) {
      toast.error("Please enter a valid expiration date (MM/YY)");
      return;
    }

    if (!cvv || cvv.length < 3) {
      toast.error("Please enter a valid CVV");
      return;
    }

    if (!cardholderName) {
      toast.error("Please enter cardholder name");
      return;
    }

    if (!zipCode || zipCode.length < 5) {
      toast.error("Please enter a valid ZIP code");
      return;
    }

    try {
      setProcessing(true);

      // Convert MM/YY to MMYY format
      const expDateFormatted = expirationDate.replace("/", "");

      const response = await fetch("/api/payments/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentToken: token,
          cardNumber: cardNumber.replace(/\s/g, ""),
          expirationDate: expDateFormatted,
          cvv,
          cardholderName,
          billingAddress: {
            zip: zipCode,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Payment successful!");
        router.push(`/payment/success/${token}`);
      } else {
        toast.error(data.error || "Payment failed. Please check your card details.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !paymentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Payment Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || "Failed to load payment details"}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = (paymentDetails.totalAmountCents / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Payment Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Payment Details</CardTitle>
            <CardDescription>
              Complete your payment for prescription medication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Patient:</p>
                <p className="font-medium">{paymentDetails.patientName}</p>
              </div>
              <div>
                <p className="text-gray-600">Provider:</p>
                <p className="font-medium">{paymentDetails.providerName}</p>
              </div>
              <div>
                <p className="text-gray-600">Medication:</p>
                <p className="font-medium">{paymentDetails.prescriptionMedication || "Prescription"}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount:</p>
                <p className="text-2xl font-bold text-blue-600">${totalAmount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              <CardTitle>Secure Payment</CardTitle>
            </div>
            <CardDescription>
              Your payment information is encrypted and secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card Number */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="pl-10"
                    disabled={processing}
                  />
                </div>
              </div>

              {/* Expiration and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiration">Expiration Date</Label>
                  <Input
                    id="expiration"
                    type="text"
                    placeholder="MM/YY"
                    value={expirationDate}
                    onChange={handleExpirationChange}
                    disabled={processing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={handleCvvChange}
                    disabled={processing}
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  type="text"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  disabled={processing}
                />
              </div>

              {/* ZIP Code */}
              <div className="space-y-2">
                <Label htmlFor="zipCode">Billing ZIP Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="12345"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                  disabled={processing}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Pay ${totalAmount}
                  </>
                )}
              </Button>

              {/* Security Notice */}
              <div className="text-center text-sm text-gray-600">
                <Lock className="inline h-4 w-4 mr-1" />
                This is a secure SSL encrypted payment processed by Authorize.Net
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
