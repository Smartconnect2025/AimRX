CREATE TABLE "provider_pharmacy_links" (
	"provider_id" uuid NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"custom_markup_percent" integer,
	CONSTRAINT "provider_pharmacy_links_provider_id_pharmacy_id_pk" PRIMARY KEY("provider_id","pharmacy_id")
);

CREATE TABLE "pharmacy_admins" (
	"user_id" uuid NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	CONSTRAINT "pharmacy_admins_user_id_pharmacy_id_pk" PRIMARY KEY("user_id","pharmacy_id")
);

ALTER TABLE "provider_pharmacy_links" ADD CONSTRAINT "provider_pharmacy_links_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "provider_pharmacy_links" ADD CONSTRAINT "provider_pharmacy_links_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pharmacy_admins" ADD CONSTRAINT "pharmacy_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pharmacy_admins" ADD CONSTRAINT "pharmacy_admins_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;