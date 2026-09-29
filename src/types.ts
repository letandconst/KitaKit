import type React from "react";

export type ProductType =
  | "dessert"
  | "baked-goods"
  | "beverages"
  | "meals"
  | "snacks"
  | "sauces-spreads"
  | "frozen-food"
  | "other-food";

export type SaleMode = "single" | "bundle" | "bulk";

export type CostStep =
  | "ingredients"
  | "packaging"
  | "labor"
  | "overhead"
  | "wastage"
  | "pricing";

export type AppView = "costing" | "planning" | "inventory" | "export";

export type Unit = string;

export interface MaterialRow {
  id: string;
  name: string;
  qty: number;
  unitCost: number;
  unit: Unit;
}

export interface LaborRow {
  id: string;
  name: string;
  hours: number;
  rate: number;
}

export interface OverheadRow {
  id: string;
  name: string;
  amount: number;
}

export interface SellingOption {
  id: string;
  name: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  productType: ProductType | null;
  saleMode: SaleMode;
  saleUnit: Unit;
  saleQuantity: number;
  targetMargin: number;
  priceIncrease: number;
  batchUnits: number;
  batchYield: number;
  bundleSize: number;
  ingredients: MaterialRow[];
  packaging: MaterialRow[];
  labor: LaborRow[];
  overhead: OverheadRow[];
  wastageRate: number;
  sellingOptions?: SellingOption[];
}

export interface InventoryItem {
  id: string;
  name: string;
  purchaseQty: number;
  purchaseUnit: Unit;
  purchasePrice: number;
  stockQty: number;
  usedQty: number;
}

export interface CostTotals {
  ingredients: number;
  ingredientsBatch: number;
  laborBatch: number;
  overheadBatch: number;
  productionCostBatch: number;
  packaging: number;
  labor: number;
  overhead: number;
  rawCost: number;
  wastageCost: number;
  totalCost: number;
  recommendedPrice: number;
}

export interface SmartWarning {
  level: "info" | "caution" | "danger";
  title: string;
  body: string;
}

export interface ShoppingListItem {
  name: string;
  purchaseQty: number;
  purchaseUnit: Unit;
  usageQty: number;
  usageUnit: Unit;
  estimatedCost: number;
}

export interface ProductionUsageItem extends MaterialRow {
  usageQty: number;
  usageUnit: Unit;
  category: "ingredient" | "packaging";
}

export type ProductUpdater = (product: Product) => Partial<Product>;
export type SetProducts = React.Dispatch<React.SetStateAction<Product[]>>;
export type SetInventory = React.Dispatch<React.SetStateAction<InventoryItem[]>>;
