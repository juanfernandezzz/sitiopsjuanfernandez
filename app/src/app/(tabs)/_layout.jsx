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
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: FONTS.bodyMed, fontSize: 11, letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="agendar"
        options={{ title: 'Agendar', tabBarIcon: ({ color }) => <Feather name="calendar" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="informacion"
        options={{ title: 'Información', tabBarIcon: ({ color }) => <Feather name="book-open" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="contacto"
        options={{ title: 'Contacto', tabBarIcon: ({ color }) => <Feather name="message-circle" size={20} color={color} /> }}
      />
    </Tabs>
  );
}
