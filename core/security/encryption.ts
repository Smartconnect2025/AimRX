import crypto from "crypto";

/**
 * Encryption utilities for sensitive data like API keys
 * Uses AES-256-GCM encryption
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || generateFallbackKey();
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Generate a fallback encryption key if ENCRYPTION_KEY env var is not set
 * WARNING: This should only be used for development. Production MUST have ENCRYPTION_KEY set.
 */
function generateFallbackKey(): string {
  // Generate a consistent key for development based on a seed
  return crypto
    .createHash("sha256")
    .update("rxportal-dev-encryption-key-do-not-use-in-production")
    .digest("hex");
}

/**
 * Encrypt a plaintext API key or sensitive string
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encryptApiKey(plaintext: string): string {
  try {
    // Validate input
    if (!plaintext || typeof plaintext !== "string") {
      throw new Error("Invalid plaintext: must be a non-empty string");
    }

    // Check if already encrypted (avoid double encryption)
    if (isEncrypted(plaintext)) {
      console.warn("API key is already encrypted, returning as-is");
      return plaintext;
    }

    // Validate encryption key
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
      console.error("Invalid encryption key: must be 64 hex characters (32 bytes)");
      throw new Error("Encryption key not properly configured");
    }

    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    const result = `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;

    return result;
  } catch (error) {
    console.error("Error encrypting API key:", error);
    console.error("Encryption key exists:", !!ENCRYPTION_KEY);
    console.error("Encryption key length:", ENCRYPTION_KEY?.length || 0);
    throw new Error(`Failed to encrypt API key: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Decrypt an encrypted API key
 * @param encryptedData - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext string
 */
export function decryptApiKey(encryptedData: string): string {
  try {
    // Check if data is already plain text (not encrypted)
    // This handles cases where API keys were stored before encryption was added
    if (!isEncrypted(encryptedData)) {
      console.warn("API key is not encrypted, returning as-is (legacy format)");
      return encryptedData;
    }

    // Split the encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      console.error(`Invalid encrypted data format: expected 3 parts, got ${parts.length}`);
      throw new Error("Invalid encrypted data format");
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    // Validate hex strings
    if (!ivHex || !authTagHex || !encryptedHex) {
      console.error("One or more encryption components are empty");
      throw new Error("Invalid encrypted data: missing components");
    }

    // Convert from hex
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    // Validate buffer lengths
    if (iv.length !== IV_LENGTH) {
      console.error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
      throw new Error("Invalid IV length");
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );

    // Set authentication tag
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Error decrypting API key:", error);
    console.error("Encrypted data length:", encryptedData?.length || 0);
    console.error("Encryption key exists:", !!ENCRYPTION_KEY);
    console.error("Encryption key length:", ENCRYPTION_KEY?.length || 0);
    throw new Error(`Failed to decrypt API key: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check if a string is encrypted (has the format iv:authTag:encryptedData)
 * @param value - String to check
 * @returns true if the string appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(":");
  // Check if it has 3 parts and each part is valid hex
  return (
    parts.length === 3 &&
    parts.every((part) => /^[0-9a-f]+$/i.test(part))
  );
}

/**
 * Encrypt API key if it's not already encrypted
 * @param apiKey - API key to encrypt (if not already encrypted)
 * @returns Encrypted API key
 */
export function ensureEncrypted(apiKey: string): string {
  if (!apiKey) {
    throw new Error("Cannot encrypt empty API key");
  }

  const alreadyEncrypted = isEncrypted(apiKey);

  if (alreadyEncrypted) {
    console.log("API key is already encrypted, skipping encryption");
    return apiKey;
  }

  console.log("Encrypting API key...");
  const encrypted = encryptApiKey(apiKey);
  console.log("API key encrypted successfully");
  return encrypted;
}
