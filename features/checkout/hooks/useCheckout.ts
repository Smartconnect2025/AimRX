"use client";

import { useUser } from "@/core/auth/UserClient";
import { createClient } from "@/core/supabase/client";
import { useCart } from "@/features/cart/hooks/useCart";
import { useSupabaseOrders } from "@/features/orders/hooks/useSupabaseOrders";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AddressFormSchema, paymentFormSchema } from "../constants";
import type { UserPhysicalAddress } from "../types";
import { useUserAddresses } from "../utils";
import type { CartItem } from "@/features/cart/types";

// Helper function to determine order type based on cart items
function determineOrderType(items: CartItem[]): string {
  // Check if any item requires prescription (sync orders)
  const hasPrescriptionRequired = items.some(
    (item) => item.requires_prescription,
  );

  if (hasPrescriptionRequired) {
    // Check for specific categories that require appointments
    const hasWeightLoss = items.some(
      (item) => item.category_name === "WEIGHT LOSS",
    );
    const hasTRT = items.some(
      (item) =>
        item.category_name === "TRT" ||
        item.name.toLowerCase().includes("testosterone"),
    );
    const hasControlledSubstance = items.some(
      (item) =>
        item.category_name === "CONTROLLED SUBSTANCE" ||
        item.name.toLowerCase().includes("controlled"),
    );

    if (hasWeightLoss) return "weight_loss";
    if (hasTRT) return "TRT";
    if (hasControlledSubstance) return "controlled_medication";

    // Default prescription required items
    return "controlled_medication";
  }

  // Check for lab tests
  const hasLabTest = items.some((item) => item.category_name === "LAB TEST");
  if (hasLabTest) return "lab_test";

  // Default to medication (async)
  return "medication";
}

