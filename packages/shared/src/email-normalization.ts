export function normalizeEmailAddress(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeMessageId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/^<+|>+$/g, "");
  return trimmed ? `<${trimmed}>` : null;
}
