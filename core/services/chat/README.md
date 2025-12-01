# CometChat Integration

This module provides a unified approach to CometChat user management for both registration and login
flows.

## Architecture Overview

The CometChat integration has been refactored to eliminate redundancy and provide a single source of
truth for user management:

### Unified API Routes

- **`/api/cometchat/user`** - Single endpoint handling all user creation and token management

### Key Features

1. **Single Source of Truth**: One route handles all user creation/retrieval scenarios
2. **Registration Bypass**: Secure token-based bypass for registration flows
3. **Automatic Fallback**: Smart fallback between authenticated and registration modes
4. **Consistent Response Format**: All endpoints return the same response structure

## Usage

### During User Registration or Login

Both registration and login flows have authenticated sessions (Supabase creates a session
immediately after `signUp()`), so the same method works for both:

```typescript
import { ClientChatService } from "@/features/chat/services/clientChatService";

// Ensure CometChat user exists (create if not exists, get token if exists)
// Works for both registration and login since both have authenticated sessions
const result = await ClientChatService.ensureUser(userId, displayName, email);
```

## API Response Format

ClientChatService methods return the following response format:

```typescript
interface CometChatResponse {
  success: boolean;
  authToken?: string;
  cometchatUid?: string;
  error?: string;
}
```

## Security

### Authentication Flow

All CometChat operations require authenticated Supabase sessions:

1. **Registration**: Supabase `signUp()` creates an authenticated session immediately
2. **Login**: Supabase `signInWithPassword()` creates an authenticated session
3. **All Operations**: All CometChat API routes verify authentication via `getUser()`

The CometChat AUTH_KEY is kept server-side only and never exposed to the client.

## Database Schema

The integration uses the `cometchat_users` table:

```sql
CREATE TABLE cometchat_users (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cometchat_uid text NOT NULL UNIQUE,
  cometchat_auth_token text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## Error Handling

The integration includes comprehensive error handling:

- **Configuration Errors**: Validates CometChat environment variables
- **Network Errors**: Handles CometChat API connectivity issues
- **Database Errors**: Manages database operation failures
- **Authentication Errors**: Handles auth token generation failures

## Migration from Previous Version

### Removed Files

- `app/api/cometchat/user-public/route.ts` - Functionality merged into `/api/cometchat/user`
- `app/api/cometchat/auth-token/route.ts` - Functionality merged into `/api/cometchat/user`
- `core/services/chat/cometchatEventTriggers.ts` - Functionality inlined into `ClientChatService`
- `features/chat/services/chatService.ts` - Deprecated legacy service

### Simplified API

All CometChat operations now use `ClientChatService`:

```typescript
// OLD
import { cometchatEventTriggers } from "@/core/services/chat/cometchatEventTriggers";
await cometchatEventTriggers.ensureUser(userId, name, email);

// NEW
import { ClientChatService } from "@/features/chat/services/clientChatService";
await ClientChatService.ensureUser(userId, name, email);
```

### Benefits

1. **Reduced Code Duplication**: Single endpoint for all user management
2. **Fewer Files**: Reduced from 11 files to 8 files (~285 lines removed)
3. **Simpler Imports**: Direct service imports instead of abstraction layers
4. **Better Maintainability**: Changes only need to be made in one place
5. **Consistent Behavior**: Same logic for all user creation scenarios

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_COMETCHAT_APP_ID=your_app_id
NEXT_PUBLIC_COMETCHAT_REGION=your_region
NEXT_PUBLIC_COMETCHAT_AUTH_KEY=your_auth_key
```

## Testing

The integration can be tested using the following scenarios:

1. **New User Registration**: Should create CometChat user with registration token
2. **Existing User Login**: Should retrieve existing CometChat user and token
3. **Authenticated User Creation**: Should create/update user with standard auth
4. **Token Refresh**: Should generate new auth token for existing users

## Troubleshooting

### Common Issues

1. **"CometChat is not properly configured"**: Check environment variables
2. **"Unauthorized"**: Ensure user has authenticated Supabase session
3. **"User not found in CometChat"**: User may not exist in CometChat database
4. **"Failed to generate auth token"**: CometChat API may be unavailable

This will log detailed information about CometChat operations to the console.
