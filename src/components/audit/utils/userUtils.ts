
export function getUserInitials(userId: string | null): string {
  if (!userId) return "SYS";
  return "U" + userId.substring(0, 2).toUpperCase();
}

export function getUserDisplayName(userId: string | null): string {
  if (!userId) return "System";
  return `User ${userId.substring(0, 8)}`;
}
