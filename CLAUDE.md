# CLAUDE.md

## Commands
- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Watch**: `npm run watch`
- **Test**: `npx vitest run`
- **Type check**: `npx tsc --noEmit`
- **Lint**: `npx eslint src`

## Formatter — Prettier
- Single quotes
- Semicolons always
- 4-space indentation (no tabs)
- Trailing commas: ES5 (objects, arrays, function params)
- Max line length: 100 characters
- Arrow function parens: always — `(x) => x`, never `x => x`
- Line endings: LF
- Control structures (like if, while) must have braces

## Linter — ESLint + typescript-eslint
- `no-explicit-any`: warn — avoid `any`, use `unknown` or a proper type
- `no-unused-vars`: error — remove unused imports and variables immediately
- `explicit-function-return-type`: off — return types on public/protected methods are still good practice
- `no-fallthrough`: error — every switch case must break, return, or throw
- `default-case`: error — every switch must have a default branch

## TypeScript — tsconfig strict mode
- `strict: true` is enabled — this includes `strictNullChecks`, `noImplicitAny`, etc.
- Target: ESNext; module: CommonJS
- Never use `any` — prefer `unknown` with a type guard, or a concrete type
- Never suppress type errors with `// @ts-ignore` or `// @ts-expect-error` without a comment explaining why
- Use `as` casts only when the type is genuinely known and cannot be inferred

## Naming conventions (observed in codebase)
- Classes: `PascalCase`
- Private/protected members: `_camelCase` (underscore prefix)
- Constants (module-level): `UPPER_SNAKE_CASE`
- Interfaces: `IPascalCase` prefix (e.g. `IGrid`, `IDaedalus`)
- Files: `PascalCase` for classes (`Grid.ts`), `camelCase` for utilities/indexes (`index.ts`)
- Named exports only — no default exports

## Code patterns
- No `console.log` — remove before committing
- Pool objects in hot loops (per-frame code) — no allocations inside `update()`
- Abstract classes use lifecycle hooks (`createCell`, `discardCell`, `copyCell`) — follow the pattern
- Prefer `readonly` on constructor-injected dependencies
- Do not add speculative abstractions — implement only what is needed now

## Tests — Vitest
- Test files go in `__tests__/`, named `ClassName.test.ts`
- Globals (`describe`, `it`, `expect`) are available without imports
- Environment: node (no DOM in tests)
- Run a single file: `npx vitest run __tests__/MyClass.test.ts`
