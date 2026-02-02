import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAuth } from "../contexts/AuthContext";
import { useAppNavigation } from "../hooks/useNavigation";
import { useTheme } from "../contexts/ThemeContext";
import * as Linking from "expo-linking";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Parse pairing code from QR data. Desktop encodes as clipsync://pair/XXXXXX or plain code. */
function parsePairingCodeFromQrData(data: string): string | null {
  const trimmed = data.trim();
  const pairPrefix = "clipsync://pair/";
  if (trimmed.toLowerCase().startsWith(pairPrefix)) {
    const code = trimmed.slice(pairPrefix.length).replace(/\s/g, "").toUpperCase();
    return code.length === 6 && /^[A-F0-9]+$/.test(code) ? code : null;
  }
  const code = trimmed.replace(/\s/g, "").toUpperCase();
  return code.length === 6 && /^[A-F0-9]+$/.test(code) ? code : null;
}

export default function PairingScreen() {
  const { actualTheme } = useTheme();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const scanHandledRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
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

  const handleScanQR = async () => {
    if (!permission) {
      Alert.alert("Camera", "Checking camera permission…");
      return;
    }
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Camera access needed",
          "ClipSync needs camera access to scan the pairing QR code. Enable it in your device settings or enter the code manually."
        );
        return;
      }
    }
    scanHandledRef.current = false;
    setScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanHandledRef.current) return;
    const parsed = parsePairingCodeFromQrData(data);
    if (parsed) {
      scanHandledRef.current = true;
      setScannerVisible(false);
      handlePair(parsed);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.inner}>
        <Text style={[styles.title, isDark && styles.titleDark]}>ClipSync</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Enter pairing code to connect</Text>

        <View style={styles.form}>
          <View style={[styles.codeInputWrap, isDark && styles.codeInputWrapDark]}>
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
            style={[styles.button, styles.primaryButton, (loading || code.length !== 6) && styles.buttonDisabled]}
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
            <Ionicons name="qr-code-outline" size={22} color={isDark ? "#fff" : "#374151"} />
            <Text style={[styles.qrButtonText, isDark && styles.qrButtonTextDark]}>Scan QR Code</Text>
          </TouchableOpacity>

          <Text style={[styles.helpText, isDark && styles.helpTextDark]}>
            Get the pairing code from Settings → Pair Mobile Device in your desktop app
          </Text>
        </View>
      </View>

      {/* QR Scanner modal */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={[styles.scannerContainer, isDark && styles.scannerContainerDark]}>
          <SafeAreaView style={styles.scannerSafe} edges={["top"]}>
            <View style={styles.scannerHeader}>
              <Text style={[styles.scannerTitle, isDark && styles.scannerTitleDark]}>Scan pairing code</Text>
              <TouchableOpacity onPress={() => setScannerVisible(false)} style={styles.scannerClose}>
                <Ionicons name="close" size={28} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.scannerOverlay}>
                <View style={[styles.scannerFrame, isDark && styles.scannerFrameDark]} />
                <Text style={[styles.scannerHint, isDark && styles.scannerHintDark]}>
                  Point at the QR code in the desktop app
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
  },
  containerDark: {
    backgroundColor: "#0a0a0a",
  },
  inner: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#0f172a",
  },
  titleDark: {
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 40,
  },
  subtitleDark: {
    color: "#a1a1aa",
  },
  form: {
    width: "100%",
  },
  codeInputWrap: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  codeInputWrapDark: {
    borderColor: "#262626",
    backgroundColor: "#171717",
  },
  codeInput: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 10,
    color: "#0f172a",
  },
  codeInputDark: {
    color: "#fff",
  },
  hint: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  hintDark: {
    color: "#a1a1aa",
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
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
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerLineDark: {
    backgroundColor: "#262626",
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dividerTextDark: {
    color: "#71717a",
  },
  qrButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  qrButtonDark: {
    backgroundColor: "#171717",
    borderColor: "#262626",
  },
  qrButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  qrButtonTextDark: {
    color: "#e5e5e5",
  },
  helpText: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 20,
  },
  helpTextDark: {
    color: "#71717a",
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerContainerDark: {
    backgroundColor: "#000",
  },
  scannerSafe: {
    flex: 1,
  },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  scannerTitleDark: {
    color: "#fff",
  },
  scannerClose: {
    padding: 8,
  },
  cameraWrap: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerFrame: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  scannerFrameDark: {
    borderColor: "rgba(255,255,255,0.6)",
  },
  scannerHint: {
    marginTop: 24,
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  scannerHintDark: {
    color: "rgba(255,255,255,0.9)",
  },
});
