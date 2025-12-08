"use client";

import { useEffect, useState } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { createClient } from "@core/supabase";

export const dynamic = 'force-dynamic';

interface Pharmacy {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  tagline: string | null;
  address: string | null;
  npi: string | null;
  phone: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export default function DebugPharmaciesPage() {
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [backendsTableExists, setBackendsTableExists] = useState<boolean | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [backendsCount, setBackendsCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [backendsError, setBackendsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkTables() {
      const supabase = createClient();

      try {
        // Check pharmacies table
        const { data, error: queryError } = await supabase
          .from("pharmacies")
          .select("*")
          .order("created_at", { ascending: false });

        if (queryError) {
          if (queryError.message.includes("relation") && queryError.message.includes("does not exist")) {
            setTableExists(false);
            setError("Table does not exist yet - run database migration");
          } else {
            setError(`Query error: ${queryError.message}`);
            setTableExists(false);
          }
        } else {
          setTableExists(true);
          setPharmacies(data || []);
        }

        // Check pharmacy_backends table
        const { data: backendsData, error: backendsQueryError } = await supabase
          .from("pharmacy_backends")
          .select("id", { count: "exact" });

        if (backendsQueryError) {
          if (backendsQueryError.message.includes("relation") && backendsQueryError.message.includes("does not exist")) {
            setBackendsTableExists(false);
            setBackendsError("Table does not exist yet - run database migration");
          } else {
            setBackendsError(`Query error: ${backendsQueryError.message}`);
            setBackendsTableExists(false);
          }
        } else {
          setBackendsTableExists(true);
          setBackendsCount(backendsData?.length || 0);
        }
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        setTableExists(false);
        setBackendsTableExists(false);
      } finally {
        setLoading(false);
      }
    }

    checkTables();
  }, []);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Pharmacies Table Debug</h1>

        {loading ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">⏳ Checking database...</p>
          </div>
        ) : (
          <>
            {/* Table Status */}
            <div className="space-y-4 mb-6">
              <div className={`border rounded-lg p-4 ${
                tableExists
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <h2 className="text-lg font-semibold mb-2">
                  {tableExists
                    ? "✓ Pharmacies table: exists"
                    : "⚠ Pharmacies table: does not exist"}
                </h2>
                {error && (
                  <p className="text-red-600 text-sm mt-2">{error}</p>
                )}
              </div>

              <div className={`border rounded-lg p-4 ${
                backendsTableExists
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <h2 className="text-lg font-semibold mb-2">
                  {backendsTableExists
                    ? `✓ Pharmacy_backends table: exists (${backendsCount} rows)`
                    : "⚠ Pharmacy_backends table: does not exist"}
                </h2>
                {backendsError && (
                  <p className="text-red-600 text-sm mt-2">{backendsError}</p>
                )}
              </div>
            </div>

            {/* Table Data */}
            {tableExists && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Pharmacies ({pharmacies.length} rows)
                </h2>

                {pharmacies.length === 0 ? (
                  <p className="text-gray-500 italic">No pharmacies in database yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Slug</th>
                          <th className="text-left p-2">NPI</th>
                          <th className="text-left p-2">Phone</th>
                          <th className="text-left p-2">Active</th>
                          <th className="text-left p-2">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pharmacies.map((pharmacy) => (
                          <tr key={pharmacy.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono text-xs">{pharmacy.id.substring(0, 8)}...</td>
                            <td className="p-2 font-semibold">{pharmacy.name}</td>
                            <td className="p-2 text-blue-600">{pharmacy.slug}</td>
                            <td className="p-2">{pharmacy.npi || "-"}</td>
                            <td className="p-2">{pharmacy.phone || "-"}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                pharmacy.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {pharmacy.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-2 text-gray-600">
                              {new Date(pharmacy.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Full JSON for debugging */}
                {pharmacies.length > 0 && (
                  <details className="mt-6">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                      Show full JSON data
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(pharmacies, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Migration Instructions */}
            {!tableExists && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h3 className="font-semibold mb-2">📋 Next Steps:</h3>
                <p className="text-sm text-gray-700">
                  The pharmacies table schema has been created in the codebase.
                  The system will automatically apply the database migration.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DefaultLayout>
  );
}
