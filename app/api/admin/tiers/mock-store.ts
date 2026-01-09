/**
 * Temporary in-memory store for tiers
 * This will be replaced with actual database once migrations are run
 */

interface Tier {
  id: string;
  tier_name: string;
  tier_code: string;
  discount_percentage: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// In-memory storage for tiers (resets on server restart)
const mockTiers: Tier[] = [
  {
    id: "tier-1-id",
    tier_name: "Tier 1",
    tier_code: "tier1",
    discount_percentage: "10.00",
    description: "Basic tier with 10% discount",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tier-2-id",
    tier_name: "Tier 2",
    tier_code: "tier2",
    discount_percentage: "15.00",
    description: "Standard tier with 15% discount",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tier-3-id",
    tier_name: "Tier 3",
    tier_code: "tier3",
    discount_percentage: "20.00",
    description: "Premium tier with 20% discount",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockTierStore = {
  getAll: (): Tier[] => {
    return mockTiers;
  },

  getById: (id: string): Tier | undefined => {
    return mockTiers.find((tier) => tier.id === id);
  },

  getTierByCode: (tierCode: string): Tier | undefined => {
    return mockTiers.find((tier) => tier.tier_code === tierCode);
  },

  create: (data: {
    tier_name: string;
    tier_code: string;
    discount_percentage: number;
    description?: string;
  }): Tier => {
    // Check for duplicates
    const existing = mockTiers.find(
      (t) =>
        t.tier_name.toLowerCase() === data.tier_name.toLowerCase() ||
        t.tier_code.toLowerCase() === data.tier_code.toLowerCase()
    );

    if (existing) {
      throw new Error("A tier with this name or code already exists");
    }

    const newTier: Tier = {
      id: `tier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tier_name: data.tier_name,
      tier_code: data.tier_code,
      discount_percentage: data.discount_percentage.toFixed(2),
      description: data.description || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockTiers.push(newTier);
    return newTier;
  },

  update: (
    id: string,
    data: {
      tier_name?: string;
      tier_code?: string;
      discount_percentage?: number;
      description?: string;
    }
  ): Tier => {
    const index = mockTiers.findIndex((tier) => tier.id === id);

    if (index === -1) {
      throw new Error("Tier not found");
    }

    // Check for duplicate names/codes (excluding current tier)
    if (data.tier_name || data.tier_code) {
      const duplicate = mockTiers.find(
        (t, i) =>
          i !== index &&
          ((data.tier_name &&
            t.tier_name.toLowerCase() === data.tier_name.toLowerCase()) ||
            (data.tier_code &&
              t.tier_code.toLowerCase() === data.tier_code.toLowerCase()))
      );

      if (duplicate) {
        throw new Error("A tier with this name or code already exists");
      }
    }

    const updatedTier: Tier = {
      ...mockTiers[index],
      tier_name: data.tier_name || mockTiers[index].tier_name,
      tier_code: data.tier_code || mockTiers[index].tier_code,
      discount_percentage:
        data.discount_percentage !== undefined
          ? data.discount_percentage.toFixed(2)
          : mockTiers[index].discount_percentage,
      description:
        data.description !== undefined
          ? data.description
          : mockTiers[index].description,
      updated_at: new Date().toISOString(),
    };

    mockTiers[index] = updatedTier;
    return updatedTier;
  },

  delete: (id: string): boolean => {
    const index = mockTiers.findIndex((tier) => tier.id === id);

    if (index === -1) {
      throw new Error("Tier not found");
    }

    mockTiers.splice(index, 1);
    return true;
  },
};
