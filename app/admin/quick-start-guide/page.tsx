"use client";

import { useState } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Copy, CheckCircle, ExternalLink } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function QuickStartGuidePage() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedAim, setCopiedAim] = useState(false);
  const [copiedGrin, setCopiedGrin] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const appUrl = "https://3004.app.specode.ai";

  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleForceSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/admin/force-seed-admins", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setSeeded(true);
        alert("✓ Admins force-seeded successfully! Try logging in now.");
      } else {
        alert("Failed to force-seed admins: " + result.error);
      }
    } catch (error) {
      console.error("Seed error:", error);
      alert("Error force-seeding admins");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">🚀 Quick Start Guide</h1>
        <p className="text-gray-600 mb-4">Multi-Pharmacy Platform - Stage 1 Complete</p>

        {/* Force Seed Admins Button */}
        {seeded ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-900 font-semibold">
              ✓ Admins force-seeded – try login again
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-yellow-900 font-semibold">
                Login showing "invalid"? Force-seed admins:
              </p>
              <button
                onClick={handleForceSeed}
                disabled={seeding}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                {seeding ? "Seeding..." : "Force Seed Admins"}
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Live Preview URL */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              1
            </span>
            Your Live Preview URL
          </h2>
          <div className="bg-gray-50 border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-blue-600 font-mono text-lg">{appUrl}</code>
              <button
                onClick={() => copyToClipboard(appUrl, setCopiedUrl)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {copiedUrl ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </>
                )}
              </button>
            </div>
          </div>
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            Open in new tab
          </a>
        </div>

        {/* Step 2: Pharmacy Admin Accounts */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              2
            </span>
            Pharmacy Admin Accounts
          </h2>

          {/* AIM Admin */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#00AEEF" }}></div>
              <h3 className="font-semibold text-lg">AIM Medical Technologies</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <code className="text-sm bg-white px-2 py-1 rounded border">
                    aim_admin@aimmedtech.com
                  </code>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Password</p>
                  <code className="text-sm bg-white px-2 py-1 rounded border">
                    AIM2025!
                  </code>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard("aim_admin@aimmedtech.com", setCopiedAim)}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {copiedAim ? "✓ Copied Email" : "Copy Email"}
              </button>
              <p className="text-sm text-gray-600 mt-3">
                <strong>Expected:</strong> Teal/blue branding (#00AEEF)
              </p>
            </div>
          </div>

          {/* Grinethch Admin */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#228B22" }}></div>
              <h3 className="font-semibold text-lg">Grinethch Pharmacy</h3>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <code className="text-sm bg-white px-2 py-1 rounded border">
                    grin_admin@grinethch.com
                  </code>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Password</p>
                  <code className="text-sm bg-white px-2 py-1 rounded border">
                    Grin2025!
                  </code>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard("grin_admin@grinethch.com", setCopiedGrin)}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {copiedGrin ? "✓ Copied Email" : "Copy Email"}
              </button>
              <p className="text-sm text-gray-600 mt-3">
                <strong>Expected:</strong> Forest green branding (#228B22)
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Debug Page */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              3
            </span>
            Verify Setup Complete
          </h2>
          <p className="text-gray-700 mb-4">
            Check that all Stage 1 components are seeded and ready:
          </p>
          <a
            href="/admin/debug-pharmacies"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Go to Debug Page
          </a>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-900 mb-2">
              ✓ What "All Green" looks like:
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Pharmacies table: exists</li>
              <li>✓ Pharmacy_backends table: exists (2 rows)</li>
              <li>✓ Pharmacy_medications table: exists (0 rows)</li>
              <li>✓ Prescriptions table upgraded: 6 new columns added</li>
              <li>✓ Linking tables ready: provider_pharmacy_links + pharmacy_admins</li>
              <li>✓ AIM seeded</li>
              <li>✓ Grinethch seeded</li>
              <li>✓ AIM admin ready</li>
              <li>✓ Grinethch admin ready</li>
              <li className="font-bold text-blue-900">🎉 Stage 1 COMPLETE – 2 pharmacies + 2 admins ready</li>
            </ul>
          </div>
        </div>

        {/* Step 4: Quick Test */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              4
            </span>
            Quick Manual Test
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                A
              </div>
              <div>
                <p className="font-medium">Log in as AIM admin</p>
                <p className="text-sm text-gray-600">
                  Email: aim_admin@aimmedtech.com → Password: AIM2025!
                </p>
                <p className="text-sm text-teal-700 font-medium mt-1">
                  → App should show teal/blue branding
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                B
              </div>
              <div>
                <p className="font-medium">Log out and log back in as Grinethch admin</p>
                <p className="text-sm text-gray-600">
                  Email: grin_admin@grinethch.com → Password: Grin2025!
                </p>
                <p className="text-sm text-green-700 font-medium mt-1">
                  → App should show forest green branding
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                C
              </div>
              <div>
                <p className="font-medium">Verify branding switches correctly</p>
                <p className="text-sm text-gray-600">
                  This confirms the multi-pharmacy platform is working - each pharmacy admin sees their own branding!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2">🎉 Stage 1 Complete - What We Built</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Database Tables:</p>
              <ul className="space-y-0.5 text-gray-700">
                <li>✓ pharmacies</li>
                <li>✓ pharmacy_backends</li>
                <li>✓ pharmacy_medications</li>
                <li>✓ provider_pharmacy_links</li>
                <li>✓ pharmacy_admins</li>
                <li>✓ prescriptions (upgraded)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Seeded Data:</p>
              <ul className="space-y-0.5 text-gray-700">
                <li>✓ AIM Medical Technologies</li>
                <li>✓ Grinethch Pharmacy</li>
                <li>✓ 2 DigitalRx backends</li>
                <li>✓ 2 pharmacy admins</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
