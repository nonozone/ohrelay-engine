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
