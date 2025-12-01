# Chat Feature

Real-time chat functionality using CometChat UIKit for secure communication between patients and
healthcare providers.

## Overview

This feature provides:

- 1-to-1 chat between patients and providers
- Real-time messaging with delivery and read receipts
- File sharing capabilities
- Mobile-responsive design
- Automatic user management and authentication

## Architecture

The chat implementation follows a simplified, direct approach:

- **Direct CometChat Integration**: Minimal abstraction layers
- **Automatic User Management**: Users created automatically during login/registration
- **Database Integration**: CometChat users stored in local database with auth tokens
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Components

### Core Components

- `ChatContainer` - Main chat interface with integrated contacts and conversations
- `ChatWrapper` - SSR-safe wrapper for dynamic loading
- `ChatService` - Utility service for user management and display name generation
- `ClientChatService` - Client-side service for CometChat operations

### Pages

- `/chat` - Main chat interface with integrated contacts and conversations

## User Flows

### Patient Flow

1. Patient logs into the platform
2. CometChat account automatically created/verified during login
3. Navigates to `/chat` section from main navigation
4. Views contact list and selects a user to chat with
5. Sends and receives real-time messages

### Provider Flow

1. Provider logs into the platform
2. CometChat account automatically created/verified during login
3. Accesses `/chat` section from navigation
4. Views contact list and initiates conversations
5. Manages ongoing conversations and sends messages

## Features

### 1-1 Chat Setup

- Any user can initiate chats with other users
- Header displays other user's name, avatar, and online/offline status
- Messages show sender's username, avatar, timestamp, and content
- Messages grouped by day with sending indicators and read receipts
- Real-time messaging with delivery and read receipts
- Chat history preservation

### Contact List Access

- All users have access to complete contact list
- Contact list shows users from `cometchat_users` table
- Contact list is searchable and scrollable
- Each contact shows avatar (or initials) and display name

### Mobile Responsiveness

- Responsive layout that adapts to screen size
- Mobile: Single view (contacts OR chat)
- Desktop: Split view (contacts on left, chat on right)
- Touch-friendly interface with proper navigation

## Usage

### Basic Implementation

```tsx
import { ChatContainer } from "@/features/chat";

// Main chat interface with integrated contacts and conversations
<ChatContainer currentUserId="user-123" currentUserName="John Smith" />;
```

### With Wrapper (Recommended)

```tsx
import { ChatWrapper } from "@/features/chat";

// SSR-safe wrapper for dynamic loading
<ChatWrapper currentUserId="user-123" currentUserName="John Smith" />;
```

## Configuration

### Environment Variables

Make sure to set the following environment variables:

- `NEXT_PUBLIC_COMETCHAT_APP_ID`
- `NEXT_PUBLIC_COMETCHAT_REGION`
- `NEXT_PUBLIC_COMETCHAT_AUTH_KEY`

### Database Schema

The feature requires the `cometchat_users` table:

```sql
CREATE TABLE public.cometchat_users (
  id bigint generated always as identity not null,
  user_id uuid not null,
  cometchat_uid text not null,
  cometchat_auth_token text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint cometchat_users_pkey primary key (id),
  constraint cometchat_users_user_id_unique unique (user_id),
  constraint cometchat_users_cometchat_uid_unique unique (cometchat_uid),
  constraint cometchat_users_user_id_users_id_fk foreign KEY (user_id) references auth.users (id) on delete CASCADE
);
```

## User Management

### Automatic User Creation

Users are automatically created in CometChat during login/registration:

1. **Login**: System checks if user exists in `cometchat_users` table
2. **Existing User**: Uses stored auth token for login
3. **New User**: Creates CometChat user and stores auth token
4. **Display Names**: Email converted to proper display name (e.g., "bob.wilson@example.com" → "Bob
   Wilson")

### CometChat UID Generation

Users are created in CometChat using a consistent UID format:

- All users: `user-{databaseUserId}`

### Auth Token Management

- Auth tokens are stored securely in the database
- Existing tokens are reused for efficiency
- New tokens generated only when needed

## Navigation Integration

The chat feature is integrated into the main application navigation:

- **Desktop**: Chat link in main navigation menu
- **Mobile**: Chat link in hamburger menu
- **Accessible**: Available to both providers and patients

## Testing

Visit `/chat` to access the main chat interface:

- Integrated contacts list and conversations
- Real-time messaging
- Mobile-responsive design
- Automatic user creation and authentication

## Current Implementation Status

✅ **Core Features**

- Basic UIKit integration
- 1-to-1 chat functionality
- Contact list integration
- Real-time messaging
- Automatic user management
- Mobile-responsive design
- Navigation integration

✅ **User Management**

- Automatic CometChat user creation
- Auth token management
- Display name generation
- Database integration

✅ **UI/UX**

- Responsive layout
- Mobile navigation
- Touch-friendly interface
- Clean, modern design

🚧 **Future Enhancements**

- EMR integration
- HIPAA-compliant file storage
- Custom notification system
- Enhanced role-based restrictions
- Chat analytics and reporting

## File Structure

```
features/chat/
├── components/
│   ├── ChatContainer.tsx      # Main chat interface
│   └── ChatWrapper.tsx        # SSR-safe wrapper
├── services/
│   ├── chatService.ts         # User management utilities
│   └── clientChatService.ts   # Client-side CometChat operations
├── index.ts                   # Feature exports
└── README.md                  # This documentation
```

## API Routes

- `/api/cometchat/user` - Create/ensure CometChat users
- `/api/cometchat/auth-token` - Generate/retrieve auth tokens

## Dependencies

- `@cometchat/chat-uikit-react` - CometChat UIKit components
- `@cometchat/chat-sdk-javascript` - CometChat SDK
- Next.js 15.2.3
- TypeScript
- Tailwind CSS
