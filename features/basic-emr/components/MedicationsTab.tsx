"use client";

import { useEffect, useState } from "react";
import { createClient } from "@core/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pill } from "lucide-react";

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  dosage_amount: string | null;
  dosage_unit: string | null;
  vial_size: string | null;
  form: string | null;
  quantity: number;
  refills: number;
  sig: string;
  status: string;
  submitted_at: string;
  prescriber: {
    first_name: string;
    last_name: string;
  } | null;
}

interface MedicationsTabProps {
  patientId: string;
}

export function MedicationsTab({ patientId }: MedicationsTabProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("prescriptions")
          .select(`
            id,
            medication,
            dosage,
            dosage_amount,
            dosage_unit,
            vial_size,
            form,
            quantity,
            refills,
            sig,
            status,
            submitted_at,
            prescriber:providers!prescriber_id(
              first_name,
              last_name
            )
          `)
          .eq("patient_id", patientId)
          .order("submitted_at", { ascending: false });

        if (error) {
          console.error("Error fetching prescriptions:", error);
        } else {
          setPrescriptions(data || []);
        }
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [patientId, supabase]);

  // Filter current medications (not delivered status)
  const currentMedications = prescriptions.filter(
    (rx) => rx.status.toLowerCase() !== "delivered"
  );

  // Filter past medications (delivered status)
  const pastMedications = prescriptions.filter(
    (rx) => rx.status.toLowerCase() === "delivered"
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDosage = (rx: Prescription) => {
    if (rx.dosage_amount && rx.dosage_unit) {
      return `${rx.dosage_amount}${rx.dosage_unit}`;
    }
    return rx.dosage;
  };

  const formatFormAndVial = (rx: Prescription) => {
    const parts = [];
    if (rx.form) parts.push(rx.form);
    if (rx.vial_size) parts.push(rx.vial_size);
    return parts.length > 0 ? parts.join(" - ") : "N/A";
  };

  const renderMedicationsTable = (medications: Prescription[], isPast: boolean = false) => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Loading medications...</div>
        </div>
      );
    }

    if (medications.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Pill className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {isPast ? "No Past Medications" : "No Current Medications"}
          </h3>
          <p className="text-gray-500">
            {isPast
              ? "This patient has no completed or discontinued medications."
              : "This patient has no active prescriptions at this time."}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold text-gray-900">Medication</TableHead>
                <TableHead className="font-bold text-gray-900">Dosage & Form</TableHead>
                <TableHead className="font-bold text-gray-900">Instructions (SIG)</TableHead>
                <TableHead className="font-bold text-gray-900">Quantity</TableHead>
                <TableHead className="font-bold text-gray-900">Refills</TableHead>
                <TableHead className="font-bold text-gray-900">Start Date</TableHead>
                {isPast && <TableHead className="font-bold text-gray-900">Status</TableHead>}
                <TableHead className="font-bold text-gray-900">Prescribed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell className="font-medium">{rx.medication}</TableCell>
                  <TableCell>
                    <div>{formatDosage(rx)}</div>
                    <div className="text-sm text-gray-500">{formatFormAndVial(rx)}</div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm">{rx.sig}</div>
                  </TableCell>
                  <TableCell>{rx.quantity}</TableCell>
                  <TableCell>{rx.refills}</TableCell>
                  <TableCell>{formatDate(rx.submitted_at)}</TableCell>
                  {isPast && (
                    <TableCell>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Delivered
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    {rx.prescriber
                      ? `Dr. ${rx.prescriber.first_name} ${rx.prescriber.last_name}`
                      : "Unknown"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <Tabs defaultValue="current" className="w-full">
      <TabsList className="bg-gray-100 mb-6">
        <TabsTrigger
          value="current"
          className="data-[state=active]:bg-white px-6 py-2"
        >
          Current Medications
          {!loading && currentMedications.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
              {currentMedications.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="past"
          className="data-[state=active]:bg-white px-6 py-2"
        >
          Past Medications
          {!loading && pastMedications.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
              {pastMedications.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="current">
        {renderMedicationsTable(currentMedications, false)}
      </TabsContent>

      <TabsContent value="past">
        {renderMedicationsTable(pastMedications, true)}
      </TabsContent>
    </Tabs>
  );
}
