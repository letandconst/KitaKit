# KitaKit

KitaKit is a web-based food costing app for small food sellers. It helps answer:

> How much does this product actually cost me, and how much should I sell it for?

The app is built for costing food products such as desserts, baked goods, beverages, packed meals, sauces, frozen goods, and other small-batch food items.

## Features

- Product costing for food businesses
- Guided onboarding using a spotlight tour
- Multiple products with product switching and deletion
- Food categories such as desserts, baked goods, beverages, meals, snacks, sauces, frozen food, and other food
- Selling formats for single items, bundles, and bulk orders
- Recipe yield setup for batch-to-piece costing
- Ingredient and packaging inventory
- Inventory pack fields: pack content, unit, purchase price, used quantity, on-hand quantity, and unit cost
- Ingredients and packaging selected from inventory to keep costs consistent
- Duplicate ingredient prevention in recipes
- Scrollable recipe rows for long ingredient, packaging, labor, and overhead lists
- Paginated inventory table
- Labor, overhead, wastage, and hidden cost tracking
- Actual cost breakdown
- Suggested selling price based on target margin
- Selling options for comparing pack sizes
- Production planning and shopping list
- Record production to deduct used ingredients and packaging from inventory
- Confirmation before inventory deduction
- Local device persistence using IndexedDB
- Light and dark mode
- Responsive Mantine UI with Lucide icons

## Tech Stack

- React 19
- TypeScript
- Vite
- Mantine UI
- Mantine Hooks
- Lucide React icons
- NextStepJS
- Motion
- PostHog analytics
- IndexedDB for local device data persistence

## Project Structure

```text
src/
  components/       Reusable UI sections and feature views
  utils/            Costing, entity, formatting, and storage helpers
  App.tsx           Main application shell and flow
  constants.ts      App constants, labels, units, categories
  main.tsx          React, Mantine, and NextStepJS providers
  onboarding.tsx    Detailed spotlight tour configuration
  styles.css        Global styles and responsive layout
  types.ts          Shared TypeScript types
```

## How To Run

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://127.0.0.1:5173/
```

If that port is already in use, Vite may choose another port.

## Analytics

KitaKit uses PostHog for product analytics. Create a local `.env` file from
`.env.example` and set your project key:

```bash
VITE_POSTHOG_KEY=phc_your_project_api_key
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

Use the EU host instead if your PostHog project is in the EU region. Analytics
are disabled when `VITE_POSTHOG_KEY` is not set.

## Available Scripts

Run the app locally:

```bash
npm run dev
```

Type-check the project:

```bash
npm run typecheck
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## How To Use

1. Start the guided tour.
   - First-time users should click `Start guided tour`.
   - Returning users can use `Replay tour` in the footer.

2. Add inventory first.
   - Go to `Inventory`.
   - Add ingredients and packaging.
   - Enter pack content, unit, and purchase price.
   - Example: for 1 kg flour, enter pack content `1000`, unit `g`, and purchase price `80`.

3. Create a product.
   - Go to `Costing`.
   - Add a product name and food category.
   - Choose whether it is sold as a single item, bundle, or bulk order.
   - Set the selling unit and recipe yield.

4. Build the recipe.
   - Add ingredients from saved inventory.
   - Add packaging from saved inventory.
   - Add labor, overhead, and wastage.
   - Review the actual cost and recommended price.

5. Adjust pricing.
   - Change the target margin to see the suggested selling price update.
   - Use selling options to compare different bundle or pack sizes.

6. Plan production.
   - Go to `Production Plan`.
   - Select a product and enter the whole number quantity to produce.
   - Review the shopping list and estimated spend.
   - Record production only after making the product, because it deducts stock from inventory.

## Data Storage

KitaKit stores data locally on the device using IndexedDB. Product and inventory data stays in the browser on the same device and browser profile.

There is no backend server, login, or cloud sync yet.

## Notes

- Ingredients and packaging used in recipes should come from Inventory.
- Unit cost and unit fields are managed from Inventory to keep recipe costing consistent.
- Production recording reduces Inventory on hand and increases Used quantity.
- Export functionality is currently hidden in the UI but retained in the codebase for later.
