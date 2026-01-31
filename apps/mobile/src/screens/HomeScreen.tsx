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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Clip } from "@clipsync/types";
import { api } from "../lib/api";
import { useClipboard } from "../hooks/useClipboard";
import { formatRelativeTime, isURL, normalizeURL, openURL } from "../lib/utils";
import ClipCard from "../components/ClipCard";
import { useTheme } from "../contexts/ThemeContext";

export default function HomeScreen() {
  const { actualTheme } = useTheme();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClips, setExpandedClips] = useState<Set<string>>(new Set());
  useClipboard(); // Start clipboard monitoring
  
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


  if (loading && clips.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
        <Ionicons name="search" size={20} color={isDark ? "#999" : "#666"} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="Search clips..."
          placeholderTextColor={isDark ? "#666" : "#999"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={isDark ? "#999" : "#666"} />
          </TouchableOpacity>
        )}
      </View>

      {filteredClips.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            {searchQuery ? "No clips found" : "No clips yet"}
          </Text>
          <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
            {searchQuery ? "Try a different search term" : "Start copying text to see your clipboard history"}
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
              onCopy={async (content) => {
                const { Clipboard } = require("expo-clipboard");
                await Clipboard.setStringAsync(content);
                Alert.alert("Copied", "Content copied to clipboard");
              }}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 44,
  },
  searchContainerDark: {
    backgroundColor: "#1a1a1a",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  searchInputDark: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptyTextDark: {
    color: "#999",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  emptySubtextDark: {
    color: "#666",
  },
});
