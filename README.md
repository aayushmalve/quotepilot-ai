# QuotePilot AI

QuotePilot turns freelancer project notes into editable quotations with AI-assisted line items, INR pricing suggestions, tax and discount calculations, browser-local drafts, and PDF export.

## Features

- Generate draft quotation items from project notes using OpenRouter.
- Edit AI-suggested quantities and rates before applying them.
- Edit business and client details, quotation number, validity, services, tax, discount, payment terms, and notes.
- Calculate totals in the application rather than relying on the model.
- Save and reload a draft in the current browser.
- Export a quotation as a PDF.

AI-generated prices are estimates, not verified market rates. Review all amounts, tax treatment, scope, and payment terms before sending a quotation.

## Requirements

- Node.js compatible with the installed Next.js version
- npm
- An OpenRouter API key for AI generation

## Local setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` and set `OPENROUTER_API_KEY` to your own key. Do not commit `.env.local` or expose the key in client-side code. The default model setting uses OpenRouter's free-model router; model availability and rate limits can vary.

Start development:

```bash
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Deployment

Deploy as a Next.js application on a compatible host such as Vercel. Import the repository, configure `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` as server-side environment variables, and deploy. Never use a `NEXT_PUBLIC_` prefix for the API key.

After deployment, test AI generation, error handling, draft saving, and PDF export on the hosted site. Free model availability is not guaranteed.

## Privacy

Quotation drafts are stored in the browser's local storage when the user saves them. AI generation sends the project notes to the configured OpenRouter model provider. Do not enter sensitive client information unless you have permission to share it with that provider.

## License

No license has been selected yet. Add a license before presenting the repository as open source.
