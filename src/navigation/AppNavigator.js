import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ProductsScreen from '../screens/ProductsScreen';
import SaleScreen from '../screens/SaleScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Products: focused ? 'cube' : 'cube-outline',
              Sale:     focused ? 'cart' : 'cart-outline',
              Reports:  focused ? 'bar-chart' : 'bar-chart-outline',
            };
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