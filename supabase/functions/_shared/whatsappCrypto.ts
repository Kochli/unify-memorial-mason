/**
 * Encrypt/decrypt Twilio API key secret for whatsapp_connections.
 * Uses AES-256-GCM. Key from env WHATSAPP_SECRET_ENCRYPTION_KEY (base64, 32 bytes).
 * Stored format: base64(iv || ciphertext) where iv is 12 bytes, ciphertext includes 16-byte auth tag.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

function getKeyMaterial(): CryptoKey {
  const raw = Deno.env.get('WHATSAPP_SECRET_ENCRYPTION_KEY');
  if (!raw || raw.length < 32) {
    throw new Error('WHATSAPP_SECRET_ENCRYPTION_KEY must be set (base64, 32+ bytes decoded)');
  }
  const binary = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  if (binary.length < 32) {
    throw new Error('WHATSAPP_SECRET_ENCRYPTION_KEY must decode to at least 32 bytes');
  }
  return crypto.subtle.importKey(
    'raw',
    binary.slice(0, 32),
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) keyPromise = getKeyMaterial();
  return keyPromise;
}

/**
 * Encrypt plaintext (e.g. Twilio API key secret). Returns base64(iv || ciphertext).
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: 128 },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt value produced by encryptSecret. plaintext must never be logged.
 */
export async function decryptSecret(encryptedBase64: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  if (combined.length < IV_LENGTH + 16) {
    throw new Error('Invalid encrypted value');
  }
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: 128 },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
