/**
 * SMS read/sync for Android.
 * iOS does not allow third-party apps to read SMS. This module is Android-only.
 *
 * To actually read SMS on Android you need a development build (expo-dev-client)
 * and a native module such as react-native-get-sms-android. In managed Expo Go,
 * readSmsFromDevice() returns [] and sync will only push messages you add via
 * a native module when you integrate it.
 */

import { Platform, PermissionsAndroid } from "react-native";

export interface SmsItem {
  body: string;
  sender?: string;
  address?: string;
  receivedAt: string; // ISO
}

// PermissionsAndroid is undefined on web and some runtimes — only use it on Android inside functions.
function getPermissionsAndroid(): typeof PermissionsAndroid | null {
  if (Platform.OS !== "android") return null;
  try {
    return PermissionsAndroid ?? null;
  } catch {
    return null;
  }
}

export async function requestSmsPermission(): Promise<boolean> {
  const PA = getPermissionsAndroid();
  if (!PA?.PERMISSIONS) return false;
  try {
    const { READ_SMS, RECEIVE_SMS } = PA.PERMISSIONS;
    const granted = await PA.requestMultiple([READ_SMS, RECEIVE_SMS]);
    return (
      granted[READ_SMS] === PA.RESULTS.GRANTED &&
      granted[RECEIVE_SMS] === PA.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

export async function hasSmsPermission(): Promise<boolean> {
  const PA = getPermissionsAndroid();
  if (!PA?.PERMISSIONS) return false;
  try {
    const { READ_SMS, RECEIVE_SMS } = PA.PERMISSIONS;
    const read = await PA.check(READ_SMS);
    const receive = await PA.check(RECEIVE_SMS);
    return read && receive;
  } catch {
    return false;
  }
}

/**
 * Read SMS from the device. Android only.
 * In managed Expo Go this returns [] unless you use a development build
 * with a native SMS module (e.g. react-native-get-sms-android).
 * Add that package and implement the read below to enable real SMS sync.
 */
export async function readSmsFromDevice(_options?: {
  maxCount?: number;
  sinceTimestamp?: number;
}): Promise<SmsItem[]> {
  if (Platform.OS !== "android") return [];

  // Optional: use native module when available (development build with react-native-get-sms-android)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SmsAndroid = require("react-native-get-sms-android");
    return new Promise((resolve) => {
      const maxCount = _options?.maxCount ?? 200;
      const filter: { box: string; minDate?: number } = { box: "inbox" };
      if (_options?.sinceTimestamp) filter.minDate = _options.sinceTimestamp;
      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: string) => {
          console.warn("[SMS] list fail:", fail);
          resolve([]);
        },
        (_count: number, smsList: string) => {
          try {
            const list: Array<{ body: string; address: string; date: number }> =
              JSON.parse(smsList);
            resolve(
              list.slice(0, maxCount).map((s) => ({
                body: s.body || "",
                address: s.address,
                sender: s.address,
                receivedAt: new Date(s.date).toISOString(),
              }))
            );
          } catch {
            resolve([]);
          }
        }
      );
    });
  } catch {
    return [];
  }
}
