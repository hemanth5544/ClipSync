import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PairingScreen from "../screens/PairingScreen";
import HomeScreen from "../screens/HomeScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
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
        tabBarActiveTintColor: isDark ? "#fff" : "#3b82f6",
        tabBarInactiveTintColor: isDark ? "#666" : "#666",
        tabBarStyle: {
          backgroundColor: isDark ? "#000" : "#fff",
          borderTopColor: isDark ? "#333" : "#e5e5e5",
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 8,
          height: 56 + (Platform.OS === "ios" ? insets.bottom : 0),
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
        headerStyle: {
          backgroundColor: isDark ? "#000" : "#fff",
        },
        headerTintColor: isDark ? "#fff" : "#000",
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
              color={focused ? "#FFD700" : color}
            />
          ),
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
