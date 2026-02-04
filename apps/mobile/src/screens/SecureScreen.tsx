import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { api } from "../lib/api";
import { deriveKey, encryptPayload, decryptPayload } from "../lib/vaultCrypto";
import { useTheme } from "../contexts/ThemeContext";

interface DecryptedClip {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function SecureScreen() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === "dark";
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [clips, setClips] = useState<DecryptedClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const keyRef = useRef<Uint8Array | null>(null);

  const bg = isDark ? "#000" : "#fff";
  const cardBg = isDark ? "#1a1a1a" : "#f5f5f5";
  const text = isDark ? "#fff" : "#000";
  const muted = isDark ? "#888" : "#666";

  const clearKey = useCallback(() => {
    keyRef.current = null;
    setUnlocked(false);
    setClips([]);
  }, []);

  const loadVaultStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await api.secure.getVaultStatus();
      setVaultExists(status.exists);
      if (status.exists && status.salt) {
        setSalt(status.salt);
        setUnlockOpen(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load vault status");
      setVaultExists(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVaultStatus();
  }, [loadVaultStatus]);

  const loadClips = async (key: Uint8Array): Promise<boolean> => {
    const encrypted = await api.secure.getClips();
    const decrypted: DecryptedClip[] = [];
    for (let i = 0; i < encrypted.length; i++) {
      const c = encrypted[i];
      try {
        const payload = await decryptPayload(key, c.encryptedPayload, c.nonce);
        decrypted.push({ id: c.id, ...payload, createdAt: c.createdAt });
      } catch {
        // Skip corrupted entries
      }
      // Yield to UI every clip so screen doesn't freeze
      if (i < encrypted.length - 1) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    if (encrypted.length > 0 && decrypted.length === 0) {
      throw new Error("Wrong password");
    }
    setClips(decrypted);
    return true;
  };

  const handleSetup = async () => {
    if (!masterPassword || masterPassword.length < 6) {
      Alert.alert("Invalid password", "Password must be at least 6 characters");
      return;
    }
    if (masterPassword !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please confirm your password");
      return;
    }
    setSettingUp(true);
    InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          const { salt: newSalt } = await api.secure.createVault();
          setSalt(newSalt);
          setVaultExists(true);
          const key = await deriveKey(masterPassword, newSalt);
          keyRef.current = key;
          setUnlocked(true);
          setSetupOpen(false);
          setMasterPassword("");
          setConfirmPassword("");
          await loadClips(key);
          setTimeout(() => Alert.alert("Success", "Secure vault created"), 100);
        } catch (error) {
          Alert.alert("Error", error instanceof Error ? error.message : "Failed to create vault");
        } finally {
          setSettingUp(false);
        }
      })();
    });
  };

  const handleUnlock = async () => {
    if (!masterPassword || !salt) return;
    const password = masterPassword;
    setUnlocking(true);
    // Force UI to paint "Unlocking…" before blocking on crypto (requestAnimationFrame + short delay)
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          const key = await deriveKey(password, salt!);
          await loadClips(key);
          keyRef.current = key;
          setUnlocked(true);
          setUnlockOpen(false);
          setMasterPassword("");
          setTimeout(() => Alert.alert("Success", "Vault unlocked"), 100);
        } catch (error) {
          setUnlocked(false);
          keyRef.current = null;
          setClips([]);
          Alert.alert("Wrong password", "Please try again");
        } finally {
          setUnlocking(false);
        }
      }, 80);
    });
  };

  const handleLock = () => {
    clearKey();
    setUnlockOpen(true);
  };

  const handleAdd = async () => {
    if (!addTitle.trim() || !addContent.trim() || !keyRef.current) return;
    try {
      const { encryptedPayload, nonce } = await encryptPayload(keyRef.current, {
        title: addTitle.trim(),
        content: addContent.trim(),
      });
      const { id, createdAt } = await api.secure.createClip(encryptedPayload, nonce);
      setClips((prev) => [
        { id, title: addTitle.trim(), content: addContent.trim(), createdAt },
        ...prev,
      ]);
      setAddOpen(false);
      setAddTitle("");
      setAddContent("");
      Alert.alert("Saved", "Password added to vault");
    } catch (error) {
      Alert.alert("Error", "Failed to save");
    }
  };

  const handleCopy = async (content: string) => {
    await Clipboard.setStringAsync(content);
    Alert.alert("Copied", "Copied to clipboard");
  };

  const handleDelete = async (id: string) => {
    try {
      await api.secure.deleteClip(id);
      setClips((prev) => prev.filter((c) => c.id !== id));
      Alert.alert("Deleted", "Password removed");
    } catch {
      Alert.alert("Error", "Failed to delete");
    }
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {!vaultExists && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Ionicons name="shield-checkmark" size={32} color="#f59e0b" style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: text }]}>Set up Secure Vault</Text>
            <Text style={[styles.cardDesc, { color: muted }]}>
              Store passwords and secrets encrypted. Your master password is never sent to our servers.
            </Text>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => setSetupOpen(true)}>
              <Ionicons name="lock-closed" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>Create vault</Text>
            </TouchableOpacity>
          </View>
        )}

        {vaultExists && !unlocked && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Ionicons name="lock-closed" size={32} color={muted} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: text }]}>Vault locked</Text>
            <Text style={[styles.cardDesc, { color: muted }]}>
              Enter your master password to view your saved passwords.
            </Text>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => setUnlockOpen(true)}>
              <Ionicons name="lock-open" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>Unlock vault</Text>
            </TouchableOpacity>
          </View>
        )}

        {unlocked && (
          <>
            <View style={styles.toolbar}>
              <Text style={[styles.toolbarText, { color: muted }]}>
                {clips.length} password{clips.length !== 1 ? "s" : ""} stored
              </Text>
              <View style={styles.toolbarBtns}>
                <TouchableOpacity style={[styles.btnSm, { borderColor: muted }]} onPress={handleLock}>
                  <Ionicons name="lock-closed" size={16} color={text} />
                  <Text style={[styles.btnSmText, { color: text }]}>Lock</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnSm, styles.btnSmPrimary]} onPress={() => setAddOpen(true)}>
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.btnSmPrimaryText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {clips.length === 0 ? (
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                <Ionicons name="shield-checkmark-outline" size={48} color={muted} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: muted }]}>No passwords yet</Text>
                <TouchableOpacity onPress={() => setAddOpen(true)}>
                  <Text style={[styles.link, { color: isDark ? "#60a5fa" : "#2563eb" }]}>Add your first password</Text>
                </TouchableOpacity>
              </View>
            ) : (
              clips.map((clip) => (
                <View key={clip.id} style={[styles.clipCard, { backgroundColor: cardBg }]}>
                  <View style={styles.clipHeader}>
                    <Text style={[styles.clipTitle, { color: text }]} numberOfLines={1}>{clip.title}</Text>
                    <View style={styles.clipActions}>
                      <TouchableOpacity onPress={() => toggleShowPassword(clip.id)}>
                        <Ionicons
                          name={showPasswords.has(clip.id) ? "eye-off" : "eye"}
                          size={22}
                          color={muted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleCopy(clip.content)}>
                        <Ionicons name="copy-outline" size={22} color={muted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(clip.id)}>
                        <Ionicons name="trash-outline" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.clipContent, { color: muted }]} selectable>
                    {showPasswords.has(clip.id) ? clip.content : "••••••••••••"}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Setup Modal - centered */}
      <Modal visible={setupOpen} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlayCentered} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContentCentered, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>Create master password</Text>
            <Text style={[styles.modalDesc, { color: muted }]}>We never store it. You need it to unlock.</Text>
            {settingUp ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={isDark ? "#a78bfa" : "#7c3aed"} />
                <Text style={[styles.modalLoadingText, { color: muted }]}>Creating vault…</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, color: text }]}
                  placeholder="Min 6 characters"
                  placeholderTextColor={muted}
                  secureTextEntry
                  value={masterPassword}
                  onChangeText={setMasterPassword}
                  editable={!settingUp}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, color: text }]}
                  placeholder="Confirm password"
                  placeholderTextColor={muted}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!settingUp}
                />
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={[styles.btn, { borderColor: muted }]} onPress={() => setSetupOpen(false)} disabled={settingUp}>
                    <Text style={{ color: text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSetup} disabled={settingUp}>
                    <Text style={styles.btnPrimaryText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Unlock Modal - centered */}
      <Modal visible={unlockOpen} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlayCentered} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContentCentered, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>Unlock vault</Text>
            {unlocking ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={isDark ? "#a78bfa" : "#7c3aed"} />
                <Text style={[styles.modalLoadingText, { color: muted }]}>Unlocking…</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, color: text }]}
                  placeholder="Master password"
                  placeholderTextColor={muted}
                  secureTextEntry
                  value={masterPassword}
                  onChangeText={setMasterPassword}
                  editable={!unlocking}
                />
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={[styles.btn, { borderColor: muted }]} onPress={() => setUnlockOpen(false)} disabled={unlocking}>
                    <Text style={{ color: text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleUnlock} disabled={unlocking}>
                    <Text style={styles.btnPrimaryText}>Unlock</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add password Modal - centered */}
      <Modal visible={addOpen} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlayCentered} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalContentCentered, { backgroundColor: bg }]}>
            <Text style={[styles.modalTitle, { color: text }]}>Add password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, color: text }]}
              placeholder="Title (e.g. Gmail)"
              placeholderTextColor={muted}
              value={addTitle}
              onChangeText={setAddTitle}
            />
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, color: text }]}
              placeholder="Password"
              placeholderTextColor={muted}
              secureTextEntry
              value={addContent}
              onChangeText={setAddContent}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, { borderColor: muted }]} onPress={() => setAddOpen(false)}>
                <Text style={{ color: text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, (!addTitle.trim() || !addContent.trim()) && styles.btnDisabled]}
                onPress={handleAdd}
                disabled={!addTitle.trim() || !addContent.trim()}
              >
                <Text style={styles.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
    ...(Platform.OS === "android" ? { elevation: 2 } : {}),
  },
  cardIcon: { marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  cardDesc: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  btnPrimaryText: { color: "#fff", fontWeight: "600" },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  toolbarText: { fontSize: 14 },
  toolbarBtns: { flexDirection: "row", gap: 8 },
  btnSm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnSmPrimary: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  btnSmText: { fontSize: 14 },
  btnSmPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  emptyIcon: { alignSelf: "center", marginBottom: 12 },
  emptyText: { textAlign: "center", marginBottom: 8 },
  link: { textAlign: "center", fontSize: 14 },
  clipCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    overflow: "hidden",
    ...(Platform.OS === "android" ? { elevation: 1 } : {}),
  },
  clipHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  clipTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  clipActions: { flexDirection: "row", gap: 12 },
  clipContent: { fontSize: 14, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalContentCentered: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 14,
  },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  modalDesc: { fontSize: 14, marginBottom: 20 },
  input: {
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
});
