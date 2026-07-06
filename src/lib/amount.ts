export function parseTokenAmount(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Amount must be a positive decimal string");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimals`);
  }

  const paddedFraction = fraction.padEnd(decimals, "0");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction || "0");
}

export function formatTokenAmount(value: bigint, decimals: number, maxFractionDigits = 6): string {
  if (value === 0n) return "0";

  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const padded = fraction.toString().padStart(decimals, "0");
  const visibleFraction = padded.slice(0, maxFractionDigits);
  const hasVisibleValue = BigInt(visibleFraction || "0") > 0n;

  if (whole === 0n && !hasVisibleValue) {
    return `<0.${"0".repeat(Math.max(0, maxFractionDigits - 1))}1`;
  }

  const trimmedFraction = visibleFraction.replace(/0+$/, "");
  return trimmedFraction ? `${whole.toString()}.${trimmedFraction}` : whole.toString();
}

export function isPositiveAmount(value: string): boolean {
  try {
    return parseTokenAmount(value, 18) > 0n;
  } catch {
    return false;
  }
}
