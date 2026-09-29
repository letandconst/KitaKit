import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Factory, ShoppingCart } from "lucide-react";
import {
  buildShoppingList,
  convertQuantity,
  findInventoryItem,
  getSaleQuantity,
  getProductionUsage,
} from "../utils/costing";
import { money, round, toNumber } from "../utils/format";
import { useState } from "react";
import type React from "react";
import type { InventoryItem, Product } from "../types";

const iconSize = 16;

interface PlanningViewProps {
  products: Product[];
  activeProduct: Product;
  activeId: string;
  inventory: InventoryItem[];
  onSelect: (value: string | null) => void;
  onInventoryChange: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

function PlanningView({
  products,
  activeProduct,
  activeId,
  inventory,
  onSelect,
  onInventoryChange,
}: PlanningViewProps) {
  const [unitsToMake, setUnitsToMake] = useState<number | "">("");
  const [productionMessage, setProductionMessage] = useState("");
  const [confirmProductionOpen, setConfirmProductionOpen] = useState(false);
  const hasPlanQuantity = unitsToMake !== "";
  const outputPerBatch = Math.max(
    toNumber(activeProduct.batchYield, activeProduct.batchUnits || 1),
    1,
  );
  const plannedOutput = hasPlanQuantity
    ? Math.max(Math.round(toNumber(unitsToMake, 1)), 1)
    : 0;
  const batchEquivalent = plannedOutput / outputPerBatch;
  const saleQuantity = getSaleQuantity(activeProduct);
  const salePackages = hasPlanQuantity ? plannedOutput / saleQuantity : 0;
  const shoppingList = hasPlanQuantity
    ? buildShoppingList(activeProduct, inventory, batchEquivalent, saleQuantity)
    : [];
  const ingredientSpend = shoppingList.reduce(
    (sum, item) => sum + item.estimatedCost,
    0,
  );

  function recordProduction(): void {
    if (!hasPlanQuantity) return;

    const usage = getProductionUsage(
      activeProduct,
      batchEquivalent,
      saleQuantity,
    );
    const requirements = usage.map((row) => {
      const item = findInventoryItem(row, inventory);
      const quantity = item
        ? convertQuantity(row.usageQty, row.usageUnit, item.purchaseUnit)
        : NaN;
      return { row, item, quantity };
    });
    const shortage = requirements.find(
      ({ row, item, quantity }) =>
        !item ||
        !Number.isFinite(quantity) ||
        quantity > (item.stockQty ?? item.purchaseQty),
    );

    if (shortage) {
      setProductionMessage(
        `Not enough stock for ${shortage.row.name}. Check Inventory before deducting ingredients.`,
      );
      setConfirmProductionOpen(false);
      return;
    }

    onInventoryChange((currentInventory) =>
      currentInventory.map((item) => {
        const consumed = requirements
          .filter((requirement) => requirement.item?.id === item.id)
          .reduce((total, requirement) => total + requirement.quantity, 0);
        return consumed
          ? {
              ...item,
              stockQty: (item.stockQty ?? item.purchaseQty) - consumed,
              usedQty: (item.usedQty ?? 0) + consumed,
            }
          : item;
      }),
    );
    setProductionMessage(
      `Deducted ingredients for ${round(plannedOutput)} ${activeProduct.saleUnit || "units"} of ${activeProduct.name}.`,
    );
    setConfirmProductionOpen(false);
  }

  return (
    <Card
      component="section"
      className="section-page"
      padding="lg"
      radius="sm"
      withBorder
    >
      <Group
        className="section-header"
        justify="space-between"
        align="flex-start"
      >
        <div>
          <Group gap={6}>
            <ShoppingCart size={iconSize} />
            <Text className="eyebrow">Production plan</Text>
          </Group>
          <Title order={2}>Production shopping list</Title>
          <Text c="dimmed" size="sm">
            Enter how many pieces you want to make, then see what to buy and
            optionally deduct used stock.
          </Text>
        </div>
      </Group>

      <div className="planning-controls">
        <Select
          label="Choose product"
          placeholder="Select product to plan"
          value={activeId}
          data={products.map((product) => ({
            value: product.id,
            label: product.name,
          }))}
          onChange={onSelect}
          searchable
          allowDeselect={false}
        />
        <NumberInput
          label={`Quantity to produce (${activeProduct.saleUnit || "units"})`}
          min={1}
          step={1}
          value={unitsToMake}
          allowDecimal={false}
          onChange={(value) =>
            setUnitsToMake(
              value === "" ? "" : Math.max(Math.round(toNumber(value, 1)), 1),
            )
          }
        />
        <Button
          type="button"
          leftSection={<Factory size={iconSize} />}
          disabled={!hasPlanQuantity}
          onClick={() => setConfirmProductionOpen(true)}
        >
          Record production
        </Button>
        <Paper className="planning-total" p="sm" radius="sm" withBorder>
          <Text size="xs" fw={850} c="clay.7">
            Estimated production spend
          </Text>
          <Title order={3}>{money(ingredientSpend)}</Title>
          <Text size="xs" c="dimmed">
            {round(plannedOutput)} {activeProduct.saleUnit || "units"} ·{" "}
            {round(batchEquivalent)} batch equivalents · {round(salePackages)} sale packs
          </Text>
        </Paper>
      </div>
      <Text c="dimmed" size="sm" fw={700} mb="md">
        Record production only after you actually make this quantity. It
        reduces Inventory on hand and increases Used.
      </Text>
      {productionMessage && (
        <Text c="dimmed" size="sm" fw={700}>
          {productionMessage}
        </Text>
      )}

      <div className="shopping-list">
        <div className="table-head shopping-head">
          <span>Ingredient / packaging</span>
          <span>Need to buy</span>
          <span>Usage required</span>
          <span>Estimated cost</span>
        </div>
        {shoppingList.map((item) => (
          <Paper
            className="shopping-row"
            key={`${item.name}-${item.purchaseUnit}`}
            p="sm"
            radius="sm"
            withBorder
          >
            <Text fw={800}>{item.name}</Text>
            <Badge color="gray" variant="light">
              {round(item.purchaseQty)} {item.purchaseUnit}
            </Badge>
            <Text c="dimmed" fw={750}>
              {round(item.usageQty)} {item.usageUnit}
            </Text>
            <Text fw={850}>{money(item.estimatedCost)}</Text>
          </Paper>
        ))}
        {shoppingList.length === 0 && (
          <div className="empty-list">
            Enter a quantity to produce to see the shopping list.
          </div>
        )}
      </div>
      <Modal
        opened={confirmProductionOpen}
        onClose={() => setConfirmProductionOpen(false)}
        title="Record production?"
        centered
      >
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            This will deduct the ingredients and packaging needed for{" "}
            {round(plannedOutput)} {activeProduct.saleUnit || "units"} of{" "}
            {activeProduct.name || "this product"} from Inventory.
          </Text>
          <Group justify="flex-end">
            <Button
              type="button"
              variant="default"
              onClick={() => setConfirmProductionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              leftSection={<Factory size={iconSize} />}
              onClick={recordProduction}
            >
              Record production
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}

export default PlanningView;
