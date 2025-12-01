export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface PaymentDetails {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

export interface CheckoutFormData {
  shipping: ShippingAddress;
  payment: PaymentDetails;
  billing?: ShippingAddress;
  sameAsShipping: boolean;
}

export interface OrderSummaryItem {
  id: string;
  name: string;
  price: number;
  subscription_price: number;
  image_url?: string;
}

export interface MockOrderResult {
  success: boolean;
  orderId?: number;
  error?: string;
}

// Import database schema types
import type {
  UserAddress as DBUserAddress,
  InsertUserAddress,
  UpdateUserAddress,
} from "@/core/database/schema";

// Frontend UserAddress interface extending database schema with proper date handling
export interface UserPhysicalAddress
  extends Omit<DBUserAddress, "created_at" | "updated_at"> {
  created_at: string; // Keep as string for API compatibility
  updated_at: string; // Keep as string for API compatibility
}

// Database operation types
export type CreateUserAddressData = InsertUserAddress;
export type UpdateUserAddressData = UpdateUserAddress;
