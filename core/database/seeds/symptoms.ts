import { createSeedClient } from "../client";
import { symptomsData } from "./data/symptoms";

export async function seedSymptoms() {
  try {
    console.log("Seeding symptoms table...");
    console.log(`Attempting to seed ${symptomsData.length} symptoms`);

    const supabase = createSeedClient();

    // Test connection first
    console.log("Testing database connection...");
    const { error: testError } = await supabase
      .from("symptoms")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Database connection test failed:", testError);
      throw testError;
    }

    console.log("Database connection successful");

    // Insert or update symptom data
    const { data, error } = await supabase
      .from("symptoms")
      .upsert(symptomsData, { onConflict: "id", ignoreDuplicates: true })
      .select();

    if (error) {
      console.error("Upsert error:", error);
      throw error;
    }

    const affectedCount = data?.length || 0;
    if (affectedCount === 0) {
      console.log("⚠️ No symptoms were inserted or updated (already present)");
    } else {
      console.log(
        `✅ Successfully inserted or updated ${affectedCount} symptoms`,
      );
    }
  } catch (error) {
    console.error("❌ Error seeding symptoms:", error);
    throw error;
  }
}

export async function main() {
  await seedSymptoms();
  process.exit(0);
}

// Run the seed if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
