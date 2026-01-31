/**
 * Client-side encryption for the Secure Vault (React Native).
 * Uses @noble packages for cross-platform crypto without Web Crypto API.
 */
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { gcm } from "@noble/ciphers/aes";
import { randomBytes } from "@noble/ciphers/webcrypto";

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const NONCE_LENGTH = 12;
const KEY_LENGTH = 32;

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
): Promise<Uint8Array> {
  const salt = base64ToBytes(saltBase64);
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const key = pbkdf2(sha256, passwordBytes, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_LENGTH,
  });
  return key;
}

export interface SecureClipPayload {
  title: string;
  content: string;
}

export async function encryptPayload(
  key: Uint8Array,
  payload: SecureClipPayload
): Promise<{ encryptedPayload: string; nonce: string }> {
  const nonce = randomBytes(NONCE_LENGTH);
  const aes = gcm(key, nonce);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = aes.encrypt(plaintext);
  return {
    encryptedPayload: bytesToBase64(ciphertext),
    nonce: bytesToBase64(nonce),
  };
}

export async function decryptPayload(
  key: Uint8Array,
  encryptedPayload: string,
  nonce: string
): Promise<SecureClipPayload> {
  const ciphertext = base64ToBytes(encryptedPayload);
  const nonceBytes = base64ToBytes(nonce);
  const aes = gcm(key, nonceBytes);
  const plaintext = aes.decrypt(ciphertext);
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext)) as SecureClipPayload;
}
