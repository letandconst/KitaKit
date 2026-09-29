const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function money(value: number): string {
  return peso.format(Number.isFinite(value) ? value : 0);
}

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function sum<T>(items: T[], iteratee: (item: T) => number): number {
  return items.reduce((total, item) => total + iteratee(item), 0);
}

export function slugify(value: unknown): string {
  return String(value || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
