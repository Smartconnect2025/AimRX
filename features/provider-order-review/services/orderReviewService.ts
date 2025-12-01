/**
 * Provider Order Review Service
 * 
 * Mock data service for order review functionality
 */

import { OrderReviewData } from "../types";

const mockOrders: Record<string, OrderReviewData> = {
  "100064": {
    id: "100064",
    created_at: "2025-05-13T12:08:07.000Z",
    user_id: "user-123",
    user_email: "eli@topflightapps.com",
    shipping_address: {
      first_name: "Isaiah",
      last_name: "Barry", 
      address: "542-545-2143",
      city: "Dignissimos qui susc",
      state: "AZ",
      postal_code: "43241",
      phone_number: "542-545-2143"
    },
    billing_address: null, // Same as shipping
    order_items: [
      {
        id: "orlistat",
        name: "Orlistat",
        price: 39.00,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&crop=center"
      }
    ],
    total_amount: 39.00,
    review_status: "pending",
    questionnaire_data: {
      // General questions
      smoke: "no",
      alcohol: "no", 
      recreationalDrugs: "no",
      heartProblems: ["none"],
      sexLife: "planned",
      erectionFrequency: "occasionally",
      erectionHardness: "hard",
      symptomDuration: "over-year",
      state: "AZ",
      
      // Demographics
      firstName: "Isaiah",
      lastName: "Barry",
      gender: "male",
      dateOfBirth: "1990-05-15",
      weight: 180,
      heightFeet: 6,
      heightInches: 2,
      phone: "542-545-2143",
      
      // Medical history
      medicalDiagnoses: ["None of these"],
      hasSurgeries: "no",
      visionHearingIssues: ["None of these"],
      
      // Current medications
      prescriptionMedications: {
        taking: "no"
      },
      nitrates: "no",
      alphaBlockers: "no",
      supplements: {
        taking: "no"
      },
      conditions: ["None of these"]
    }
  },
  "100063": {
    id: "100063", 
    created_at: "2025-05-12T10:30:00.000Z",
    user_id: "user-456",
    user_email: "rowena@topflightapps.com",
    shipping_address: {
      first_name: "Rowena",
      last_name: "Baylie Acacianna",
      address: "123 Main Street",
      city: "Phoenix", 
      state: "AZ",
      postal_code: "85001",
      phone_number: "602-555-0123"
    },
    billing_address: {
      first_name: "Rowena",
      last_name: "Baylie Acacianna", 
      address: "456 Billing Ave",
      city: "Scottsdale",
      state: "AZ", 
      postal_code: "85002",
      phone_number: "602-555-0456"
    },
    order_items: [
      {
        id: "garcinia-cambogia-extract",
        name: "Garcinia Cambogia Extract",
        price: 29.00,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=300&h=300&fit=crop&crop=center"
      }
    ],
    total_amount: 29.00,
    review_status: "in_review", 
    reviewed_by: "f6aa3634-ee8a-4a50-a546-4607bf8cdb92", // Current provider ID
    questionnaire_data: {
      smoke: "yes",
      alcohol: "yes",
      recreationalDrugs: "no", 
      heartProblems: ["high-blood-pressure"],
      sexLife: "active",
      erectionFrequency: "sometimes",
      erectionHardness: "soft",
      symptomDuration: "6-12-months",
      state: "AZ",
      
      firstName: "Rowena",
      lastName: "Baylie Acacianna",
      gender: "male",
      dateOfBirth: "1985-08-22",
      weight: 175,
      heightFeet: 5,
      heightInches: 10,
      phone: "602-555-0123",
      smoking: {
        does: "yes",
        frequency: "daily"
      },
      alcohol_details: {
        does: "yes", 
        frequency: "weekly"
      },
      
      medicalDiagnoses: ["Diabetes"],
      hasSurgeries: "yes",
      surgeryDetails: "Knee replacement surgery 3 months ago",
      visionHearingIssues: ["None of these"],
      
      prescriptionMedications: {
        taking: "yes",
        list: "Metformin 500mg, Lisinopril 10mg"
      },
      nitrates: "no",
      alphaBlockers: "yes",
      supplements: {
        taking: "yes",
        list: "Vitamin D, Fish Oil"
      },
      conditions: ["Abnormal blood pressure, diabetes, or high cholesterol"]
    }
  },
  "100061": {
    id: "100061",
    created_at: "2025-05-10T14:22:00.000Z", 
    user_id: "user-789",
    user_email: "test@example.com",
    shipping_address: {
      first_name: "John",
      last_name: "Smith",
      address: "789 Test Street",
      city: "Tucson",
      state: "AZ", 
      postal_code: "85701",
      phone_number: "520-555-0789"
    },
    billing_address: null,
    order_items: [
      {
        id: "omega-3-fish-oil", 
        name: "Omega-3 Fish Oil",
        price: 28.00,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1550572017-6b121a68e41d?w=300&h=300&fit=crop&crop=center"
      }
    ],
    total_amount: 28.00,
    review_status: "completed",
    reviewed_by: "other-provider-id",
    reviewed_at: "2025-05-11T09:15:00.000Z",
    questionnaire_data: {
      smoke: "no",
      alcohol: "yes",
      recreationalDrugs: "no",
      heartProblems: ["none"],
      sexLife: "somewhat-active", 
      erectionFrequency: "often",
      erectionHardness: "very-soft",
      symptomDuration: "3-6-months",
      state: "AZ",
      
      firstName: "John",
      lastName: "Smith",
      gender: "male",
      dateOfBirth: "1978-12-03",
      weight: 195,
      heightFeet: 5,
      heightInches: 8,
      phone: "520-555-0789",
      
      medicalDiagnoses: ["Gastric/Stomach issues"],
      hasSurgeries: "no", 
      visionHearingIssues: ["None of these"],
      
      prescriptionMedications: {
        taking: "yes",
        list: "Omeprazole 20mg"
      },
      nitrates: "no",
      alphaBlockers: "no",
      supplements: {
        taking: "no"
      },
      conditions: ["Gastrointestinal, stomach or liver disorders"]
    }
  }
};

