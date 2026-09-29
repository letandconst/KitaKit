import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Boxes, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import { unitOptions } from "../constants";
import { getInventoryUnitCost } from "../utils/costing";
import {
  addInventoryItem,
  addInventoryItems,
  addInventoryStock,
  removeInventoryItem,
  updateInventoryItem,
} from "../utils/entities";
import { money, round, toNumber } from "../utils/format";
import { useState } from "react";
import type React from "react";
import type { InventoryItem } from "../types";

const iconSize = 16;
const pageSize = 10;

interface InventoryViewProps {
  inventory: InventoryItem[];
  onInventoryChange: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

function InventoryView({ inventory, onInventoryChange }: InventoryViewProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<number>(1);
  const [restockCounts, setRestockCounts] = useState<Record<string, number>>({});
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [bulkNames, setBulkNames] = useState<string[]>([]);
  const bulkRows = Array.from(
    { length: Math.max(Number(bulkCount) || 1, 1) },
    (_, index) => index,
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleInventory = normalizedQuery
    ? inventory.filter((item) =>
        (item.name ?? "").toLowerCase().includes(normalizedQuery),
      )
    : inventory;
  const totalPages = Math.max(Math.ceil(visibleInventory.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedInventory = visibleInventory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
            <Boxes size={iconSize} />
            <Text className="eyebrow">Inventory</Text>
          </Group>
          <Title order={2}>Ingredient & packaging inventory</Title>
          <Text c="dimmed" size="sm">
            Save pack prices, units, and stock so every matching recipe cost
            recalculates.
          </Text>
          <Text c="dimmed" size="sm" fw={700} mt={4}>
            Example: 1 kg flour = Pack content 1000, Unit g, Purchase price
            ₱80.
          </Text>
        </div>
        <Group gap="xs">
          <Button
            type="button"
            variant="light"
            onClick={() => {
              setBulkNames([]);
              setBulkAddOpen(true);
            }}
          >
            Add multiple
          </Button>
          <Button
            type="button"
            leftSection={<Plus size={iconSize} />}
            onClick={() => addInventoryItem(onInventoryChange)}
          >
            Add ingredient
          </Button>
        </Group>
      </Group>

      <TextInput
        className="inventory-search"
        label="Search inventory"
        leftSection={<Search size={iconSize} />}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
        placeholder="Flour, box, oil..."
        mb="md"
      />

      <div className="inventory-table">
        <div className="table-head inventory-head">
          <span>Ingredient / packaging</span>
          <span>Pack content</span>
          <span>Unit</span>
          <span>Purchase price</span>
          <span>Used</span>
          <span>On hand</span>
          <span>Add stock</span>
          <span>Unit cost</span>
          <span></span>
        </div>
        {paginatedInventory.map((item) => (
          <Paper
            className="inventory-row"
            key={item.id}
            p="sm"
            radius="sm"
            withBorder
          >
            <TextInput
              value={item.name}
              aria-label="Ingredient or packaging name"
              placeholder="Flour, sugar, food container..."
              onChange={(event) =>
                updateInventoryItem(
                  item.id,
                  "name",
                  event.target.value,
                  onInventoryChange,
                )
              }
            />
            <NumberInput
              min={0}
              step={0.01}
              value={item.purchaseQty}
              aria-label="Pack content"
              placeholder="1000"
              onChange={(value) =>
                updateInventoryItem(
                  item.id,
                  "purchaseQty",
                  value,
                  onInventoryChange,
                  true,
                )
              }
            />
            <Select
              data={unitOptions}
              searchable
              allowDeselect={false}
              value={item.purchaseUnit}
              aria-label="Unit"
              placeholder="g"
              onChange={(value) =>
                updateInventoryItem(
                  item.id,
                  "purchaseUnit",
                  value ?? "",
                  onInventoryChange,
                )
              }
            />
            <NumberInput
              min={0}
              step={0.01}
              value={item.purchasePrice}
              aria-label="Purchase price"
              placeholder="80"
              onChange={(value) =>
                updateInventoryItem(
                  item.id,
                  "purchasePrice",
                  value,
                  onInventoryChange,
                  true,
                )
              }
            />
            <NumberInput
              min={0}
              step={0.01}
              value={round(item.usedQty ?? 0)}
              aria-label="Used quantity"
              suffix={` ${item.purchaseUnit || "unit"}`}
              readOnly
            />
            <Text fw={750}>
              {round(item.stockQty ?? item.purchaseQty)} {item.purchaseUnit}
            </Text>
            <Group gap={4} wrap="nowrap">
              <NumberInput
                min={1}
                step={1}
                value={restockCounts[item.id] ?? 1}
                aria-label="Packs to add"
                onChange={(value) =>
                  setRestockCounts((current) => ({
                    ...current,
                    [item.id]: toNumber(value, 1),
                  }))
                }
                w={72}
              />
              <ActionIcon
                color="sage"
                variant="light"
                type="button"
                aria-label={`Add stock for ${item.name}`}
                title="Add pack(s) to stock"
                onClick={() =>
                  addInventoryStock(
                    item.id,
                    restockCounts[item.id] ?? 1,
                    onInventoryChange,
                  )
                }
              >
                <PackagePlus size={iconSize} />
              </ActionIcon>
            </Group>
            <Text fw={850}>
              {money(getInventoryUnitCost(item))}/{item.purchaseUnit || "unit"}
            </Text>
            <ActionIcon
              color="red"
              variant="light"
              type="button"
              aria-label="Remove inventory item"
              onClick={() => removeInventoryItem(item.id, onInventoryChange)}
            >
              <Trash2 size={iconSize} />
            </ActionIcon>
          </Paper>
        ))}
        {visibleInventory.length === 0 && (
          <div className="empty-list">
            No inventory items match your search.
          </div>
        )}
      </div>
      {visibleInventory.length > pageSize && (
        <Group justify="space-between" mt="md">
          <Text c="dimmed" size="sm" fw={700}>
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, visibleInventory.length)} of{" "}
            {visibleInventory.length}
          </Text>
          <Pagination
            value={currentPage}
            onChange={setPage}
            total={totalPages}
            size="sm"
          />
        </Group>
      )}
      <Modal
        opened={bulkAddOpen}
        onClose={() => setBulkAddOpen(false)}
        title="Add inventory items"
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
              setBulkNames((current) => current.slice(0, Number(value) || 1));
            }}
          />
          <Stack gap="xs" className="bulk-add-fields">
            {bulkRows.map((index) => (
              <TextInput
                key={index}
                label={`Item ${index + 1}`}
                placeholder="Enter ingredient or packaging name"
                value={bulkNames[index] ?? ""}
                onChange={(event) =>
                  setBulkNames((current) => {
                    const nextNames = [...current];
                    nextNames[index] = event.target.value;
                    return nextNames;
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
              disabled={!bulkNames.some((name) => name?.trim())}
              onClick={() => {
                addInventoryItems(
                  bulkNames.map((name) => name.trim()).filter(Boolean),
                  onInventoryChange,
                );
                setBulkAddOpen(false);
                setBulkNames([]);
              }}
            >
              Add items
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}

export default InventoryView;
