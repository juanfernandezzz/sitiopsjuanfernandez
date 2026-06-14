import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.sage,
        tabBarInactiveTintColor: COLORS.inkFaint,
        tabBarStyle: {
          backgroundColor: COLORS.offwhite,
          borderTopColor: COLORS.line,
          height: 74,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontFamily: FONTS.bodyMed, fontSize: 12.5, letterSpacing: 0.2 },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="agendar"
        options={{ title: 'Agendar', tabBarIcon: ({ color }) => <Feather name="calendar" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="respira"
        options={{ title: 'Respira', tabBarIcon: ({ color }) => <Feather name="wind" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="informacion"
        options={{ title: 'Información', tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="contacto"
        options={{ title: 'Contacto', tabBarIcon: ({ color }) => <Feather name="message-circle" size={24} color={color} /> }}
      />
    </Tabs>
  );
}