/**
 * Get order by ID
 */
export async function getOrderById(id: string): Promise<OrderReviewData | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockOrders[id] || null;
}

/**
 * Start order review
 */
export async function startOrderReview(orderId: string, providerId: string): Promise<{ success: boolean; error?: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const order = mockOrders[orderId];
  if (!order) {
    return { success: false, error: "Order not found" };
  }
  
  if (order.review_status === "in_review") {
    return { success: false, error: "Order is already being reviewed" };
  }
  
  if (order.review_status === "completed") {
    return { success: false, error: "Order has already been completed" };
  }
  
  // Update order status
  order.review_status = "in_review";
  order.reviewed_by = providerId;
  
  return { success: true };
}

/**
 * Release order review
 */
export async function releaseOrderReview(orderId: string, providerId: string): Promise<{ success: boolean; error?: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const order = mockOrders[orderId];
  if (!order) {
    return { success: false, error: "Order not found" };
  }
  
  if (order.review_status !== "in_review") {
    return { success: false, error: "Order is not currently being reviewed" };
  }
  
  if (order.reviewed_by !== providerId) {
    return { success: false, error: "You are not the provider reviewing this order" };
  }
  
  // Release the order
  order.review_status = "pending";
  order.reviewed_by = undefined;
  
  return { success: true };
}

/**
 * Complete order review 
 */
export async function completeOrderReview(orderId: string, providerId: string): Promise<{ success: boolean; error?: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const order = mockOrders[orderId];
  if (!order) {
    return { success: false, error: "Order not found" };
  }
  
  if (order.review_status !== "in_review") {
    return { success: false, error: "Order is not currently being reviewed" };
  }
  
  if (order.reviewed_by !== providerId) {
    return { success: false, error: "You are not the provider reviewing this order" };
  }
  
  // Complete the review
  order.review_status = "completed";
  order.reviewed_at = new Date().toISOString();
  
  return { success: true };
} 