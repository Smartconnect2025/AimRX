CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'provider');
CREATE TYPE "public"."experience_level" AS ENUM('entry', 'mid', 'senior', 'expert');
CREATE TYPE "public"."provider_gender" AS ENUM('male', 'female');
CREATE TYPE "public"."practice_type" AS ENUM('solo', 'group', 'hospital', 'clinic', 'telehealth');
CREATE TYPE "public"."encounter_business_type" AS ENUM('appointment_based', 'order_based', 'order_based_async', 'order_based_sync', 'coaching', 'manual');
CREATE TYPE "public"."encounter_status" AS ENUM('upcoming', 'completed', 'in_progress');
CREATE TYPE "public"."encounter_type" AS ENUM('routine', 'follow_up', 'urgent', 'consultation');
CREATE TYPE "public"."order_type" AS ENUM('lab', 'imaging', 'medication', 'referral');
CREATE TYPE "public"."pharmacy_system_type" AS ENUM('DigitalRx', 'PioneerRx', 'QS1', 'Liberty', 'Custom', 'BestRx');
CREATE TYPE "public"."order_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed', 'active', 'payment_failed');
CREATE TABLE "user_roles" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"role" "user_role" NOT NULL,
	CONSTRAINT "user_roles_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "user_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"given_name" text NOT NULL,
	"family_name" text NOT NULL,
	"phone" text,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "stripe_customers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stripe_customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_customers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "stripe_customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);

CREATE TABLE "mfa_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"form_data" jsonb NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "payment_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_name" text DEFAULT 'AMRX' NOT NULL,
	"api_login_id" text,
	"transaction_key_encrypted" text,
	"public_client_key" text,
	"signature_key_encrypted" text,
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"is_verified" boolean DEFAULT false,
	"last_verified_at" timestamp with time zone,
	"verification_error" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid,
	"total_amount_cents" integer NOT NULL,
	"consultation_fee_cents" integer DEFAULT 0 NOT NULL,
	"medication_cost_cents" integer DEFAULT 0 NOT NULL,
	"patient_id" uuid,
	"patient_email" text,
	"patient_phone" text,
	"patient_name" text,
	"provider_id" uuid,
	"provider_name" text,
	"pharmacy_id" uuid,
	"pharmacy_name" text,
	"authnet_transaction_id" text,
	"authnet_authorization_code" text,
	"authnet_response_code" text,
	"authnet_response_reason" text,
	"payment_token" text NOT NULL,
	"payment_link_url" text,
	"payment_link_expires_at" timestamp with time zone,
	"payment_link_used_at" timestamp with time zone,
	"card_last_four" text,
	"card_type" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"order_progress" text DEFAULT 'payment_pending' NOT NULL,
	"delivery_method" text DEFAULT 'pickup' NOT NULL,
	"tracking_number" text,
	"tracking_url" text,
	"payment_link_email_sent_at" timestamp with time zone,
	"payment_confirmation_email_sent_at" timestamp with time zone,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"webhook_received_at" timestamp with time zone,
	"webhook_payload" jsonb,
	"paid_at" timestamp with time zone,
	"refund_amount_cents" integer,
	"refunded_at" timestamp with time zone,
	CONSTRAINT "payment_transactions_payment_token_unique" UNIQUE("payment_token")
);

CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"first_name" text,
	"last_name" text,
	"date_of_birth" date,
	"gender" "provider_gender",
	"avatar_url" text,
	"email" text,
	"phone_number" text,
	"company_name" text,
	"email_verified" timestamp with time zone,
	"phone_verified" timestamp with time zone,
	"npi_number" text,
	"specialties" jsonb,
	"medical_licenses" jsonb,
	"board_certifications" jsonb,
	"education_training" jsonb,
	"languages_spoken" jsonb,
	"professional_associations" jsonb,
	"years_of_experience" integer,
	"professional_bio" text,
	"practice_type" "practice_type",
	"practice_address" jsonb,
	"services_offered" jsonb,
	"insurance_plans_accepted" jsonb,
	"hospital_affiliations" jsonb,
	"physical_address" jsonb,
	"billing_address" jsonb,
	"tax_id" text,
	"payment_details" jsonb,
	"payment_method" text,
	"payment_schedule" text,
	"tier_level" text,
	"specialty" text,
	"licensed_states" text[],
	"service_types" text[],
	"insurance_plans" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "providers_npi_number_unique" UNIQUE("npi_number")
);

CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"date_of_birth" date NOT NULL,
	"phone" varchar(50),
	"email" varchar(255),
	"avatar_url" text,
	"data" jsonb,
	"physical_address" jsonb,
	"billing_address" jsonb,
	"emr_data" jsonb,
	"provider_id" uuid,
	"status" varchar(50),
	"emr_created_at" timestamp with time zone,
	"emr_updated_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patients_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "provider_patient_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_patient_unique" UNIQUE("provider_id","patient_id")
);

CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"datetime" timestamp with time zone NOT NULL,
	"duration" integer NOT NULL,
	"type" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "provider_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"provider_timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "provider_availability_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"exception_date" date NOT NULL,
	"is_available" boolean NOT NULL,
	"start_time" time,
	"end_time" time,
	"provider_timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);

CREATE TABLE "provider_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"default_telehealth_duration" integer DEFAULT 30 NOT NULL,
	"default_inperson_duration" integer DEFAULT 45 NOT NULL,
	"allowed_durations" jsonb DEFAULT '[15,30,45,60,90]'::jsonb NOT NULL,
	"enabled_service_types" jsonb DEFAULT '["telehealth","in_person"]'::jsonb NOT NULL,
	"allow_patient_duration_change" boolean DEFAULT false NOT NULL,
	"advance_booking_days" integer DEFAULT 30 NOT NULL,
	"min_booking_notice_hours" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"provider_id" uuid,
	"finalized_by" uuid,
	"title" varchar(255) NOT NULL,
	"encounter_date" timestamp with time zone NOT NULL,
	"status" "encounter_status" DEFAULT 'upcoming' NOT NULL,
	"encounter_type" "encounter_type" DEFAULT 'routine' NOT NULL,
	"business_type" "encounter_business_type" NOT NULL,
	"appointment_id" uuid,
	"order_id" uuid,
	"provider_name" varchar(255),
	"provider_notes" text,
	"finalized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"name" varchar(255) NOT NULL,
	"dosage" varchar(100) NOT NULL,
	"frequency" varchar(100) NOT NULL,
	"start_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"name" varchar(255) NOT NULL,
	"onset_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"severity" varchar(20) DEFAULT 'mild' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "allergies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"allergen" varchar(255) NOT NULL,
	"reaction_type" varchar(255) NOT NULL,
	"severity" varchar(20) DEFAULT 'mild' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"blood_pressure" varchar(20),
	"heart_rate" integer,
	"weight" numeric(5, 2),
	"height" varchar(20),
	"temperature" numeric(4, 1),
	"blood_oxygen" integer,
	"bmi" numeric(4, 1),
	"respiratory_rate" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "emr_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid NOT NULL,
	"ordered_by" uuid NOT NULL,
	"order_type" "order_type" NOT NULL,
	"title" text NOT NULL,
	"details" text,
	"ordered_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "addendums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "billing_diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"billing_group_id" uuid NOT NULL,
	"icd_code" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "billing_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"procedure_code" varchar(10) NOT NULL,
	"procedure_description" text NOT NULL,
	"modifiers" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "billing_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"billing_group_id" uuid NOT NULL,
	"cpt_code" varchar(10) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "patient_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"name" text NOT NULL,
	"file_type" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"storage_path" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescriber_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"encounter_id" uuid,
	"appointment_id" uuid,
	"medication" text NOT NULL,
	"dosage" text NOT NULL,
	"dosage_amount" text,
	"dosage_unit" text,
	"vial_size" text,
	"form" text,
	"quantity" integer NOT NULL,
	"refills" integer DEFAULT 0 NOT NULL,
	"sig" text NOT NULL,
	"dispense_as_written" boolean DEFAULT false,
	"pharmacy_notes" text,
	"patient_price" numeric(10, 2),
	"doctor_price" numeric(10, 2),
	"medication_id" uuid,
	"pharmacy_id" uuid,
	"backend_id" uuid,
	"profit_cents" integer DEFAULT 0,
	"total_paid_cents" integer DEFAULT 0,
	"stripe_payment_intent_id" text,
	"payment_status" text DEFAULT 'unpaid',
	"order_progress" text DEFAULT 'payment_pending',
	"payment_transaction_id" uuid,
	"pdf_base64" text,
	"signature_base64" text,
	"queue_id" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"tracking_number" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prescriptions_queue_id_unique" UNIQUE("queue_id")
);

