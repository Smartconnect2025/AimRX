"use client";

import { useState, useEffect } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

const MEDICATION_FORMS = [
  "Tablet",
  "Capsule",
  "Liquid",
  "Cream",
  "Ointment",
  "Gel",
  "Patch",
  "Injection",
  "Inhaler",
  "Drops",
  "Spray",
  "Suppository",
];

const DOSAGE_UNITS = ["mg", "mL", "mcg", "g", "units", "%"];

interface MedicationCatalogItem {
  id: string;
  medication_name: string;
  vial_size: string | null;
  dosage_amount: string | null;
  dosage_unit: string | null;
  form: string | null;
  quantity: string | null;
  refills: string | null;
  sig: string | null;
  pharmacy_notes: string | null;
  patient_price: string | null;
  doctor_price: string | null;
}

export default function MedicationCatalogPage() {
  const [medications, setMedications] = useState<MedicationCatalogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationCatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    medication_name: "",
    vial_size: "",
    dosage_amount: "",
    dosage_unit: "mg",
    form: "",
    quantity: "",
    refills: "0",
    sig: "",
    pharmacy_notes: "",
    patient_price: "",
    doctor_price: "",
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await fetch("/api/medication-catalog");
      const data = await response.json();
      setMedications(data.medications || []);
    } catch (error) {
      console.error("Error fetching medications:", error);
      alert("Failed to load medications");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      medication_name: "",
      vial_size: "",
      dosage_amount: "",
      dosage_unit: "mg",
      form: "",
      quantity: "",
      refills: "0",
      sig: "",
      pharmacy_notes: "",
      patient_price: "",
      doctor_price: "",
    });
    setEditingMedication(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingMedication
        ? `/api/medication-catalog/${editingMedication.id}`
        : "/api/medication-catalog";

      const method = editingMedication ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save medication");

      alert(`Medication ${editingMedication ? "updated" : "created"} successfully`);

      setIsDialogOpen(false);
      resetForm();
      fetchMedications();
    } catch (error) {
      console.error("Error saving medication:", error);
      alert("Failed to save medication");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (medication: MedicationCatalogItem) => {
    setEditingMedication(medication);
    setFormData({
      medication_name: medication.medication_name,
      vial_size: medication.vial_size || "",
      dosage_amount: medication.dosage_amount || "",
      dosage_unit: medication.dosage_unit || "mg",
      form: medication.form || "",
      quantity: medication.quantity || "",
      refills: medication.refills || "0",
      sig: medication.sig || "",
      pharmacy_notes: medication.pharmacy_notes || "",
      patient_price: medication.patient_price || "",
      doctor_price: medication.doctor_price || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) return;

    try {
      const response = await fetch(`/api/medication-catalog/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete medication");

      alert("Medication deleted successfully");

      fetchMedications();
    } catch (error) {
      console.error("Error deleting medication:", error);
      alert("Failed to delete medication");
    }
  };

  const filteredMedications = medications.filter((med) =>
    med.medication_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medication Catalog</h1>
            <p className="text-muted-foreground mt-2">
              Manage pre-saved medications for quick prescription creation
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMedication ? "Edit Medication" : "Add New Medication"}
                </DialogTitle>
                <DialogDescription>
                  Fill in all the medication details to save to the catalog
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Medication Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A]">
                    Medication Information
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="medication_name">Medication Name *</Label>
                    <Input
                      id="medication_name"
                      required
                      value={formData.medication_name}
                      onChange={(e) =>
                        handleInputChange("medication_name", e.target.value)
                      }
                      placeholder="e.g., Semaglutide"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vial_size">Vial Size</Label>
                    <Input
                      id="vial_size"
                      value={formData.vial_size}
                      onChange={(e) =>
                        handleInputChange("vial_size", e.target.value)
                      }
                      placeholder="e.g., 2.5mg/0.5ml"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dosage_amount">Dosage Amount</Label>
                      <Input
                        id="dosage_amount"
                        type="number"
                        step="0.01"
                        value={formData.dosage_amount}
                        onChange={(e) =>
                          handleInputChange("dosage_amount", e.target.value)
                        }
                        placeholder="e.g., 10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dosage_unit">Dosage Unit</Label>
                      <Select
                        value={formData.dosage_unit}
                        onValueChange={(value) =>
                          handleInputChange("dosage_unit", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOSAGE_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="form">Form</Label>
                    <Select
                      value={formData.form}
                      onValueChange={(value) => handleInputChange("form", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_FORMS.map((form) => (
                          <SelectItem key={form} value={form}>
                            {form}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        value={formData.quantity}
                        onChange={(e) =>
                          handleInputChange("quantity", e.target.value)
                        }
                        placeholder="e.g., 30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="refills">Refills</Label>
                      <Input
                        id="refills"
                        type="number"
                        min="0"
                        value={formData.refills}
                        onChange={(e) =>
                          handleInputChange("refills", e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Directions / Sig */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A]">
                    Directions / Sig
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="sig">SIG (Directions for Patient)</Label>
                    <Textarea
                      id="sig"
                      value={formData.sig}
                      onChange={(e) => handleInputChange("sig", e.target.value)}
                      placeholder="e.g., Inject 0.25mg subcutaneously once weekly"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pharmacy_notes">Notes to Pharmacy</Label>
                    <Textarea
                      id="pharmacy_notes"
                      value={formData.pharmacy_notes}
                      onChange={(e) =>
                        handleInputChange("pharmacy_notes", e.target.value)
                      }
                      placeholder="Any special instructions..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E3A8A]">Pricing</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient_price">Patient Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <Input
                          id="patient_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.patient_price}
                          onChange={(e) =>
                            handleInputChange("patient_price", e.target.value)
                          }
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doctor_price">Doctor Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <Input
                          id="doctor_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.doctor_price}
                          onChange={(e) =>
                            handleInputChange("doctor_price", e.target.value)
                          }
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : editingMedication ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Medications Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication Name</TableHead>
                <TableHead>Vial Size</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Patient Price</TableHead>
                <TableHead>Doctor Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No medications found. Add your first medication to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMedications.map((medication) => (
                  <TableRow key={medication.id}>
                    <TableCell className="font-medium">
                      {medication.medication_name}
                    </TableCell>
                    <TableCell>{medication.vial_size || "-"}</TableCell>
                    <TableCell>
                      {medication.dosage_amount && medication.dosage_unit
                        ? `${medication.dosage_amount}${medication.dosage_unit}`
                        : "-"}
                    </TableCell>
                    <TableCell>{medication.form || "-"}</TableCell>
                    <TableCell>
                      {medication.patient_price
                        ? `$${parseFloat(medication.patient_price).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {medication.doctor_price
                        ? `$${parseFloat(medication.doctor_price).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(medication)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(medication.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DefaultLayout>
  );
}
