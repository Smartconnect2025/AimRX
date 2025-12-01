# CometChat Video Call Feature

✅ **PRODUCTION READY** - This feature is fully integrated with the appointment and authentication
systems.

This feature provides secure video calling functionality for patients and providers using CometChat
SDK with auth token-based authentication.

## Features

- **Secure Authentication**: Uses CometChat auth tokens (not hardcoded UIDs)
- **Appointment Integration**: Fetches real appointment and user data from the database
- **Role-Based Access**: Automatically determines provider vs patient interface
- **Real-Time Communication**: Supports video/audio calls with CometChat SDK
- **Authorization**: Verifies users can only access their own appointments

## Components

- **PatientVideoCall**: Patient interface with waiting room that auto-answers incoming calls
- **ProviderVideoCall**: Provider interface with a "Start meeting" button to initiate calls

Both components now accept props:

- `appointmentId`: The appointment database ID
- `currentUserId`: The authenticated user's database ID
- `currentUserName`: The user's display name

## Routes

### Appointment-Based (Primary)

- `/appointment/[id]` - Automatically routes to correct interface based on user role

### Direct Access (Requires appointmentId Query Parameter)

- `/video-call/patient?appointmentId=[id]` - Patient video call interface
- `/video-call/provider?appointmentId=[id]` - Provider video call interface

## Implementation Details

### Authentication Flow

1. User navigates to appointment page
2. System fetches appointment details via `/api/appointments/[id]`
3. API verifies user authorization (provider or patient for that appointment)
4. Component fetches CometChat auth token via `ClientChatService.ensureUser()`
5. User logs into CometChat using `loginWithAuthToken()` (secure)
6. Video call interface displays with real appointment data

### Data Flow

1. **Appointment API** (`/api/appointments/[id]/route.ts`): Fetches appointment with provider and
   patient details
2. **Video Call Components**: Initialize CometChat and fetch user auth tokens
3. **CometChat**: Handles real-time video/audio communication

### Security

- ✅ Uses auth tokens instead of hardcoded UIDs
- ✅ Verifies user authorization for appointment access
- ✅ Requires authenticated session
- ✅ Validates appointment ownership

## Usage Example

```typescript
// In appointment booking or calendar, link to:
<a href={`/appointment/${appointmentId}`}>Join Video Call</a>

// Or role-specific links:
<a href={`/video-call/provider?appointmentId=${appointmentId}`}>
  Start Provider Session
</a>
```
