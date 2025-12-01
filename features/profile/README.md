# Profile Feature

## Overview

The Profile feature provides a comprehensive patient profile management system with personal
information and security management capabilities. Users can update their personal details, contact
information, change passwords, and manage their account settings. The feature is fully integrated
with Supabase for data operations and follows project conventions for maintainable, type-safe code.

## Architecture & Structure

- **Feature Isolation:** All business logic, hooks, and UI for profile management live in
  `features/profile/`.
- **Thin Pages:** Pages under `app/(features)/profile/` only import and render feature components.
- **Reusable UI:** Shared UI components (e.g., `PersonalInformationForm`, `SecurityForm`) are
  modular and reusable.
- **Utils & Hooks:** Shared utilities (e.g., `getInitials`, `convertToUserProfile`) and hooks (e.g.,
  `useProfile`) are reused across components.

## Main Components

### Core Components

- **ProfilePage:** Main dashboard combining personal information, contact details, security, and
  account management
- **PersonalInformationForm:** Interactive form for managing personal details with real-time avatar
  updates
- **ContactInformationForm:** Contact and address information management with validation
- **SecurityForm:** Password management with strength validation and current password verification

### Account Management Components

- **DeleteAccountSection:** Secure account deletion with confirmation dialog
- **Avatar Display:** Real-time initials display with user-friendly fallbacks

### UI Components

- **Form Validation:** Comprehensive validation using React Hook Form + Zod
- **Real-time Updates:** Live synchronization with database changes
- **Error Handling:** Proper error handling and user feedback throughout

## Pages

- `/profile` — Main profile management dashboard

## Features

- **Personal Information:** Update name, date of birth, gender with real-time avatar updates
- **Contact Information:** Manage email, phone, and complete address details
- **Security Management:** Change password with strength validation and current password
  verification
- **Account Deletion:** Secure account deletion with admin privileges and automatic sign-out
- **Real-time Updates:** Immediate UI updates on data changes using Supabase subscriptions
- **Form Validation:** Comprehensive validation with user-friendly error messages
- **Responsive Design:** Mobile and desktop optimized interface

## Data Model & Supabase Integration

### Tables

- **patients**
  - `id`, `user_id`, `first_name`, `last_name`, `date_of_birth`, `phone`, `email`, `data`,
    `is_active`, `created_at`, `updated_at`
- **auth.users** (Supabase Auth)
  - `id`, `email`, `password_hash`, `user_metadata`

### Features

- **Security:** RLS policies restrict access to patient's own data
- **Performance:** Indexed columns for efficient querying
- **Real-time:** Live updates for profile changes and account status
- **Data Integrity:** Automatic patient record creation for new users

## Server-Side Features

- **User Validation:** Automatic user ID lookup and validation
- **Admin Operations:** Secure account deletion using service role
- **Password Management:** Secure password updates with validation
- **Error Handling:** Graceful error handling and user feedback

## Extensibility

- Add new profile fields to the `patients` table
- Extend validation schemas for additional data types
- Add new security features (2FA, session management)
- Integrate with other health management features

## Dependencies

- React Hook Form + Zod (forms/validation)
- date-fns (date formatting)
- Lucide React (icons)
- Tailwind CSS (styling)
- ShadcnUI (UI primitives)
- Sonner (toast notifications)

---

For implementation details, see code comments and the main feature files in `features/profile/`.