CREATE TABLE "medication_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_name" varchar(255) NOT NULL,
	"vial_size" varchar(100),
	"dosage_amount" varchar(50),
	"dosage_unit" varchar(20),
	"form" varchar(100),
	"quantity" varchar(50),
	"refills" varchar(10),
	"sig" text,
	"pharmacy_notes" text,
	"patient_price" numeric(10, 2),
	"doctor_price" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pharmacies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#00AEEF',
	"tagline" text,
	"address" text,
	"npi" text,
	"phone" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pharmacies_slug_unique" UNIQUE("slug")
);

CREATE TABLE "pharmacy_backends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"system_type" "pharmacy_system_type" NOT NULL,
	"api_url" text,
	"api_key_encrypted" text,
	"store_id" text,
	"location_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "pharmacy_medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"name" text NOT NULL,
	"strength" text,
	"form" text,
	"ndc" text,
	"vial_size" text,
	"retail_price_cents" integer NOT NULL,
	"aimrx_site_pricing_cents" integer,
	"doctor_markup_percent" integer DEFAULT 25,
	"category" text,
	"dosage_instructions" text,
	"detailed_description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"in_stock" boolean DEFAULT true,
	"preparation_time_days" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "provider_pharmacy_links" (
	"provider_id" uuid NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"custom_markup_percent" integer,
	CONSTRAINT "provider_pharmacy_links_provider_id_pharmacy_id_pk" PRIMARY KEY("provider_id","pharmacy_id")
);

CREATE TABLE "pharmacy_admins" (
	"user_id" uuid NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pharmacy_admins_user_id_pharmacy_id_pk" PRIMARY KEY("user_id","pharmacy_id")
);

CREATE TABLE "tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_name" text NOT NULL,
	"tier_code" text NOT NULL,
	"discount_percentage" numeric(5, 2) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tiers_tier_name_unique" UNIQUE("tier_name"),
	CONSTRAINT "tiers_tier_code_unique" UNIQUE("tier_code")
);

CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"user_name" text,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"queue_id" text,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "goal_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"current" numeric NOT NULL,
	"date" date NOT NULL,
	"notes" text
);

CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"metric" text NOT NULL,
	"description" text,
	"target_value" text NOT NULL,
	"current_value" text DEFAULT '0' NOT NULL,
	"unit" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"custom_goal" text,
	"progress" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'not-started' NOT NULL,
	"tracking_source" text DEFAULT 'manual' NOT NULL,
	"timeframe" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"target" numeric NOT NULL,
	"achieved" boolean DEFAULT false NOT NULL,
	"achieved_at" timestamp with time zone
);

CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"url" text,
	"content" text,
	"cover_src" text,
	"type" text NOT NULL,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);

