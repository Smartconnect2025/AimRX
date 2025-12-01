export const SEVERITY_COLORS = {
  mild: {
    bg: "bg-green-500/10",
    text: "text-green-700",
    value: "text-green-700",
  },
  moderate: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-700",
    value: "text-yellow-700",
  },
  severe: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    value: "text-destructive",
  },
};

export const getSeverityColor = (severity: number) => {
  if (severity <= 3) return SEVERITY_COLORS.mild;
  if (severity <= 6) return SEVERITY_COLORS.moderate;
  return SEVERITY_COLORS.severe;
};
