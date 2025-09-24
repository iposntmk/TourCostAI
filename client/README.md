# TourCostAI – Intelligent tour management UI

This Vite + React application delivers the responsive front end for the TourCost AI platform. It guides travel operations teams through the full lifecycle of digitising tour programmes, validating them against Master Data, and reviewing financial outcomes.

## Key capabilities

- **AI image intake workflow** – Upload itinerary screenshots or PDFs and run an embedded Gemini-based simulation that extracts services, itinerary, and financial hints. Differences between detected values and Master Data prices are highlighted for rapid correction.
- **Operations dashboard** – Searchable, filterable view of all tours with discrepancy counts, upcoming departures, and one-click Excel exports for accounting or BI pipelines.
- **Deep tour detail workspace** – Tabbed view containing general information, automatically calculated per diem breakdowns, itinerary editing, tour costs, manual expenses, and settlement calculations with strict field validation.
- **Master Data console** – Admin-grade CRUD management for services, guides, partners, per diem rates, and shared catalogues to guarantee consistent pricing and terminology across the organisation.

## Tech stack

- [Vite](https://vitejs.dev/) with React 19 and TypeScript
- Context-based state management with local storage persistence for tours and master data
- [xlsx](https://github.com/SheetJS/sheetjs) for client-side Excel exports
- Lightweight responsive styling with modern CSS (no component library dependency)

## Getting started

```bash
# Install dependencies
npm install

# Start the development server with hot reloading
npm run dev

# Run type checks and linting
npm run lint

# Build the production bundle
npm run build
```

By default the dev server runs on `http://localhost:5173`.

## Project structure

```
client/
├── public/               # Static assets served as-is
├── src/
│   ├── components/       # Layout and reusable UI primitives
│   ├── contexts/         # Master Data and tour state providers
│   ├── data/             # Seed Master Data catalogues
│   ├── pages/            # Feature pages (Dashboard, AI intake, etc.)
│   ├── utils/            # Formatting, calculations, AI extraction helpers
│   └── types.ts          # Shared TypeScript contracts
└── vite.config.ts        # Vite build configuration
```

## Responsive design

The layout adapts fluidly across desktop, tablet, and mobile breakpoints. Navigation collapses into a mobile menu, tables shift into card-style stacks where required, and spacing scales via CSS clamps for excellent readability on any device.

## Notes on AI simulation

Actual Google Gemini integration is mocked in `src/utils/extraction.ts` to keep the project self-contained. The module simulates realistic extraction results, price discrepancies, and itinerary content so the human verification steps and Master Data enforcement can be fully demonstrated without external services.
