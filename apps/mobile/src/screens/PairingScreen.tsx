import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useAppNavigation } from "../hooks/useNavigation";
import { useTheme } from "../contexts/ThemeContext";
import * as Linking from "expo-linking";
import { getApiUrl } from "../lib/api";

export default function PairingScreen() {
  const { actualTheme } = useTheme();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { pairWithCode } = useAuth();
  const navigation = useAppNavigation();
  const isDark = actualTheme === "dark";

  // Handle deep link for QR code scanning
  React.useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      if (event.url.includes("clipsync://pair/")) {
        const codeFromUrl = event.url.split("/pair/")[1];
        if (codeFromUrl && codeFromUrl.length === 6) {
          setCode(codeFromUrl.toUpperCase());
          handlePair(codeFromUrl.toUpperCase());
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    
    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes("clipsync://pair/")) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handlePair = async (pairingCode?: string) => {
    const codeToUse = pairingCode || code.toUpperCase().replace(/\s/g, "");
    
    if (!codeToUse || codeToUse.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-character pairing code");
      return;
    }

    try {
      setLoading(true);
      await pairWithCode(codeToUse);
      navigation.replace("Tabs");
    } catch (error: any) {
      Alert.alert("Pairing Failed", error.message || "Invalid or expired pairing code");
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // For now, show instructions
    // In production, use expo-camera or expo-barcode-scanner
    Alert.alert(
      "Scan QR Code",
      "Point your camera at the QR code shown in the desktop app settings.\n\nNote: Full QR scanning requires expo-camera or expo-barcode-scanner to be installed.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>ClipSync</Text>
      <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Enter pairing code to connect</Text>

      <View style={styles.form}>
        <View style={styles.codeInputContainer}>
          <TextInput
            style={[styles.codeInput, isDark && styles.codeInputDark]}
            placeholder="XXXXXX"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 6))}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            keyboardType="default"
            textAlign="center"
            placeholderTextColor={isDark ? "#666" : "#999"}
          />
        </View>

        <Text style={[styles.hint, isDark && styles.hintDark]}>
          Enter the 6-character code from your desktop app
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={() => handlePair()}
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Pair Device</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
          <Text style={[styles.dividerText, isDark && styles.dividerTextDark]}>Or</Text>
          <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.qrButton, isDark && styles.qrButtonDark]}
          onPress={handleScanQR}
        >
          <Ionicons name="qr-code-outline" size={20} color={isDark ? "#fff" : "#000"} />
          <Text style={[styles.qrButtonText, isDark && styles.qrButtonTextDark]}>Scan QR Code</Text>
        </TouchableOpacity>

        <Text style={[styles.helpText, isDark && styles.helpTextDark]}>
          Get the pairing code from Settings → Pair Mobile Device in your desktop app
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#000",
  },
  titleDark: {
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  subtitleDark: {
    color: "#999",
  },
  form: {
    width: "100%",
  },
  codeInputContainer: {
    marginBottom: 12,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 8,
    fontFamily: "monospace",
    backgroundColor: "#f9f9f9",
    color: "#000",
  },
  codeInputDark: {
    borderColor: "#fff",
    backgroundColor: "#1a1a1a",
    color: "#fff",
  },
  hint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  hintDark: {
    color: "#999",
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#000",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerLineDark: {
    backgroundColor: "#333",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
  },
  dividerTextDark: {
    color: "#999",
  },
  qrButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrButtonDark: {
    backgroundColor: "#1a1a1a",
    borderColor: "#333",
  },
  qrButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
  qrButtonTextDark: {
    color: "#fff",
  },
  helpText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
  helpTextDark: {
    color: "#666",
  },
});
