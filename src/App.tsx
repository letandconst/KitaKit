import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { useNextStep } from "nextstepjs";
import {
  BadgeDollarSign,
  Boxes,
  Calculator,
  Gauge,
  HandCoins,
  Moon,
  PackageOpen,
  PercentCircle,
  PiggyBank,
  Plus,
  ShoppingCart,
  Sun,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CostBreakdown from "./components/CostBreakdown";
import CostStepPanel from "./components/CostStepPanel";
import ExportView from "./components/ExportView";
import InventoryView from "./components/InventoryView";
import PlanningView from "./components/PlanningView";
import {
  productTypeOptions,
  saleModeOptions,
  starterInventory,
  starterProducts,
  unitOptions,
} from "./constants";
import { addProduct, removeProduct } from "./utils/entities";
import { money } from "./utils/format";
import { calculateTotals } from "./utils/costing";
import { loadPersistedState, writeAppState } from "./utils/storage";
import type {
  AppView,
  CostStep,
  CostTotals,
  InventoryItem,
  Product,
  ProductType,
  ProductUpdater,
  SaleMode,
} from "./types";

const iconSize = 16;

const appViews: { value: AppView; label: string; Icon: LucideIcon }[] = [
  { value: "inventory", label: "Inventory", Icon: Boxes },
  { value: "costing", label: "Costing", Icon: Calculator },
  { value: "planning", label: "Production Plan", Icon: ShoppingCart },
];

const stepTabs: { value: CostStep; label: string; Icon: LucideIcon }[] = [
  { value: "ingredients", label: "Ingredients", Icon: PackageOpen },
  { value: "packaging", label: "Packaging", Icon: Boxes },
  { value: "labor", label: "Labor", Icon: HandCoins },
  { value: "overhead", label: "Overhead", Icon: Gauge },
  { value: "wastage", label: "Wastage", Icon: PercentCircle },
  { value: "pricing", label: "Pricing", Icon: BadgeDollarSign },
];

function App() {
  const [showOnboardingLauncher, setShowOnboardingLauncher] = useState(
    () => localStorage.getItem("kitakit-onboarding-seen") !== "true",
  );
  const [products, setProducts] = useState<Product[]>(starterProducts);
  const [inventory, setInventory] = useState<InventoryItem[]>(starterInventory);
  const [activeId, setActiveId] = useState<string | undefined>(
    starterProducts[0]?.id,
  );
  const [activeStep, setActiveStep] = useState<CostStep>("ingredients");
  const [activeView, setActiveView] = useState<AppView>("inventory");
  const [dataReady, setDataReady] = useState(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { closeNextStep, startNextStep } = useNextStep();
  const isDark = colorScheme === "dark";

  const activeProduct =
    products.find((product) => product.id === activeId) ?? products[0];
  const totalsById = useMemo<Record<string, CostTotals>>(
    () =>
      Object.fromEntries(
        products.map((product) => [
          product.id,
          calculateTotals(product, inventory),
        ]),
      ),
    [products, inventory],
  );
  const totals = activeProduct ? totalsById[activeProduct.id] : null;

  useEffect(() => {
    let cancelled = false;

    loadPersistedState()
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products);
        setInventory(data.inventory);
        setActiveId(data.products[0]?.id);
        setDataReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setDataReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (dataReady) writeAppState(products, inventory).catch(() => {});
  }, [dataReady, products, inventory]);

  useEffect(() => {
    if (!activeProduct && products[0]) setActiveId(products[0].id);
  }, [activeProduct, products]);

  useEffect(() => {
    function hideOnboardingLauncher() {
      setShowOnboardingLauncher(false);
    }

    window.addEventListener("kitakit-onboarding-seen", hideOnboardingLauncher);
    return () => {
      window.removeEventListener(
        "kitakit-onboarding-seen",
        hideOnboardingLauncher,
      );
    };
  }, []);

  function updateActiveProduct(updater: ProductUpdater): void {
    if (!activeProduct) return;
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === activeProduct.id
          ? { ...product, ...updater(product) }
          : product,
      ),
    );
  }

  function changeView(view: AppView): void {
    setActiveView(view);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function startSpotlightTour(): void {
    closeNextStep();
    setShowOnboardingLauncher(true);
    if (!activeProduct) addProduct(setProducts, setActiveId);
    changeView("costing");
    setActiveStep("ingredients");
    window.setTimeout(() => startNextStep("kitakit-setup"), 180);
  }

  if (!dataReady) {
    return (
      <main className="empty-shell" aria-live="polite">
        <Text c="dimmed" fw={700}>
          Loading saved data...
        </Text>
      </main>
    );
  }

  if (!activeProduct || !totals) {
    return (
      <Container component="main" size="xl" className="app-shell">
        {showOnboardingLauncher && (
          <OnboardingLauncher
            variant="welcome"
            onStartTour={startSpotlightTour}
          />
        )}
        <div className="app-frame">
          <aside className="navigation-rail">
            <AppNavigation
              activeView={activeView}
              isDark={isDark}
              onChange={changeView}
              onToggleTheme={() => setColorScheme(isDark ? "light" : "dark")}
            />
          </aside>
          <div className="app-content">
            {activeView === "inventory" ? (
              <InventoryView
                inventory={inventory}
                onInventoryChange={setInventory}
              />
            ) : (
              <Paper className="section-page" p="lg" radius="sm" withBorder>
                <Text fw={850}>
                  {showOnboardingLauncher
                    ? "Start with the guide above."
                    : "Start with inventory or create your first product."}
                </Text>
                <Text c="dimmed" size="sm">
                  Add inventory items first or create your first product when
                  you are ready to cost a recipe. You can replay the guide from
                  the footer anytime.
                </Text>
                {!showOnboardingLauncher && (
                  <Button
                    type="button"
                    mt="md"
                    onClick={() => addProduct(setProducts, setActiveId)}
                  >
                    Create product
                  </Button>
                )}
              </Paper>
            )}
          </div>
        </div>
        <AppFooter onReplayTour={startSpotlightTour} />
      </Container>
    );
  }

  return (
    <Container component="main" size="xl" className="app-shell">
      {showOnboardingLauncher && (
        <OnboardingLauncher onStartTour={startSpotlightTour} />
      )}
      <TopPanel
        product={activeProduct}
        products={products}
        activeId={activeProduct.id}
        totals={totals}
        onUpdate={updateActiveProduct}
        onSelect={(value) => setActiveId(value ?? undefined)}
        onAdd={() => addProduct(setProducts, setActiveId)}
        onRemove={() =>
          removeProduct(activeProduct.id, setProducts, setActiveId)
        }
      />
      <div className="app-frame">
        <aside className="navigation-rail">
          <AppNavigation
            activeView={activeView}
            isDark={isDark}
            onChange={changeView}
            onToggleTheme={() => setColorScheme(isDark ? "light" : "dark")}
          />
        </aside>

        <div className="app-content">
          {activeView === "costing" && (
            <section className="product-layout">
              <div className="product-workspace">
                <section className="workspace-grid">
                  <StepTabs activeStep={activeStep} onChange={setActiveStep} />
                  <CostStepPanel
                    product={activeProduct}
                    step={activeStep}
                    totals={totals}
                    inventory={inventory}
                    onUpdate={updateActiveProduct}
                    onOpenInventory={() => changeView("inventory")}
                  />
                  <CostBreakdown
                    product={activeProduct}
                    totals={totals}
                    inventory={inventory}
                  />
                </section>
              </div>
            </section>
          )}

          {activeView === "planning" && (
            <PlanningView
              products={products}
              activeProduct={activeProduct}
              activeId={activeProduct.id}
              inventory={inventory}
              onSelect={(value) => setActiveId(value ?? undefined)}
              onInventoryChange={setInventory}
            />
          )}

          {activeView === "inventory" && (
            <InventoryView
              inventory={inventory}
              onInventoryChange={setInventory}
            />
          )}
          {activeView === "export" && (
            <ExportView
              products={products}
              activeProduct={activeProduct}
              totalsById={totalsById}
              inventory={inventory}
            />
          )}
        </div>
      </div>
      <AppFooter onReplayTour={startSpotlightTour} />
    </Container>
  );
}

