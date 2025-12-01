import { createServerClient } from "@/core/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AddressHelperResult {
  success: boolean;
  addressId?: string;
  error?: string;
}

/**
 * Helper service to manage addresses for Stripe orders
 */
export class AddressHelperService {
  private supabase: SupabaseClient | null;

  constructor() {
    this.supabase = null;
  }

  /**
   * Initialize server-side client
   */
  private async getServerClient(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await createServerClient();
    }
    return this.supabase;
  }

  /**
   * Get or create a placeholder address for a user
   */
  async getOrCreatePlaceholderAddress(
    userId: string,
  ): Promise<AddressHelperResult> {
    try {
      const client = await this.getServerClient();

      // First, try to find an existing address for the user
      const { data: existingAddresses, error: fetchError } = await client
        .from("user_addresses")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (fetchError) {
        console.error("Error fetching existing addresses:", fetchError);
        return { success: false, error: fetchError.message };
      }

      // If an address exists, return it
      if (existingAddresses && existingAddresses.length > 0) {
        return { success: true, addressId: existingAddresses[0].id };
      }

      // Create a placeholder address
      const { data: newAddress, error: createError } = await client
        .from("user_addresses")
        .insert([
          {
            user_id: userId,
            given_name: "Stripe",
            family_name: "Customer",
            address_line_1: "Address collected via Stripe Checkout",
            city: "Unknown",
            state: "CA",
            postal_code: "00000",
            phone: "000-000-0000",
            is_primary: true,
          },
        ])
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating placeholder address:", createError);
        return { success: false, error: createError.message };
      }

      return { success: true, addressId: newAddress.id };
    } catch (error) {
      console.error("Unexpected error in address helper:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const addressHelperService = new AddressHelperService();
