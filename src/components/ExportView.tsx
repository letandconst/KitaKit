import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  Boxes,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import {
  exportInventory,
  exportProductCostSheet,
  exportProductSummary,
} from "../utils/exporters";
import type { CostTotals, InventoryItem, Product } from "../types";

const iconSize = 16;

interface ExportViewProps {
  products: Product[];
  activeProduct: Product;
  totalsById: Record<string, CostTotals>;
  inventory: InventoryItem[];
}

function ExportView({
  products,
  activeProduct,
  totalsById,
  inventory,
}: ExportViewProps) {
  const activeTotals = totalsById[activeProduct.id];

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
            <Download size={iconSize} />
            <Text className="eyebrow">Export</Text>
          </Group>
          <Title order={2}>Costing records</Title>
          <Text c="dimmed" size="sm">
            Download clean CSV files or print the current report.
          </Text>
        </div>
      </Group>

      <SimpleGrid
        className="export-grid"
        cols={{ base: 1, sm: 2, lg: 4 }}
        spacing="md"
      >
        <Card
          className="export-card"
          component="article"
          padding="md"
          radius="sm"
          withBorder
        >
          <Stack gap="xs" h="100%">
            <Group gap={6}>
              <FileSpreadsheet size={iconSize} />
              <Text className="eyebrow">All products</Text>
            </Group>
            <Title order={2}>Product summary CSV</Title>
            <Text c="dimmed" size="sm">
              Cost, suggested price, margin, and major cost buckets for every
              product.
            </Text>
            <Button
              mt="auto"
              type="button"
              leftSection={<Download size={iconSize} />}
              onClick={() => exportProductSummary(products, totalsById)}
            >
              Download CSV
            </Button>
          </Stack>
        </Card>

        <Card
          className="export-card"
          component="article"
          padding="md"
          radius="sm"
          withBorder
        >
          <Stack gap="xs" h="100%">
            <Group gap={6}>
              <Boxes size={iconSize} />
              <Text className="eyebrow">Inventory</Text>
            </Group>
            <Title order={2}>Ingredient price CSV</Title>
            <Text c="dimmed" size="sm">
              Reusable ingredient and packaging list with purchase quantity, unit, and price.
            </Text>
            <Button
              mt="auto"
              type="button"
              leftSection={<Download size={iconSize} />}
              onClick={() => exportInventory(inventory)}
            >
              Download CSV
            </Button>
          </Stack>
        </Card>

        <Card
          className="export-card"
          component="article"
          padding="md"
          radius="sm"
          withBorder
        >
          <Stack gap="xs" h="100%">
            <Group gap={6}>
              <ClipboardList size={iconSize} />
              <Text className="eyebrow">Current product</Text>
            </Group>
            <Title order={2}>{activeProduct.name} cost sheet</Title>
            <Text c="dimmed" size="sm">
              Detailed ingredients, packaging, labor, overhead, wastage, and
              pricing.
            </Text>
            <Button
              mt="auto"
              type="button"
              leftSection={<Download size={iconSize} />}
              onClick={() =>
                exportProductCostSheet(activeProduct, activeTotals, inventory)
              }
            >
              Download CSV
            </Button>
          </Stack>
        </Card>

        <Card
          className="export-card"
          component="article"
          padding="md"
          radius="sm"
          withBorder
        >
          <Stack gap="xs" h="100%">
            <Group gap={6}>
              <Printer size={iconSize} />
              <Text className="eyebrow">Printable</Text>
            </Group>
            <Title order={2}>Browser print view</Title>
            <Text c="dimmed" size="sm">
              Use your browser printer dialog to save the current app view as
              PDF.
            </Text>
            <Button
              mt="auto"
              variant="light"
              type="button"
              leftSection={<Printer size={iconSize} />}
              onClick={() => window.print()}
            >
              Print or save PDF
            </Button>
          </Stack>
        </Card>
      </SimpleGrid>
    </Card>
  );
}

export default ExportView;
