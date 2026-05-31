import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text } from 'react-native';
import { getAllProducts } from '../database/db';

import ProductsScreen from '../screens/ProductsScreen';
import SaleScreen from '../screens/SaleScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

const LOW_STOCK_THRESHOLD = 5;

function BadgeIcon({ name, color, size, count }) {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {count > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -6,
          backgroundColor: '#EF4444', borderRadius: 8,
          minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count}</Text>
        </View>
      )}
    </View>
  );
}

export default function AppNavigator() {
  const [lowStockCount, setLowStockCount] = useState(0);

  const checkLowStock = () => {
    const products = getAllProducts();
    const count = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
    setLowStockCount(count);
  };

  return (
    <NavigationContainer onStateChange={checkLowStock} onReady={checkLowStock}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Products: focused ? 'cube' : 'cube-outline',
              Sale:     focused ? 'cart' : 'cart-outline',
              Reports:  focused ? 'bar-chart' : 'bar-chart-outline',
            };
            if (route.name === 'Products') {
              return (
                <BadgeIcon
                  name={icons.Products}
                  color={color}
                  size={size}
                  count={lowStockCount}
                />
              );
            }
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: 'gray',
          headerShown: true,
        })}
      >
        <Tab.Screen name="Sale"     component={SaleScreen} />
        <Tab.Screen name="Products" component={ProductsScreen} />
        <Tab.Screen name="Reports"  component={ReportsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}