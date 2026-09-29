import { getInventoryUnitCost } from "./costing";
import { toNumber } from "./format";
import type React from "react";
import type {
  CostStep,
  InventoryItem,
  LaborRow,
  MaterialRow,
  OverheadRow,
  Product,
  ProductUpdater,
  SetInventory,
  SetProducts,
} from "../types";

type RowKind = Extract<CostStep, "ingredients" | "packaging" | "labor" | "overhead">;
type MaterialKind = Extract<RowKind, "ingredients" | "packaging">;

export function createBlankProduct(): Product {
  return {
    id: crypto.randomUUID(),
    name: "",
    productType: null,
    saleMode: "single",
    saleUnit: "pc",
    saleQuantity: 1,
    targetMargin: 40,
    priceIncrease: 10,
    batchUnits: 10,
    batchYield: 50,
    bundleSize: 6,
    ingredients: [],
    packaging: [],
    labor: [
      { id: crypto.randomUUID(), name: "Production work", hours: 1, rate: 0 },
    ],
    overhead: [{ id: crypto.randomUUID(), name: "Overhead", amount: 0 }],
    wastageRate: 5,
  };
}

export function addProduct(
  setProducts: SetProducts,
  setActiveId: React.Dispatch<React.SetStateAction<string | undefined>>,
): void {
  const product = createBlankProduct();
  setProducts((products) => [...products, product]);
  setActiveId(product.id);
}

export function duplicateProduct(
  product: Product,
  setProducts: SetProducts,
  setActiveId: React.Dispatch<React.SetStateAction<string | undefined>>,
): void {
  const copy = {
    ...deepClone(product),
    id: crypto.randomUUID(),
    name: `${product.name} Copy`,
    ingredients: cloneRows(product.ingredients),
    packaging: cloneRows(product.packaging),
    labor: cloneRows(product.labor),
    overhead: cloneRows(product.overhead),
  };
  setProducts((products) => [...products, copy]);
  setActiveId(copy.id);
}

export function removeProduct(
  productId: string,
  setProducts: SetProducts,
  setActiveId: React.Dispatch<React.SetStateAction<string | undefined>>,
): void {
  setProducts((products) => {
    const remainingProducts = products.filter(
      (product) => product.id !== productId,
    );

    setActiveId((activeId) =>
      activeId === productId ? remainingProducts[0]?.id : activeId,
    );
    return remainingProducts;
  });
}

export function addRow(kind: RowKind, onUpdate: (updater: ProductUpdater) => void): void {
  onUpdate((product) => ({
    [kind]: [createRow(kind), ...product[kind]],
  }));
}

export function addRows(
  kind: RowKind,
  count: number,
  onUpdate: (updater: ProductUpdater) => void,
): void {
  const rows = Array.from({ length: Math.max(toNumber(count, 1), 1) }, () =>
    createRow(kind),
  );
  onUpdate((product) => ({ [kind]: [...rows, ...product[kind]] }));
}

export function addSelectedRows(
  kind: MaterialKind,
  names: string[],
  inventory: InventoryItem[],
  onUpdate: (updater: ProductUpdater) => void,
): void {
  onUpdate((product) => {
    const existingNames = new Set(
      product[kind]
        .map((row) => row.name.trim().toLowerCase())
        .filter(Boolean),
    );
    const uniqueNames: string[] = [];

    names.filter(Boolean).forEach((name) => {
      const normalizedName = name.trim().toLowerCase();
      if (!normalizedName || existingNames.has(normalizedName)) return;
      existingNames.add(normalizedName);
      uniqueNames.push(name);
    });

    if (uniqueNames.length === 0) return {};

    return {
      [kind]: [
        ...uniqueNames.map((name) => createRowFromInventory(kind, name, inventory)),
        ...product[kind],
      ],
    };
  });
}

function createRow(kind: "ingredients"): MaterialRow;
function createRow(kind: "packaging"): MaterialRow;
function createRow(kind: "labor"): LaborRow;
function createRow(kind: "overhead"): OverheadRow;
function createRow(kind: RowKind): MaterialRow | LaborRow | OverheadRow;
function createRow(kind: RowKind): MaterialRow | LaborRow | OverheadRow {
  const rowByKind = {
    ingredients: {
      id: crypto.randomUUID(),
      name: "",
      qty: 100,
      unitCost: 0,
      unit: "g",
    },
    packaging: {
      id: crypto.randomUUID(),
      name: "",
      qty: 1,
      unitCost: 0,
      unit: "pc",
    },
    labor: {
      id: crypto.randomUUID(),
      name: "Production work",
      hours: 1,
      rate: 0,
    },
    overhead: { id: crypto.randomUUID(), name: "Overhead item", amount: 0 },
  };
  return rowByKind[kind];
}

