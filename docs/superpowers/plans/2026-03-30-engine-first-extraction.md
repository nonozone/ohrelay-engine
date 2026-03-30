# Engine First Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the first standalone, publicly auditable `apps/engine` modules into `ohrelay-engine` without pulling in private control-plane or SaaS code.

**Architecture:** Build `apps/engine` as an isolated workspace package that only depends on `@ohrelay/shared`, Node built-ins, and public delivery dependencies. Start with low-coupling modules that explain core reply restoration and outbound delivery behavior, then expose them through a narrow `src/index.ts` entrypoint.

**Tech Stack:** TypeScript, Vitest, pnpm workspace, Nodemailer, AWS SES SDK

---

### Task 1: Create the public engine package shell

**Files:**
- Create: `apps/engine/package.json`
- Create: `apps/engine/tsconfig.json`
- Create: `apps/engine/src/index.ts`
- Modify: `apps/engine/README.md`

- [ ] **Step 1: Write the failing package-level test import**

```typescript
// apps/engine/src/index.test.ts
import { describe, expect, it } from "vitest";
import * as engine from "./index.js";

describe("engine public surface", () => {
  it("exports the first standalone extraction modules", () => {
    expect(engine).toHaveProperty("extractThreadHeaders");
    expect(engine).toHaveProperty("rewriteHeaders");
    expect(engine).toHaveProperty("rewriteBootstrapMessage");
    expect(engine).toHaveProperty("resolveIdentity");
    expect(engine).toHaveProperty("encryptSmtpPassword");
    expect(engine).toHaveProperty("decryptSmtpPassword");
    expect(engine).toHaveProperty("createOutboundTraceId");
    expect(engine).toHaveProperty("sendRawEmail");
    expect(engine).toHaveProperty("createSmtpClient");
    expect(engine).toHaveProperty("createResendSmtpClient");
    expect(engine).toHaveProperty("createSesClient");
    expect(engine).toHaveProperty("sendSesRawMessage");
    expect(engine).toHaveProperty("createRawEmailClients");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm --filter @ohrelay/engine test -- --runInBand`
Expected: FAIL because `apps/engine/package.json` and `src/index.ts` do not exist yet.

- [ ] **Step 3: Write the minimal workspace package**

```json
// apps/engine/package.json
{
  "name": "@ohrelay/engine",
  "private": true,
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-ses": "^3.913.0",
    "@ohrelay/shared": "workspace:*",
    "nodemailer": "^7.0.13"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  }
}
```

```json
// apps/engine/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist",
    "noEmit": false
  },
  "include": ["src/**/*.ts"]
}
```

```typescript
// apps/engine/src/index.ts
export * from "./mime/extract-thread-headers.js";
export * from "./mime/rewrite-bootstrap-message.js";
export * from "./mime/rewrite-headers.js";
export * from "./decision/resolve-identity.js";
export * from "./security/smtp-password-crypto.js";
export * from "./outbound-trace-id.js";
export * from "./delivery/send-raw-email.js";
export * from "./delivery/providers/smtp.js";
export * from "./delivery/providers/resend-smtp.js";
export * from "./delivery/ses-client.js";
export * from "./delivery/create-raw-email-client.js";
```

```md
<!-- apps/engine/README.md -->
# apps/engine

Standalone engine package for the public OhRelay trust boundary.

This first extraction batch includes:

- MIME/thread-header parsing and rewriting
- reply identity resolution
- SMTP password encryption helpers
- outbound trace-id generation
- raw-email delivery adapters for SMTP, Resend SMTP, and SES

Still intentionally excluded in this batch:

- database repositories
- HTTP routes and runtime wiring
- SMTP server runtime
- control-plane integrations
```

- [ ] **Step 4: Run test to verify it still fails for missing module files**

Run: `corepack pnpm --filter @ohrelay/engine test -- --runInBand`
Expected: FAIL with import resolution errors for missing module paths under `apps/engine/src`.

- [ ] **Step 5: Commit**

```bash
git add apps/engine/package.json apps/engine/tsconfig.json apps/engine/src/index.ts apps/engine/src/index.test.ts apps/engine/README.md
git commit -m "chore: scaffold public engine package"
```

### Task 2: Import MIME rewriting and thread header extraction

