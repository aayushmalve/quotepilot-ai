# QuotePilot AI

**Turn freelance project notes into a professional, editable quotation.**

QuotePilot AI helps freelancers and small service businesses turn a project brief into a structured quotation with AI-assisted line items, suggested INR prices, editable commercial terms, automatic totals, browser-local drafts, and PDF export.

**Live application:** https://quotepilot-ai-two.vercel.app
**Source code:** https://github.com/aayushmalve/quotepilot-ai

## Features

- Generate draft quotation line items from a project description.
- Suggest indicative prices in INR.
- Edit service descriptions, quantities, and rates.
- Configure business and client details, quotation number, and validity.
- Apply tax and discounts and calculate totals in the application.
- Set payment terms and additional notes.
- Save and reload drafts in the current browser.
- Export quotations as PDF.
- Validate AI-generated data before using it in the application.

AI-generated quotations are drafts, not verified market quotations. Review the scope, pricing, taxes, payment terms, and client details before sending a quotation.

## AI model and open-weight technology

QuotePilot uses the following model through the OpenRouter API:

`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`

- **Model developer:** NVIDIA
- **Model family:** Nemotron 3 Nano Omni
- **Model information:** [Official NVIDIA model card](https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning/modelcard)
- **Model weights:** [NVIDIA on Hugging Face](https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16)
- **Model terms:** [NVIDIA Open Model License](https://www.nvidia.com/content/dam/en-zz/Solutions/license-agreements/enterprise-software/NVIDIA-Nemotron-Open-Model-License-12-12-25.pdf)
- **Inference provider:** [OpenRouter](https://openrouter.ai/)

The application sends requests from its server-side API route to OpenRouter. It does not download or run the model weights locally. The `:free` endpoint can be subject to shared capacity, rate limits, model availability, and provider-specific terms.

The model's open-weight licensing is distinct from the license for this application's source code. Review NVIDIA's applicable model agreement and OpenRouter's service terms before using the system commercially.

## How it works

1. A user enters project notes.
2. The server sends the generation request to the configured model provider.
3. The model proposes quotation details in JSON.
4. The application parses and validates the result.
5. The user reviews and edits the quotation.
6. The application calculates totals and can export the quotation as a PDF.

AI-generated prices and commercial terms may be inaccurate. Users remain responsible for reviewing every quotation before sending it.

## Technology stack

- Next.js and React
- TypeScript
- Tailwind CSS
- Zod for schema validation
- OpenRouter API for hosted model inference
- jsPDF for PDF generation
- Browser local storage for saved drafts

## Run locally

### Requirements

- Node.js compatible with the project
- npm
- An OpenRouter API key

### Setup

```bash
git clone https://github.com/aayushmalve/quotepilot-ai.git
cd quotepilot-ai
npm install
cp .env.example .env.local
```

Edit `.env.local` and replace the placeholder API key with your own key.

```dotenv
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
```

Keep `.env.local` private. Never commit API keys or expose them in browser-side code.

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Quality checks

Run these commands before submitting changes:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment

The application can be deployed to Vercel or another compatible Next.js hosting platform.

Configure these server-side environment variables in the deployment settings:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

Never use a `NEXT_PUBLIC_` prefix for the API key. After deploying, verify the live application and API generation endpoint. Hosted model availability is not guaranteed.

## Privacy and limitations

- Saved drafts use the current browser's local storage; they are not automatically a cloud-synced account.
- Project notes submitted for AI generation are sent to the configured OpenRouter provider and may be processed by the selected upstream model provider.
- Do not submit confidential client information unless you have permission and have reviewed the applicable provider terms.
- Model output can be incomplete, inconsistent, or incorrect. Check every generated quotation.
- Free inference may be rate-limited or temporarily unavailable.
- QuotePilot does not independently verify market prices, tax compliance, or the legal suitability of commercial terms.

## License

The QuotePilot AI application source code is distributed under the MIT License. See [LICENSE](LICENSE).

The MIT license for this repository does not replace or modify the separate license and service terms applicable to the third-party AI model and inference provider.
