import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Clip } from "@clipsync/types";
import { api } from "../lib/api";
import { useClipboard } from "../hooks/useClipboard";
import { formatRelativeTime, getDateGroup, isURL, normalizeURL, openURL } from "../lib/utils";
import ClipCard from "../components/ClipCard";
import { useTheme } from "../contexts/ThemeContext";
import * as Device from "expo-device";
import type { DateGroup } from "../lib/timeUtils";

export default function HomeScreen() {
  const { actualTheme } = useTheme();
  const { deviceName } = useClipboard();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClips, setExpandedClips] = useState<Set<string>>(new Set());
  const [addSnippetVisible, setAddSnippetVisible] = useState(false);
  const [newSnippetText, setNewSnippetText] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingSnippet, setSavingSnippet] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);

  const isDark = actualTheme === "dark";

  useEffect(() => {
    loadClips();
    
    // Refresh every 10 seconds to catch new clips
    const interval = setInterval(loadClips, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadClips = async () => {
    try {
      setLoading(true);
      const response = await api.clips.getAll({ pageSize: 50 });
      // Sort by copiedAt desc
      const sorted = [...response.data].sort((a, b) => {
        return new Date(b.copiedAt).getTime() - new Date(a.copiedAt).getTime();
      });
      setClips(sorted);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load clips");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClips();
  };

  const filteredClips = useMemo(() => {
    if (!searchQuery.trim()) return clips;
    
    const query = searchQuery.toLowerCase();
    return clips.filter((clip) => {
      const contentMatch = clip.content.toLowerCase().includes(query);
      const deviceMatch = clip.deviceName?.toLowerCase().includes(query);
      const tagsMatch = clip.tags?.some((tag) => tag.toLowerCase().includes(query));
      return contentMatch || deviceMatch || tagsMatch;
    });
  }, [clips, searchQuery]);

  const groupOrder: DateGroup[] = ["Today", "Yesterday", "This week", "Older"];
  const clipsByDate = useMemo(() => {
    const groups: Record<DateGroup, Clip[]> = {
      Today: [],
      Yesterday: [],
      "This week": [],
      Older: [],
    };
    filteredClips.forEach((c) => {
      const g = getDateGroup(c.copiedAt);
      groups[g].push(c);
    });
    return groups;
  }, [filteredClips]);

  const toggleExpand = (clipId: string) => {
    setExpandedClips((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clipId)) {
        newSet.delete(clipId);
      } else {
        newSet.add(clipId);
      }
      return newSet;
    });
  };

  const handleDelete = async (clip: Clip) => {
    Alert.alert(
      "Delete Clip?",
      "Are you sure you want to delete this clip? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.clips.delete(clip.id);
              setClips(clips.filter((c) => c.id !== clip.id));
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete clip");
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await api.clips.toggleFavorite(id);
      setClips(clips.map((clip) => (clip.id === id ? updated : clip)));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update favorite");
    }
  };

  const handleAddSnippet = async () => {
    const content = newSnippetText.trim();
    if (!content) {
      Alert.alert("Empty snippet", "Enter or paste some text to save.");
      return;
    }
    setSavingSnippet(true);
    try {
      const saved = await api.clips.create({
        content,
        deviceName: deviceName || Device.deviceName || "Mobile",
      });
      setClips((prev) => [saved, ...prev]);
      setNewSnippetText("");
      setAddSnippetVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save snippet");
    } finally {
      setSavingSnippet(false);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    if (selectedIds.size > 0) setSelectedIds(new Set());
  };

  const toggleSelectClip = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredClips.map((c) => c.id)));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      "Delete selected?",
      `Delete ${selectedIds.size} clip(s)? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingSelected(true);
            try {
              for (const id of selectedIds) {
                await api.clips.delete(id);
              }
              setClips((prev) => prev.filter((c) => !selectedIds.has(c.id)));
              setSelectedIds(new Set());
              setSelectMode(false);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete some clips");
            } finally {
              setDeletingSelected(false);
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (clips.length === 0) return;
    Alert.alert(
      "Clear all clips?",
      "Delete all clips? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            setDeletingSelected(true);
            try {
              for (const clip of clips) {
                await api.clips.delete(clip.id);
              }
              setClips([]);
              setSelectMode(false);
              setSelectedIds(new Set());
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to clear clips");
            } finally {
              setDeletingSelected(false);
            }
          },
        },
      ]
    );
  };

  const handleCopy = async (content: string, clipId: string) => {
    try {
      await Clipboard.setStringAsync(content);
      setCopiedClipId(clipId);
      setTimeout(() => setCopiedClipId(null), 2000);
      const saved = await api.clips.create({
        content,
        deviceName: deviceName || Device.deviceName || "Mobile",
      });
      setClips((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to copy");
    }
  };

  if (loading && clips.length === 0) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top", "left", "right"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#3b82f6"} />
        </View>
      </SafeAreaView>
    );
  }

  const renderSection = (group: DateGroup) => {
    const groupClips = clipsByDate[group];
    if (groupClips.length === 0) return null;
    return (
      <View key={group} style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{group}</Text>
        {groupClips.map((item) => (
          <ClipCard
            key={item.id}
            clip={item}
            isExpanded={expandedClips.has(item.id)}
            onToggleExpand={() => toggleExpand(item.id)}
            onDelete={() => handleDelete(item)}
            onToggleFavorite={() => handleToggleFavorite(item.id)}
            onCopy={(content) => handleCopy(content, item.id)}
            selectMode={selectMode}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={() => toggleSelectClip(item.id)}
            isCopied={copiedClipId === item.id}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top", "left", "right"]}>
      {/* Search + New snippet + Select */}
      <View style={[styles.searchContainer, isDark && styles.searchContainerDark, { marginTop: -25 }]}>
        <Ionicons name="search" size={22} color={isDark ? "#999" : "#666"} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="Search clips..."
          placeholderTextColor={isDark ? "#666" : "#999"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!selectMode}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.headerButton}>
            <Ionicons name="close-circle" size={22} color={isDark ? "#999" : "#666"} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setAddSnippetVisible(true)}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Add new snippet"
        >
          <Ionicons name="add-circle" size={26} color={isDark ? "#fff" : "#3b82f6"} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleSelectMode}
          style={[styles.headerButton, selectMode && styles.headerButtonActive]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={selectMode ? "Cancel select" : "Select clips"}
        >
          <Ionicons
            name={selectMode ? "close-circle" : "checkbox-outline"}
            size={26}
            color={selectMode ? "#ef4444" : isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      {/* Select mode toolbar */}
      {selectMode && (
        <View style={[styles.selectToolbar, isDark && styles.selectToolbarDark]}>
          <TouchableOpacity onPress={selectAll} style={styles.toolbarButton}>
            <Text style={[styles.toolbarButtonText, isDark && styles.toolbarButtonTextDark]}>
              Select all
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            disabled={selectedIds.size === 0 || deletingSelected}
            style={[styles.toolbarButton, selectedIds.size === 0 && styles.toolbarButtonDisabled]}
          >
            <Ionicons name="trash-outline" size={18} color={selectedIds.size === 0 ? "#666" : "#ef4444"} />
            <Text style={[styles.toolbarButtonTextDanger, selectedIds.size === 0 && styles.toolbarButtonTextDisabled]}>
              Delete ({selectedIds.size})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} disabled={deletingSelected || clips.length === 0} style={styles.toolbarButton}>
            <Text style={[styles.toolbarButtonTextDanger, (deletingSelected || clips.length === 0) && styles.toolbarButtonTextDisabled]}>
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredClips.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconWrap, isDark && styles.emptyIconWrapDark]}>
            <Ionicons name="clipboard-outline" size={48} color={isDark ? "#666" : "#999"} />
          </View>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            {searchQuery ? "No clips found" : "No clips yet"}
          </Text>
          <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
            {searchQuery ? "Try a different search term" : "Copy text anywhere to see it here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupOrder}
          keyExtractor={(g) => g}
          renderItem={({ item: group }) => renderSection(group)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#3b82f6"} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add new snippet modal */}
      <Modal
        visible={addSnippetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddSnippetVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setAddSnippetVisible(false)} />
          <SafeAreaView style={styles.modalSafeArea} edges={["bottom"]}>
            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Add new snippet</Text>
                <TouchableOpacity onPress={() => { setAddSnippetVisible(false); setNewSnippetText(""); }} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                  <Ionicons name="close" size={28} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>
              </View>
            <Text style={[styles.modalDescription, isDark && styles.modalDescriptionDark]}>
              Paste or type text to save as a new clip.
            </Text>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <TextInput
                style={[styles.snippetInput, isDark && styles.snippetInputDark]}
                placeholder="Paste or type your snippet here..."
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={newSnippetText}
                onChangeText={setNewSnippetText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, isDark && styles.modalButtonSecondaryDark]}
                onPress={() => { setAddSnippetVisible(false); setNewSnippetText(""); }}
              >
                <Text style={[styles.modalButtonTextSecondary, isDark && styles.modalButtonTextSecondaryDark]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, (!newSnippetText.trim() || savingSnippet) && styles.modalButtonDisabled]}
                onPress={handleAddSnippet}
                disabled={!newSnippetText.trim() || savingSnippet}
              >
                {savingSnippet ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Save snippet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  containerDark: {
    backgroundColor: "#0a0a0a",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 52,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchContainerDark: {
    backgroundColor: "#171717",
    borderColor: "#262626",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    minWidth: 0,
    paddingVertical: 4,
  },
  searchInputDark: {
    color: "#fff",
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonActive: {
    opacity: 0.9,
  },
  selectToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  selectToolbarDark: {
    backgroundColor: "#171717",
    borderBottomColor: "#262626",
  },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
  toolbarButtonText: {
    fontSize: 14,
    color: "#333",
  },
  toolbarButtonTextDark: {
    color: "#ccc",
  },
  toolbarButtonTextDanger: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
  toolbarButtonTextDisabled: {
    color: "#666",
    fontWeight: "normal",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitleDark: {
    color: "#a1a1aa",
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIconWrapDark: {
    backgroundColor: "#262626",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 19,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  emptyTextDark: {
    color: "#a1a1aa",
  },
  emptySubtext: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
  },
  emptySubtextDark: {
    color: "#71717a",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSafeArea: {
    maxHeight: "85%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "100%",
  },
  modalContentDark: {
    backgroundColor: "#171717",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  modalTitleDark: {
    color: "#fff",
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  modalDescriptionDark: {
    color: "#999",
  },
  modalScroll: {
    maxHeight: 200,
  },
  snippetInput: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#000",
    minHeight: 140,
  },
  snippetInputDark: {
    borderColor: "#333",
    color: "#fff",
    backgroundColor: "#1a1a1a",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#3b82f6",
  },
  modalButtonSecondary: {
    backgroundColor: "#f0f0f0",
  },
  modalButtonSecondaryDark: {
    backgroundColor: "#333",
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  modalButtonTextSecondaryDark: {
    color: "#fff",
  },
});
