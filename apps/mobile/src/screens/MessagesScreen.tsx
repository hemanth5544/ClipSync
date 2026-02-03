import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SyncedMessage } from "@clipsync/types";
import { api } from "../lib/api";
import { useTheme } from "../contexts/ThemeContext";
import { requestSmsPermission, hasSmsPermission, readSmsFromDevice } from "../lib/sms";
import { formatRelativeTime } from "../lib/timeUtils";

const MESSAGES_SYNC_ENABLED_KEY = "messages_sync_enabled";
const MESSAGES_LAST_SYNC_AT_KEY = "messages_last_sync_at";
const BACKGROUND_SYNC_INTERVAL_MS = 45000; // 45 seconds

/** Running inside Expo Go — SMS read is not available; need a dev build. */
const isExpoGo = Constants.appOwnership === "expo";

export default function MessagesScreen() {
  const { actualTheme } = useTheme();
  const [messages, setMessages] = useState<SyncedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const isDark = actualTheme === "dark";

  const deviceId = Device.deviceName || Device.modelName || "Mobile";

  const loadMessages = useCallback(async () => {
    try {
      const response = await api.messages.list({ pageSize: 100 });
      setMessages(response.data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load messages";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-check SMS permission when screen is focused (e.g. after user grants in dialog or returns from Settings)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      hasSmsPermission().then(setPermissionGranted);
    }, [])
  );

  useEffect(() => {
    loadMessages();
    (async () => {
      const enabled = await AsyncStorage.getItem(MESSAGES_SYNC_ENABLED_KEY);
      setSyncEnabled(enabled === "true");
      if (Platform.OS === "android") {
        setPermissionGranted(await hasSmsPermission());
      } else {
        setPermissionGranted(false);
      }
    })();
  }, [loadMessages]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleRequestPermission = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Not available", "SMS sync is only supported on Android. iOS does not allow apps to read messages.");
      return;
    }
    const granted = await requestSmsPermission();
    setPermissionGranted(granted);
    if (!granted) {
      Alert.alert(
        "Permission needed",
        "SMS read permission is required to sync your messages. You can enable it in Settings."
      );
    }
  };

  const handleSyncNow = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Not available", "SMS sync is only supported on Android.");
      return;
    }
    if (isExpoGo) {
      Alert.alert(
        "Not available in Expo Go",
        "SMS sync needs a development build. Expo Go cannot read SMS. Use 'Sync sample messages' to test desktop notifications, or build with: npx expo prebuild && add react-native-get-sms-android."
      );
      return;
    }
    const hasPermission = permissionGranted ?? (await hasSmsPermission());
    if (!hasPermission) {
      const granted = await requestSmsPermission();
      if (!granted) {
        Alert.alert("Permission needed", "Please allow SMS read access to sync messages.");
        return;
      }
      setPermissionGranted(true);
    }

    setSyncing(true);
    try {
      const smsList = await readSmsFromDevice({ maxCount: 500 });
      if (smsList.length === 0) {
        Alert.alert(
          "No messages read",
          "No SMS were read. Check that you granted SMS permission and use a development build (not Expo Go)."
        );
      } else {
        const payload = smsList.map((s) => ({
          body: s.body,
          sender: s.sender,
          address: s.address,
          receivedAt: s.receivedAt,
        }));
        const result = await api.messages.push(deviceId, payload);
        const maxReceived = Math.max(...smsList.map((s) => new Date(s.receivedAt).getTime()));
        await AsyncStorage.setItem(MESSAGES_LAST_SYNC_AT_KEY, String(maxReceived));
        Alert.alert("Synced", `${result.synced} message(s) synced. New messages will auto-sync and desktop will get push notifications.`);
        loadMessages();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Sync failed";
      Alert.alert("Sync failed", msg);
    } finally {
      setSyncing(false);
    }
  };

  /** Push a few sample messages so you can test sync + desktop notifications in Expo Go. */
  const handleSyncSampleMessages = async () => {
    setSyncing(true);
    try {
      const now = new Date();
      const samples = [
        { body: "Sample: Meeting at 3pm tomorrow.", sender: "Sample", address: "sample", receivedAt: new Date(now.getTime() - 3600000).toISOString() },
        { body: "Sample: Your code is ready for review.", sender: "Dev Team", address: "dev", receivedAt: new Date(now.getTime() - 7200000).toISOString() },
        { body: "Sample: Reminder — sync works! Check your desktop for notifications.", sender: "ClipSync", address: "clipsync", receivedAt: now.toISOString() },
      ];
      const result = await api.messages.push(deviceId, samples);
      Alert.alert("Sample synced", `${result.synced} sample message(s) synced. Check this list and your desktop for push notifications.`);
      loadMessages();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Sync failed";
      Alert.alert("Sync failed", msg);
    } finally {
      setSyncing(false);
    }
  };

  const toggleSyncEnabled = async () => {
    const next = !syncEnabled;
    await AsyncStorage.setItem(MESSAGES_SYNC_ENABLED_KEY, next ? "true" : "false");
    setSyncEnabled(next);
  };

  // Background sync: when sync is On and permission granted, periodically push new SMS to API so desktop gets them and can show notifications
  const syncNewMessagesToApi = useCallback(async () => {
    if (Platform.OS !== "android" || isExpoGo || !(permissionGranted ?? false)) return;
    const enabled = await AsyncStorage.getItem(MESSAGES_SYNC_ENABLED_KEY);
    if (enabled !== "true") return;
    try {
      const lastAt = await AsyncStorage.getItem(MESSAGES_LAST_SYNC_AT_KEY);
      const sinceTs = lastAt ? parseInt(lastAt, 10) : 0;
      const smsList = await readSmsFromDevice({ sinceTimestamp: sinceTs, maxCount: 100 });
      if (smsList.length === 0) return;
      const payload = smsList.map((s) => ({
        body: s.body,
        sender: s.sender,
        address: s.address,
        receivedAt: s.receivedAt,
      }));
      await api.messages.push(deviceId, payload);
      const maxReceived = Math.max(...smsList.map((s) => new Date(s.receivedAt).getTime()));
      await AsyncStorage.setItem(MESSAGES_LAST_SYNC_AT_KEY, String(maxReceived));
      loadMessages();
    } catch (e) {
      // Silent fail for background sync
    }
  }, [deviceId, loadMessages, permissionGranted]);

  useEffect(() => {
    if (!syncEnabled || permissionGranted !== true || isExpoGo || Platform.OS !== "android") return;
    const run = () => syncNewMessagesToApi();
    run(); // run once soon
    const interval = setInterval(run, BACKGROUND_SYNC_INTERVAL_MS);
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") run();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [syncEnabled, permissionGranted, syncNewMessagesToApi]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#3b82f6"} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Sync phone messages</Text>
          {isExpoGo ? (
            <>
              <View style={[styles.expoGoBanner, isDark && styles.expoGoBannerDark]}>
                <Ionicons name="information-circle" size={22} color={isDark ? "#93c5fd" : "#2563eb"} />
                <Text style={[styles.expoGoBannerText, isDark && styles.textLight]}>
                  SMS sync is not available in Expo Go. The system cannot show the SMS permission dialog here. To sync real messages, create a development build (see README). Use the button below to sync sample messages and test desktop notifications.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, syncing && styles.buttonDisabled]}
                onPress={handleSyncSampleMessages}
                disabled={syncing}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                )}
                <Text style={styles.buttonText}>{syncing ? "Syncing…" : "Sync sample messages"}</Text>
              </TouchableOpacity>
            </>
          ) : Platform.OS === "android" ? (
            <>
              <Text style={[styles.hint, isDark && styles.textMuted]}>
                {permissionGranted === true
                  ? "New messages sync automatically when SMS sync is On. Desktop gets push notifications."
                  : "Allow access to your SMS so they sync to ClipSync. On desktop you'll get push notifications for new messages."}
              </Text>
              {permissionGranted === true && (
                <View style={[styles.permissionBadge, isDark && styles.permissionBadgeDark]}>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  <Text style={[styles.permissionBadgeText, isDark && styles.textLight]}>SMS access allowed</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={[styles.label, isDark && styles.textLight]}>SMS sync</Text>
                <TouchableOpacity
                  onPress={toggleSyncEnabled}
                  style={[styles.switch, syncEnabled && styles.switchOn]}
                >
                  <Text style={[styles.switchText, syncEnabled && styles.switchTextOn]}>{syncEnabled ? "On" : "Off"}</Text>
                </TouchableOpacity>
              </View>
              {permissionGranted === false && (
                <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Allow SMS access</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, syncing && styles.buttonDisabled]}
                onPress={handleSyncNow}
                disabled={syncing}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                )}
                <Text style={styles.buttonText}>{syncing ? "Syncing…" : "Sync now"}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.hint, isDark && styles.textMuted]}>
              SMS sync is not available on iOS. Use an Android device to sync messages.
            </Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, isDark && styles.textLight, { marginTop: 24 }]}>
          Synced messages ({messages.length})
        </Text>
        {messages.length === 0 ? (
          <View style={[styles.emptyCard, isDark && styles.cardDark]}>
            <Ionicons name="chatbubbles-outline" size={48} color={isDark ? "#666" : "#999"} />
            <Text style={[styles.emptyText, isDark && styles.textMuted]}>
              No messages synced yet. Tap “Sync now” on Android to sync your SMS.
            </Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View key={msg.id} style={[styles.messageCard, isDark && styles.cardDark]}>
              <View style={styles.messageHeader}>
                <Text style={[styles.sender, isDark && styles.textLight]} numberOfLines={1}>
                  {msg.sender || msg.address || "Unknown"}
                </Text>
                <Text style={[styles.time, isDark && styles.textMuted]}>
                  {formatRelativeTime(msg.receivedAt)}
                </Text>
              </View>
              <Text style={[styles.body, isDark && styles.textLight]} numberOfLines={4}>
                {msg.body}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  containerDark: { backgroundColor: "#000" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardDark: { backgroundColor: "#111" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10, color: "#000" },
  textLight: { color: "#fff" },
  textMuted: { color: "#666" },
  hint: { fontSize: 14, color: "#666", marginBottom: 12, lineHeight: 20 },
  expoGoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  expoGoBannerDark: { backgroundColor: "#1e3a5f" },
  expoGoBannerText: { flex: 1, fontSize: 14, lineHeight: 20, color: "#1e40af" },
  permissionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  permissionBadgeDark: { backgroundColor: "rgba(34, 197, 94, 0.2)" },
  permissionBadgeText: { fontSize: 14, fontWeight: "600", color: "#166534" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 16, color: "#000" },
  switch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
  },
  switchOn: { backgroundColor: "#3b82f6" },
  switchText: { fontSize: 14, color: "#333", fontWeight: "600" },
  switchTextOn: { color: "#fff" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#333",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonPrimary: { backgroundColor: "#3b82f6" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginTop: 8,
  },
  emptyText: { marginTop: 12, textAlign: "center", color: "#666" },
  messageCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 10,
    overflow: "hidden",
  },
  messageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sender: { fontSize: 15, fontWeight: "600", color: "#000", flex: 1 },
  time: { fontSize: 12, color: "#666" },
  body: { fontSize: 14, color: "#333", lineHeight: 20 },
});
