export const formatProgress = (p: string) => p.replace(/_/g, " ");

// only the progress field uses snake_case values; leave title/content untouched
export const formatChange = (field: string, value: string | null) =>
  value === null ? "—" : field === "progress" ? formatProgress(value) : value;
