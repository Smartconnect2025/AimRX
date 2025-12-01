"use client";

import {
  Calendar,
  Edit,
  Mail,
  MapPin,
  Phone,
  Pill,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";

import { Accordion } from "@/components/ui/accordion";
import { Allergy, Condition, Medication, Patient } from "../types";
import { AllergyModal } from "./AllergyModal";
import { ConditionModal } from "./ConditionModal";
import { MedicationModal } from "./MedicationModal";
import { MedicalDataAccordionSection } from "./MedicalDataAccordionSection";
import {
  transformAllergies,
  transformConditions,
  transformMedications,
  type MedicalDataItem,
} from "../utils/medicalDataTransformers";

interface PatientSidebarProps {
  patient: Patient;
  medications: Medication[];
  conditions: Condition[];
  allergies: Allergy[];
  onEditPatient: () => void;
  onRefreshData: () => void;
}

export function PatientSidebar({
  patient,
  medications,
  conditions,
  allergies,
  onEditPatient,
  onRefreshData,
}: PatientSidebarProps) {
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null,
  );
  const [editingCondition, setEditingCondition] = useState<Condition | null>(
    null,
  );
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Modal handlers
  const handleAddMedication = () => {
    setEditingMedication(null);
    setIsMedicationModalOpen(true);
  };

  const handleEditMedication = (item: MedicalDataItem) => {
    const medication = medications.find((m) => m.id === item.id);
    if (medication) {
      setEditingMedication(medication);
      setIsMedicationModalOpen(true);
    }
  };

  const handleAddCondition = () => {
    setEditingCondition(null);
    setIsConditionModalOpen(true);
  };

  const handleEditCondition = (item: MedicalDataItem) => {
    const condition = conditions.find((c) => c.id === item.id);
    if (condition) {
      setEditingCondition(condition);
      setIsConditionModalOpen(true);
    }
  };

  const handleAddAllergy = () => {
    setEditingAllergy(null);
    setIsAllergyModalOpen(true);
  };

  const handleEditAllergy = (item: MedicalDataItem) => {
    const allergy = allergies.find((a) => a.id === item.id);
    if (allergy) {
      setEditingAllergy(allergy);
      setIsAllergyModalOpen(true);
    }
  };

  const handleModalSuccess = () => {
    onRefreshData();
  };

  const medicationItems = transformMedications(medications);
  const conditionItems = transformConditions(conditions);
  const allergyItems = transformAllergies(allergies);

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
      {/* Patient Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg">
            {getPatientInitials(patient.firstName, patient.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {patient.firstName} {patient.lastName}
              </h2>
              <Edit
                className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600 flex-shrink-0"
                onClick={onEditPatient}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              DOB: {formatDate(patient.dateOfBirth)}
            </span>
          </div>
          {patient.phone && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{patient.phone}</span>
            </div>
          )}
          {patient.email && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
          {patient.address && (
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {patient.address.street}, {patient.address.city},{" "}
                {patient.address.state} {patient.address.zipCode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Medical Data Accordion */}
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={["medications", "conditions", "allergies"]}
        >
          <MedicalDataAccordionSection
            value="medications"
            title="Medications"
            icon={<Pill className="h-4 w-4" />}
            items={medicationItems}
            emptyMessage="No medications recorded"
            onAdd={handleAddMedication}
            onEdit={handleEditMedication}
          />

          <MedicalDataAccordionSection
            value="conditions"
            title="Conditions"
            icon={<Stethoscope className="h-4 w-4" />}
            items={conditionItems}
            emptyMessage="No conditions recorded"
            onAdd={handleAddCondition}
            onEdit={handleEditCondition}
          />

          <MedicalDataAccordionSection
            value="allergies"
            title="Allergies"
            icon={<ShieldAlert className="h-4 w-4" />}
            items={allergyItems}
            emptyMessage="No allergies recorded"
            onAdd={handleAddAllergy}
            onEdit={handleEditAllergy}
          />
        </Accordion>
      </div>

      {/* Modals */}
      <MedicationModal
        isOpen={isMedicationModalOpen}
        onClose={() => setIsMedicationModalOpen(false)}
        patientId={patient.id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        medication={editingMedication}
        onSuccess={handleModalSuccess}
      />

      <ConditionModal
        isOpen={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        patientId={patient.id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        condition={editingCondition}
        onSuccess={handleModalSuccess}
      />

      <AllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        patientId={patient.id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        allergy={editingAllergy}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
