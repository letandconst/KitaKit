import { getInventoryUnitCost, getMaterialUnitCost } from "./costing";
import { round, slugify } from "./format";
import type {
  CostTotals,
  InventoryItem,
  Product,
  ShoppingListItem,
} from "../types";

type CsvCellValue = string | number | null | undefined;
type CsvRow = CsvCellValue[];

interface ShoppingPlan {
  optionName?: string;
  plannedOutput?: number;
  batchEquivalent?: number;
}

export function exportProductSummary(
  products: Product[],
  totalsById: Record<string, CostTotals>,
): void {
  const rows = [
    [
      "Product",
      "Actual Cost",
      "Suggested Price",
      "Target Margin",
      "Ingredients",
      "Packaging",
      "Labor",
      "Overhead",
      "Wastage",
    ],
    ...products.map((product) => {
      const totals = totalsById[product.id];
      return [
        product.name,
        totals.totalCost,
        totals.recommendedPrice,
        `${product.targetMargin}%`,
        totals.ingredients,
        totals.packaging,
        totals.labor,
        totals.overhead,
        totals.wastageCost,
      ];
    }),
  ];
  downloadCsv("product-cost-summary.csv", rows);
}

export function exportInventory(inventory: InventoryItem[]): void {
  const rows = [
    [
      "Ingredient / Packaging",
      "Purchase Quantity",
      "Purchase Unit",
      "Purchase Price",
      "Unit Cost",
    ],
    ...inventory.map((item) => [
      item.name,
      item.purchaseQty,
      item.purchaseUnit,
      item.purchasePrice,
      getInventoryUnitCost(item),
    ]),
  ];
  downloadCsv("ingredient-inventory.csv", rows);
}

export function exportProductCostSheet(
  product: Product,
  totals: CostTotals,
  inventory: InventoryItem[],
): void {
  const materialRows = [
    ["Ingredients"],
    ["Ingredient", "Quantity", "Unit", "Unit Cost", "Line Cost"],
    ...product.ingredients.map((item) => [
      item.name,
      item.qty,
      item.unit,
      getMaterialUnitCost(item, inventory),
      item.qty * getMaterialUnitCost(item, inventory),
    ]),
    [],
    ["Packaging"],
    ["Item", "Quantity", "Unit", "Unit Cost", "Line Cost"],
    ...product.packaging.map((item) => [
      item.name,
      item.qty,
      item.unit,
      getMaterialUnitCost(item, inventory),
      item.qty * getMaterialUnitCost(item, inventory),
    ]),
    [],
    ["Labor"],
    ["Task", "Hours", "Rate", "Line Cost"],
    ...product.labor.map((item) => [
      item.name,
      item.hours,
      item.rate,
      item.hours * item.rate,
    ]),
    [],
    ["Overhead"],
    ["Cost", "Amount"],
    ...product.overhead.map((item) => [item.name, item.amount]),
    [],
    ["Summary"],
    ["Actual Cost", totals.totalCost],
    [
      `Suggested Price (${product.targetMargin}% margin)`,
      totals.recommendedPrice,
    ],
  ];
  downloadCsv(`${slugify(product.name)}-cost-sheet.csv`, materialRows);
}

export function exportShoppingList(
  product: Product,
  shoppingList: ShoppingListItem[],
  plan: ShoppingPlan = {},
): void {
  const rows = [
    [`Shopping list for ${product.name}`],
    [
      "Quantity to make",
      plan.optionName ?? `${plan.plannedOutput ?? product.batchUnits}`,
    ],
    ["Batch equivalents", plan.batchEquivalent ?? product.batchUnits],
    [],
    [
      "Ingredient / Packaging",
      "Need to Buy",
      "Purchase Unit",
      "Usage Required",
      "Usage Unit",
      "Estimated Cost",
    ],
    ...shoppingList.map((item) => [
      item.name,
      round(item.purchaseQty),
      item.purchaseUnit,
      round(item.usageQty),
      item.usageUnit,
      item.estimatedCost,
    ]),
  ];
  downloadCsv(`${slugify(product.name)}-shopping-list.csv`, rows);
}

function downloadCsv(filename: string, rows: CsvRow[]): void {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: CsvCellValue): string {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