**Files:**
- Create: `apps/engine/src/mime/extract-thread-headers.ts`
- Create: `apps/engine/src/mime/extract-thread-headers.test.ts`
- Create: `apps/engine/src/mime/rewrite-bootstrap-message.ts`
- Create: `apps/engine/src/mime/rewrite-bootstrap-message.test.ts`
- Create: `apps/engine/src/mime/rewrite-headers.ts`
- Create: `apps/engine/src/mime/rewrite-headers.test.ts`

- [ ] **Step 1: Write the failing MIME tests**

Use the private repo behavior as the source of truth and add these tests before the implementation:

```bash
cp /Users/nono/nonoCode/OhRelay/apps/core/src/mime/extract-thread-headers.test.ts apps/engine/src/mime/extract-thread-headers.test.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/mime/rewrite-bootstrap-message.test.ts apps/engine/src/mime/rewrite-bootstrap-message.test.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/mime/rewrite-headers.test.ts apps/engine/src/mime/rewrite-headers.test.ts
```

- [ ] **Step 2: Run MIME tests to verify they fail**

Run: `corepack pnpm --filter @ohrelay/engine test -- --runInBand apps/engine/src/mime`
Expected: FAIL because the corresponding `.ts` implementation files do not exist yet.

- [ ] **Step 3: Copy the MIME implementations**

```bash
cp /Users/nono/nonoCode/OhRelay/apps/core/src/mime/extract-thread-headers.ts apps/engine/src/mime/extract-thread-headers.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/mime/rewrite-bootstrap-message.ts apps/engine/src/mime/rewrite-bootstrap-message.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/mime/rewrite-headers.ts apps/engine/src/mime/rewrite-headers.ts
```

- [ ] **Step 4: Run MIME tests to verify they pass**

Run: `corepack pnpm --filter @ohrelay/engine test -- --runInBand apps/engine/src/mime`
Expected: PASS for all MIME tests, including the non-ASCII header encoding regression.

- [ ] **Step 5: Commit**

```bash
git add apps/engine/src/mime apps/engine/src/index.ts
git commit -m "feat: import public engine mime helpers"
```

### Task 3: Import identity resolution and security helpers

**Files:**
- Create: `apps/engine/src/decision/resolve-identity.ts`
- Create: `apps/engine/src/decision/resolve-identity.test.ts`
- Create: `apps/engine/src/security/smtp-password-crypto.ts`
- Create: `apps/engine/src/security/smtp-password-crypto.test.ts`

- [ ] **Step 1: Write the failing decision and crypto tests**

```bash
cp /Users/nono/nonoCode/OhRelay/apps/core/src/decision/resolve-identity.test.ts apps/engine/src/decision/resolve-identity.test.ts
```

Add a new SMTP password crypto test file with these cases:

```typescript
import { afterEach, describe, expect, it, vi } from "vitest";

describe("smtp password crypto", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a password with a configured master key", () => {
    vi.stubEnv("SMTP_CREDENTIALS_MASTER_KEY", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    const { decryptSmtpPassword, encryptSmtpPassword } = await import("./smtp-password-crypto.js");

    const ciphertext = encryptSmtpPassword("A8JJGSAG");

    expect(ciphertext.startsWith("v1:")).toBe(true);
    expect(decryptSmtpPassword(ciphertext)).toBe("A8JJGSAG");
  });

  it("throws in production when the master key is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SMTP_CREDENTIALS_MASTER_KEY", "");
    const { decryptSmtpPassword } = await import("./smtp-password-crypto.js");

    expect(() => decryptSmtpPassword("v1:bad:bad:bad")).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm --filter @ohrelay/engine test -- --runInBand apps/engine/src/decision apps/engine/src/security`
Expected: FAIL because the implementation files do not exist yet.

- [ ] **Step 3: Copy the decision/security implementations and adjust decision fixtures**

```bash
cp /Users/nono/nonoCode/OhRelay/apps/core/src/decision/resolve-identity.ts apps/engine/src/decision/resolve-identity.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/security/smtp-password-crypto.ts apps/engine/src/security/smtp-password-crypto.ts
```

