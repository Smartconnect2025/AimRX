"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@core/auth";

import { useDocumentManager } from "../hooks/useDocumentManager";
import { useEmrStore } from "../store/emr-store";
import { Encounter, Patient } from "../types";
import { appointmentEncounterService } from "../services/appointmentEncounterService";
import { CreateEncounterModal } from "./CreateEncounterModal";

import { DocumentManager } from "./DocumentManager";
import { DocumentViewer } from "./DocumentViewer";
import { EditEncounterModal } from "./EditEncounterModal";
import { EncounterSection } from "./EncounterSection";

import { PatientSidebar } from "./PatientSidebar";
import { LabDataTab } from "./LabDataTab";
import { toast } from "sonner";

interface PatientChartProps {
  patientId: string;
}

interface DocumentType {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  url: string;
}

export function PatientChart({ patientId }: PatientChartProps) {
  const router = useRouter();
  const { user } = useUser();

  const patients = useEmrStore((state) => state.patients);
  const currentPatient = useEmrStore((state) => state.currentPatient);
  const encounters = useEmrStore((state) => state.encounters);
  const medications = useEmrStore((state) => state.medications);
  const conditions = useEmrStore((state) => state.conditions);
  const allergies = useEmrStore((state) => state.allergies);
  const loading = useEmrStore((state) => state.loading);
  const error = useEmrStore((state) => state.error);
  const fetchPatientById = useEmrStore((state) => state.fetchPatientById);
  const fetchEncounters = useEmrStore((state) => state.fetchEncounters);
  const fetchMedications = useEmrStore((state) => state.fetchMedications);
  const fetchConditions = useEmrStore((state) => state.fetchConditions);
  const fetchAllergies = useEmrStore((state) => state.fetchAllergies);
  const setCurrentPatient = useEmrStore((state) => state.setCurrentPatient);
  const deleteEncounterAsync = useEmrStore(
    (state) => state.deleteEncounterAsync,
  );

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isCreateEncounterOpen, setIsCreateEncounterOpen] = useState(false);

  const [isEditEncounterOpen, setIsEditEncounterOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(
    null,
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [encounterToDelete, setEncounterToDelete] = useState<string | null>(
    null,
  );
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<DocumentType | null>(
    null,
  );
  const [isProvider, setIsProvider] = useState(false);

  const { documents, handleUpload, handleDelete, handleView } =
    useDocumentManager();

  const loadPatientData = useCallback(async () => {
    if (!user?.id) return;

    await fetchPatientById(patientId, user.id);

    await Promise.all([
      fetchEncounters(patientId, user.id),
      fetchMedications(patientId, user.id),
      fetchConditions(patientId, user.id),
      fetchAllergies(patientId, user.id),
    ]);

    // Check if user is a provider
    const canCreateEncounters =
      await appointmentEncounterService.canUserCreateEncounters(user.id);
    setIsProvider(canCreateEncounters);
  }, [
    user?.id,
    patientId,
    fetchPatientById,
    fetchEncounters,
    fetchMedications,
    fetchConditions,
    fetchAllergies,
  ]);

  useEffect(() => {
    if (user?.id) {
      loadPatientData();
    }
  }, [loadPatientData, user?.id]);

  useEffect(() => {
    if (currentPatient && currentPatient.id === patientId) {
      setPatient(currentPatient);
    } else {
      const foundPatient = patients.find((p: Patient) => p.id === patientId);
      if (foundPatient) {
        setPatient(foundPatient);
        setCurrentPatient(foundPatient);
      }
    }
  }, [currentPatient, patients, patientId, setCurrentPatient]);

  const handleEditPatient = () => {
    router.push(`/basic-emr/patients/${patientId}/edit`);
  };

  const handleStartCall = (encounterId: string) => {
    // Find the encounter to get the appointmentId
    const encounter = encounters.find((e: Encounter) => e.id === encounterId);
    if (encounter?.appointmentId) {
      // Navigate to the appointment page (same as provider dashboard Join button)
      window.location.href = `/appointment/${encounter.appointmentId}`;
    } else {
      // Fallback to the old route if no appointmentId
      router.push(
        `/video-call/provider?encounterId=${encounterId}&patientId=${patient?.id}`,
      );
    }
  };

  const handleEditEncounter = (encounterId: string) => {
    const encounter = encounters.find((e: Encounter) => e.id === encounterId);
    if (encounter) {
      setEditingEncounter(encounter);
      setIsEditEncounterOpen(true);
    }
  };

  const handleDeleteEncounter = async (encounterId: string) => {
    if (!user?.id) return;

    setEncounterToDelete(encounterId);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user?.id) return;

    try {
      if (encounterToDelete) {
        await deleteEncounterAsync(encounterToDelete, user.id);
        setIsDeleteConfirmOpen(false);
        setEncounterToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete encounter:", error);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setEncounterToDelete(null);
  };

  const handleViewDocument = (doc: DocumentType) => {
    if (handleView(doc)) {
      setCurrentDocument(doc);
      setIsDocumentViewerOpen(true);
    }
  };

  const handleCloseDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setCurrentDocument(null);
  };

  const handleCloseEditEncounter = () => {
    setIsEditEncounterOpen(false);
    setEditingEncounter(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Please log in to view patient chart
          </h2>
          <Button
            onClick={() => router.push("/auth")}
            variant="default"
            className="px-6 py-2 rounded-lg"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Loading patient chart...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    toast.error(error);
    // return (
    //   <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    //     <div className="text-center">
    //       <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
    //       <p className="text-gray-600 mb-4">{error}</p>
    //       <Button onClick={() => router.back()} variant="outline">
    //         Go Back
    //       </Button>
    //     </div>
    //   </div>
    // );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Patient not found
          </h2>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const patientEncounters = encounters.filter(
    (e: Encounter) => e.patientId === patientId,
  );
  // Filter appointment-based encounters
  const appointmentEncounters = patientEncounters.filter(
    (e: Encounter) => e.businessType === "appointment_based",
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <PatientSidebar
        patient={patient}
        medications={medications}
        conditions={conditions}
        allergies={allergies}
        onEditPatient={handleEditPatient}
        onRefreshData={loadPatientData}
      />

      <main className="flex-1 flex flex-col">
        {/* Patient Information Header - Hidden on small screens */}
        <div className="bg-white border-b border-gray-200 px-4 py-6 hidden sm:block">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            {isProvider && (
              <Button
                className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                onClick={() => setIsCreateEncounterOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Encounter
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white p-4 sm:p-6 lg:p-8">
          {/* Mobile Create Encounter Button - Only visible on small screens */}
          {isProvider && (
            <div className="mb-6 sm:hidden">
              <Button
                className="bg-primary hover:bg-primary/90 text-white w-full"
                onClick={() => setIsCreateEncounterOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Encounter
              </Button>
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <div className="mb-4">
              <div className="overflow-x-auto">
                <TabsList className="bg-gray-100 flex-nowrap w-max min-w-full">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-white whitespace-nowrap flex-shrink-0 px-3 py-2 text-sm"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="appointments"
                    className="data-[state=active]:bg-white whitespace-nowrap flex-shrink-0 px-3 py-2 text-sm"
                  >
                    <span className="hidden sm:inline">Appointments</span>
                    <span className="sm:hidden">Apps</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="lab"
                    className="data-[state=active]:bg-white whitespace-nowrap flex-shrink-0 px-3 py-2 text-sm"
                  >
                    Lab Data
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="data-[state=active]:bg-white whitespace-nowrap flex-shrink-0 px-3 py-2 text-sm"
                  >
                    <span className="hidden sm:inline">Documents</span>
                    <span className="sm:hidden">Docs</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-6">
              {/* All Encounters */}
              <EncounterSection
                title="All Encounters"
                encounters={patientEncounters}
                onStartCall={handleStartCall}
                onEditEncounter={handleEditEncounter}
                onDeleteEncounter={handleDeleteEncounter}
                patientId={patientId}
              />
            </TabsContent>

            <TabsContent value="appointments" className="space-y-6">
              {/* Appointment-based Encounters */}
              <EncounterSection
                title="Appointment-based Encounters"
                encounters={appointmentEncounters}
                onStartCall={handleStartCall}
                onEditEncounter={handleEditEncounter}
                onDeleteEncounter={handleDeleteEncounter}
                patientId={patientId}
              />
            </TabsContent>

            <TabsContent value="lab" className="space-y-6">
              <LabDataTab patientId={patientId} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <DocumentManager
                documents={documents}
                onUpload={handleUpload}
                onView={handleViewDocument}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <CreateEncounterModal
        isOpen={isCreateEncounterOpen}
        onClose={() => setIsCreateEncounterOpen(false)}
        patientId={patient.id}
        patientName={`${patient.firstName} ${patient.lastName}`}
      />

      <EditEncounterModal
        isOpen={isEditEncounterOpen}
        onClose={handleCloseEditEncounter}
        encounter={editingEncounter}
        patientId={patient.id}
        patientName={`${patient.firstName} ${patient.lastName}`}
      />

      <DocumentViewer
        isOpen={isDocumentViewerOpen}
        onClose={handleCloseDocumentViewer}
        document={currentDocument}
      />

      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent className="bg-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Encounter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this encounter? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-300 text-white"
            >
              Delete Encounter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
