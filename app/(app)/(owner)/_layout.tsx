import { Tabs } from 'expo-router';

import { OrdersIcon, ProductsIcon, ProfileIcon } from '@/shared/navigation/icons';
import { colors, typography } from '@/shared/ui';

export default function OwnerTabsLayout() {
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
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <OrdersIcon color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color }) => <ProductsIcon color={color as string} />,
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
