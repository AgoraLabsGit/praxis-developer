import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    return null;
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a string. Returns plaintext if ENCRYPTION_KEY is not configured.
 * Format: iv:authTag:encrypted (all hex)
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  if (!key) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string. Returns as-is if not in encrypted format (backward compat).
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  if (!key) return encrypted;

  const parts = encrypted.split(':');
  if (parts.length !== 3) return encrypted;

  const [ivHex, authTagHex, encryptedText] = parts;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encrypted;
  }
}
