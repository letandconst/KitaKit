import posthog from "posthog-js";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

let initialized = false;

export function initPostHog(): void {
  if (!posthogKey || initialized) return;

  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageleave: true,
    capture_pageview: true,
    person_profiles: "identified_only",
  });

  initialized = true;
}

export function captureAnalyticsEvent(
  name: string,
  properties?: Record<string, unknown>,
): void {
  if (!initialized) return;

  posthog.capture(name, properties);
}

export { posthog };
