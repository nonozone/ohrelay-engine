export function sniffVerificationCode(input: string): string | null {
  const match = input.match(/\b\d{6,9}\b/);
  return match?.[0] ?? null;
}
