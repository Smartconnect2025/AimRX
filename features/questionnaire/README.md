# Questionnaire Feature

## Overview

The Questionnaire feature provides a flexible, reusable questionnaire system that can be integrated
across multiple touchpoints in the application. It supports multi-step forms, various question
types, validation, and conditional logic. The feature is built with React Hook Form and follows
project conventions for maintainable, type-safe code.

## Architecture & Structure

- **Feature Isolation:** All questionnaire logic and UI components live in `features/questionnaire/`
- **Thin Pages:** Pages under `app/(features)/questionnaire/` only import and render feature
  components
- **Reusable UI:** Shared UI components (e.g., `QuestionField`, `QuestionnaireSection`) are modular
  and reusable
- **Context & State:** Uses React Context for state management and form context for validation

## Main Components

### Core Components

- **Questionnaire:** Main wrapper component handling form state and context
- **QuestionnaireContent:** Core UI component with navigation and progress tracking
- **QuestionnaireSection:** Section renderer with question grouping
- **QuestionField:** Individual question field with type-specific rendering

### Form Components

- **SingleSelect:** Radio button selection with single choice
- **MultiSelect:** Checkbox selection supporting multiple choices
- **TextInput:** Free-form text input with validation
- **Navigation:** Step navigation with progress tracking
- **ValidationDisplay:** Error message handling and display

### UI Components

- **Progress:** Visual progress indicator for multi-step forms
- **AlertDialog:** Confirmation dialogs for actions like cancellation
- **ErrorMessages:** Contextual error display for validation
- **NavigationButtons:** Back/Next/Cancel navigation controls

## Pages

- `/questionnaire` — Base questionnaire page
- `/test-questionnaire` — Example implementation page

## Features

- **Question Types:**
  - Single-select (radio buttons)
  - Multi-select (checkboxes)
  - Text input fields
- **Form Management:**
  - Multi-step navigation
  - Progress tracking
  - Validation handling
  - Error management
- **User Experience:**
  - Step-by-step progression
  - Clear validation feedback
  - Cancel confirmation
  - Progress persistence
- **Validation:**
  - Per-section validation
  - Required field handling
  - Custom validation rules
  - Error message display

## Data Model & Types

### Core Types

- **QuestionnaireConfig**
  - `id`, `title`, `description`, `sections[]`
- **SectionConfig**
  - `id`, `title`, `enabled`, `required`, `questions[]`
- **Question**
  - `id`, `type`, `question`, `required`, `options[]`

### Storage Options

- **Custom Storage Adapter**
  - `save()`, `load()`, `update()`
- **EMR Integration**
- **Encounter Storage**

## Features

- **Multi-step Forms:** Navigate through sections with progress tracking
- **Validation:** Real-time validation with error display
- **Storage:** Flexible storage options with adapters
- **Navigation:** Intuitive navigation with cancel confirmation
- **Progress:** Visual progress tracking
- **Error Handling:** Clear error messages and validation feedback

## Integration Examples

### 1. Medical Intake Form

```tsx
const config = {
  id: "medical-intake",
  title: "Medical History",
  sections: [
    {
      id: "general",
      title: "General Information",
      questions: [
        // Question configurations
      ],
    },
  ],
};
```

### 2. Pre-appointment Questionnaire

```tsx
const config = {
  id: "pre-appointment",
  title: "Pre-visit Questions",
  sections: [
    {
      id: "symptoms",
      title: "Current Symptoms",
      questions: [
        // Question configurations
      ],
    },
  ],
};
```

## Dependencies

- Next.js 15.2.3 (framework)
- React Hook Form (form management)
- Zod (validation)
- ShadcnUI (UI components)
- Lucide React (icons)
- Tailwind CSS (styling)

## Best Practices

1. **Form Organization:**
   - Group related questions in sections
   - Use clear, concise question text
   - Provide helpful descriptions

2. **Validation:**
   - Validate only current section
   - Clear error states on navigation
   - Show user-friendly error messages

3. **Navigation:**
   - Confirm before cancellation
   - Save progress when appropriate
   - Clear feedback on completion

4. **Integration:**
   - Use appropriate storage adapter
   - Handle completion callbacks
   - Manage state appropriately

---

For implementation details, see the component files in `features/questionnaire/`.
