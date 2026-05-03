export function sanitizeInternalReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/r/")) return null;
  return value;
}

export function buildSourcePath(pathname: string, search: string, inheritedFrom?: string | null): string {
  const safeInheritedFrom = sanitizeInternalReturnPath(inheritedFrom);

  if (pathname.startsWith("/r/") && safeInheritedFrom) {
    return safeInheritedFrom;
  }

  return search ? `${pathname}?${search}` : pathname;
}

export function getReturnDestinationLabel(path: string | null): string {
  switch (path) {
    case "/trending":
      return "Trending";
    case "/high-signal":
      return "High Signal";
    case "/":
    case null:
      return "CurrentScout";
    default:
      return "CurrentScout";
  }
}

export function getReturnCtaLabel(path: string | null): string {
  const destination = getReturnDestinationLabel(path);
  return destination === "CurrentScout" ? "Back to CurrentScout" : `Back to ${destination}`;
}

export function getCompactReturnLabel(path: string | null): string {
  switch (path) {
    case "/trending":
      return "Trending";
    case "/high-signal":
      return "Signal";
    default:
      return "Feed";
  }
}
