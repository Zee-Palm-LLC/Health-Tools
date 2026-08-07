# Health Tools

A collection of open-source health tools — symptom intake, booking automation, exercise form detection, and more. Built by [Zee Palm](https://zeepalm.com).

Each tool is a self-contained project in its own directory, with its own dependencies, setup instructions, and README. There is no shared build system: clone the repo, `cd` into the tool you want, and follow its README. Tools are deliberately independent so they can use whatever stack fits the problem.

> **None of these tools provide medical advice or clinical decision-making.** They handle intake, scheduling, and form-factor problems around care — not care itself. Each tool states its own limitations in its README.

## Tools

| Tool | What it does | Stack | Status |
| ---- | ------------ | ----- | ------ |
| [**symptom-intake**](symptom-intake) | Turns a casual health complaint into a structured intake record — symptom, duration, severity, associated symptoms, red flags | Next.js, TypeScript, DeepSeek | ✅ Available |
| **booking-automation** | Automates appointment scheduling and reminders for clinics | TBD | 🚧 Planned |
| **exercise-form-detection** | Detects and scores exercise form from video for gyms and physio | TBD | 🚧 Planned |

## Getting started

```bash
git clone https://github.com/Zee-Palm-LLC/Health-Tools.git
cd Health-Tools/symptom-intake
```

Then follow that tool's README. Every tool ships a `.env.example` listing the environment variables it needs — copy it to `.env.local` and fill in your own values. Real keys are never committed.

## Repository layout

```
Health-Tools/
├── README.md              you are here
├── LICENSE
├── .gitignore             shared ignore rules, applied across all tools
└── symptom-intake/        each tool is fully self-contained
    ├── README.md
    ├── .env.example
    └── ...
```

## Contributing

Adding a tool means adding a top-level directory. Each one should be independently runnable and ship with:

- a `README.md` covering what it does, its stack, setup steps, and its limitations
- a `.env.example` if it needs configuration, with no real values
- no committed secrets, build output, or dependencies

Add a row to the table above so the tool is discoverable from the front door.

## License

MIT — see [LICENSE](LICENSE).
