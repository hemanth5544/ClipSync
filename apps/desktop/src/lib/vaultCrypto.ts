/**
 * Client-side encryption for the Secure Vault.
 * Master password never leaves the device. All encrypt/decrypt happens locally.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const NONCE_LENGTH = 12;
const KEY_LENGTH = 256;

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function deriveKey(
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  const salt = base64ToBytes(saltBase64);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface SecureClipPayload {
  title: string;
  content: string;
}

export async function encryptPayload(
  key: CryptoKey,
  payload: SecureClipPayload
): Promise<{ encryptedPayload: string; nonce: string }> {
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, tagLength: 128 },
    key,
    plaintext
  );
  return {
    encryptedPayload: bytesToBase64(new Uint8Array(ciphertext)),
    nonce: bytesToBase64(nonce),
  };
}

export async function decryptPayload(
  key: CryptoKey,
  encryptedPayload: string,
  nonce: string
): Promise<SecureClipPayload> {
  const ciphertext = base64ToBytes(encryptedPayload);
  const nonceBytes = base64ToBytes(nonce);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonceBytes, tagLength: 128 },
    key,
    ciphertext
  );
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext)) as SecureClipPayload;
}
