import { Tabs } from 'expo-router';

import { HomeIcon, OrdersIcon, ProfileIcon } from '@/shared/navigation/icons';
import { colors, typography } from '@/shared/ui';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.default,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface.default,
          borderTopColor: colors.border.default,
        },
        tabBarLabelStyle: {
          fontFamily: typography.caption.fontFamily,
          fontSize: typography.caption.fontSize,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          // tabBarIcon da ColorValue (puede ser un PlatformColor dinámico) -- acá siempre es
          // uno de nuestros hex estáticos (tabBarActiveTintColor/InactiveTintColor arriba).
          tabBarIcon: ({ color }) => <HomeIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <OrdersIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <ProfileIcon color={color as string} />,
        }}
      />
    </Tabs>
  );
}
