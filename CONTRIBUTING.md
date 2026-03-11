# Contributing to timeslottr

Thanks for your interest in contributing! Here's how to get started.

## Setup

1. Fork and clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests to make sure everything works:
   ```bash
   npm test
   ```

## Development

```bash
npm run build       # Build with tsup (ESM + CJS)
npm run typecheck   # Run TypeScript type checking
npm test            # Run tests with Vitest
npm run coverage    # Run tests with coverage report
```

## Project structure

- `src/` — Library source code (entry: `src/index.ts`)
- `src/internal/` — Internal implementation details
- `demo/` — Next.js demo site ([timeslottr.vercel.app](https://timeslottr.vercel.app))

## Making changes

1. Create a branch from `master`
2. Make your changes
3. Add or update tests as needed
4. Run `npm test` and `npm run typecheck` to verify
5. Open a pull request against `master`

## Guidelines

- Keep the library **zero-dependency** — do not add runtime dependencies
- Ensure your code works with both ESM and CJS consumers
- Node.js 18+ is the minimum supported version
- If you change the public API, update both `README.md` and `demo/components/api-reference.tsx`

## Reporting bugs

Open an issue at [github.com/tilomitra/timeslottr/issues](https://github.com/tilomitra/timeslottr/issues) with a minimal reproduction.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
