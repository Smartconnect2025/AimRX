import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing required environment variables");
  console.error("URL:", supabaseUrl ? "Found" : "Missing");
  console.error("Key:", supabaseServiceRoleKey ? "Found" : "Missing");
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
  },
});

async function createDemoUsers() {
  console.log("Creating demo users...\n");

  const users = [
    {
      email: "platform@demo.com",
      password: "Demo2025!",
      role: "platform_owner",
      metadata: { role: "platform_owner" },
    },
    {
      email: "admin@demo.com",
      password: "Demo2025!",
      role: "admin",
      metadata: { role: "pharmacy_admin" },
    },
    {
      email: "dr.smith@demo.com",
      password: "Doctor2025!",
      role: "provider",
      metadata: { role: "doctor", firstName: "Sarah", lastName: "Smith" },
    },
    {
      email: "dr.jones@demo.com",
      password: "Doctor2025!",
      role: "provider",
      metadata: { role: "doctor", firstName: "Michael", lastName: "Jones" },
    },
  ];

  for (const user of users) {
    try {
      // Check if user exists first
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === user.email
      );

      if (existingUser) {
        console.log(`Deleting existing user: ${user.email}`);
        await supabase.auth.admin.deleteUser(existingUser.id);
      }

      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.metadata,
      });

      if (error) {
        console.error(`❌ Error creating ${user.email}:`, error.message);
        continue;
      }

      if (!data.user) {
        console.error(`❌ No user data returned for ${user.email}`);
        continue;
      }

      console.log(`✅ Created: ${user.email}`);

      // Add role to user_roles table if not platform owner
      if (user.role !== "platform_owner") {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({ user_id: data.user.id, role: user.role });

        if (roleError) {
          console.error(`⚠️  Warning: Could not set role for ${user.email}`);
        }
      }

      // Create provider profile for doctors
      if (user.role === "provider") {
        const { error: providerError } = await supabase
          .from("providers")
          .upsert({
            user_id: data.user.id,
            first_name: user.metadata.firstName,
            last_name: user.metadata.lastName,
            specialization:
              user.email === "dr.smith@demo.com"
                ? "Family Medicine"
                : "Internal Medicine",
            npi_number:
              user.email === "dr.smith@demo.com" ? "1234567890" : "0987654321",
            license_number:
              user.email === "dr.smith@demo.com" ? "MD12345" : "MD54321",
            license_state: "CA",
            is_accepting_patients: true,
          });

        if (providerError) {
          console.error(
            `⚠️  Warning: Could not create provider profile for ${user.email}`
          );
        }
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${user.email}:`, err);
    }
  }

  console.log("\n✅ Demo users created successfully!");
  console.log("\nAccounts:");
  console.log("| Role             | Email                  | Password     |");
  console.log("|------------------|------------------------|--------------|");
  console.log("| Platform Owner   | platform@demo.com      | Demo2025!    |");
  console.log("| Pharmacy Admin   | admin@demo.com         | Demo2025!    |");
  console.log("| Doctor 1         | dr.smith@demo.com      | Doctor2025!  |");
  console.log("| Doctor 2         | dr.jones@demo.com      | Doctor2025!  |");
}

createDemoUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
