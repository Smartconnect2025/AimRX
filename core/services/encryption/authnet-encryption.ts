import crypto from "crypto";

/**
 * Encryption service for Authorize.Net credentials
 * Uses AES-256-GCM encryption
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 * This should be a 32-byte (256-bit) key stored securely in environment variables
 */
function getEncryptionKey(): Buffer {
  const key = process.env.AUTHNET_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "AUTHNET_ENCRYPTION_KEY environment variable is not set. Please add it to your .env file."
    );
  }

  // Ensure the key is exactly 32 bytes (256 bits)
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error(
      "AUTHNET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a string (Transaction Key or Signature Key)
 * Returns encrypted string in format: iv:authTag:encryptedData (all hex-encoded)
 */
export function encryptAuthNetKey(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Return as: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt Authorize.Net key");
  }
}

/**
 * Decrypt an encrypted string
 * Accepts format: iv:authTag:encryptedData (all hex-encoded)
 */
export function decryptAuthNetKey(encryptedData: string): string {
  try {
    const key = getEncryptionKey();

    // Split the encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt Authorize.Net key");
  }
}

/**
 * Generate a secure encryption key (for setup)
 * This should be run once and stored in .env as AUTHNET_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Test if encryption/decryption is working
 */
export function testEncryption(): boolean {
  try {
    const testData = "test-transaction-key-12345";
    const encrypted = encryptAuthNetKey(testData);
    const decrypted = decryptAuthNetKey(encrypted);

    return decrypted === testData;
  } catch (error) {
    console.error("Encryption test failed:", error);
    return false;
  }
}
