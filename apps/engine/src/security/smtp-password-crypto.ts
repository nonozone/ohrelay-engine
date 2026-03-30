import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";

const SMTP_PASSWORD_CIPHER_VERSION = "v1";
const SMTP_PASSWORD_CIPHER_ALGORITHM = "aes-256-gcm";
const DEV_FALLBACK_MASTER_KEY = "ohrelay-dev-smtp-credentials-master-key";

export function encryptSmtpPassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    SMTP_PASSWORD_CIPHER_ALGORITHM,
    resolveMasterKey(),
    iv
  );
  const ciphertext = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [
    SMTP_PASSWORD_CIPHER_VERSION,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64")
  ].join(":");
}

export function decryptSmtpPassword(payload: string): string {
  const [version, ivBase64, authTagBase64, ciphertextBase64] =
    payload.split(":");

  if (
    version !== SMTP_PASSWORD_CIPHER_VERSION ||
    !ivBase64 ||
    !authTagBase64 ||
    !ciphertextBase64
  ) {
    throw new Error("Invalid SMTP password ciphertext");
  }

  const decipher = createDecipheriv(
    SMTP_PASSWORD_CIPHER_ALGORITHM,
    resolveMasterKey(),
    Buffer.from(ivBase64, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextBase64, "base64")),
    decipher.final()
  ]).toString("utf8");
}

function resolveMasterKey(): Buffer {
  const rawValue = process.env.SMTP_CREDENTIALS_MASTER_KEY?.trim();

  if (rawValue) {
    if (/^[0-9a-f]{64}$/i.test(rawValue)) {
      return Buffer.from(rawValue, "hex");
    }

    try {
      const decoded = Buffer.from(rawValue, "base64");
      if (decoded.length === 32) {
        return decoded;
      }
    } catch {
      // Fall through to the string-hash fallback below.
    }

    return createHash("sha256").update(rawValue).digest();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SMTP_CREDENTIALS_MASTER_KEY is required in production");
  }

  return createHash("sha256").update(DEV_FALLBACK_MASTER_KEY).digest();
}
