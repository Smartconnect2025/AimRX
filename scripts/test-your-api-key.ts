import { encryptApiKey, decryptApiKey, isEncrypted } from "../core/security/encryption";

const YOUR_API_KEY = "DEF9A8F1-AD18-69D5-EB7A-D71B1996B4E1";

console.log("Testing your API key:", YOUR_API_KEY);
console.log("Is encrypted?", isEncrypted(YOUR_API_KEY));

try {
  console.log("\n1. Encrypting...");
  const encrypted = encryptApiKey(YOUR_API_KEY);
  console.log("Encrypted:", encrypted.substring(0, 50) + "...");
  console.log("Length:", encrypted.length);

  console.log("\n2. Decrypting...");
  const decrypted = decryptApiKey(encrypted);
  console.log("Decrypted:", decrypted);

  console.log("\n3. Match?", decrypted === YOUR_API_KEY ? "✅ YES" : "❌ NO");
} catch (error) {
  console.error("\n❌ ERROR:", error);
}
