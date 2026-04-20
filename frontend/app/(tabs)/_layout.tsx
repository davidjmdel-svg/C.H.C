import { Tabs } from "expo-router";
import { Calculator, History } from "lucide-react-native";
import { colors } from "../../src/theme";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 14,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Calcular",
          tabBarIcon: ({ color, size }) => (
            <Calculator color={color} size={size} />
          ),
          tabBarTestID: "tab-calculate",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => (
            <History color={color} size={size} />
          ),
          tabBarTestID: "tab-history",
        }}
      />
    </Tabs>
  );
}