export function useCheckout() {
  const { items, clearCart, getTotalAmount, _hasHydrated } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [orderSuccessful, setOrderSuccessful] = useState(false);
  const { user } = useUser();
  const { addresses, createAddress } = useUserAddresses(user?.id);
  const { createOrder } = useSupabaseOrders();

  // Determine default address
  const defaultAddress: UserPhysicalAddress | undefined =
    addresses.find((a) => a.is_primary) || addresses[0];

  // Initialize forms
  const shippingForm = useForm({
    resolver: zodResolver(AddressFormSchema),
    defaultValues: defaultAddress
      ? {
          firstName: defaultAddress.given_name || "",
          lastName: defaultAddress.family_name || "",
          phone: defaultAddress.phone || "",
          address:
            defaultAddress.address_line_1 +
            (defaultAddress.address_line_2
              ? ", " + defaultAddress.address_line_2
              : ""),
          city: defaultAddress.city,
          state: defaultAddress.state,
          postalCode: defaultAddress.postal_code,
          saveAddress: false,
          isPrimary: false,
        }
      : {
          firstName: "",
          lastName: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          postalCode: "",
          saveAddress: false,
          isPrimary: false,
        },
  });

  const paymentForm = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardholderName: `${
        defaultAddress
          ? `${defaultAddress.given_name} ${defaultAddress.family_name}`
          : ""
      }`,
      cardNumber: "",
      expiryDate: "",
      cvc: "",
    },
  });

  const billingForm = useForm({
    resolver: zodResolver(AddressFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      saveAddress: false,
      isPrimary: false,
    },
  });

  // Selected shipping address state
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<
    string | undefined
  >(defaultAddress?.id);
  const selectedShippingAddress =
    addresses.find((a) => a.id === selectedShippingAddressId) || defaultAddress;

  // Selected billing address state
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<
    string | undefined
  >(undefined);
  const selectedBillingAddress = addresses.find(
    (a) => a.id === selectedBillingAddressId,
  );

  // When addresses change, set the selectedShippingAddressId to the default if not already set
  useEffect(() => {
    if (addresses.length > 0) {
      const primary = addresses.find((a) => a.is_primary) || addresses[0];
      setSelectedShippingAddressId((prev) => prev ?? primary.id);
    }
  }, [addresses]);

  // Update shipping form when selected address changes
  useEffect(() => {
    if (selectedShippingAddress) {
      shippingForm.reset({
        firstName: selectedShippingAddress.given_name || "",
        lastName: selectedShippingAddress.family_name || "",
        phone: selectedShippingAddress.phone || "",
        address:
          selectedShippingAddress.address_line_1 +
          (selectedShippingAddress.address_line_2
            ? ", " + selectedShippingAddress.address_line_2
            : ""),
        city: selectedShippingAddress.city,
        state: selectedShippingAddress.state,
        postalCode: selectedShippingAddress.postal_code,
        saveAddress: false,
        isPrimary: false,
      });
    }
  }, [selectedShippingAddress, shippingForm]);

  // Update billing form when selected billing address changes
  useEffect(() => {
    if (selectedBillingAddress) {
      billingForm.reset({
        firstName: selectedBillingAddress.given_name || "",
        lastName: selectedBillingAddress.family_name || "",
        phone: selectedBillingAddress.phone || "",
        address:
          selectedBillingAddress.address_line_1 +
          (selectedBillingAddress.address_line_2
            ? ", " + selectedBillingAddress.address_line_2
            : ""),
        city: selectedBillingAddress.city,
        state: selectedBillingAddress.state,
        postalCode: selectedBillingAddress.postal_code,
        saveAddress: false,
        isPrimary: false,
      });
    }
  }, [selectedBillingAddress, billingForm]);

  const handlePlaceOrder = async () => {
    // Clear any pending order state from previous orders to prevent
    // async orders from showing sync confirmation UI
    localStorage.removeItem("pendingOrderId");
    localStorage.removeItem("pendingOrderType");

    // Validate all forms
    const shippingValid = await shippingForm.trigger();
    console.log("Shipping Values", shippingForm.getValues());
    const paymentValid = await paymentForm.trigger();
    const billingValid = sameAsShipping || (await billingForm.trigger());

    if (!shippingValid) {
      toast.error("Please complete shipping information");
      return;
    }

    if (!paymentValid) {
      toast.error("Please complete payment information");
      return;
    }

    if (!billingValid) {
      toast.error("Please complete billing information");
      return;
    }

    if (!user?.id) {
      toast.error("Please log in to place an order");
      return;
    }

    setIsLoading(true);

    try {
      // Get form data
      const shippingData = shippingForm.getValues();
      const paymentData = paymentForm.getValues();
      const billingData = sameAsShipping
        ? shippingData
        : billingForm.getValues();

      // Handle shipping address creation/retrieval
      let shippingAddressId: string;
      if (selectedShippingAddressId && !shippingData.saveAddress) {
        // Use existing selected address
        shippingAddressId = selectedShippingAddressId;
      } else {
        // Create or save new shipping address
        const addressToSave: Omit<
          UserPhysicalAddress,
          "id" | "created_at" | "updated_at"
        > = {
          user_id: user.id,
          given_name: shippingData.firstName.trim(),
          family_name: shippingData.lastName.trim(),
          address_line_1: shippingData.address.split(",")[0].trim(),
          address_line_2:
            shippingData.address.split(",").slice(1).join(",").trim() || null,
          city: shippingData.city.trim(),
          state: shippingData.state.trim(),
          postal_code: shippingData.postalCode.trim(),
          phone: shippingData.phone.trim(),
          is_primary: !!shippingData.isPrimary,
        };

        const { error, addressId } = await createAddress(addressToSave);
        if (error) {
          console.error("Failed to save shipping address.", error);
          toast.error("Failed to save shipping address");
          return;
        }

        if (!addressId) {
          toast.error("Failed to create shipping address");
          return;
        }

        shippingAddressId = addressId;
      }

      // Handle billing address if different
      let billingAddressId: string | undefined;
      if (!sameAsShipping) {
        if (selectedBillingAddressId && !billingData.saveAddress) {
          billingAddressId = selectedBillingAddressId;
        } else {
          const billingAddressToSave: Omit<
            UserPhysicalAddress,
            "id" | "created_at" | "updated_at"
          > = {
            user_id: user.id,
            given_name: billingData.firstName.trim(),
            family_name: billingData.lastName.trim(),
            address_line_1: billingData.address.split(",")[0].trim(),
            address_line_2:
              billingData.address.split(",").slice(1).join(",").trim() || null,
            city: billingData.city.trim(),
            state: billingData.state.trim(),
            postal_code: billingData.postalCode.trim(),
            phone: billingData.phone.trim(),
            is_primary: !!billingData.isPrimary,
          };

          const { error, addressId } =
            await createAddress(billingAddressToSave);
          if (error) {
            console.error("Failed to save billing address.", error);
            toast.error("Failed to save billing address");
            return;
          }

          if (!addressId) {
            toast.error("Failed to create billing address");
            return;
          }

          billingAddressId = addressId;
        }
      }

      // Get patient ID for the user
      const supabase = createClient();
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle(); // Use maybeSingle() to handle 0 rows

      if (patientError || !patient) {
        toast.error(
          "Patient profile not found. Please complete your profile first.",
        );
        return;
      }

      // Determine order type based on cart items
      const orderType = determineOrderType(items);

      // Create order data for Supabase
      const orderData = {
        user_id: user.id,
        patient_id: patient.id,
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId,
        order_type: orderType, // Add order type for sync/async determination
        line_items: items.map((item) => ({
          product_id: item.id,
          name: item.name,
          price: item.stripe_prices?.[0]?.amount || 0,
          stripe_price_id: item.stripe_prices?.[0]?.id,
          image_url: item.image_url,
        })),
        payment_details: {
          subscription_type: "monthly" as const,
          cardholderName: paymentData.cardholderName,
          last4: paymentData.cardNumber.slice(-4),
          requested_cancel: false,
        },
      };

      // Create order in Supabase
      const result = await createOrder(orderData);

      if (result.requiresAppointment) {
        // For sync orders, store order info and redirect to appointment scheduling
        toast.success(
          "Order placed! Please schedule an appointment to complete your order.",
        );
        localStorage.setItem("pendingOrderId", result.order.id);
        localStorage.setItem("pendingOrderType", result.orderType);
        // Don't clear cart yet - wait for appointment scheduling
        setOrderSuccessful(true);
      } else {
        // For async orders, complete the order flow
        toast.success("Order placed successfully!");
        setOrderSuccessful(true);
        clearCart();
        localStorage.setItem("lastOrderId", result.order.id);
      }

      // Dispatch custom event to refresh orders
      window.dispatchEvent(new CustomEvent("orders-updated"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const subtotalFormatted = getTotalAmount();
  const subtotal = parseFloat(subtotalFormatted.replace("$", ""));

  return {
    forms: {
      shippingForm,
      paymentForm,
      billingForm,
    },
    state: {
      isLoading: !_hasHydrated || isLoading,
      sameAsShipping,
      orderSuccessful,
      subtotal,
      items,
      addresses,
      selectedShippingAddressId,
      selectedShippingAddress,
      selectedBillingAddressId,
      selectedBillingAddress,
    },
    actions: {
      setSameAsShipping,
      handlePlaceOrder,
      setSelectedShippingAddressId,
      setSelectedBillingAddressId,
    },
  };
}
