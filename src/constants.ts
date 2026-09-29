export const DB_NAME = "kitaKit-db";
export const DB_VERSION = 1;
export const DB_STORE = "app-data";
export const PRODUCTS_KEY = "products";
export const INVENTORY_KEY = "inventory";
export const LEGACY_PRODUCTS_KEY = "truecost-react-products";
export const LEGACY_INVENTORY_KEY = "truecost-react-inventory";

export const starterProducts: Product[] = [];

export const starterInventory: InventoryItem[] = [];

export const stepLabels: Record<CostStep, string> = {
  ingredients: "Ingredients",
  packaging: "Packaging",
  labor: "Labor",
  overhead: "Overhead",
  wastage: "Wastage",
  pricing: "Pricing",
};

export const stepHelp: Record<CostStep, string> = {
  ingredients: "Ingredients consumed by one production batch.",
  packaging: "Boxes, labels, wrappers, inserts, and other per-unit packaging.",
  labor: "Your time or staff time needed to make one unit.",
  overhead:
    "Utilities, delivery allowance, rent allocation, and other hidden costs.",
  wastage:
    "Spoilage, rejects, shrinkage, and mistakes added back into the cost.",
  pricing: "A plain-language answer based on the real cost and target margin.",
};

export const unitOptions: string[] = [
  "pc",
  "pcs",
  "unit",
  "serving",
  "set",
  "pack",
  "box",
  "bag",
  "bottle",
  "jar",
  "tray",
  "kg",
  "g",
  "lb",
  "oz",
  "L",
  "ml",
  "cup",
  "tbsp",
  "tsp",
  "meter",
  "cm",
  "sheet",
  "roll",
];

export const productTypeOptions: { value: ProductType; label: string }[] = [
  { value: "dessert", label: "Dessert" },
  { value: "baked-goods", label: "Baked goods" },
  { value: "beverages", label: "Beverages" },
  { value: "meals", label: "Meals" },
  { value: "snacks", label: "Snacks" },
  { value: "sauces-spreads", label: "Sauces & spreads" },
  { value: "frozen-food", label: "Frozen food" },
  { value: "other-food", label: "Other food" },
];

export const saleModeOptions: { value: SaleMode; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "bundle", label: "Bundle" },
  { value: "bulk", label: "Bulk" },
];
import type {
  CostStep,
  InventoryItem,
  Product,
  ProductType,
  SaleMode,
} from "./types";
