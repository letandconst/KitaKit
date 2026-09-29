import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { CircleAlert, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { stepHelp, stepLabels, unitOptions } from "../constants";
import {
  calculateSellingOption,
  findInventoryItem,
  getSellingOptions,
  getMaterialUnitCost,
} from "../utils/costing";
import {
  addRow,
  addSelectedRows,
  removeRow,
  updateMaterialName,
  updateRow,
} from "../utils/entities";
import { money, round, toNumber } from "../utils/format";
import type {
  CostStep,
  CostTotals,
  InventoryItem,
  LaborRow,
  MaterialRow,
  OverheadRow,
  Product,
  ProductUpdater,
  SellingOption,
} from "../types";

const iconSize = 16;
type RowKind = Extract<CostStep, "ingredients" | "packaging" | "labor" | "overhead">;
type MaterialKind = Extract<RowKind, "ingredients" | "packaging">;
type Metric = [label: string, value: string];
type OnUpdateProduct = (updater: ProductUpdater) => void;

interface CostStepPanelProps {
  product: Product;
  step: CostStep;
  totals: CostTotals;
  inventory: InventoryItem[];
  onUpdate: OnUpdateProduct;
  onOpenInventory: () => void;
}

function CostStepPanel({
  product,
  step,
  totals,
  inventory,
  onUpdate,
  onOpenInventory,
}: CostStepPanelProps) {
  const addEnabled = (["ingredients", "packaging", "labor", "overhead"] as CostStep[]).includes(
    step,
  );
  const canBulkAdd = (["ingredients", "packaging"] as CostStep[]).includes(step);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [bulkSelections, setBulkSelections] = useState<string[]>([]);
  const [inventoryNotice, setInventoryNotice] = useState("");
  const addLabelByStep: Record<RowKind, string> = {
    ingredients: "Add ingredient",
    packaging: "Add packaging",
    labor: "Add labor",
    overhead: "Add overhead",
  };
  const addLabel = isRowKind(step) ? addLabelByStep[step] : "Add item";
  const existingBulkRows = canBulkAdd ? product[step as MaterialKind] : [];
  const inventoryOptions = inventory
    .map((item) => item.name)
    .filter(Boolean)
    .filter(
      (name) =>
        !existingBulkRows.some(
          (row) => row.name.trim().toLowerCase() === name.trim().toLowerCase(),
        ) &&
        !bulkSelections.some(
          (selection) =>
            selection?.trim().toLowerCase() === name.trim().toLowerCase(),
        ),
    )
    .map((name) => ({ value: name, label: name }));
  const bulkRows = Array.from(
    { length: Math.max(Number(bulkCount) || 1, 1) },
    (_, index) => index,
  );
  const needsInventoryFirst =
    canBulkAdd && inventory.filter((item) => item.name.trim()).length === 0;

  function showInventoryFirstNotice(): void {
    setInventoryNotice(
      "Add ingredients or packaging in Inventory first, then select them here.",
    );
  }

  function handleAddRow(kind: RowKind): void {
    if (
      (kind === "ingredients" || kind === "packaging") &&
      needsInventoryFirst
    ) {
      showInventoryFirstNotice();
      return;
    }

    addRow(kind, onUpdate);
  }

  return (
    <Card
      component="section"
      className="cost-panel"
      padding="lg"
      radius="sm"
      withBorder
    >
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text className="eyebrow">Recipe setup</Text>
          <Title order={2}>{stepLabels[step]}</Title>
          <Text c="dimmed" size="sm">
            {stepHelp[step]}
          </Text>
        </div>
        {addEnabled && isRowKind(step) && (
          <Group gap="xs">
            {canBulkAdd && (
              <Button
                type="button"
                variant="light"
                size="xs"
                onClick={() => {
                  if (needsInventoryFirst) {
                    showInventoryFirstNotice();
                    return;
                  }
                  setBulkSelections([]);
                  setBulkAddOpen(true);
                }}
              >
                Add multiple
              </Button>
            )}
            <Button
              type="button"
              aria-label={addLabel}
              title={addLabel}
              size="xs"
              leftSection={<Plus size={iconSize} />}
              onClick={() => handleAddRow(step)}
            >
              {addLabel}
            </Button>
          </Group>
        )}
      </Group>

      {inventoryNotice && (
        <Alert
          color="clay"
          icon={<CircleAlert size={iconSize} />}
          mb="md"
          withCloseButton
          onClose={() => setInventoryNotice("")}
        >
          {inventoryNotice}
        </Alert>
      )}

      {step === "ingredients" && (
        <MaterialRows
          rows={product.ingredients}
          kind="ingredients"
          inventory={inventory}
          onUpdate={onUpdate}
          onInventoryRequired={showInventoryFirstNotice}
          onOpenInventory={onOpenInventory}
        />
      )}
      {step === "packaging" && (
        <MaterialRows
          rows={product.packaging}
          kind="packaging"
          inventory={inventory}
          onUpdate={onUpdate}
          onInventoryRequired={showInventoryFirstNotice}
          onOpenInventory={onOpenInventory}
        />
      )}
      {step === "labor" && (
        <LaborRows rows={product.labor} onUpdate={onUpdate} />
      )}
      {step === "overhead" && (
        <OverheadRows rows={product.overhead} onUpdate={onUpdate} />
      )}
      {step === "wastage" && (
        <WastagePanel product={product} totals={totals} onUpdate={onUpdate} />
      )}
      {step === "pricing" && (
        <PricingPanel
          product={product}
          totals={totals}
          inventory={inventory}
          onUpdate={onUpdate}
        />
      )}
      <Modal
        opened={bulkAddOpen}
        onClose={() => setBulkAddOpen(false)}
        title={step === "ingredients" ? "Add ingredients" : "Add packaging"}
        centered
      >
        <Stack gap="md">
          <NumberInput
            label="How many rows?"
            min={1}
            max={50}
            step={1}
            allowDecimal={false}
            value={bulkCount}
            onChange={(value) => {
              setBulkCount(Number(value) || 1);
              setBulkSelections((current) =>
                current.slice(0, Number(value) || 1),
              );
            }}
          />
          <Stack gap="xs" className="bulk-add-fields">
            {bulkRows.map((index) => (
              <Select
                key={index}
                label={`${step === "ingredients" ? "Ingredient" : "Packaging"} ${index + 1}`}
                placeholder="Select from inventory"
                data={inventoryOptions}
                value={bulkSelections[index] ?? null}
                searchable
                clearable
                nothingFoundMessage="No inventory item found"
                onChange={(value) =>
                  setBulkSelections((current) => {
                    const nextSelections = [...current];
                    nextSelections[index] = value ?? "";
                    return nextSelections;
                  })
                }
              />
            ))}
          </Stack>
          <Group justify="flex-end">
            <Button
              type="button"
              variant="default"
              onClick={() => setBulkAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              leftSection={<Plus size={iconSize} />}
              disabled={!bulkSelections.some(Boolean)}
              onClick={() => {
                addSelectedRows(step as MaterialKind, bulkSelections, inventory, onUpdate);
                setBulkAddOpen(false);
                setBulkSelections([]);
              }}
            >
              Add selected
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}

interface MaterialRowsProps {
  rows: MaterialRow[];
  kind: MaterialKind;
  inventory: InventoryItem[];
  onUpdate: OnUpdateProduct;
  onInventoryRequired: () => void;
  onOpenInventory: () => void;
}

function MaterialRows({
  rows,
  kind,
  inventory,
  onUpdate,
  onInventoryRequired,
  onOpenInventory,
}: MaterialRowsProps) {
  const inventoryNames = inventory.map((item) => item.name).filter(Boolean);

  return (
    <div className="row-table">
      {inventoryNames.length === 0 && (
        <Paper className="setup-empty-panel" p="md" radius="sm" withBorder>
          <Stack gap="xs">
            <Text fw={850}>
              Add ingredients or packaging in Inventory first.
            </Text>
            <Text c="dimmed" size="sm">
              Recipe rows can only use saved inventory items so unit cost,
              stock, and usage stay accurate.
            </Text>
            <Group>
              <Button type="button" variant="light" onClick={onOpenInventory}>
                Open inventory
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}
      <div className="table-head material-head">
        <span>{kind === "ingredients" ? "Ingredient" : "Packaging"}</span>
        <span>
          {kind === "ingredients"
            ? "Amount used per recipe batch"
            : "Qty used per sale"}
        </span>
        <span>Unit cost</span>
        <span>Unit</span>
        <span>Line cost</span>
        <span></span>
      </div>
      {rows.map((row) => {
        const inventoryItem = findInventoryItem(row, inventory);
        const resolvedUnitCost = getMaterialUnitCost(row, inventory);
        const availableNames = inventoryNames.filter(
          (name) =>
            name === row.name ||
            !rows.some(
              (item) =>
                item.id !== row.id &&
                item.name.trim().toLowerCase() === name.trim().toLowerCase(),
            ),
        );

        return (
          <div className="cost-row" key={row.id}>
            <Select
              aria-label={kind === "ingredients" ? "Ingredient name" : "Packaging name"}
              data={availableNames}
              value={row.name || null}
              onChange={(value) =>
                updateMaterialName(kind, row.id, value ?? "", inventory, onUpdate)
              }
              onDropdownOpen={() => {
                if (inventoryNames.length === 0) onInventoryRequired();
              }}
              searchable
              clearable
              nothingFoundMessage="No inventory item found"
              placeholder={
                kind === "ingredients"
                  ? "Select ingredient from inventory"
                  : "Select packaging from inventory"
              }
            />
            <NumberInput
              aria-label={
                kind === "ingredients"
                  ? "Amount used per recipe batch"
                  : "Quantity used per sale"
              }
              min={0}
              step={0.01}
              value={row.qty}
              onChange={(value) =>
                updateRow(kind, row.id, "qty", value, onUpdate, true)
              }
            />
            <NumberInput
              aria-label="Cost per unit"
              min={0}
              step={0.01}
              value={round(resolvedUnitCost)}
              readOnly={Boolean(inventoryItem)}
              title={inventoryItem ? "Managed in inventory" : "Select from inventory"}
              onChange={(value) =>
                updateRow(kind, row.id, "unitCost", value, onUpdate, true)
              }
            />
            <Select
              aria-label="Unit"
              data={unitOptions}
              searchable
              allowDeselect={false}
              value={row.unit}
              readOnly={Boolean(inventoryItem)}
              onChange={(value) =>
                updateRow(kind, row.id, "unit", value ?? "", onUpdate)
              }
            />
            <Text fw={850}>{money(row.qty * resolvedUnitCost)}</Text>
            <ActionIcon
              className="remove-btn"
              color="red"
              variant="light"
              type="button"
              aria-label="Remove item"
              onClick={() => removeRow(kind, row.id, onUpdate)}
            >
              <Trash2 size={iconSize} />
            </ActionIcon>
          </div>
        );
      })}
    </div>
  );
}

function LaborRows({
  rows,
  onUpdate,
}: {
  rows: LaborRow[];
  onUpdate: OnUpdateProduct;
}) {
  return (
    <div className="row-table">
      <Text c="dimmed" size="sm" fw={700}>
        Example: mixing, cooking, packing, or cleaning time.
      </Text>
      <div className="table-head labor-head">
        <span>Work</span>
        <span>Hours</span>
        <span>Rate</span>
        <span></span>
      </div>
      {rows.map((row) => (
        <div className="cost-row three" key={row.id}>
          <TextInput
            aria-label="Task"
            value={row.name}
            onChange={(event) =>
              updateRow("labor", row.id, "name", event.target.value, onUpdate)
            }
          />
          <NumberInput
            aria-label="Hours"
            min={0}
            step={0.25}
            value={row.hours}
            onChange={(value) =>
              updateRow("labor", row.id, "hours", value, onUpdate, true)
            }
          />
          <NumberInput
            aria-label="Hourly rate"
            min={0}
            step={0.01}
            value={row.rate}
            onChange={(value) =>
              updateRow("labor", row.id, "rate", value, onUpdate, true)
            }
          />
          <ActionIcon
            className="remove-btn"
            color="red"
            variant="light"
            type="button"
            aria-label="Remove labor"
            onClick={() => removeRow("labor", row.id, onUpdate)}
          >
            <Trash2 size={iconSize} />
          </ActionIcon>
        </div>
      ))}
    </div>
  );
}

function OverheadRows({
  rows,
  onUpdate,
}: {
  rows: OverheadRow[];
  onUpdate: OnUpdateProduct;
}) {
  return (
    <div className="row-table">
      <Text c="dimmed" size="sm" fw={700}>
        Example: LPG, electricity, water, rent share, or delivery allowance.
      </Text>
      <div className="table-head labor-head">
        <span>Cost</span>
        <span>Amount</span>
        <span></span>
        <span></span>
      </div>
      {rows.map((row) => (
        <div className="cost-row three" key={row.id}>
          <TextInput
            aria-label="Overhead name"
            value={row.name}
            onChange={(event) =>
              updateRow(
                "overhead",
                row.id,
                "name",
                event.target.value,
                onUpdate,
              )
            }
          />
          <NumberInput
            aria-label="Amount"
            min={0}
            step={0.01}
            value={row.amount}
            onChange={(value) =>
              updateRow("overhead", row.id, "amount", value, onUpdate, true)
            }
          />
          <span />
          <ActionIcon
            className="remove-btn"
            color="red"
            variant="light"
            type="button"
            aria-label="Remove overhead"
            onClick={() => removeRow("overhead", row.id, onUpdate)}
          >
            <Trash2 size={iconSize} />
          </ActionIcon>
        </div>
      ))}
    </div>
  );
}

function WastagePanel({
  product,
  totals,
  onUpdate,
}: {
  product: Product;
  totals: CostTotals;
  onUpdate: OnUpdateProduct;
}) {
  return (
    <Stack gap="md">
      <div className="range-row">
        <Text c="dimmed" size="sm" fw={700}>
          Expected wastage, spoilage, shrinkage, and rejects
        </Text>
        <Slider
          min={0}
          max={50}
          value={product.wastageRate}
          onChange={(value) =>
            onUpdate(() => ({ wastageRate: toNumber(value) }))
          }
        />
      </div>
      <MetricRow
        metrics={[
          ["Wastage", `${product.wastageRate}%`],
          ["Base cost before wastage", money(totals.rawCost)],
          ["Wastage cost", money(totals.wastageCost)],
        ]}
      />
    </Stack>
  );
}

function PricingPanel({
  product,
  totals,
  inventory,
  onUpdate,
}: {
  product: Product;
  totals: CostTotals;
  inventory: InventoryItem[];
  onUpdate: OnUpdateProduct;
}) {
  const options = getSellingOptions(product);

  function saveOptions(nextOptions: SellingOption[]): void {
    onUpdate(() => ({ sellingOptions: nextOptions }));
  }

  return (
    <Stack gap="md">
      <MetricRow
        metrics={[
          ["Actual cost", money(totals.totalCost)],
          ["Target margin", `${product.targetMargin}%`],
          ["Suggested price", money(totals.recommendedPrice)],
        ]}
      />
      <Text className="pricing-note" c="dimmed" fw={700}>
        To reach a {product.targetMargin}% margin,{" "}
        {product.name || "this product"} should sell for about{" "}
        {money(totals.recommendedPrice)}.
      </Text>
      <Group justify="space-between" align="center">
        <div>
          <Text fw={850}>Selling options</Text>
          <Text c="dimmed" size="sm">
            Compare pack sizes using this product's batch cost.
          </Text>
        </div>
        <Button
          type="button"
          variant="light"
          leftSection={<Plus size={iconSize} />}
          onClick={() =>
            saveOptions([
              ...options,
              {
                id: crypto.randomUUID(),
                name: "New option",
                quantity: 1,
              },
            ])
          }
        >
          Add selling option
        </Button>
      </Group>
      <div className="selling-options">
        <div className="selling-option-head">
          <span>Option name</span>
          <span>Quantity ({product.saleUnit || "unit"})</span>
          <span>Estimated cost</span>
          <span>Recommended price</span>
          <span />
        </div>
        {options.map((option) => {
          const optionTotals = calculateSellingOption(
            product,
            inventory,
            option,
          );
          return (
            <div className="selling-option-row" key={option.id}>
              <TextInput
                aria-label="Selling option name"
                value={option.name}
                onChange={(event) =>
                  saveOptions(
                    options.map((item) =>
                      item.id === option.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  )
                }
              />
              <NumberInput
                aria-label={`Selling quantity in ${product.saleUnit || "units"}`}
                min={0.01}
                step={1}
                value={option.quantity}
                onChange={(value) =>
                  saveOptions(
                    options.map((item) =>
                      item.id === option.id
                        ? { ...item, quantity: toNumber(value, 1) }
                        : item,
                    ),
                  )
                }
              />
              <Text fw={800}>{money(optionTotals.totalCost)}</Text>
              <Text fw={850}>{money(optionTotals.recommendedPrice)}</Text>
              <ActionIcon
                className="remove-btn"
                color="red"
                variant="light"
                type="button"
                aria-label={`Remove ${option.name || "selling option"}`}
                disabled={options.length <= 1}
                onClick={() =>
                  saveOptions(options.filter((item) => item.id !== option.id))
                }
              >
                <Trash2 size={iconSize} />
              </ActionIcon>
            </div>
          );
        })}
      </div>
    </Stack>
  );
}

function MetricRow({ metrics }: { metrics: Metric[] }) {
  return (
    <SimpleGrid className="metric-row" cols={{ base: 1, sm: 3 }} spacing="xs">
      {metrics.map(([label, value]) => (
        <Paper key={label} p="sm" radius="sm" withBorder>
          <Text c="dimmed" size="xs" fw={800}>
            {label}
          </Text>
          <Text fw={850}>{value}</Text>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

function isRowKind(step: CostStep): step is RowKind {
  return ["ingredients", "packaging", "labor", "overhead"].includes(step);
}

export default CostStepPanel;
