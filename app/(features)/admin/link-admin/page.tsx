"use client";

import { useState } from "react";

export default function LinkAdminPage() {
  const [adminUserId, setAdminUserId] = useState("0afc1206-84f6-4ece-b462-38e0cc8c9b67");
  const [pharmacySlug, setPharmacySlug] = useState("grinethch");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLink = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/link-pharmacy-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_user_id: adminUserId,
          pharmacy_slug: pharmacySlug,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Link Pharmacy Admin</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin User ID
          </label>
          <input
            type="text"
            value={adminUserId}
            onChange={(e) => setAdminUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="User ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pharmacy Slug
          </label>
          <input
            type="text"
            value={pharmacySlug}
            onChange={(e) => setPharmacySlug(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., grinethch"
          />
        </div>

        <button
          onClick={handleLink}
          disabled={isLoading || !adminUserId || !pharmacySlug}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? "Linking..." : "Link Admin to Pharmacy"}
        </button>

        {result && (
          <div
            className={`mt-4 p-4 rounded-md ${
              result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}
          >
            <h3
              className={`font-semibold mb-2 ${
                result.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.success ? "Success!" : "Error"}
            </h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Quick Info:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Greenwich Admin User ID:</strong> 0afc1206-84f6-4ece-b462-38e0cc8c9b67
          </li>
          <li>
            <strong>Greenwich Pharmacy Slug:</strong> grinethch
          </li>
        </ul>
      </div>
    </div>
  );
}
