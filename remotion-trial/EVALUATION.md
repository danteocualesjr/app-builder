# Remotion trial: licensing and app-builder integration

This folder was scaffolded with `create-video@latest --blank`. A sample render was produced locally with:

`npx remotion render src/index.ts MyComp out/trial.mp4`

(`out/` is gitignored; re-run the command to regenerate.)

## 1. Can you use Remotion on your products? (license)

Per [Remotion license docs](https://www.remotion.dev/docs/license), use without a company license is allowed if **any** of these applies:

- Individual use
- For-profit organization with **at most 3 employees**
- Non-profit / not-for-profit
- Evaluating fit and **not** yet using it commercially

Otherwise you need a **company license** ([remotion.pro](https://remotion.pro/), [FAQ](https://www.remotion.pro/faq)). Full terms: [LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). Questions: `hi@remotion.dev`.

**Self-check before shipping:**

- [ ] Entity type (individual / nonprofit / small for-profit ≤3 / larger)
- [ ] Commercial use in production vs evaluation only
- [ ] If required, company license purchased or in procurement

## 2. Using Remotion next to the Next.js `app-builder` app (brownfield)

Per [Installation in existing projects](https://www.remotion.dev/docs/brownfield):

- Add a dedicated folder (e.g. `remotion/`) with `Composition.tsx`, `Root.tsx`, and an entry file that calls `registerRoot(RemotionRoot)`.
- Run Studio: `npx remotion studio <path-to-entry.ts>` (example: `npx remotion studio remotion/index.ts`).
- Render: `npx remotion render <entry> <compositionId> <output.mp4>`.
- Avoid `tsconfig` `paths` that remap `import "remotion"` to a local folder name `remotion` without a prefix.
- Optional packages by use case:
  - In-app preview: [`@remotion/player`](https://www.remotion.dev/docs/player/installation)
  - Node renders: [`@remotion/renderer`](https://www.remotion.dev/docs/renderer)
  - Lambda: [`@remotion/lambda`](https://www.remotion.dev/docs/lambda/setup)
- ESLint: `@remotion/eslint-plugin` with overrides scoped to Remotion files (see brownfield doc).

## 3. React 19 compatibility (verified for this scaffold)

This trial pins **Remotion 4.0.459** with **React 19.2.3** / **react-dom 19.2.3** (see [package.json](./package.json)). That combination installs and renders successfully (CLI render to MP4 completed).

The parent [app-builder](../package.json) uses **React 19.2.4**. For a merged monorepo or shared dependencies, align `react`, `react-dom`, and `@types/react` across the Next app and Remotion folder to a single version line Remotion supports, then run Studio and a test render after integration.
