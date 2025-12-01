"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@core/auth";

import { ITEMS_PER_PAGE } from "../constants";
import { useEmrStore } from "../store/emr-store";

export function PatientList() {
  const router = useRouter();
  const { user } = useUser();
  const patients = useEmrStore((state) => state.patients);
  const loading = useEmrStore((state) => state.loading);
  const error = useEmrStore((state) => state.error);
  const fetchPatients = useEmrStore((state) => state.fetchPatients);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.id) {
      fetchPatients(user.id, searchQuery, currentPage, ITEMS_PER_PAGE);
    }
  }, [user?.id, searchQuery, currentPage, fetchPatients]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Please log in to view patients
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

  const totalPages = Math.ceil(patients.length / ITEMS_PER_PAGE);
  const currentPatients = patients;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewPatient = (patientId: string) => {
    router.push(`/basic-emr/patients/${patientId}`);
  };

  const handleCreatePatient = () => {
    router.push("/basic-emr/patients/new");
  };

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <Button
            onClick={handleCreatePatient}
            variant="default"
            className="px-4 py-2 rounded-lg font-medium w-full sm:w-auto"
          >
            Create New Patient
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full max-w-md border-gray-300 rounded-lg"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading patients...</div>
          </div>
        )}
        {error && (
          <div className="flex justify-center py-4 text-red-500">{error}</div>
        )}

        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-none">
                    {/* <TableHead className="text-gray-700 font-medium px-6 py-4 border-none">ID</TableHead> */}
                    <TableHead className="text-gray-700 font-medium px-4 sm:px-6 py-4 border-none">
                      First Name
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium px-4 sm:px-6 py-4 border-none">
                      Last Name
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium px-4 sm:px-6 py-4 border-none">
                      Gender
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium px-4 sm:px-6 py-4 border-none">
                      Date of Birth
                    </TableHead>
                    <TableHead className="text-gray-700 font-medium px-4 sm:px-6 py-4 border-none"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPatients.length === 0 ? (
                    <TableRow className="border-none">
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500 border-none"
                      >
                        No patients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPatients.map((patient, index) => (
                      <TableRow
                        key={patient.id}
                        className={`border-none ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        {/* <TableCell className="px-6 py-4 text-gray-900 font-medium border-none">{patient.id}</TableCell> */}
                        <TableCell className="px-4 sm:px-6 py-4 text-gray-900 border-none">
                          {patient.firstName}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-gray-900 border-none">
                          {patient.lastName}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-gray-900 border-none">
                          {patient.gender || "Not specified"}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 text-gray-900 border-none">
                          {patient.dateOfBirth}
                        </TableCell>
                        <TableCell className="px-4 sm:px-6 py-4 border-none">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPatient(patient.id)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent className="flex items-center space-x-1">
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-2 text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                </PaginationItem>
                {pageNumbers.map((page) => (
                  <PaginationItem key={page}>
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={
                        currentPage === page
                          ? "px-2 sm:px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                          : "px-2 sm:px-3 py-2 text-gray-700 border-gray-300 hover:bg-gray-50 text-sm"
                      }
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-2 text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
