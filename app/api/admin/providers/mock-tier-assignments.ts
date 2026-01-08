/**
 * Temporary in-memory store for provider tier assignments
 * Maps provider_id to tier_code
 * This will be replaced with actual database column once migrations are run
 */

const providerTierAssignments = new Map<string, string>();

export const mockProviderTiers = {
  setTier: (providerId: string, tierCode: string) => {
    providerTierAssignments.set(providerId, tierCode);
  },

  getTier: (providerId: string): string | undefined => {
    return providerTierAssignments.get(providerId);
  },

  removeTier: (providerId: string) => {
    providerTierAssignments.delete(providerId);
  },

  getAll: (): Map<string, string> => {
    return providerTierAssignments;
  },
};