interface TopPanelProps {
  product: Product;
  products: Product[];
  activeId: string;
  totals: CostTotals;
  onUpdate: (updater: ProductUpdater) => void;
  onSelect: (value: string | null) => void;
  onAdd: () => void;
  onRemove: () => void;
}

function TopPanel({
  product,
  products,
  activeId,
  totals,
  onUpdate,
  onSelect,
  onAdd,
  onRemove,
}: TopPanelProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const actualProfit = totals.recommendedPrice - totals.totalCost;
  const productName = (product.name ?? "").trim();
  const isDraftProduct = productName.length === 0;
  const categoryValue = productTypeOptions.some(
    (option) => option.value === product.productType,
  )
    ? product.productType
    : product.productType
      ? "other-food"
      : null;

  return (
    <>
      <Paper
        className="top-panel"
        aria-labelledby="app-title"
        shadow="sm"
        p="lg"
        radius="sm"
        withBorder
      >
        <Stack className="question-block" gap="md">
          <div>
            <Text className="eyebrow">
              KitaKit · food costing and ingredient planning made simple
            </Text>
            <Title id="app-title" order={1}>
              What are you selling?
            </Title>
          </div>
          <div id="product-identity" className="start-form">
            {!isDraftProduct && (
              <Group className="product-picker" gap="xs" align="end">
                <Select
                  label="Choose product"
                  data={products.map((item) => ({
                    value: item.id,
                    label: item.name || "Untitled product",
                  }))}
                  value={activeId}
                  onChange={onSelect}
                  searchable
                  allowDeselect={false}
                  nothingFoundMessage="No products found"
                  style={{ flex: 1 }}
                />
                <Button
                  className="new-product-button"
                  type="button"
                  size="sm"
                  leftSection={<Plus size={iconSize} />}
                  onClick={onAdd}
                >
                  New product
                </Button>
                <Tooltip label="Delete product">
                  <ActionIcon
                    type="button"
                    size="lg"
                    color="red"
                    variant="light"
                    aria-label="Delete product"
                    disabled={products.length <= 1}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 size={iconSize} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            )}
            <TextInput
              label="Product name"
              placeholder="Enter product name"
              value={product.name}
              onChange={(event) =>
                onUpdate(() => ({ name: event.target.value }))
              }
              autoComplete="off"
            />
            <Select
              label="Food category"
              placeholder="Select category"
              data={productTypeOptions}
              value={categoryValue}
              onChange={(value) =>
                onUpdate(() => ({ productType: value as ProductType | null }))
              }
              allowDeselect={false}
            />
            <div id="selling-format">
              <Select
                label="Sell as"
                description={getSaleModeDescription(product.saleMode)}
                data={saleModeOptions}
                value={product.saleMode ?? "single"}
                onChange={(value) =>
                  onUpdate((currentProduct) => {
                    const saleMode = value ?? "single";

                    if (saleMode === "single") {
                      return {
                        saleMode: saleMode as SaleMode,
                        bundleSize: 1,
                        saleQuantity: 1,
                      };
                    }

                    if (saleMode === "bulk") {
                      return {
                        saleMode: saleMode as SaleMode,
                        saleQuantity: currentProduct.saleQuantity || 10,
                      };
                    }

                    return {
                      saleMode: saleMode as SaleMode,
                      bundleSize: currentProduct.bundleSize || 6,
                    };
                  })
                }
                allowDeselect={false}
              />
            </div>
            <Select
              label="Selling unit"
              description="The unit customers buy, such as pc, tray, bottle, or box."
              data={unitOptions}
              value={product.saleUnit ?? "pc"}
              onChange={(value) =>
                onUpdate(() => ({ saleUnit: value ?? "pc" }))
              }
              searchable
              allowDeselect={false}
            />
            <div id="recipe-yield">
              <NumberInput
                label="Recipe yield"
                description={`How many sellable ${product.saleUnit || "units"} one recipe batch makes.`}
                min={1}
                step={1}
                value={product.batchYield ?? product.batchUnits}
                onChange={(value) =>
                  onUpdate(() => ({ batchYield: Number(value) || 1 }))
                }
              />
            </div>
            {product.saleMode !== "single" && (
              <NumberInput
                label={
                  product.saleMode === "bulk"
                    ? "Pieces per bulk order"
                    : "Pieces per bundle"
                }
                min={1}
                step={1}
                value={
                  product.saleMode === "bulk"
                    ? (product.saleQuantity ?? 1)
                    : (product.bundleSize ?? 1)
                }
                onChange={(value) =>
                  onUpdate(() =>
                    product.saleMode === "bulk"
                      ? { saleQuantity: Number(value) || 1 }
                      : { bundleSize: Number(value) || 1 },
                  )
                }
              />
            )}
            <NumberInput
              label="Target margin"
              min={1}
              max={95}
              step={1}
              value={product.targetMargin}
              suffix="%"
              onChange={(value) =>
                onUpdate(() => ({ targetMargin: Number(value) || 40 }))
              }
            />
          </div>
        </Stack>

        <SimpleGrid
          id="answer-cards"
          cols={1}
          spacing="md"
          className="answer-card"
          aria-live="polite"
        >
          <Card className="answer-card-cost" padding="md" radius="sm">
            <Group gap="xs" mb={6}>
              <PiggyBank size={iconSize} />
              <Text size="sm" fw={700} c="white">
                {product.name || "This product"} costs
              </Text>
            </Group>
            <Title order={2} c="white">
              {money(totals.totalCost)}
            </Title>
          </Card>
          <Card
            className="answer-card-price"
            padding="md"
            radius="sm"
            withBorder
          >
            <Group gap="xs" mb={6}>
              <BadgeDollarSign size={iconSize} />
              <Text size="sm" fw={700} c="clay.7">
                Recommended price
              </Text>
            </Group>
            <Title order={2}>{money(totals.recommendedPrice)}</Title>
            <Badge color="clay" variant="light">
              {product.targetMargin}% target margin
            </Badge>
          </Card>
          <Card
            className="answer-card-profit"
            padding="md"
            radius="sm"
            withBorder
          >
            <Group gap="xs" mb={6}>
              <HandCoins size={iconSize} />
              <Text size="sm" fw={700}>
                Actual profit at recommended price
              </Text>
            </Group>
            <Title order={2}>{money(actualProfit)}</Title>
            <Text size="sm" c="dimmed" fw={700}>
              Recommended price minus actual cost
            </Text>
          </Card>
        </SimpleGrid>
      </Paper>
      <Modal
        opened={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete product"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete {product.name || "this product"}?
            This cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              type="button"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              type="button"
              onClick={() => {
                onRemove();
                setDeleteOpen(false);
              }}
            >
              Delete product
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

interface OnboardingLauncherProps {
  variant?: "inline" | "welcome";
  onStartTour: () => void;
}

function OnboardingLauncher({
  variant = "inline",
  onStartTour,
}: OnboardingLauncherProps) {
  const isWelcome = variant === "welcome";

  return (
    <Card
      id="onboarding-welcome"
      className={`onboarding-panel ${isWelcome ? "welcome" : ""}`}
      padding="lg"
      radius="sm"
      withBorder
    >
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text className="eyebrow">
            {isWelcome ? "Welcome to KitaKit" : "Guided onboarding"}
          </Text>
          <Title order={2}>
            {isWelcome
              ? "Set up your food costing workspace"
              : "Need help setting this up?"}
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Launch an interactive walkthrough that highlights the exact parts of
            the app you need to set up inventory, recipe yield, costs, and
            production planning.
          </Text>
        </div>
        <Badge color="sage" variant="light">
          Product tour
        </Badge>
      </Group>
      <Group justify="flex-start" mt="md">
        <Button
          type="button"
          leftSection={<BadgeDollarSign size={iconSize} />}
          onClick={onStartTour}
        >
          Start guided tour
        </Button>
      </Group>
    </Card>
  );
}

function AppFooter({ onReplayTour }: { onReplayTour: () => void }) {
  return (
    <footer className="app-footer">
      <Group justify="space-between" gap="sm">
        <Text size="sm" c="dimmed">
          KitaKit helps food sellers connect inventory, recipe cost, and
          production planning.
        </Text>
        <Group gap="xs">
          <Button
            type="button"
            variant="subtle"
            size="xs"
            onClick={onReplayTour}
          >
            Replay tour
          </Button>
          {/* <Button
            component="a"
            href="#"
            variant="subtle"
            size="xs"
          >
            Send feedback
          </Button> */}
        </Group>
      </Group>
    </footer>
  );
}

function getSaleModeDescription(saleMode: SaleMode): string {
  if (saleMode === "bundle") {
    return "Sold as a fixed pack, like 6 pcs of puto or cookies.";
  }

  if (saleMode === "bulk") {
    return "Sold as a larger order size, like 50 pcs or one party tray.";
  }

  return "Sold one piece at a time. Recipe yield can still be more than 1.";
}

interface AppNavigationProps {
  activeView: AppView;
  isDark: boolean;
  onChange: (view: AppView) => void;
  onToggleTheme: () => void;
}

function AppNavigation({
  activeView,
  isDark,
  onChange,
  onToggleTheme,
}: AppNavigationProps) {
  return (
    <Group
      className="app-navigation"
      justify="space-between"
      align="center"
      gap="md"
    >
      <ViewTabs activeView={activeView} onChange={onChange} />
      <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
        <ActionIcon
          className="theme-toggle"
          type="button"
          variant="light"
          size="xl"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={onToggleTheme}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

interface ViewTabsProps {
  activeView: AppView;
  onChange: (view: AppView) => void;
}

function ViewTabs({ activeView, onChange }: ViewTabsProps) {
  return (
    <nav className="view-tabs" aria-label="App sections">
      {appViews.map(({ value, label, Icon }) => (
        <button
          id={`nav-${value}`}
          className={`nav-tab ${activeView === value ? "active" : ""}`}
          type="button"
          key={value}
          onClick={() => onChange(value)}
        >
          <SegmentLabel icon={Icon} label={label} />
        </button>
      ))}
    </nav>
  );
}

interface StepTabsProps {
  activeStep: CostStep;
  onChange: (step: CostStep) => void;
}

function StepTabs({ activeStep, onChange }: StepTabsProps) {
  return (
    <Card
      id="recipe-steps"
      className="steps-panel"
      aria-label="Costing steps"
      padding={6}
      radius="sm"
      withBorder
    >
      <SegmentedControl
        value={activeStep}
        onChange={(value) => onChange(value as CostStep)}
        fullWidth
        data={stepTabs.map(({ value, label, Icon }) => ({
          value,
          label: <SegmentLabel icon={Icon} label={label} />,
        }))}
      />
    </Card>
  );
}

interface SegmentLabelProps {
  icon: LucideIcon;
  label: string;
}

function SegmentLabel({ icon: Icon, label }: SegmentLabelProps) {
  return (
    <span className="segmented-label">
      <Icon size={iconSize} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export default App;
