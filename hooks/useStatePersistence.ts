import { useEffect, Dispatch, SetStateAction } from "react";

interface UseStatePersistenceOptions<T> {
  storageKey: string;
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  disabled?: boolean;
}

/**
 * Custom hook to persist state to localStorage
 * Automatically saves state as it changes and restores it on mount
 *
 * @param storageKey - Unique key for localStorage
 * @param state - The state to persist
 * @param setState - State setter function
 * @param disabled - Disable persistence (useful when editing existing data)
 */
export function useStatePersistence<T>({
  storageKey,
  state,
  setState,
  disabled = false,
}: UseStatePersistenceOptions<T>) {
  // Load saved data on mount
  useEffect(() => {
    if (disabled) return;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData) as T;
        setState(parsedData);
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, disabled]); // Only run on mount

  // Save data whenever state changes
  useEffect(() => {
    if (disabled) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
    }
  }, [state, storageKey, disabled]);

  // Clear saved data
  const clearPersistedData = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing persisted state:", error);
    }
  };

  return { clearPersistedData };
}
