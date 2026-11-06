# Contributing to Inkwell Studio

Thank you for contributing to Inkwell Studio! This project is maintained with high engineering standards for East African creators.

## Code Standards
- **Strict Typing**: All TypeScript code must pass with `strict: true` and zero compiler warnings.
- **No Stubs**: PRs with `TODO`, `...`, or placeholder logic will not be approved. Implement complete, tested solutions.
- **Zero Secrets in Code**: Secrets and API keys must be loaded exclusively via environment variables. Do not log PII or secrets.

## Commit Guidelines
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(scope): add feature description`
- `fix(scope): fix bug description`
- `docs(scope): documentation update`
- `test(scope): add or improve tests`
- `refactor(scope): code change without behavior changes`

## Kenyan & Regional Context
- Currency calculations should default to `KES` (Kenyan Shilling) with secondary `USD` conversion.
- Times and scheduling align with `Africa/Nairobi` (UTC+3).
- Provide Swahili localization support for UI actions and prompt templates where specified.

## Testing & Verification
Before opening a pull request, ensure all tests pass:
```bash
npm run typecheck
npm run lint
npm run test
```

