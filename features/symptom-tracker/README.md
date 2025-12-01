# Symptoms Feature

## Overview

The Symptoms feature provides a comprehensive symptom tracking and monitoring system for patients.
Users can log, track, analyze, and export their symptom data with severity tracking, trend analysis,
and customizable reminders. The feature is fully integrated with Supabase for data operations and
follows project conventions for maintainable, type-safe code.

## Architecture & Structure

- **Feature Isolation:** All business logic, hooks, and UI for symptoms live in
  `features/sympton-tracker/`.
- **Thin Pages:** Pages under `app/(features)/symptoms/` only import and render feature components.
- **Reusable UI:** Shared UI components (e.g., `SeveritySlider`, `SymptomSearch`) are modular and
  reusable.
- **Utils & Hooks:** Shared utilities (e.g., `getSeverityColor`) and hooks (e.g., `usePatient`) are
  reused across components.

## Main Components

### Core Components

- **SymptomTracker:** Main dashboard combining search, logging, trends, and history
- **SymptomLoggingPanel:** Interactive symptom logging interface with severity slider
- **SymptomHistory:** Complete history view with filtering, export, and pagination
- **RecentSymptoms:** Recent symptoms display with edit/delete capabilities

### Analysis Components

- **SymptomTrends:** Trend analysis with interactive charts
- **SymptomTrendsChart:** Line chart visualization for severity over time
- **SymptomBadgeList:** Interactive symptom filtering badges
- **TimeRangeSelector:** Time period selection for analysis

### UI Components

- **SeveritySlider:** Visual 1-10 severity rating with color indicators
- **SymptomSearch:** Searchable symptom selection with custom entry
- **EditSymptomForm:** Form for modifying logged symptoms
- **ReminderSettings:** Reminder frequency and time configuration

## Pages

- `/symptom-tracker` — Main symptom tracking dashboard
- `/symptom-tracker/history` — Complete symptom history and analysis

## Features

- **Symptom Logging:** Log symptoms with severity (1-10) and notes
- **Search & Custom:** Find predefined symptoms or add custom ones
- **Trend Analysis:** Visual charts showing patterns over time
- **History & Export:** Complete history with PDF export and pagination
- **Reminders:** Configurable symptom logging reminders
- **Real-time Updates:** Immediate UI updates on data changes
- **Responsive Design:** Mobile and desktop optimized

## Data Model & Supabase Integration

### Tables

- **symptoms**
  - `id`, `patient_id`, `symptom_id`, `severity`, `description`, `created_at`
- **symptom_list**
  - `id`, `name`, `emoji`, `is_common`
- **reminders**
  - `id`, `patient_id`, `frequency`, `time_of_day`, `enabled`

### Features

- **Security:** RLS policies restrict access to patient's own data
- **Performance:** Indexed columns for efficient querying
- **Real-time:** Live updates for symptom logs and reminders

## Server-Side Features

- **Patient Validation:** Automatic patient ID lookup and validation
- **Data Aggregation:** Efficient trend data processing
- **PDF Generation:** Server-side PDF report generation
- **Error Handling:** Graceful error handling and feedback

## Extensibility

- Add new symptom types to `symptom_list`
- Extend severity tracking with new metrics
- Add new analysis and visualization types
- Integrate with other health tracking features

## Dependencies

- React Hook Form + Zod (forms/validation)
- jsPDF (PDF export)
- Recharts (trend visualization)
- Lucide React (icons)
- Tailwind CSS (styling)
- ShadcnUI (UI primitives)

---

For implementation details, see code comments and the main feature files in
`features/sympton-tracker/`.
