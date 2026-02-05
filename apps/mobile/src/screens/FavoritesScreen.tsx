import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Clip } from "@clipsync/types";
import { api } from "../lib/api";
import { formatRelativeTime, isURL, normalizeURL, openURL } from "../lib/utils";
import ClipCard from "../components/ClipCard";
import { useTheme } from "../contexts/ThemeContext";

export default function FavoritesScreen() {
  const { actualTheme } = useTheme();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClips, setExpandedClips] = useState<Set<string>>(new Set());
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);
  const isDark = actualTheme === "dark";

  useEffect(() => {
    loadFavorites();
    
    const interval = setInterval(loadFavorites, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.clips.getAll({ favorite: true, pageSize: 100 });
      // Sort by copiedAt desc
      const sorted = [...response.data].sort((a, b) => {
        return new Date(b.copiedAt).getTime() - new Date(a.copiedAt).getTime();
      });
      setClips(sorted);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load favorites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
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


  const handleCopy = async (content: string, clipId: string) => {
    try {
      await Clipboard.setStringAsync(content);
      setCopiedClipId(clipId);
      setTimeout(() => setCopiedClipId(null), 2000);
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

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top", "left", "right"]}>
      <View style={[styles.searchContainer, isDark && styles.searchContainerDark, { marginTop: -25 }]}>
        <Ionicons name="search" size={22} color={isDark ? "#999" : "#666"} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="Search favorites..."
          placeholderTextColor={isDark ? "#666" : "#999"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close-circle" size={22} color={isDark ? "#999" : "#666"} />
          </TouchableOpacity>
        )}
      </View>

      {filteredClips.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconWrap, isDark && styles.emptyIconWrapDark]}>
            <Ionicons name="star-outline" size={48} color={isDark ? "#666" : "#999"} />
          </View>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            {searchQuery ? "No favorites found" : "No favorite clips yet"}
          </Text>
          <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
            {searchQuery ? "Try a different search term" : "Mark clips as favorites to see them here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredClips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClipCard
              clip={item}
              isExpanded={expandedClips.has(item.id)}
              onToggleExpand={() => toggleExpand(item.id)}
              onDelete={() => handleDelete(item)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onCopy={(content) => handleCopy(content, item.id)}
              isCopied={copiedClipId === item.id}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#3b82f6"} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    marginTop: 12,
    marginBottom: 16,
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
});
