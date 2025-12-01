import { createSeedClient } from "../client";
import { tagsData } from "./data/tags";
import type { Tag } from "../schema";

export async function seedTags() {
  try {
    console.log("Seeding tags table...");
    console.log(`Attempting to seed ${tagsData.length} tags`);

    const supabase = createSeedClient();

    // Test connection first
    console.log("Testing database connection...");
    const { error: testError } = await supabase
      .from("tags")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Database connection test failed:", testError);
      throw testError;
    }

    console.log("Database connection successful");

    // Insert or update tag data with conflict resolution
    const { data, error } = await supabase
      .from("tags")
      .upsert(tagsData, { onConflict: "slug", ignoreDuplicates: true })
      .select();

    if (error) {
      console.error("Upsert error:", error);
      throw error;
    }

    const affectedCount = data?.length || 0;
    if (affectedCount === 0) {
      console.log(
        "WARNING: No tags were inserted or updated (already present)",
      );
    } else {
      console.log(`Successfully inserted or updated ${affectedCount} tags`);
      data?.forEach((tag: Tag) => {
        console.log(`   - ${tag.name} (${tag.slug})`);
      });
    }
  } catch (error) {
    console.error("Error seeding tags:", error);
    throw error;
  }
}

export async function main() {
  await seedTags();
  process.exit(0);
}

// Run the seed if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
