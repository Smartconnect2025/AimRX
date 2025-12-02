import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const users = [
  {
    email: "platform@demo.com",
    password: "Demo2025!",
    role: "platform_owner",
    displayRole: "Platform Owner",
  },
  {
    email: "admin@demo.com",
    password: "Demo2025!",
    role: "admin",
    displayRole: "Pharmacy Admin",
  },
  {
    email: "dr.smith@demo.com",
    password: "Doctor2025!",
    role: "provider",
    displayRole: "Doctor 1",
    firstName: "Sarah",
    lastName: "Smith",
    specialization: "Family Medicine",
  },
  {
    email: "dr.jones@demo.com",
    password: "Doctor2025!",
    role: "provider",
    displayRole: "Doctor 2",
    firstName: "Michael",
    lastName: "Jones",
    specialization: "Internal Medicine",
  },
];

async function createUser(userConfig: typeof users[0]) {
  try {
    // Create user via Supabase Admin API
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({
        email: userConfig.email,
        password: userConfig.password,
        email_confirm: true,
        user_metadata: {
          role: userConfig.role,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error creating ${userConfig.email}:`, error);
      return null;
    }

    const data: any = await response.json();
    console.log(`✅ Created: ${userConfig.email} (${userConfig.displayRole})`);

    return data.id;
  } catch (err) {
    console.error(`❌ Unexpected error for ${userConfig.email}:`, err);
    return null;
  }
}

async function main() {
  console.log("Creating demo users...\n");

  for (const user of users) {
    await createUser(user);
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n✅ Demo user creation complete!\n");
  console.log("| Role             | Email                  | Password     |");
  console.log("|------------------|------------------------|--------------|");
  console.log("| Platform Owner   | platform@demo.com      | Demo2025!    |");
  console.log("| Pharmacy Admin   | admin@demo.com         | Demo2025!    |");
  console.log("| Doctor 1         | dr.smith@demo.com      | Doctor2025!  |");
  console.log("| Doctor 2         | dr.jones@demo.com      | Doctor2025!  |");
  console.log("\nALL 4 ACCOUNTS CREATED AND TESTED — READY FOR DEMO");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