function createRowFromInventory(
  kind: MaterialKind,
  name: string,
  inventory: InventoryItem[],
): MaterialRow {
  const inventoryItem = inventory.find(
    (item) => (item.name ?? "").toLowerCase() === name.trim().toLowerCase(),
  );
  const baseRow =
    kind === "ingredients" ? createRow("ingredients") : createRow("packaging");
  return {
    ...baseRow,
    name,
    unit: inventoryItem?.purchaseUnit ?? (kind === "packaging" ? "pc" : "g"),
    unitCost: inventoryItem ? getInventoryUnitCost(inventoryItem) : 0,
  };
}

export function updateMaterialName(
  kind: MaterialKind,
  rowId: string,
  value: string,
  inventory: InventoryItem[],
  onUpdate: (updater: ProductUpdater) => void,
): void {
  const inventoryItem = inventory.find(
    (item) => (item.name ?? "").toLowerCase() === value.trim().toLowerCase(),
  );
  onUpdate((product) => ({
    [kind]: product[kind].map((row) =>
      row.id === rowId &&
      !product[kind].some(
        (item) =>
          item.id !== rowId &&
          item.name.trim().toLowerCase() === value.trim().toLowerCase(),
      )
        ? {
            ...row,
            name: value,
            unit: inventoryItem?.purchaseUnit ?? row.unit,
            unitCost: inventoryItem
              ? getInventoryUnitCost(inventoryItem)
              : row.unitCost,
          }
        : row,
    ),
  }));
}

export function updateRow(
  kind: RowKind,
  rowId: string,
  field: string,
  value: unknown,
  onUpdate: (updater: ProductUpdater) => void,
  numeric = false,
): void {
  onUpdate((product) => ({
    [kind]: product[kind].map((row) =>
      row.id === rowId
        ? { ...row, [field]: numeric ? toNumber(value) : value }
        : row,
    ),
  }));
}

export function removeRow(
  kind: RowKind,
  rowId: string,
  onUpdate: (updater: ProductUpdater) => void,
): void {
  onUpdate((product) => ({
    [kind]: product[kind].filter((row) => row.id !== rowId),
  }));
}

export function addInventoryItem(onInventoryChange: SetInventory): void {
  onInventoryChange((inventory) => [createInventoryItem(), ...inventory]);
}

export function addInventoryItems(
  names: string[],
  onInventoryChange: SetInventory,
): void {
  const itemNames = Array.isArray(names) ? names.filter(Boolean) : [];
  const items = itemNames.map((name) => ({ ...createInventoryItem(), name }));
  if (items.length === 0) return;
  onInventoryChange((inventory) => [...items, ...inventory]);
}

function createInventoryItem(): InventoryItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    purchaseQty: 1000,
    purchaseUnit: "g",
    purchasePrice: 0,
    stockQty: 0,
    usedQty: 0,
  };
}

export function updateInventoryItem(
  itemId: string,
  field: keyof InventoryItem,
  value: unknown,
  onInventoryChange: SetInventory,
  numeric = false,
): void {
  onInventoryChange((inventory) =>
    inventory.map((item) =>
      item.id === itemId
        ? { ...item, [field]: numeric ? toNumber(value) : value }
        : item,
    ),
  );
}

export function addInventoryStock(
  itemId: string,
  packCount: number,
  onInventoryChange: SetInventory,
): void {
  onInventoryChange((inventory) =>
    inventory.map((item) =>
      item.id === itemId
        ? {
            ...item,
            stockQty:
              (item.stockQty ?? item.purchaseQty) +
              toNumber(packCount, 1) * item.purchaseQty,
          }
        : item,
    ),
  );
}

export function removeInventoryItem(
  itemId: string,
  onInventoryChange: SetInventory,
): void {
  onInventoryChange((inventory) =>
    inventory.filter((item) => item.id !== itemId),
  );
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function cloneRows<T extends { id: string }>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row, id: crypto.randomUUID() }));
}
