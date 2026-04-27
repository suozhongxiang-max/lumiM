# Repository Guidelines

## Project Structure & Module Organization

Routes and screens live under `app/` using Expo Router; each folder maps to a screen and may include layout groups such as `(auth)` or `(tabs)`. Shared primitives belong in `components/ui/`, while feature widgets stay in `components/pages/`. Global data flows through `stores/` (Zustand) and `services/` (API clients in `services/api-client.ts`). Cross-cutting helpers sit in `utils/`, `constants/`, and `styles/`. Native build artifacts remain under `ios/` and `android/`, and regression helpers plus diagnostics scripts reside in `__tests__/`.

## Build, Test, and Development Commands

- `npm start` — boot the Expo Metro server for local development.
- `npm run ios` / `npm run android` — launch the native simulators through Expo.
- `npm run web` — verify responsive behavior in a browser shell.
- `npm run lint` / `npm run lint:fix` — inspect or auto-fix ESLint violations.
- `npm run format` — normalize Markdown/JSON; `npm run reset-project` restores the Expo template when the workspace drifts.

## Coding Style & Naming Conventions

Write strict TypeScript and ES2023 modules with functional, file-scoped components. Keep layout props declarative and colocate hooks in `hooks/` or feature folders. Use camelCase for variables/functions, PascalCase for components and Zustand stores, and kebab-case for files unless Expo Router mandates PascalCase segments. Indent with 2 spaces, run Prettier via the provided config, and respect the shared ESLint rules that extend `eslint-config-expo`.

## Testing Guidelines

All smoke and integration coverage belongs under `__tests__/`, following the `auth.test.ts` pattern of exporting helper routines plus a `runAllTests` orchestrator. Execute suites with `npx ts-node __tests__/auth.test.ts` (install `ts-node` locally if missing) and capture console output for PR comments. Name new specs `*.test.ts`, favor deterministic mocks through `useXYZStore.getState()`, and prioritize flows touching auth, routing, and token persistence until CI lands.

## Commit & Pull Request Guidelines

Commits should be short, present tense, and imperative (e.g., `Improve onboarding carousel spacing`) and stay under 72 characters. For PRs, include a concise purpose summary, reproduction steps, and screenshots or screen recordings whenever UI changes occur. Confirm `npm run lint` and the manual test suite succeed, ensure Expo boots cleanly (`npm start`), and tag maintainers responsible for the touched folders (services, routing, UI) so reviews stay focused.

## Security & Configuration Tips

Do not check secrets into the repo—load them through secure Expo config or local `.env` files referenced in `config/`. When integrating new services, register endpoints inside `services/api-client.ts` and gate experimental features behind environment flags to avoid leaking unfinished flows in production builds.

<!--以下内容为用户自行填写，禁止修改-->

# 参考

/Users/yaotutu/Desktop/code/tope-lumi/lumi-server 这是我们的服务端代码
/Users/yaotutu/Desktop/code/tope-lumi/lumi-web-next 这是我们的web页面代码

# 重要提示

- 禁止私自运行项目，如需要运行项目，让用户自行运行
- 始终用中文回答我的问题
