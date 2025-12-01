"use client";

import { createClient } from "@core/supabase";
import type { UserPhysicalAddress } from "./types";
import { useEffect, useState } from "react";

export const formatCardNumber = (value: string): string => {
  const v = value.replace(/\s/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || "";
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  if (parts.length) {
    return parts.join(" ");
  } else {
    return v;
  }
};

export const formatExpiryDate = (value: string): string => {
  const v = value.replace(/\s/g, "").replace(/[^0-9]/gi, "");
  if (v.length >= 2) {
    return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
  }
  return v;
};

export const formatCVC = (value: string): string => {
  return value.replace(/[^0-9]/gi, "").slice(0, 4);
};

export const formatPhoneNumber = (value: string): string => {
  const phoneNumber = value.replace(/[^\d]/g, "");
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
    3,
    6,
  )}-${phoneNumber.slice(6, 10)}`;
};

export function useUserAddresses(userId: string | undefined) {
  const [addresses, setAddresses] = useState<UserPhysicalAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error);
          setAddresses([]);
        } else {
          setAddresses(data as UserPhysicalAddress[]);
        }
        setIsLoading(false);
      });
  }, [userId]);

  // Save address if not exists and return the address ID
  async function createAddress(
    addressToSave: Omit<
      UserPhysicalAddress,
      "id" | "created_at" | "updated_at"
    >,
  ): Promise<{ error: Error | null; addressId?: string }> {
    // Check for equality with all columns
    const existingAddress = addresses.find(
      (addr) =>
        addr.user_id === addressToSave.user_id &&
        addr.given_name === addressToSave.given_name &&
        addr.family_name === addressToSave.family_name &&
        addr.address_line_1 === addressToSave.address_line_1 &&
        (addr.address_line_2 || "") === (addressToSave.address_line_2 || "") &&
        addr.city === addressToSave.city &&
        addr.state === addressToSave.state &&
        addr.postal_code === addressToSave.postal_code &&
        (addr.phone || "") === (addressToSave.phone || ""),
    );

    if (existingAddress) {
      return { error: null, addressId: existingAddress.id };
    }

    const supabase = createClient();
    if (addressToSave.is_primary) {
      // Start transaction: set all user's addresses to not primary, then insert new primary
      const { error: updateError } = await supabase
        .from("user_addresses")
        .update({ is_primary: false })
        .eq("user_id", addressToSave.user_id)
        .eq("is_primary", true);
      if (updateError) return { error: updateError };
    }

    const { data: newAddress, error: insertError } = await supabase
      .from("user_addresses")
      .insert([addressToSave])
      .select()
      .single();

    if (insertError) return { error: insertError };

    // Update local state with the new address
    setAddresses((prev) => [newAddress as UserPhysicalAddress, ...prev]);

    return { error: null, addressId: newAddress?.id };
  }

  return { addresses, isLoading, error, createAddress };
}
