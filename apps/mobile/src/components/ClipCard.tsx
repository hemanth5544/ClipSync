import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Clip } from "@clipsync/types";
import { formatRelativeTime, isURL, normalizeURL, openURL } from "../lib/utils";
import { useTheme } from "../contexts/ThemeContext";
import {
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";

interface ClipCardProps {
  clip: Clip;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onCopy: (content: string) => void;
  /** When true, show checkbox and tap toggles selection instead of expand */
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  /** When true, show checkmark on copy button (just copied) */
  isCopied?: boolean;
}

export default function ClipCard({
  clip,
  isExpanded,
  onToggleExpand,
  onDelete,
  onToggleFavorite,
  onCopy,
  selectMode = false,
  isSelected = false,
  onToggleSelect,
  isCopied = false,
}: ClipCardProps) {
  const { actualTheme } = useTheme();
  const shouldShowExpand = clip.content.length > 150;
  const isUrl = isURL(clip.content);
  const translateX = useRef(new Animated.Value(0)).current;
  const lastTap = useRef<number | null>(null);

  const isDark = actualTheme === "dark";

  // Double tap handler
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap.current && now - lastTap.current < DOUBLE_PRESS_DELAY) {
      onToggleFavorite();
      lastTap.current = null;
    } else {
      lastTap.current = now;
    }
  };

  // Swipe to delete gesture (only horizontal, doesn't interfere with taps)
  const swipeGesture = Gesture.Pan()
    .activeOffsetX(10) // Require horizontal movement to activate
    .failOffsetY([-10, 10]) // Fail if vertical movement is too much
    .onUpdate((event) => {
      // Only allow swipe right (positive translationX)
      if (event.translationX > 0) {
        translateX.setValue(event.translationX);
      }
    })
    .onEnd((event) => {
      const swipeThreshold = 100;
      if (event.translationX > swipeThreshold) {
        // Swipe right - delete
        Animated.timing(translateX, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDelete();
          translateX.setValue(0);
        });
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    });

  const handleUrlPress = async () => {
    if (isUrl) {
      await openURL(normalizeURL(clip.content));
    }
  };

  const cardStyles = [
    styles.card,
    isDark && styles.cardDark,
    {
      transform: [{ translateX }],
    },
  ];

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={cardStyles}>
        {/* Delete indicator (shows when swiping left) */}
        <Animated.View
          style={[
            styles.deleteIndicator,
            {
              opacity: translateX.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <Ionicons name="trash" size={24} color="#fff" />
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          {selectMode && onToggleSelect ? (
            <TouchableOpacity
              onPress={onToggleSelect}
              style={styles.checkboxTouch}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
            </TouchableOpacity>
          ) : null}
          <View style={styles.headerLeft}>
            <Text
              style={[styles.preview, isDark && styles.previewDark]}
              numberOfLines={2}
            >
              {clip.contentPreview || clip.content.substring(0, 100)}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons
                name="time-outline"
                size={12}
                color={isDark ? "#999" : "#666"}
              />
              <Text style={[styles.time, isDark && styles.timeDark]}>
                {formatRelativeTime(clip.copiedAt)}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onToggleFavorite}
              style={styles.iconButton}
            >
              <Ionicons
                name={clip.isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={clip.isFavorite ? "#ef4444" : isDark ? "#999" : "#666"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onCopy(clip.content)}
              style={[styles.iconButton, isCopied && styles.iconButtonCopied]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={isCopied ? "checkmark-circle" : "copy-outline"}
                size={22}
                color={isCopied ? "#22c55e" : isDark ? "#999" : "#666"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
              <Ionicons
                name="trash-outline"
                size={20}
                color={isDark ? "#999" : "#666"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content - In select mode tap toggles selection; otherwise double tap to favorite */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={
            selectMode && onToggleSelect
              ? onToggleSelect
              : handleDoubleTap
          }
          delayPressIn={0}
        >
          <View style={styles.content}>
            {isUrl ? (
              <TouchableOpacity onPress={handleUrlPress}>
                <View style={styles.urlContainer}>
                  <Ionicons name="open-outline" size={16} color="#3b82f6" />
                  <Text
                    style={styles.urlText}
                    numberOfLines={isExpanded ? undefined : 3}
                  >
                    {clip.content}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Text
                style={[styles.contentText, isDark && styles.contentTextDark]}
                numberOfLines={isExpanded ? undefined : 3}
              >
                {clip.content}
              </Text>
            )}

            {shouldShowExpand && (
              <TouchableOpacity
                onPress={onToggleExpand}
                style={styles.expandButton}
              >
                <Text
                  style={[styles.expandText, isDark && styles.expandTextDark]}
                >
                  {isExpanded ? "Show less" : "Show more"}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={isDark ? "#999" : "#666"}
                />
              </TouchableOpacity>
            )}

            {/* Tags */}
            {clip.tags && clip.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {clip.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, isDark && styles.tagDark]}
                  >
                    <Text
                      style={[styles.tagText, isDark && styles.tagTextDark]}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Device Badge */}
            {clip.deviceName && (
              <View style={styles.deviceContainer}>
                <View style={styles.deviceBadge}>
                  <Ionicons name="phone-portrait-outline" size={12} color="#fff" />
                  <Text style={styles.deviceText} numberOfLines={1}>
                    {clip.deviceName}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  cardDark: {
    backgroundColor: "#171717",
    borderColor: "#262626",
  },
  deleteIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkboxTouch: {
    marginRight: 12,
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#999",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  preview: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  previewDark: {
    color: "#fff",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  timeDark: {
    color: "#999",
  },
  actions: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  iconButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonCopied: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 22,
  },
  content: {
    marginTop: 8,
  },
  contentText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  contentTextDark: {
    color: "#ccc",
  },
  urlContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  urlText: {
    fontSize: 14,
    color: "#3b82f6",
    textDecorationLine: "underline",
    flex: 1,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  expandText: {
    fontSize: 12,
    color: "#666",
  },
  expandTextDark: {
    color: "#999",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagDark: {
    backgroundColor: "#1a1a1a",
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
  tagTextDark: {
    color: "#999",
  },
  deviceContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  deviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff9500",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    maxWidth: 120,
  },
  deviceText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "500",
  },
});