Replace the private `createDecisionFixtures` import in `resolve-identity.test.ts` with local inline fixtures so the test stays self-contained in the public repo.

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm --filter @ohrelay/engine test -- --runInBand apps/engine/src/decision apps/engine/src/security`
Expected: PASS for identity resolution and password encryption tests.

- [ ] **Step 5: Commit**

```bash
git add apps/engine/src/decision apps/engine/src/security
git commit -m "feat: import identity resolution and smtp crypto helpers"
```

### Task 4: Import outbound delivery and trace-id helpers

**Files:**
- Create: `apps/engine/src/outbound-trace-id.ts`
- Create: `apps/engine/src/outbound-trace-id.test.ts`
- Create: `apps/engine/src/delivery/send-raw-email.ts`
- Create: `apps/engine/src/delivery/send-raw-email.test.ts`
- Create: `apps/engine/src/delivery/providers/smtp.ts`
- Create: `apps/engine/src/delivery/providers/smtp.test.ts`
- Create: `apps/engine/src/delivery/providers/resend-smtp.ts`
- Create: `apps/engine/src/delivery/providers/resend-smtp.test.ts`
- Create: `apps/engine/src/delivery/ses-client.ts`
- Create: `apps/engine/src/delivery/ses-client.test.ts`
- Create: `apps/engine/src/delivery/create-raw-email-client.ts`

- [ ] **Step 1: Write the failing delivery tests**

```bash
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/send-raw-email.test.ts apps/engine/src/delivery/send-raw-email.test.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/providers/smtp.test.ts apps/engine/src/delivery/providers/smtp.test.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/providers/resend-smtp.test.ts apps/engine/src/delivery/providers/resend-smtp.test.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/ses-client.test.ts apps/engine/src/delivery/ses-client.test.ts
```

Add a new trace-id test file with these cases:

```typescript
import { describe, expect, it } from "vitest";

import { createOutboundTraceId } from "./outbound-trace-id.js";

describe("createOutboundTraceId", () => {
  it("keeps SES-safe characters only", () => {
    expect(createOutboundTraceId("client+tag@abc.com", 123)).toBe("trace.123.client-tag@abc.com");
  });

  it("falls back to unknown when the recipient becomes empty", () => {
    expect(createOutboundTraceId("   ", 123)).toBe("trace.123.unknown");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm --filter @ohrelay/engine test -- --runInBand apps/engine/src/delivery apps/engine/src/outbound-trace-id.test.ts`
Expected: FAIL because the delivery and trace-id implementation files do not exist yet.

- [ ] **Step 3: Copy the delivery implementations**

```bash
cp /Users/nono/nonoCode/OhRelay/apps/core/src/outbound-trace-id.ts apps/engine/src/outbound-trace-id.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/send-raw-email.ts apps/engine/src/delivery/send-raw-email.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/providers/smtp.ts apps/engine/src/delivery/providers/smtp.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/providers/resend-smtp.ts apps/engine/src/delivery/providers/resend-smtp.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/ses-client.ts apps/engine/src/delivery/ses-client.ts
cp /Users/nono/nonoCode/OhRelay/apps/core/src/delivery/create-raw-email-client.ts apps/engine/src/delivery/create-raw-email-client.ts
```

If needed, remove any runtime-env fields that are unused in the public package API while keeping behavior unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm --filter @ohrelay/engine test -- --runInBand apps/engine/src/delivery apps/engine/src/outbound-trace-id.test.ts`
Expected: PASS for SMTP, Resend SMTP, SES, raw-email sending, and trace-id sanitization coverage.

- [ ] **Step 5: Commit**

```bash
git add apps/engine/src/delivery apps/engine/src/outbound-trace-id.ts apps/engine/src/outbound-trace-id.test.ts
git commit -m "feat: import public engine delivery helpers"
```

### Task 5: Update docs and run full verification

**Files:**
- Modify: `README.md`
- Modify: `docs/repository-scope.md`
- Modify: `apps/engine/README.md`

- [ ] **Step 1: Update docs to reflect the new public engine surface**

Add `apps/engine` to the “What You Can Audit Here Today” list and replace placeholder language with the concrete first-batch modules now present.

- [ ] **Step 2: Run full workspace verification**

Run: `corepack pnpm install`
Expected: lockfile updates if new dependencies were added.

Run: `corepack pnpm --filter @ohrelay/engine test`
Expected: PASS

Run: `corepack pnpm --filter @ohrelay/engine typecheck`
Expected: PASS

Run: `corepack pnpm test`
Expected: PASS across `packages/shared`, `apps/worker`, and `apps/engine`

Run: `corepack pnpm typecheck`
Expected: PASS across the full public workspace

- [ ] **Step 3: Commit**

```bash
git add README.md docs/repository-scope.md apps/engine/README.md pnpm-lock.yaml package.json apps/engine/package.json
git commit -m "docs: publish first public engine extraction"
```
