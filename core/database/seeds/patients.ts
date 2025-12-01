import { createSeedClient } from "../client";
import { patientsData } from "./data/patients";
import type { Patient } from "../schema";

export async function seedPatients() {
  try {
    console.log("Seeding patients table...");
    console.log(`Attempting to seed ${patientsData.length} patients`);

    const supabase = createSeedClient();

    // Test connection first
    console.log("Testing database connection...");
    const { error: testError } = await supabase
      .from("patients")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Database connection test failed:", testError);
      throw testError;
    }

    console.log("Database connection successful");

    // First, create auth users for each patient
    console.log("Creating auth users for patients...");
    const userIds: string[] = [];

    for (let i = 0; i < patientsData.length; i++) {
      const email = `demo+patient${i + 1}@specode.ai`;
      const password = "Specode.123";

      // Create auth user using Supabase Admin API
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (authError) {
        // Check if user already exists
        if (authError.message?.includes("already been registered")) {
          // Get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(
            (u) => u.email === email,
          );
          if (existingUser) {
            console.log(`   - User already exists: ${email}`);
            userIds.push(existingUser.id);
          } else {
            console.error(`Error finding existing user ${email}:`, authError);
            throw authError;
          }
        } else {
          console.error(`Error creating auth user ${email}:`, authError);
          throw authError;
        }
      } else if (authData?.user) {
        console.log(`   - Created auth user: ${email}`);
        userIds.push(authData.user.id);
      }
    }

    // Prepare patient data with user_ids
    const patientsWithUserIds = patientsData.map((patient, index) => ({
      ...patient,
      user_id: userIds[index],
    }));

    // Insert patient data with user_ids
    const { data, error } = await supabase
      .from("patients")
      .insert(patientsWithUserIds)
      .select();

    if (error) {
      // If error is due to duplicate data, that's okay for development seeding
      if (error.code === "23505") {
        // unique_violation
        console.log(
          "WARNING: Some patients already exist, skipping duplicates",
        );
        return;
      }
      console.error("Insert error:", error);
      throw error;
    }

    const insertedCount = data?.length || 0;
    console.log(`✅ Successfully inserted ${insertedCount} patients`);

    // Log patient details for verification
    data?.forEach((patient: Patient, index: number) => {
      const email = `demo+patient${index + 1}@specode.ai`;
      console.log(`   - ${patient.first_name} ${patient.last_name} - ${email}`);
    });
  } catch (error) {
    console.error("Error seeding patients:", error);
    throw error;
  }
}

export async function main() {
  await seedPatients();
  process.exit(0);
}

// Run the seed if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
