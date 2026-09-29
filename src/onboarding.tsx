import { Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { CardComponentProps, Tour } from "nextstepjs";

export const onboardingTours: Tour[] = [
  {
    tour: "kitakit-setup",
    steps: [
      {
        icon: "🍰",
        title: "Create or choose a product",
        content:
          "Start by naming the food product you sell, or choose an existing product when you have more than one.",
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
        title: "Set selling format and unit",
        content:
          "Choose whether this is sold as a single item, bundle, or bulk order, then set the unit customers buy, like pc, tray, bottle, or box.",
        selector: "#selling-setup",
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
        title: "Enter yield and target margin",
        content:
          "Recipe yield tells KitaKit how many sellable units one batch makes. Target margin controls the recommended selling price.",
        selector: "#recipe-pricing",
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
        icon: "📦",
        title: "Create ingredient and packaging inventory",
        content:
          "Add ingredients and packaging in Inventory with pack content, unit, purchase price, and stock. Recipe rows pull cost and unit from here.",
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