CREATE TABLE "notification_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"label" text NOT NULL,
	"action_data" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"critical" boolean DEFAULT false NOT NULL,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"content" text NOT NULL,
	"did_exercise" boolean DEFAULT false NOT NULL,
	"caffeine_servings" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "mood_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mood" text NOT NULL,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "order_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" text NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "order_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" integer NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"subscription_price" integer NOT NULL,
	"stripe_price_id" text
);

CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"shipping_address_id" uuid NOT NULL,
	"billing_address_id" uuid,
	"payment_details" jsonb,
	"stripe_session_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"color" varchar(50),
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);

CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image_url" text,
	"active_ingredient" text,
	"benefits" text,
	"safety_info" text,
	"subscription_price" integer NOT NULL,
	"subscription_price_discounted" integer,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_best_seller" boolean DEFAULT false NOT NULL,
	"requires_prescription" boolean DEFAULT false NOT NULL,
	"stripe_product_id" text,
	"stripe_price_ids" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);

CREATE TABLE "reminders" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "reminders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"patient_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true,
	"frequency" text NOT NULL,
	"time_of_day" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "symptom_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"severity" bigint,
	"description" varchar,
	"patient_id" uuid,
	"symptom_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "symptoms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"is_common" boolean DEFAULT false
);

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "stripe_customers" ADD CONSTRAINT "stripe_customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "patients" ADD CONSTRAINT "patients_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "provider_patient_mappings" ADD CONSTRAINT "provider_patient_mappings_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_patient_mappings" ADD CONSTRAINT "provider_patient_mappings_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_availability_exceptions" ADD CONSTRAINT "provider_availability_exceptions_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_settings" ADD CONSTRAINT "provider_settings_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_finalized_by_users_id_fk" FOREIGN KEY ("finalized_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "medications" ADD CONSTRAINT "medications_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "emr_orders" ADD CONSTRAINT "emr_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "emr_orders" ADD CONSTRAINT "emr_orders_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "emr_orders" ADD CONSTRAINT "emr_orders_ordered_by_users_id_fk" FOREIGN KEY ("ordered_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "addendums" ADD CONSTRAINT "addendums_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "billing_diagnoses" ADD CONSTRAINT "billing_diagnoses_billing_group_id_billing_groups_id_fk" FOREIGN KEY ("billing_group_id") REFERENCES "public"."billing_groups"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "billing_groups" ADD CONSTRAINT "billing_groups_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "billing_procedures" ADD CONSTRAINT "billing_procedures_billing_group_id_billing_groups_id_fk" FOREIGN KEY ("billing_group_id") REFERENCES "public"."billing_groups"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescriber_id_users_id_fk" FOREIGN KEY ("prescriber_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medication_id_pharmacy_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."pharmacy_medications"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_backend_id_pharmacy_backends_id_fk" FOREIGN KEY ("backend_id") REFERENCES "public"."pharmacy_backends"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pharmacy_backends" ADD CONSTRAINT "pharmacy_backends_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pharmacy_medications" ADD CONSTRAINT "pharmacy_medications_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_pharmacy_links" ADD CONSTRAINT "provider_pharmacy_links_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_pharmacy_links" ADD CONSTRAINT "provider_pharmacy_links_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pharmacy_admins" ADD CONSTRAINT "pharmacy_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pharmacy_admins" ADD CONSTRAINT "pharmacy_admins_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notification_actions" ADD CONSTRAINT "notification_actions_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_activities" ADD CONSTRAINT "order_activities_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_user_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."user_addresses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_user_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."user_addresses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "symptom_logs" ADD CONSTRAINT "symptom_logs_symptom_id_symptoms_id_fk" FOREIGN KEY ("symptom_id") REFERENCES "public"."symptoms"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX "idx_provider_patient_mappings_provider_id" ON "provider_patient_mappings" USING btree ("provider_id");
CREATE INDEX "idx_provider_patient_mappings_patient_id" ON "provider_patient_mappings" USING btree ("patient_id");