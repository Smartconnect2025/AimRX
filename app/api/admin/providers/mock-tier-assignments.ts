/**
 * Temporary persistent store for provider tier assignments
 * Maps provider_id to tier_code
 * Uses file system to persist across server restarts
 * This will be replaced with actual database column once migrations are run
 */

import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), '.mock-tier-assignments.json');

// Load existing assignments from file
function loadAssignments(): Map<string, string> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const obj = JSON.parse(data);
      return new Map(Object.entries(obj));
    }
  } catch (error) {
    console.error('Error loading tier assignments:', error);
  }
  return new Map<string, string>();
}

// Save assignments to file
function saveAssignments(assignments: Map<string, string>) {
  try {
    const obj = Object.fromEntries(assignments);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving tier assignments:', error);
  }
}

export const mockProviderTiers = {
  setTier: (providerId: string, tierCode: string) => {
    const assignments = loadAssignments();
    assignments.set(providerId, tierCode);
    saveAssignments(assignments);
    console.log(`💾 Tier saved to disk: Provider ${providerId} -> ${tierCode}`);
  },

  getTier: (providerId: string): string | undefined => {
    const assignments = loadAssignments();
    return assignments.get(providerId);
  },

  removeTier: (providerId: string) => {
    const assignments = loadAssignments();
    assignments.delete(providerId);
    saveAssignments(assignments);
  },

  getAll: (): Map<string, string> => {
    return loadAssignments();
  },
};
