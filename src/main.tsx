import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { NextStepProvider, NextStepReact } from "nextstepjs";
import "@mantine/core/styles.css";
import App from "./App";
import { KitaKitTourCard, onboardingTours } from "./onboarding";
import "./styles.css";

const theme = createTheme({
  primaryColor: "sage",
  colors: {
    sage: [
      "#f0f7f1",
      "#dfece2",
      "#bfd8c5",
      "#9dc2a6",
      "#7dad88",
      "#619672",
      "#4f7f5f",
      "#3f664d",
      "#314f3d",
      "#253d2f",
    ],
    clay: [
      "#fff2ee",
      "#f8ded5",
      "#efbdad",
      "#e39983",
      "#d8775d",
      "#c86147",
      "#a94d36",
      "#883d2c",
      "#6d3125",
      "#58291f",
    ],
  },
  defaultRadius: "sm",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  headings: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
});

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <NextStepProvider>
        <NextStepReact
          steps={onboardingTours}
          cardComponent={KitaKitTourCard}
          shadowRgb="20, 34, 31"
          shadowOpacity="0.34"
          overlayZIndex={2500}
          disableConsoleLogs
          onComplete={() => {
            localStorage.setItem("kitakit-onboarding-seen", "true");
            window.dispatchEvent(new Event("kitakit-onboarding-seen"));
            window.dispatchEvent(new Event("kitakit-tour-complete"));
          }}
          onSkip={() => {
            localStorage.setItem("kitakit-onboarding-seen", "true");
            window.dispatchEvent(new Event("kitakit-onboarding-seen"));
          }}
        >
          <App />
        </NextStepReact>
      </NextStepProvider>
    </MantineProvider>
  </StrictMode>,
);
