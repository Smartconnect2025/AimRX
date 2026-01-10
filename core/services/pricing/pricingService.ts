/**
 * Pricing Calculation Service
 *
 * Centralized pricing logic for prescription medications.
 * All pricing calculations should go through this service to ensure consistency
 * and prevent client-side manipulation.
 */

export interface PricingCalculation {
  pharmacyCost: number;
  markupPercent: number;
  markupAmount: number;
  patientPrice: number;
  platformFee?: number;
}

export interface TierDiscount {
  tierCode: string;
  discountPercent: number;
}

/**
 * Calculate final patient price from pharmacy cost and provider markup
 *
 * @param acquisitionCost - The pharmacy's cost/wholesale price
 * @param providerMarkupPercent - Provider's markup percentage (default 25%)
 * @param platformFee - Optional platform fee in dollars (default 0)
 * @returns Detailed pricing calculation
 */
export function calculateFinalPrice(
  acquisitionCost: number,
  providerMarkupPercent: number = 25,
  platformFee: number = 0
): PricingCalculation {
  // Validate inputs
  if (acquisitionCost < 0) {
    throw new Error("Acquisition cost cannot be negative");
  }
  if (providerMarkupPercent < 0) {
    throw new Error("Markup percentage cannot be negative");
  }
  if (platformFee < 0) {
    throw new Error("Platform fee cannot be negative");
  }

  // Calculate markup amount
  const markupAmount = acquisitionCost * (providerMarkupPercent / 100);

  // Calculate patient price: cost + markup + platform fee
  const patientPrice = acquisitionCost + markupAmount + platformFee;

  return {
    pharmacyCost: Number(acquisitionCost.toFixed(2)),
    markupPercent: providerMarkupPercent,
    markupAmount: Number(markupAmount.toFixed(2)),
    patientPrice: Number(patientPrice.toFixed(2)),
    platformFee: platformFee > 0 ? Number(platformFee.toFixed(2)) : undefined,
  };
}

/**
 * Calculate provider-specific price with tier discount
 *
 * @param acquisitionCost - The pharmacy's cost/wholesale price
 * @param providerMarkupPercent - Provider's markup percentage
 * @param tierDiscount - Provider's tier discount (optional)
 * @returns Pricing with tier discount applied
 */
export function calculatePriceWithTierDiscount(
  acquisitionCost: number,
  providerMarkupPercent: number,
  tierDiscount?: TierDiscount
): PricingCalculation {
  // Calculate base pricing
  const basePricing = calculateFinalPrice(acquisitionCost, providerMarkupPercent);

  // If no tier discount, return base pricing
  if (!tierDiscount || tierDiscount.discountPercent === 0) {
    return basePricing;
  }

  // Apply tier discount to patient price
  const discountAmount = basePricing.patientPrice * (tierDiscount.discountPercent / 100);
  const discountedPrice = basePricing.patientPrice - discountAmount;

  return {
    ...basePricing,
    patientPrice: Number(discountedPrice.toFixed(2)),
  };
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format price as currency string
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate provider profit from a prescription
 *
 * @param patientPrice - What patient pays
 * @param acquisitionCost - What pharmacy charges provider
 * @returns Provider's profit in dollars
 */
export function calculateProviderProfit(
  patientPrice: number,
  acquisitionCost: number
): number {
  const profit = patientPrice - acquisitionCost;
  return Number(profit.toFixed(2));
}
