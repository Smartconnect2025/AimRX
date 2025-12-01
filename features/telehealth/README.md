# Telehealth Platform

This unified telehealth feature combines appointment management and video calling functionality into
a cohesive platform.

## Components

### Session Management

- **SessionCard**: Displays individual appointment/session information with action buttons
- **SessionsList**: Lists multiple sessions with join/cancel capabilities

### Video Calling

- **PatientVideoCall**: Patient interface with waiting room that auto-answers incoming calls
- **ProviderVideoCall**: Provider interface with "Start meeting" button to initiate calls
- **CameraPreview**: Camera preview component for pre-call setup

## Types

### Session Types

- `Session`: Core session/appointment data structure
- `SessionStatus`: Status enumeration (upcoming, active, completed, cancelled)
- `SessionProvider`: Provider information structure

### Video Call Types

- `VideoCallProvider`: Provider data for video calls
- `VideoCallSession`: Video call session metadata
- `CallStatus`: Call state enumeration (waiting, connected, ended)
- `CallType`: Call participant type (patient, provider)

## Usage

### Session Management

```tsx
import { SessionsList, SessionCard } from "@/features/telehealth";

// Display list of sessions
<SessionsList
  sessions={sessions}
  onJoinSession={handleJoinSession}
  onSessionClick={handleCancelSession}
/>

// Display individual session
<SessionCard
  session={session}
  onJoin={handleJoin}
  onCancel={handleCancel}
/>
```

### Video Calling

```tsx
import { PatientVideoCall, ProviderVideoCall } from "@/features/telehealth";

// Patient view - auto-answers calls
<PatientVideoCall />

// Provider view - can initiate calls
<ProviderVideoCall />
```

## Routes

- `/video-call/patient` - Patient video call interface
- `/video-call/provider` - Provider video call interface
- `/appointment/[id]` - Dynamic appointment page (role-based video interface)

## Integration Points

The SessionCard's "Join Call" button launches the appropriate video call interface based on user
role, creating a seamless flow from appointment management to video calling.

## Dependencies

- **CometChat SDK**: Powers the video calling functionality
- **Supabase**: Backend for appointment/session data
- **Shadcn/UI**: UI component library
- **Lucide React**: Icon library
- **Date-fns**: Date formatting utilities

## Configuration

Requires environment variables for CometChat:

- `NEXT_PUBLIC_COMETCHAT_APP_ID`
- `NEXT_PUBLIC_COMETCHAT_REGION`
- `NEXT_PUBLIC_COMETCHAT_AUTH_KEY`
