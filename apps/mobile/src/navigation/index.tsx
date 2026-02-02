import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PairingScreen from "../screens/PairingScreen";
import HomeScreen from "../screens/HomeScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import MessagesScreen from "../screens/MessagesScreen";
import SecureScreen from "../screens/SecureScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { ActivityIndicator, View, Platform } from "react-native";
import React from "react";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { actualTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = actualTheme === "dark";

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: isDark ? "#60a5fa" : "#2563eb",
        tabBarInactiveTintColor: isDark ? "#6b7280" : "#9ca3af",
        tabBarStyle: {
          backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
          borderTopColor: isDark ? "#262626" : "#e5e7eb",
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 10) : 10,
          height: 58 + (Platform.OS === "ios" ? insets.bottom : 0),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIconStyle: { marginBottom: -2 },
        headerStyle: {
          backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#262626" : "#e5e7eb",
        },
        headerTintColor: isDark ? "#fff" : "#111",
        headerTitleStyle: { fontSize: 18, fontWeight: "700" },
        headerShadowVisible: false,
        headerLargeTitle: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          title: "All Clips",
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "star" : "star-outline"}
              size={size}
              color={focused ? "#fbbf24" : color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          title: "Messages",
        }}
      />
      <Tab.Screen
        name="Secure"
        component={SecureScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export const navigationRef = React.createRef<NavigationContainerRef<any>>();

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Pairing" component={PairingScreen} />
        ) : (
          <Stack.Screen name="Tabs" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function useRouter() {
  return {
    push: (route: string, params?: any) => {
      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate(route as any, params);
      }
    },
    replace: (route: string, params?: any) => {
      if (navigationRef.current?.isReady()) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: route as any, params }],
        });
      }
    },
  };
}
