import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useAppNavigation } from "../hooks/useNavigation";
import { useTheme } from "../contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { theme, actualTheme, setTheme } = useTheme();
  const navigation = useAppNavigation();
  const [autoStart, setAutoStart] = useState(false);
  const [syncInterval, setSyncInterval] = useState("300");
  const [historyLimit, setHistoryLimit] = useState("1000");
  const isDark = actualTheme === "dark";

  useEffect(() => {
    loadSettings();
    // Refresh user details when screen loads
    refreshUser();
  }, []);

  const loadSettings = async () => {
    try {
      const savedAutoStart = await AsyncStorage.getItem("autoStart");
      const savedSyncInterval = await AsyncStorage.getItem("syncInterval");
      const savedHistoryLimit = await AsyncStorage.getItem("historyLimit");
      
      setAutoStart(savedAutoStart === "true");
      setSyncInterval(savedSyncInterval || "300");
      setHistoryLimit(savedHistoryLimit || "1000");
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleAutoStartChange = async (value: boolean) => {
    setAutoStart(value);
    await AsyncStorage.setItem("autoStart", value.toString());
  };

  const handleSyncIntervalChange = async (value: string) => {
    setSyncInterval(value);
    await AsyncStorage.setItem("syncInterval", value);
  };

  const handleHistoryLimitChange = async (value: string) => {
    setHistoryLimit(value);
    await AsyncStorage.setItem("historyLimit", value);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          navigation.replace("Pairing");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top", "left", "right"]}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* <Image source={require("../../assets/icon.png")} style={styles.appLogo} resizeMode="contain" accessibilityLabel="ClipSync" /> */}
      {/* User Info */}
      <View style={[styles.section, isDark && styles.sectionDark ,{marginTop: -25}]}>
        <View style={styles.userInfo}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, isDark && styles.userNameDark]}>{user?.name || user?.email || "User"}</Text>
            {user?.email && <Text style={[styles.userEmail, isDark && styles.userEmailDark]}>{user.email}</Text>}
          </View>
        </View>
      </View>

      {/* Theme Settings */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Appearance</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>Theme</Text>
            <Text style={[styles.settingDescription, isDark && styles.settingDescriptionDark]}>
              Choose light or dark mode
            </Text>
          </View>
          <View style={styles.themeButtons}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                theme === "light" && styles.themeButtonActive,
                isDark && styles.themeButtonDark,
              ]}
              onPress={() => setTheme("light")}
            >
              <Ionicons name="sunny" size={20} color={theme === "light" ? "#000" : (isDark ? "#999" : "#666")} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                theme === "dark" && styles.themeButtonActive,
                isDark && styles.themeButtonDark,
              ]}
              onPress={() => setTheme("dark")}
            >
              <Ionicons name="moon" size={20} color={theme === "dark" ? "#fff" : (isDark ? "#999" : "#666")} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                theme === "system" && styles.themeButtonActive,
                isDark && styles.themeButtonDark,
              ]}
              onPress={() => setTheme("system")}
            >
              <Ionicons name="phone-portrait" size={20} color={theme === "system" ? (isDark ? "#fff" : "#000") : (isDark ? "#999" : "#666")} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* General Settings */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>General</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>Auto-start on boot</Text>
            <Text style={[styles.settingDescription, isDark && styles.settingDescriptionDark]}>
              Automatically start ClipSync when your device boots
            </Text>
          </View>
          <Switch
            value={autoStart}
            onValueChange={handleAutoStartChange}
            trackColor={{ false: isDark ? "#333" : "#ccc", true: isDark ? "#fff" : "#000" }}
          />
        </View>
      </View>

      {/* Sync Settings */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Sync</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>Sync Interval (seconds)</Text>
            <Text style={[styles.settingDescription, isDark && styles.settingDescriptionDark]}>
              How often to sync clips with the server
            </Text>
          </View>
          <TextInput
            style={[styles.numberInput, isDark && styles.numberInputDark]}
            value={syncInterval}
            onChangeText={handleSyncIntervalChange}
            keyboardType="numeric"
            placeholder="300"
            placeholderTextColor={isDark ? "#666" : "#999"}
          />
        </View>
      </View>

      {/* History Settings */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>History</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>History Limit</Text>
            <Text style={[styles.settingDescription, isDark && styles.settingDescriptionDark]}>
              Maximum number of clips to keep in history
            </Text>
          </View>
          <TextInput
            style={[styles.numberInput, isDark && styles.numberInputDark]}
            value={historyLimit}
            onChangeText={handleHistoryLimitChange}
            keyboardType="numeric"
            placeholder="1000"
            placeholderTextColor={isDark ? "#666" : "#999"}
          />
        </View>
      </View>

      {/* Sign Out */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  appLogo: {
    width: 56,
    height: 56,
    alignSelf: "center",
    marginBottom: 12,
  },
  section: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#f8f8f8",
    overflow: "hidden",
  },
  sectionDark: {
    backgroundColor: "#111",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  sectionTitleDark: {
    color: "#fff",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  userNameDark: {
    color: "#fff",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  userEmailDark: {
    color: "#999",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  settingLabelDark: {
    color: "#fff",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
  },
  settingDescriptionDark: {
    color: "#999",
  },
  themeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  themeButtonDark: {
    borderColor: "#333",
    backgroundColor: "#1a1a1a",
  },
  themeButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: "center",
    fontSize: 16,
    color: "#000",
  },
  numberInputDark: {
    borderColor: "#333",
    backgroundColor: "#1a1a1a",
    color: "#fff",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
});
