import type {
  CostTotals,
  InventoryItem,
  MaterialRow,
  Product,
  ProductionUsageItem,
  SellingOption,
  ShoppingListItem,
  SmartWarning,
} from "../types";
import { round, sum, toNumber } from "./format";

interface UnitFactor {
  group: "mass" | "volume" | "length" | "count";
  factor: number;
}

export function calculateTotals(
  product: Product,
  inventory: InventoryItem[] = [],
  materialMultiplier = 1,
): CostTotals {
  const saleQuantity = getSaleQuantity(product);
  return calculateSellingOption(
    product,
    inventory,
    { quantity: saleQuantity },
    materialMultiplier,
  );
}

export function calculateSellingOption(
  product: Product,
  inventory: InventoryItem[] = [],
  option: Partial<SellingOption> = {},
  materialMultiplier = 1,
): CostTotals {
  const saleQuantity = Math.max(toNumber(option.quantity, 1), 0);
  const outputPerBatch = Math.max(
    toNumber(product.batchYield, product.batchUnits || 1),
    1,
  );
  const ingredientsBatch = sum(
    product.ingredients,
    (item) =>
      item.qty * getMaterialUnitCost(item, inventory) * materialMultiplier,
  );
  const laborBatch = sum(product.labor, (item) => item.hours * item.rate);
  const overheadBatch = sum(product.overhead, (item) => item.amount);
  const ingredients = (ingredientsBatch * saleQuantity) / outputPerBatch;
  const packaging = sum(
    product.packaging,
    (item) =>
      item.qty * getMaterialUnitCost(item, inventory) * materialMultiplier,
  );
  const labor = (laborBatch * saleQuantity) / outputPerBatch;
  const overhead = (overheadBatch * saleQuantity) / outputPerBatch;
  const productionCostBatch = ingredientsBatch + laborBatch + overheadBatch;
  const rawCost = ingredients + packaging + labor + overhead;
  const wastageCost = rawCost * ((product.wastageRate || 0) / 100);
  const totalCost = rawCost + wastageCost;
  const margin = Math.min(Math.max(product.targetMargin || 1, 1), 95) / 100;

  return {
    ingredients,
    ingredientsBatch,
    laborBatch,
    overheadBatch,
    productionCostBatch,
    packaging,
    labor,
    overhead,
    rawCost,
    wastageCost,
    totalCost,
    recommendedPrice: totalCost / (1 - margin),
  };
}

export function getSmartWarnings(
  product: Product,
  totals: CostTotals,
  inventory: InventoryItem[],
): SmartWarning[] {
  const inventoryLinkedItems = [...product.ingredients, ...product.packaging];
  const warnings: SmartWarning[] = [];
  const manualItems = inventoryLinkedItems.filter(
    (item) => !findInventoryItem(item, inventory),
  );
  const conversionIssues = inventoryLinkedItems.filter((item) => {
    const inventoryItem = findInventoryItem(item, inventory);
    return inventoryItem && !canConvert(inventoryItem.purchaseUnit, item.unit);
  });

  if (product.targetMargin < 25) {
    warnings.push({
      level: "caution",
      title: "Low target margin",
      body: "Consider whether this leaves enough room for discounts, fees, and mistakes.",
    });
  }

  if (product.wastageRate >= 15) {
    warnings.push({
      level: "caution",
      title: "High wastage allowance",
      body: `${product.wastageRate}% wastage is a large part of cost. Check spoilage, rejects, or batch sizing.`,
    });
  }

  if (manualItems.length > 0) {
    const manualNames = manualItems
      .map((item) => item.name.trim() || "Unnamed ingredient")
      .join(", ");
    warnings.push({
      level: "info",
      title: "Manual ingredient prices",
      body: `${manualItems.length} item${manualItems.length === 1 ? "" : "s"} not linked to inventory yet: ${manualNames}.`,
    });
  }

  if (conversionIssues.length > 0) {
    warnings.push({
      level: "danger",
      title: "Unit conversion mismatch",
      body: `${conversionIssues.length} item${conversionIssues.length === 1 ? "" : "s"} have inventory units that cannot convert to usage units.`,
    });
  }

  return warnings;
}

