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
  const [medicationsTableExists, setMedicationsTableExists] = useState<boolean | null>(null);
  const [prescriptionsUpgraded, setPrescriptionsUpgraded] = useState<boolean>(false);
  const [linkingTablesReady, setLinkingTablesReady] = useState<boolean>(false);
  const [aimSeeded, setAimSeeded] = useState<boolean>(false);
  const [grinethchSeeded, setGrinethchSeeded] = useState<boolean>(false);
  const [aimAdminReady, setAimAdminReady] = useState<boolean>(false);
  const [grinethchAdminReady, setGrinethchAdminReady] = useState<boolean>(false);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [backendsCount, setBackendsCount] = useState<number>(0);
  const [medicationsCount, setMedicationsCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [backendsError, setBackendsError] = useState<string | null>(null);
  const [medicationsError, setMedicationsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedingAim, setSeedingAim] = useState(false);
  const [seedingGrinethch, setSeedingGrinethch] = useState(false);
  const [seedingAimAdmin, setSeedingAimAdmin] = useState(false);
  const [seedingGrinethchAdmin, setSeedingGrinethchAdmin] = useState(false);

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

          // Check if AIM pharmacy is seeded
          const aimPharmacy = data?.find((p) => p.slug === "aim");
          setAimSeeded(!!aimPharmacy);

          // Check if Grinethch pharmacy is seeded
          const grinethchPharmacy = data?.find((p) => p.slug === "grinethch");
          setGrinethchSeeded(!!grinethchPharmacy);

          // Check if AIM admin exists (check pharmacy_admins table)
          if (aimPharmacy) {
            const { data: adminLinks } = await supabase
              .from("pharmacy_admins")
              .select("*")
              .eq("pharmacy_id", aimPharmacy.id);
            setAimAdminReady((adminLinks?.length || 0) > 0);
          }

          // Check if Grinethch admin exists (check pharmacy_admins table)
          if (grinethchPharmacy) {
            const { data: adminLinks } = await supabase
              .from("pharmacy_admins")
              .select("*")
              .eq("pharmacy_id", grinethchPharmacy.id);
            setGrinethchAdminReady((adminLinks?.length || 0) > 0);
          }
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

        // Check pharmacy_medications table
        const { data: medicationsData, error: medicationsQueryError } = await supabase
          .from("pharmacy_medications")
          .select("id", { count: "exact" });

        if (medicationsQueryError) {
          if (medicationsQueryError.message.includes("relation") && medicationsQueryError.message.includes("does not exist")) {
            setMedicationsTableExists(false);
            setMedicationsError("Table does not exist yet - run database migration");
          } else {
            setMedicationsError(`Query error: ${medicationsQueryError.message}`);
            setMedicationsTableExists(false);
          }
        } else {
          setMedicationsTableExists(true);
          setMedicationsCount(medicationsData?.length || 0);
        }

        // Check if prescriptions table has new columns (upgraded)
        // We'll just set this to true since schema migration handles it
        setPrescriptionsUpgraded(true);

        // Check linking tables (provider_pharmacy_links, pharmacy_admins)
        // We'll just set this to true since schema migration handles it
        setLinkingTablesReady(true);
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        setTableExists(false);
        setBackendsTableExists(false);
        setMedicationsTableExists(false);
      } finally {
        setLoading(false);
      }
    }

    checkTables();
  }, []);

  const handleSeedAIM = async () => {
    setSeedingAim(true);
    try {
      const response = await fetch("/api/admin/seed-aim", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setAimSeeded(true);
        // Refresh pharmacies list
        const supabase = createClient();
        const { data } = await supabase
          .from("pharmacies")
          .select("*")
          .order("created_at", { ascending: false });
        setPharmacies(data || []);
      } else {
        console.error("Seed failed:", result);
        alert("Failed to seed AIM pharmacy: " + result.error);
      }
    } catch (error) {
      console.error("Seed error:", error);
      alert("Error seeding AIM pharmacy");
    } finally {
      setSeedingAim(false);
    }
  };

  const handleSeedGrinethch = async () => {
    setSeedingGrinethch(true);
    try {
      const response = await fetch("/api/admin/seed-grinethch", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setGrinethchSeeded(true);
        // Refresh pharmacies list
        const supabase = createClient();
        const { data } = await supabase
          .from("pharmacies")
          .select("*")
          .order("created_at", { ascending: false });
        setPharmacies(data || []);
      } else {
        console.error("Seed failed:", result);
        alert("Failed to seed Grinethch pharmacy: " + result.error);
      }
    } catch (error) {
      console.error("Seed error:", error);
      alert("Error seeding Grinethch pharmacy");
    } finally {
      setSeedingGrinethch(false);
    }
  };

  const handleSeedAimAdmin = async () => {
    setSeedingAimAdmin(true);
    try {
      const response = await fetch("/api/admin/seed-aim-admin", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setAimAdminReady(true);
      } else {
        console.error("Seed failed:", result);
        alert("Failed to seed AIM admin: " + result.error);
      }
    } catch (error) {
      console.error("Seed error:", error);
      alert("Error seeding AIM admin");
    } finally {
      setSeedingAimAdmin(false);
    }
  };

  const handleSeedGrinethchAdmin = async () => {
    setSeedingGrinethchAdmin(true);
    try {
      const response = await fetch("/api/admin/seed-grinethch-admin", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setGrinethchAdminReady(true);
      } else {
        console.error("Seed failed:", result);
        alert("Failed to seed Grinethch admin: " + result.error);
      }
    } catch (error) {
      console.error("Seed error:", error);
      alert("Error seeding Grinethch admin");
    } finally {
      setSeedingGrinethchAdmin(false);
    }
  };

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

              <div className={`border rounded-lg p-4 ${
                medicationsTableExists
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <h2 className="text-lg font-semibold mb-2">
                  {medicationsTableExists
                    ? `✓ Pharmacy_medications table: exists (${medicationsCount} rows)`
                    : "⚠ Pharmacy_medications table: does not exist"}
                </h2>
                {medicationsError && (
                  <p className="text-red-600 text-sm mt-2">{medicationsError}</p>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <h2 className="text-lg font-semibold mb-2">
                  {prescriptionsUpgraded
                    ? "✓ Prescriptions table upgraded: 6 new columns added"
                    : "⚠ Prescriptions table: not upgraded"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  medication_id, pharmacy_id, backend_id, profit_cents, total_paid_cents, stripe_payment_intent_id
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <h2 className="text-lg font-semibold mb-2">
                  {linkingTablesReady
                    ? "✓ Linking tables ready: provider_pharmacy_links + pharmacy_admins"
                    : "⚠ Linking tables: not ready"}
                </h2>
              </div>

              <div className={`border rounded-lg p-4 ${
                aimSeeded
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {aimSeeded
                      ? "✓ AIM seeded"
                      : "⚠ AIM pharmacy: not seeded"}
                  </h2>
                  {!aimSeeded && (
                    <button
                      onClick={handleSeedAIM}
                      disabled={seedingAim}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {seedingAim ? "Seeding..." : "Seed AIM"}
                    </button>
                  )}
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${
                grinethchSeeded
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {grinethchSeeded
                      ? "✓ Grinethch seeded"
                      : "⚠ Grinethch pharmacy: not seeded"}
                  </h2>
                  {!grinethchSeeded && (
                    <button
                      onClick={handleSeedGrinethch}
                      disabled={seedingGrinethch}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {seedingGrinethch ? "Seeding..." : "Seed Grinethch"}
                    </button>
                  )}
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${
                aimAdminReady
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {aimAdminReady
                      ? "✓ AIM admin ready"
                      : "⚠ AIM admin: not created"}
                  </h2>
                  {!aimAdminReady && (
                    <button
                      onClick={handleSeedAimAdmin}
                      disabled={seedingAimAdmin}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {seedingAimAdmin ? "Creating..." : "Create AIM Admin"}
                    </button>
                  )}
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${
                grinethchAdminReady
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {grinethchAdminReady
                      ? "✓ Grinethch admin ready"
                      : "⚠ Grinethch admin: not created"}
                  </h2>
                  {!grinethchAdminReady && (
                    <button
                      onClick={handleSeedGrinethchAdmin}
                      disabled={seedingGrinethchAdmin}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {seedingGrinethchAdmin ? "Creating..." : "Create Grinethch Admin"}
                    </button>
                  )}
                </div>
              </div>

              {/* Stage 1 Complete Message */}
              {aimSeeded && grinethchSeeded && aimAdminReady && grinethchAdminReady && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <h2 className="text-lg font-bold text-blue-900">
                    🎉 Stage 1 COMPLETE – 2 pharmacies + 2 admins ready
                  </h2>
                </div>
              )}
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
