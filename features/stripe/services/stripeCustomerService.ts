import { createClient } from "@/core/supabase/client";
import { createServerClient } from "@/core/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface StripeCustomerRecord {
  id: number;
  user_id: string;
  stripe_customer_id: string;
  stripe_metadata: Record<string, string | number | boolean> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStripeCustomerData {
  user_id: string;
  stripe_customer_id: string;
  stripe_metadata?: Record<string, string | number | boolean>;
}

export interface StripeCustomerDbResult<T = StripeCustomerRecord> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Database service for managing Stripe customers
 */
export class StripeCustomerDbService {
  private supabase: SupabaseClient | null;
  private isServerSide: boolean;

  constructor(isServerSide = false) {
    this.isServerSide = isServerSide;
    if (isServerSide) {
      // Will be initialized in server-side methods
      this.supabase = null;
    } else {
      this.supabase = createClient();
    }
  }

  /**
   * Initialize server-side client (for use in API routes)
   */
  private async getServerClient(): Promise<SupabaseClient> {
    if (this.isServerSide && !this.supabase) {
      this.supabase = await createServerClient();
    }
    return this.supabase!;
  }

  /**
   * Store a new Stripe customer in the database
   */
  async storeStripeCustomer(
    data: CreateStripeCustomerData,
  ): Promise<StripeCustomerDbResult> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data: result, error } = await client
        .from("stripe_customers")
        .insert([
          {
            user_id: data.user_id,
            stripe_customer_id: data.stripe_customer_id,
            stripe_metadata: data.stripe_metadata || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error storing Stripe customer:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Unexpected error storing Stripe customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get Stripe customer by user ID
   */
  async getStripeCustomerByUserId(
    userId: string,
  ): Promise<StripeCustomerDbResult> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data, error } = await client
        .from("stripe_customers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          return { success: false, error: "Customer not found" };
        }
        console.error("Error fetching Stripe customer:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Unexpected error fetching Stripe customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get Stripe customer by Stripe customer ID
   */
  async getStripeCustomerByStripeId(
    stripeCustomerId: string,
  ): Promise<StripeCustomerDbResult> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data, error } = await client
        .from("stripe_customers")
        .select("*")
        .eq("stripe_customer_id", stripeCustomerId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          return { success: false, error: "Customer not found" };
        }
        console.error("Error fetching Stripe customer:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Unexpected error fetching Stripe customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update Stripe customer metadata
   */
  async updateStripeCustomerMetadata(
    userId: string,
    metadata: Record<string, string | number | boolean>,
  ): Promise<StripeCustomerDbResult> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data, error } = await client
        .from("stripe_customers")
        .update({
          stripe_metadata: metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating Stripe customer metadata:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error(
        "Unexpected error updating Stripe customer metadata:",
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instances for client and server use
export const stripeCustomerDbService = new StripeCustomerDbService(false);
export const stripeCustomerDbServiceServer = new StripeCustomerDbService(true);
