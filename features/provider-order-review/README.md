# Provider Order Review Feature

This feature provides comprehensive order review functionality for healthcare providers, allowing them to review patient questionnaire responses and manage prescription workflows.

## Overview

The Provider Order Review feature enables providers to:
- Review detailed patient questionnaire responses
- Manage order review workflows (start, release, complete)
- View order details including shipping, billing, and items
- Ensure state-based authorization for order access

## Components

### Main Components

- **ProviderOrderReviewPage**: Main page component that orchestrates the entire review process
- **OrderReviewHeader**: Header with breadcrumbs and order information
- **OrderReviewControls**: Review workflow controls (start/release review buttons)
- **QuestionnaireDisplay**: Accordion-based questionnaire response display
- **OrderDetailsCard**: Order shipping, billing, and item information

### UI Components

- **QuestionItem**: Individual question-answer display component

## Features

### Questionnaire Display
- **General Questions**: Smoking, alcohol, drug use, heart problems, ED symptoms
- **Demographics**: Personal information, height, weight, contact details
- **Medical History**: Diagnoses, surgeries, vision/hearing issues
- **Current Medications**: Prescriptions, supplements, conditions
- **Semaglutide Questionnaire**: Treatment-specific questions (when applicable)

### Review Workflow
1. **Pending**: Order available for review
2. **Start Review**: Provider claims the order for review
3. **In Review**: Active review state with prescription management
4. **Release**: Provider can release the order back to pending
5. **Complete**: Finalize the review process

### Authorization
- Provider authentication required
- State-based authorization (Arizona only in current implementation)
- Order locking mechanism to prevent concurrent reviews

## Data Structure

### OrderReviewData
```typescript
interface OrderReviewData {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  shipping_address: AddressData;
  billing_address?: AddressData | null;
  order_items: OrderItem[];
  questionnaire_data?: QuestionnaireData;
  review_status: "pending" | "in_review" | "completed";
  reviewed_by?: string;
  total_amount: number;
  reviewed_at?: string;
}
```

### QuestionnaireData
Comprehensive questionnaire response structure supporting:
- Basic health questions (smoking, alcohol, drugs)
- Extended ED questionnaire
- Demographics and personal information
- Medical history and current medications
- Semaglutide-specific questions

## Usage

### Basic Implementation
```typescript
import { ProviderOrderReviewPage } from "@/features/provider-order-review";

// In your page component
<ProviderOrderReviewPage orderId="100064" />
```

### Hook Usage
```typescript
import { useOrderReview } from "@/features/provider-order-review";

const {
  order,
  state,
  fetchOrder,
  handleStartReview,
  handleReleaseReview,
  isBeingReviewedByCurrentProvider,
} = useOrderReview(orderId, providerId);
```

## Routing

The feature is designed to work with dynamic routes:
- `/provider/orders/[id]` - Individual order review page
- Links back to `/provider/orders` - Order management dashboard

## Mock Data

The feature includes comprehensive mock data service with:
- Multiple order examples with varying questionnaire responses
- Different review states (pending, in_review, completed)
- Realistic patient information and medical responses

## Styling

- Uses Tailwind CSS for styling
- Consistent with existing provider dashboard design
- Responsive design for mobile and desktop
- Shadcn UI components for consistent UI patterns

## Future Extensions

- Real backend API integration
- Additional questionnaire types
- Prescription management integration
- Review history and audit trails
- Provider notes and annotations
- Automated review assistance 