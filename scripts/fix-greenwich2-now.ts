import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// The encrypted data from database
const ENCRYPTED = "dfd0f5deb368871034ad41a3ccf018a7:271cfc81c0d36bfaf33b5582618cfcba:cd5d2e084b5045c21d255e748ef844a32fcf849bfb84344c89b275627cafbaa5f16f3555";

// Try to decrypt with fallback key
const FALLBACK_KEY = crypto
  .createHash("sha256")
  .update("rxportal-dev-encryption-key-do-not-use-in-production")
  .digest("hex");

console.log("Attempting to decrypt Greenwich 2 API key...");

try {
  const [ivHex, authTagHex, encryptedHex] = ENCRYPTED.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(FALLBACK_KEY, "hex"),
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  const apiKey = decrypted.toString("utf8");

  console.log("✅ Successfully decrypted API key:", apiKey);
  console.log("\nNow updating database with plain text key...");

  // Update database with plain text
  const { data, error } = await supabase
    .from("pharmacy_backends")
    .update({ api_key_encrypted: apiKey })
    .eq("pharmacy_id", (
      await supabase.from("pharmacies").select("id").ilike("name", "%greenwich%2%").single()
    ).data!.id)
    .select();

  if (error) {
    console.error("❌ Database update failed:", error);
  } else {
    console.log("✅ Greenwich 2 API key updated to plain text");
    console.log("   The system will now handle it correctly");
    console.log("   API Key:", apiKey);
  }
} catch (error) {
  console.error("❌ Decryption failed:", error);
  console.log("\nFalling back to setting plain text API key directly...");

  // Just set it to the plain text you provided
  const { error: updateError } = await supabase
    .from("pharmacy_backends")
    .update({ api_key_encrypted: "DEF9A8F1-AD18-69D5-EB7A-D71B1996B4E1" })
    .eq("pharmacy_id", (
      await supabase.from("pharmacies").select("id").ilike("name", "%greenwich%2%").single()
    ).data!.id);

  if (updateError) {
    console.error("❌ Failed:", updateError);
  } else {
    console.log("✅ Set to plain text API key: DEF9A8F1-AD18-69D5-EB7A-D71B1996B4E1");
  }
}

process.exit(0);
