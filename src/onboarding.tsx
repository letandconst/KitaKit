import { Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { CardComponentProps, Tour } from "nextstepjs";

export const onboardingTours: Tour[] = [
  {
    tour: "kitakit-setup",
    steps: [
      {
        icon: "👋",
        title: "Start with real food costs",
        content:
          "KitaKit works best when inventory prices, recipe usage, and selling format are connected. This tour shows the setup order.",
        selector: "#onboarding-welcome",
        side: "bottom",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 12,
        pointerRadius: 8,
        selectorRetryAttempts: 3,
      },
      {
        icon: "📦",
        title: "Add ingredient and packaging inventory",
        content:
          "Inventory stores pack content, unit, purchase price, on-hand stock, and used quantity. Recipe rows pull cost and unit from here.",
        selector: "#nav-inventory",
        side: "bottom",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 8,
      },
      {
        icon: "🍰",
        title: "Create or choose a product",
        content:
          "Use this area to switch products or create a new food item you want to cost.",
        selector: "#product-identity",
        side: "bottom",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 8,
        selectorRetryAttempts: 5,
      },
      {
        icon: "🧁",
        title: "Set selling format",
        content:
          "Single means sold one piece at a time. Bundle and bulk add a quantity field, like 6 pcs per pack or 50 pcs per order.",
        selector: "#selling-format",
        side: "bottom",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 8,
        selectorRetryAttempts: 5,
      },
      {
        icon: "📏",
        title: "Enter recipe yield",
        content:
          "Recipe yield is how many sellable pieces one recipe batch makes. This is what turns batch ingredients into per-piece cost.",
        selector: "#recipe-yield",
        side: "bottom",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 8,
        selectorRetryAttempts: 5,
      },
      {
        icon: "🥣",
        title: "Build the recipe setup",
        content:
          "Move through ingredients, packaging, labor, overhead, wastage, and pricing. Ingredients and packaging should come from inventory.",
        selector: "#recipe-steps",
        side: "bottom",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 8,
        selectorRetryAttempts: 5,
      },
      {
        icon: "💡",
        title: "Read the instant answers",
        content:
          "These cards summarize the result as you work: actual cost, recommended selling price, and expected profit at your target margin.",
        selector: "#answer-cards",
        side: "left",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 8,
        selectorRetryAttempts: 5,
      },
      {
        icon: "💸",
        title: "Review actual cost and price",
        content:
          "This panel answers the key question: what does it cost, what should I sell it for, and how much profit remains?",
        selector: "#cost-summary",
        side: "left",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 8,
        selectorRetryAttempts: 5,
      },
      {
        icon: "🛒",
        title: "Plan production later",
        content:
          "Use Production Plan when you are ready to make a quantity. It creates a shopping list and can record production against inventory.",
        selector: "#nav-planning",
        side: "bottom",
        cardOffset: 32,
        scrollOffset: 24,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 8,
      },
    ],
  },
];

export function KitaKitTourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Paper className="tour-card" p="md" radius="sm" shadow="xl" withBorder>
      {arrow}
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" gap="md">
          <Group gap="xs" wrap="nowrap">
            {step.icon && <span className="tour-icon">{step.icon}</span>}
            <Title order={3}>{step.title}</Title>
          </Group>
          <Badge color="sage" variant="light">
            {currentStep + 1} / {totalSteps}
          </Badge>
        </Group>
        <Text c="dimmed" size="sm">
          {step.content}
        </Text>
        <Group justify="space-between" mt="xs">
          <Button
            type="button"
            variant="subtle"
            size="xs"
            onClick={skipTour}
          >
            Skip
          </Button>
          <Group gap="xs">
            <Button
              type="button"
              variant="default"
              size="xs"
              disabled={isFirstStep}
              onClick={prevStep}
            >
              Back
            </Button>
            <Button type="button" size="xs" onClick={nextStep}>
              {isLastStep ? "Finish" : "Next"}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}
