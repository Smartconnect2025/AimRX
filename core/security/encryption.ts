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
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Error encrypting API key:", error);
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypt an encrypted API key
 * @param encryptedData - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext string
 */
export function decryptApiKey(encryptedData: string): string {
  try {
    // Split the encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    // Convert from hex
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

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
    throw new Error("Failed to decrypt API key");
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
  if (isEncrypted(apiKey)) {
    return apiKey;
  }
  return encryptApiKey(apiKey);
}
