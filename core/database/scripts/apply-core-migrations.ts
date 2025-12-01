#!/usr/bin/env tsx
import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Apply core security migrations that need to run after initial schema setup
 */
async function applyCoreMigrations() {
  // Connection string from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("🚀 Starting core migrations setup...\n");

  // Create a postgres connection
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  const coreMigrations = [
    {
      file: "01_secure_drizzle_table.sql",
      description: "Securing drizzle migrations table",
    },
    {
      file: "02_create_all_storage_buckets.sql",
      description:
        "Creating storage buckets for avatars, resources, and products",
    },
    {
      file: "03_user_roles_rls.sql",
      description: "Setting up Row Level Security for user_roles table",
    },
  ];

  try {
    // Step 1: Check if initial migrations have been run
    console.log("📋 Checking migration status...");
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations__'
      ) as migrations_exist
    `);

    const migrationsExist = result[0]?.migrations_exist;

    if (!migrationsExist) {
      console.log("⚠️  Migrations table doesn't exist yet.");
      console.log(
        "   Please run 'npm run db:migrate' first, then run this script again.\n",
      );
      await client.end();
      process.exit(1);
    }

    console.log("✅ Migrations table found\n");

    // Step 2: Apply core infrastructure migrations
    console.log("🔐 Applying core security migrations...");

    for (const migration of coreMigrations) {
      console.log(`\n📝 ${migration.description}...`);

      const sqlPath = join(__dirname, "..", "core-migrations", migration.file);

      const sqlContent = readFileSync(sqlPath, "utf-8");

      try {
        // Execute the SQL file
        await client.unsafe(sqlContent);
        console.log(`   ✅ ${migration.file} applied successfully`);
      } catch (error) {
        // Check if it's an error because the changes already exist
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          errorMessage?.includes("already exists") ||
          errorMessage?.includes("duplicate") ||
          errorMessage?.includes("multiple primary keys")
        ) {
          console.log(`   ⚠️  ${migration.file} - already applied (skipping)`);
        } else {
          console.error(
            `   ❌ Error applying ${migration.file}:`,
            errorMessage,
          );
          throw error;
        }
      }
    }

    console.log("\n✨ Core migrations completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Core migrations setup failed:", error);
    console.log(
      "\n📋 If automated execution failed, please run these SQL files manually in your Supabase SQL Editor:",
    );
    coreMigrations.forEach((m) => {
      console.log(`   - core/database/core-migrations/${m.file}`);
    });
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  applyCoreMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to apply core migrations:", error);
      process.exit(1);
    });
}

export { applyCoreMigrations };
