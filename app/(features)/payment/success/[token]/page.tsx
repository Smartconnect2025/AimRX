"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Package, Clock, LogIn } from "lucide-react";

const printStyles = `
@media print {
  @page {
    size: auto;
    margin: 10mm;
  }

  /* Hide non-print elements */
  .print-hide {
    display: none !important;
  }

  /* Reset page container */
  .print-container {
    min-height: auto !important;
    padding: 0 !important;
    background: white !important;
  }

  .print-content {
    max-width: 100% !important;
    padding: 0 !important;
  }

  /* Smaller logo */
  .print-logo {
    height: 3.5rem !important;
    margin-bottom: 0.5rem !important;
  }

  /* Compact header */
  .print-header {
    margin-bottom: 0.5rem !important;
    text-align: center !important;
  }

  /* Smaller success icon */
  .print-icon-container {
    width: 2.5rem !important;
    height: 2.5rem !important;
    margin-bottom: 0.5rem !important;
  }

  .print-icon-container svg {
    width: 1.5rem !important;
    height: 1.5rem !important;
  }

  /* Smaller title */
  .print-title {
    font-size: 1.25rem !important;
    margin-bottom: 0.25rem !important;
  }

  .print-subtitle {
    font-size: 0.875rem !important;
  }

  /* Compact card */
  .print-card {
    margin-bottom: 0.5rem !important;
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }

  .print-card-header {
    padding: 0.75rem !important;
  }

  .print-card-content {
    padding: 0.75rem !important;
    padding-top: 0 !important;
  }

  /* Compact payment details */
  .print-details {
    padding: 0.5rem !important;
  }

  .print-details-row {
    padding-bottom: 0.375rem !important;
    margin-bottom: 0 !important;
    font-size: 0.8rem !important;
  }

  /* Compact sections */
  .print-section {
    padding: 0.5rem !important;
    margin-bottom: 0 !important;
  }

  .print-section-title {
    font-size: 0.875rem !important;
    margin-bottom: 0.25rem !important;
  }

  .print-section-text {
    font-size: 0.7rem !important;
    line-height: 1.3 !important;
  }

  .print-step {
    margin-bottom: 0.125rem !important;
  }

  /* Compact contact info */
  .print-contact {
    padding-top: 0.5rem !important;
    font-size: 0.75rem !important;
  }

  .print-contact p {
    margin-bottom: 0.125rem !important;
  }
}
`;

interface PaymentDetails {
  patientName: string;
  providerName: string;
  totalAmountCents: number;
  description: string;
  orderProgress: string;
  deliveryMethod?: string;
  pharmacyName?: string;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    if (!token) return;
    loadPaymentStatus();
  }, [token]);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/details/${token}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentDetails(data.payment);
      }
    } catch (error) {
      console.error("Error loading payment status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Processing payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className="min-h-screen bg-gray-50 py-12 px-4 print-container">
        <div className="container max-w-2xl mx-auto print-content">
          {/* Header */}
          <div className="text-center mb-8 print-header">
            <div className="flex justify-end mb-4 print-hide">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </div>
            <img
              src="https://i.imgur.com/r65O4DB.png"
              alt="AIM Medical Technologies"
              className="h-24 mx-auto mb-4 print-logo"
            />
          </div>

        {/* Success Card */}
        <Card className="mb-6 print-card">
          <CardHeader className="print-card-header">
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 print-icon-container">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2 print-title">
                Payment Successful!
              </CardTitle>
              <p className="text-muted-foreground text-lg print-subtitle">
                Thank you for your payment
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 print-card-content">
            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4 print-details">
                <div className="flex justify-between items-center pb-3 border-b print-details-row">
                  <span className="text-gray-600">Patient</span>
                  <span className="font-semibold">{paymentDetails.patientName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b print-details-row">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-semibold">{paymentDetails.providerName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b print-details-row">
                  <span className="text-gray-600">Description</span>
                  <span className="font-semibold text-right max-w-[60%]">
                    {paymentDetails.description}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 print-details-row">
                  <span className="text-lg font-bold text-gray-900">Amount Paid</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(paymentDetails.totalAmountCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* What Happens Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 print-section">
              <div className="flex items-start gap-3 mb-4">
                <Package className="w-6 h-6 text-blue-600 mt-1 print-hide" />
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 print-section-title">What Happens Next?</h3>
                  <div className="space-y-3 text-sm text-gray-700 print-section-text">
                    <div className="flex items-start gap-2 print-step">
                      <div className="mt-1">1.</div>
                      <p>
                        <strong>Payment Confirmation:</strong> You will receive a confirmation
                        email shortly with your receipt.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 print-step">
                      <div className="mt-1">2.</div>
                      <p>
                        <strong>Provider Approval:</strong> Your provider will review and approve
                        the order.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 print-step">
                      <div className="mt-1">3.</div>
                      <p>
                        <strong>Pharmacy Processing:</strong> The pharmacy will prepare your
                        medication.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 print-step">
                      <div className="mt-1">4.</div>
                      <p>
                        <strong>
                          {paymentDetails?.deliveryMethod === "pickup" && "Ready for Pickup"}
                          {paymentDetails?.deliveryMethod === "delivery" && "Local Delivery"}
                          {paymentDetails?.deliveryMethod === "shipping" && "Shipping"}
                          {!paymentDetails?.deliveryMethod && "Fulfillment"}:
                        </strong>{" "}
                        {paymentDetails?.deliveryMethod === "pickup" &&
                          `You'll receive a notification when your medication is ready to collect at ${paymentDetails?.pharmacyName || "the pharmacy"}.`}
                        {paymentDetails?.deliveryMethod === "delivery" &&
                          `The pharmacy will deliver your medication to your address.`}
                        {paymentDetails?.deliveryMethod === "shipping" &&
                          "You'll receive tracking information once your order ships."}
                        {!paymentDetails?.deliveryMethod &&
                          "You'll receive updates on how to receive your medication."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Estimate */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 print-section">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 print-hide" />
              <div>
                <p className="font-semibold text-gray-900 mb-1 print-section-title">Expected Timeline</p>
                <p className="text-sm text-gray-700 print-section-text">
                  {paymentDetails?.deliveryMethod === "pickup" &&
                    "Your medication will typically be ready for pickup within 3-7 business days."}
                  {paymentDetails?.deliveryMethod === "delivery" &&
                    "Your medication will typically be delivered within 3-7 business days."}
                  {paymentDetails?.deliveryMethod === "shipping" &&
                    "Your medication will typically ship within 3-5 business days and arrive within 5-10 business days."}
                  {!paymentDetails?.deliveryMethod &&
                    "Your medication will typically be ready within 5-10 business days."}
                  {" "}We&apos;ll send you updates via email.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="text-center pt-4 print-contact">
              <p className="text-sm text-gray-600 mb-2">Questions about your order?</p>
              <p className="text-sm font-medium text-gray-900">
                Contact AIM Medical Technologies
              </p>
              <p className="text-sm text-gray-600">(512) 377-9898 · Mon–Fri 9AM–6PM CST</p>
              <p className="text-sm text-gray-600">106 E 6th St, Suite 900 · Austin, TX 78701</p>
            </div>

            {/* Print Button */}
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="w-full print-hide"
            >
              Print Receipt
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground print-hide">
          You can safely close this page. A confirmation has been sent to your email.
        </p>
      </div>
    </div>
    </>
  );
}
