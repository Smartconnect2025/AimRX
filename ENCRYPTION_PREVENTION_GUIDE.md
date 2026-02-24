# Encryption Bug Prevention Guide

## What Was The Bug?

The "Failed to decrypt API key" error occurred when pharmacy API keys were encrypted with one encryption key but the system tried to decrypt them with a different encryption key.

## Root Causes

1. **No ENCRYPTION_KEY in environment** - System used fallback development key
2. **Different encryption keys between environments** - Dev vs production used different keys
3. **Encryption key changed** - Key was regenerated or modified after data was encrypted
4. **No validation** - System didn't check if decryption would work before storing encrypted data

## Permanent Prevention Measures Implemented

### 1. **Startup Validation** ✅

The system now validates the encryption key when it starts:

```typescript
// Validates on module load
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error("CRITICAL: Invalid ENCRYPTION_KEY");
}
```

**What this prevents:**
- Invalid encryption keys
- Missing encryption keys
- Wrong key format

### 2. **Fallback Warning** ✅

When using the fallback development key, you'll see a warning:

```
⚠️  Using fallback encryption key. Set ENCRYPTION_KEY in .env for production.
```

**What this prevents:**
- Silent use of fallback keys
- Production deployments without proper encryption key
- Key mismatches between environments

### 3. **Graceful Decryption** ✅

The decryption function now handles edge cases:

```typescript
// Check if it's plain text (legacy format)
if (!isEncrypted(encryptedData)) {
  console.warn("⚠️  API key is not encrypted (legacy plain text format)");
  return encryptedData; // Works with plain text
}
```

**What this prevents:**
- Crashes when encountering plain text API keys
- Data loss from failed decryptions
- 500 errors in prescription submission

### 4. **Better Error Messages** ✅

All API endpoints now have try-catch blocks with descriptive errors:

```typescript
try {
  DIGITALRX_API_KEY = decryptApiKey(backend.api_key_encrypted);
} catch (decryptError) {
  return NextResponse.json({
    error: "Pharmacy API key decryption failed. Please re-enter credentials.",
    details: decryptError.message
  }, { status: 500 });
}
```

**What this prevents:**
- Generic 500 errors
- Confusion about what went wrong
- Long debugging sessions

### 5. **Health Check Endpoint** ✅

New endpoint to proactively detect encryption issues:

```
GET /api/admin/health/encryption
```

Returns:
- Which pharmacies have encryption issues
- Which keys are plain text vs encrypted
- Specific recommendations for each issue

**What this prevents:**
- Discovering encryption issues in production
- Failed prescription submissions
- Lost sales due to broken pharmacy integrations

### 6. **Fix Encryption Endpoint** ✅

New endpoint to fix encryption issues without SQL:

```
POST /api/admin/pharmacy-backends/fix-encryption
{
  "backendId": "...",
  "newApiKey": "..."
}
```

**What this prevents:**
- Need for SQL access to fix issues
- Downtime while waiting for database access
- Risk of SQL syntax errors

### 7. **Environment Variable Documentation** ✅

Added to `.env.example`:

```bash
# Encryption
# Generate with: openssl rand -hex 32
# CRITICAL: Keep this secret and consistent across all environments
ENCRYPTION_KEY=
```

**What this prevents:**
- Forgetting to set encryption key
- Using different keys in different environments
- Confusion about how to generate the key

### 8. **Validation Script** ✅

Created `scripts/validate-encryption-setup.ts` to check:
- ✓ ENCRYPTION_KEY exists
- ✓ Key format is valid (64 hex chars)
- ✓ Encryption/decryption works correctly
- ✓ Production readiness

**What this prevents:**
- Deploying with broken encryption
- Silent encryption failures
- Environment configuration issues

## How To Use These Preventions

### For Developers

1. **Generate encryption key:**
   ```bash
   openssl rand -hex 32
   ```

2. **Add to .env:**
   ```bash
   ENCRYPTION_KEY=your_generated_key_here
   ```

3. **Validate setup:**
   ```bash
   npm run validate:encryption
   ```

4. **Check health before deploying:**
   ```bash
   curl https://your-app.com/api/admin/health/encryption
   ```

### For Admins

1. **Monitor encryption health:**
   - Visit `/api/admin/health/encryption` regularly
   - Check for "failed" or "plain_text" statuses
   - Follow recommendations to fix issues

2. **If you see decryption errors:**
   - Go to `/admin/pharmacy-management`
   - Find the affected pharmacy
   - Click "Edit"
   - Re-enter the API key
   - Click "Save"

### For DevOps

1. **Use the same ENCRYPTION_KEY in all environments:**
   - Development
   - Staging
   - Production

2. **Store encryption key securely:**
   - Use environment variables (not committed to git)
   - Use secrets management (AWS Secrets Manager, Vault, etc.)
   - Rotate keys safely (decrypt all data, re-encrypt with new key)

3. **Monitor logs for encryption warnings:**
   ```bash
   grep "fallback encryption key" logs.txt
   grep "not encrypted" logs.txt
   grep "Failed to decrypt" logs.txt
   ```

## Testing

### Manual Test

1. Create a test pharmacy with API key
2. Verify it encrypts: `SELECT api_key_encrypted FROM pharmacy_backends WHERE ...`
3. Try to submit a prescription using that pharmacy
4. Should work without errors

### Automated Test

```bash
# Validate encryption setup
npm run validate:encryption

# Check encryption health
curl http://localhost:3000/api/admin/health/encryption
```

## Emergency Recovery

If you still encounter "Failed to decrypt API key":

1. **Option 1: Re-enter via UI** (Recommended)
   - Go to `/admin/pharmacy-management`
   - Edit the pharmacy
   - Re-enter API key
   - Save

2. **Option 2: Use fix endpoint**
   ```bash
   curl -X POST /api/admin/pharmacy-backends/fix-encryption \
     -H "Content-Type: application/json" \
     -d '{"backendId": "...", "newApiKey": "..."}'
   ```

3. **Option 3: Direct SQL** (Last resort)
   ```sql
   UPDATE pharmacy_backends
   SET api_key_encrypted = 'YOUR_PLAIN_TEXT_API_KEY'
   WHERE id = 'backend_id_here';
   ```

## Key Takeaways

✅ **Always set ENCRYPTION_KEY in .env**
✅ **Use the same key across all environments**
✅ **Run validation script before deploying**
✅ **Monitor encryption health regularly**
✅ **Re-enter API keys if you see decryption errors**

## Future Improvements

Potential enhancements to consider:

- [ ] Automatic key rotation with data migration
- [ ] Multi-key support for zero-downtime key rotation
- [ ] Encrypted backup/restore functionality
- [ ] Integration with cloud secrets managers (AWS, Azure, GCP)
- [ ] Automated encryption health checks in CI/CD pipeline

---

**Last Updated:** 2024
**Related Files:**
- `core/security/encryption.ts`
- `scripts/validate-encryption-setup.ts`
- `app/api/admin/health/encryption/route.ts`
- `.env.example`
