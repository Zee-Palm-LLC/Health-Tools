# Symptom Intake Assistant

A small web app that turns a casual health complaint — *"I've had a headache and felt tired since yesterday"* — into a structured intake record.

You describe a symptom in plain language. The assistant asks one or two clarifying questions, then renders a clean summary card with the symptom, duration, severity, associated symptoms, and any red flags worth routing to a clinician.

> **This is not a diagnostic tool.** It does not diagnose, treat, or give medical advice. It only asks clarifying questions and formats intake information. Nothing it produces is a clinical assessment, and it is not a substitute for talking to a qualified healthcare professional.

## What it does

- Accepts a free-text symptom description
- Asks at most two clarifying questions, one at a time
- Extracts a structured record:

  ```json
  {
    "symptom": "Headache",
    "duration": "Since yesterday morning",
    "severity": "moderate",
    "associated_symptoms": ["Fatigue", "Sensitivity to light"],
    "red_flags": ["Stiff neck"]
  }
  ```

- Renders that record as a summary card, highlighting red flags

Red flags are a **routing signal**, not an interpretation — the assistant lists what was reported and never explains what it might mean.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** in strict mode
- **Tailwind CSS**
- **Claude** via the [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript), using structured outputs so the model's response is schema-validated
- Deployed on **Vercel**

No database, no auth, no persistence — the conversation lives in React state for the length of the session.

## Getting started

**Prerequisites:** Node.js 18.17 or newer, and an [Anthropic API key](https://console.anthropic.com/settings/keys).

```bash
git clone https://github.com/<your-org>/zp-symptom-bot.git
cd zp-symptom-bot
npm install
```

Create your local environment file from the template:

```bash
cp .env.example .env.local
```

Then open `.env.local` and set your key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

`.env.local` is gitignored and must never be committed. The key is read server-side only — it is never sent to the browser.

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server                  |
| `npm run build`     | Production build                      |
| `npm start`         | Serve the production build            |
| `npm run lint`      | ESLint via `next lint`                |
| `npm run typecheck` | `tsc --noEmit`                        |

## Project structure

```
app/
  page.tsx              Page shell (server component)
  layout.tsx            Root layout
  api/chat/route.ts     Server-side Claude call — the only place the API key is used
components/
  ChatWindow.tsx        Message list, input, loading + error state
  IntakeSummaryCard.tsx Renders the extracted record
lib/
  systemPrompt.ts       The extraction prompt, kept separate for easy iteration
  intakeSchema.ts       Zod schema the model output is constrained to
  chatClient.ts         Browser-side fetch wrapper for /api/chat
  types.ts              Types shared between the UI and the API route
```

## How it works

`ChatWindow` posts the full conversation to `/api/chat`. The route calls Claude with the prompt from `lib/systemPrompt.ts` and a JSON schema derived from `lib/intakeSchema.ts`, so the response always arrives as:

```ts
{ reply: string, extracted: IntakeRecord | null }
```

`reply` is shown in the chat. `extracted` stays `null` until enough information has been gathered, at which point the summary card appears.

Every call to Claude happens in the API route. The client never talks to the Anthropic API directly and never sees the key.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add `ANTHROPIC_API_KEY` under **Settings → Environment Variables**.
3. Deploy. No other configuration is needed.

## Security notes

- The API key lives only in `.env.local` (local) or Vercel environment variables (deployed), and is read via `process.env.ANTHROPIC_API_KEY` in the API route.
- `.env.local` and `.env*.local` are gitignored.
- Request bodies are validated with Zod before any model call.
- No conversation data is stored or logged anywhere.

## License

MIT
