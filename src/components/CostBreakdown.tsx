import { Badge, Card, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { AlertTriangle, CircleCheck, ReceiptText } from "lucide-react";
import { getSmartWarnings } from "../utils/costing";
import { money } from "../utils/format";
import type { CostTotals, InventoryItem, Product, SmartWarning } from "../types";

const iconSize = 16;

interface CostBreakdownProps {
  product: Product;
  totals: CostTotals;
  inventory: InventoryItem[];
}

type BreakdownLine = [label: string, value: number, type?: "total"];

function CostBreakdown({ product, totals, inventory }: CostBreakdownProps) {
  const lines: BreakdownLine[] = [
    ["Ingredients per batch", totals.ingredientsBatch],
    ["Packaging", totals.packaging],
    ["Labor", totals.labor],
    ["Delivery and overhead", totals.overhead],
    [`Wastage (${product.wastageRate}%)`, totals.wastageCost],
    ["Actual cost", totals.totalCost, "total"],
    [
      `Price for ${product.targetMargin}% margin`,
      totals.recommendedPrice,
      "total",
    ],
  ];
  if (product.saleMode === "bundle" || product.saleMode === "bulk") {
    const batchOutput = Math.max(
      Number(product.batchYield ?? product.batchUnits) || 1,
      1,
    );
    lines.splice(1, 0, [
      `Ingredient cost per piece`,
      totals.ingredientsBatch / batchOutput,
    ]);
  }
  const warnings = getSmartWarnings(product, totals, inventory);

  return (
    <Card
      id="cost-summary"
      component="section"
      className="summary-panel"
      padding="lg"
      radius="sm"
      withBorder
    >
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Group gap={6}>
            <ReceiptText size={iconSize} />
            <Text className="eyebrow">Actual cost</Text>
          </Group>
          <Title order={2}>Cost breakdown</Title>
        </div>
      </Group>
      <Stack className="breakdown" gap={4}>
        {lines.map(([label, value, type]) => (
          <Paper
            className={`breakdown-line ${type || ""}`}
            key={label}
            p={type ? "xs" : 0}
            radius="sm"
          >
            <Text size="sm" fw={700} c="dimmed">
              {label}
            </Text>
            <Text fw={800}>{money(value)}</Text>
          </Paper>
        ))}
      </Stack>
      <SmartWarnings warnings={warnings} />
    </Card>
  );
}

function SmartWarnings({ warnings }: { warnings: SmartWarning[] }) {
  return (
    <Stack className="warning-list" gap="xs">
      <Group className="warning-title" justify="space-between">
        <Text size="xs" fw={850}>
          Smart checks
        </Text>
        <Badge color={warnings.length ? "clay" : "sage"} variant="light">
          {warnings.length}
        </Badge>
      </Group>
      {warnings.length === 0 ? (
        <Paper className="warning-item good" p="sm" radius="sm" withBorder>
          <Text fw={800} size="sm">
            <CircleCheck size={iconSize} /> No obvious issues
          </Text>
          <Text c="dimmed" size="sm">
            Costing, margin, and ingredient setup look reasonable.
          </Text>
        </Paper>
      ) : (
        warnings.map((warning) => (
          <Paper
            className={`warning-item ${warning.level}`}
            key={warning.title}
            p="sm"
            radius="sm"
            withBorder
          >
            <Text fw={800} size="sm">
              <AlertTriangle size={iconSize} /> {warning.title}
            </Text>
            <Text c="dimmed" size="sm">
              {warning.body}
            </Text>
          </Paper>
        ))
      )}
    </Stack>
  );
}

export default CostBreakdown;