export function buildShoppingList(
  product: Product,
  inventory: InventoryItem[],
  batchCount = product.batchUnits,
  saleQuantity = getSaleQuantity(product),
): ShoppingListItem[] {
  const grouped = new Map<string, ShoppingListItem>();
  const outputPerBatch = Math.max(
    toNumber(product.batchYield, product.batchUnits || 1),
    1,
  );

  [
    ...product.ingredients.map((item) => ({ ...item, category: "ingredient" })),
    ...product.packaging.map((item) => ({ ...item, category: "packaging" })),
  ].forEach((item) => {
    const inventoryItem = findInventoryItem(item, inventory);
    const purchaseUnit = inventoryItem?.purchaseUnit || item.unit;
    const usageQty =
      item.category === "packaging"
        ? item.qty * ((outputPerBatch * batchCount) / saleQuantity)
        : item.qty * batchCount;
    const convertedQty = convertQuantity(usageQty, item.unit, purchaseUnit);
    const purchaseQty = Number.isFinite(convertedQty) ? convertedQty : usageQty;
    const key = `${item.name.trim().toLowerCase()}-${purchaseUnit}`;
    const existing = grouped.get(key) || {
      name: item.name,
      purchaseQty: 0,
      purchaseUnit,
      usageQty: 0,
      usageUnit: item.unit,
      estimatedCost: 0,
    };

    existing.purchaseQty += purchaseQty;
    existing.usageQty += usageQty;
    existing.estimatedCost += usageQty * getMaterialUnitCost(item, inventory);
    grouped.set(key, existing);
  });

  return Array.from(grouped.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getSaleQuantity(product: Product): number {
  if (product.saleMode === "bundle")
    return Math.max(toNumber(product.bundleSize, 1), 1);
  if (product.saleMode === "bulk")
    return Math.max(toNumber(product.saleQuantity, 1), 1);
  return 1;
}

export function getSellingOptions(product: Product): SellingOption[] {
  if (Array.isArray(product.sellingOptions) && product.sellingOptions.length) {
    return product.sellingOptions;
  }
  const quantity = getSaleQuantity(product);
  const name =
    product.saleMode === "bundle"
      ? `${quantity} ${product.saleUnit || "unit"} bundle`
      : product.saleMode === "bulk"
        ? `${quantity} ${product.saleUnit || "unit"} bulk`
        : `Single ${product.saleUnit || "unit"}`;
  return [{ id: "legacy-default-option", name, quantity }];
}

export function getProductionUsage(
  product: Product,
  batches = 1,
  saleQuantity = getSaleQuantity(product),
): ProductionUsageItem[] {
  const batchCount = Math.max(toNumber(batches, 1), 0);
  const bundles =
    (Math.max(toNumber(product.batchYield, product.batchUnits || 1), 1) /
      Math.max(toNumber(saleQuantity, 1), 1)) *
    batchCount;
  return [
    ...product.ingredients.map((item) => ({
      ...item,
      usageQty: item.qty * batchCount,
      usageUnit: item.unit,
      category: "ingredient" as const,
    })),
    ...product.packaging.map((item) => ({
      ...item,
      usageQty: item.qty * bundles,
      usageUnit: item.unit,
      category: "packaging" as const,
    })),
  ];
}

export function findInventoryItem(
  row: MaterialRow,
  inventory: InventoryItem[],
): InventoryItem | undefined {
  return inventory.find(
    (item) => item.name.trim().toLowerCase() === row.name.trim().toLowerCase(),
  );
}

export function getMaterialUnitCost(
  row: MaterialRow,
  inventory: InventoryItem[],
): number {
  const inventoryItem = findInventoryItem(row, inventory);
  if (!inventoryItem) return toNumber(row.unitCost);

  const convertedCost = convertUnitCost(
    inventoryItem.purchasePrice,
    inventoryItem.purchaseQty,
    inventoryItem.purchaseUnit,
    row.unit,
  );
  return Number.isFinite(convertedCost)
    ? round(convertedCost)
    : toNumber(row.unitCost);
}

export function getInventoryUnitCost(item: InventoryItem): number {
  const qty = Math.max(toNumber(item.purchaseQty), 0.000001);
  return toNumber(item.purchasePrice) / qty;
}

export function convertUnitCost(
  price: number,
  purchaseQty: number,
  purchaseUnit: string,
  usageUnit: string,
): number {
  const purchaseFactor = unitFactor(purchaseUnit);
  const usageFactor = unitFactor(usageUnit);
  if (
    !purchaseFactor ||
    !usageFactor ||
    purchaseFactor.group !== usageFactor.group
  )
    return NaN;

  const purchaseBaseQty = Math.max(
    toNumber(purchaseQty) * purchaseFactor.factor,
    0.000001,
  );
  const costPerBaseUnit = toNumber(price) / purchaseBaseQty;
  return costPerBaseUnit * usageFactor.factor;
}

export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
): number {
  const fromFactor = unitFactor(fromUnit);
  const toFactor = unitFactor(toUnit);
  if (!fromFactor || !toFactor || fromFactor.group !== toFactor.group)
    return NaN;
  return (toNumber(quantity) * fromFactor.factor) / toFactor.factor;
}

export function canConvert(fromUnit: string, toUnit: string): boolean {
  const fromFactor = unitFactor(fromUnit);
  const toFactor = unitFactor(toUnit);
  return Boolean(fromFactor && toFactor && fromFactor.group === toFactor.group);
}

function unitFactor(unit: string): UnitFactor | undefined {
  const normalized = String(unit || "")
    .trim()
    .toLowerCase();
  const factors: Record<string, UnitFactor> = {
    kg: { group: "mass", factor: 1000 },
    g: { group: "mass", factor: 1 },
    lb: { group: "mass", factor: 453.592 },
    oz: { group: "mass", factor: 28.3495 },
    l: { group: "volume", factor: 1000 },
    liter: { group: "volume", factor: 1000 },
    litre: { group: "volume", factor: 1000 },
    ml: { group: "volume", factor: 1 },
    cup: { group: "volume", factor: 240 },
    tbsp: { group: "volume", factor: 15 },
    tsp: { group: "volume", factor: 5 },
    meter: { group: "length", factor: 100 },
    m: { group: "length", factor: 100 },
    cm: { group: "length", factor: 1 },
    pc: { group: "count", factor: 1 },
    pcs: { group: "count", factor: 1 },
    unit: { group: "count", factor: 1 },
    serving: { group: "count", factor: 1 },
    set: { group: "count", factor: 1 },
    pack: { group: "count", factor: 1 },
    box: { group: "count", factor: 1 },
    bag: { group: "count", factor: 1 },
    bottle: { group: "count", factor: 1 },
    jar: { group: "count", factor: 1 },
    tray: { group: "count", factor: 1 },
    sheet: { group: "count", factor: 1 },
    roll: { group: "count", factor: 1 },
  };
  return factors[normalized];
}
