// Timezone utility functions

export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const formatTimezone = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const timeZoneName =
      parts.find((part) => part.type === "timeZoneName")?.value || "";

    // Format timezone name for better readability
    const readableName =
      timezone.split("/").pop()?.replace(/_/g, " ") || timezone;

    return `${readableName} (${timeZoneName})`;
  } catch {
    return timezone;
  }
};

export const formatTimezoneShort = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    return (
      parts.find((part) => part.type === "timeZoneName")?.value || timezone
    );
  } catch {
    return timezone;
  }
};
