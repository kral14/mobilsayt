import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { logger } from './utils/logger';

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';

// Product Screens
import ProductRegistrationScreen from './screens/products/ProductRegistrationScreen';

// Purchase Screens
import ProductPurchaseScreen from './screens/purchases/ProductPurchaseScreen';

// Customer Screens
import CustomerRegistrationScreen from './screens/customers/CustomerRegistrationScreen';
import CustomerScreen from './screens/customers/CustomerScreen';

// Sale Screens
import ProductSaleScreen from './screens/sales/ProductSaleScreen';

// Supplier Screens
import SupplierScreen from './screens/suppliers/SupplierScreen';

// Warehouse Screens
import WarehouseScreen from './screens/warehouse/WarehouseScreen';

// Invoice Screens
import PurchaseInvoicesScreen from './screens/invoices/PurchaseInvoicesScreen';
import SaleInvoicesScreen from './screens/invoices/SaleInvoicesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  logger.info('App: Komponent mount olundu');
  
  return (
    <NavigationContainer
      onReady={() => logger.info('NavigationContainer: Hazırdır')}
      onStateChange={(state) => logger.debug('NavigationContainer: State dəyişdi', state)}
    >
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6200ee',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen}
          options={{ title: 'Şifrəni Unutdum' }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerLeft: null, title: 'Ana Səhifə' }}
        />

        {/* Product Screens */}
        <Stack.Screen 
          name="ProductRegistration" 
          component={ProductRegistrationScreen}
          options={{ title: 'Mal Qeydiyyatı' }}
        />

        {/* Purchase Screens */}
        <Stack.Screen 
          name="ProductPurchase" 
          component={ProductPurchaseScreen}
          options={{ title: 'Mal Alışı' }}
        />

        {/* Customer Screens */}
        <Stack.Screen 
          name="CustomerRegistration" 
          component={CustomerRegistrationScreen}
          options={{ title: 'Müştəri Qeydiyyatı' }}
        />
        <Stack.Screen 
          name="CustomerScreen" 
          component={CustomerScreen}
          options={{ title: 'Müştərilər' }}
        />

        {/* Sale Screens */}
        <Stack.Screen 
          name="ProductSale" 
          component={ProductSaleScreen}
          options={{ title: 'Mal Satışı' }}
        />

        {/* Supplier Screens */}
        <Stack.Screen 
          name="SupplierScreen" 
          component={SupplierScreen}
          options={{ title: 'Satıcılar' }}
        />

        {/* Warehouse Screens */}
        <Stack.Screen 
          name="WarehouseScreen" 
          component={WarehouseScreen}
          options={{ title: 'Anbar' }}
        />

        {/* Invoice Screens */}
        <Stack.Screen 
          name="PurchaseInvoices" 
          component={PurchaseInvoicesScreen}
          options={{ title: 'Alış Qaimələri' }}
        />
        <Stack.Screen 
          name="SaleInvoices" 
          component={SaleInvoicesScreen}
          options={{ title: 'Satış Qaimələri' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

