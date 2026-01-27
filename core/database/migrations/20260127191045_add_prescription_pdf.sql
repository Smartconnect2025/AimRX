ALTER TABLE "patient_documents" ADD COLUMN "prescription_id" uuid;
ALTER TABLE "patient_documents" ADD COLUMN "uploaded_by" uuid;
ALTER TABLE "patient_documents" ADD COLUMN "document_category" text DEFAULT 'general';
ALTER TABLE "prescriptions" ADD COLUMN "pdf_storage_path" text;
ALTER TABLE "prescriptions" ADD COLUMN "pdf_document_id" uuid;
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescriptions" DROP COLUMN "pdf_base64";
ALTER TABLE "prescriptions" DROP COLUMN "signature_base64";