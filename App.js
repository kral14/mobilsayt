import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from './utils/logger';
import keepAliveService from './utils/keepAlive';
import { authService } from './services/authService';

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
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
import InvoiceMenuScreen from './screens/invoices/InvoiceMenuScreen';

// Partners Screens
import PartnersMenuScreen from './screens/partners/PartnersMenuScreen';

// Reports Screens
import ReportsScreen from './screens/reports/ReportsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useRef(null);
  const hasCheckedAutoLogin = useRef(false);
  const loadingTimeoutRef = useRef(null);

  logger.info('App: Komponent mount olundu');

  // Invoices Stack Navigator
  const InvoicesStack = () => (
    <Stack.Navigator
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
      <Stack.Screen 
        name="InvoiceMenu" 
        component={InvoiceMenuScreen}
        options={{ headerShown: false }}
      />
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
      <Stack.Screen 
        name="ProductPurchase" 
        component={ProductPurchaseScreen}
        options={({ route }) => ({
          title: route?.params?.isEdit ? 'Alış Qaiməsini Redaktə Et' : 'Mal Alışı'
        })}
      />
      <Stack.Screen 
        name="ProductSale" 
        component={ProductSaleScreen}
        options={({ route }) => ({
          title: route?.params?.isEdit ? 'Satış Qaiməsini Redaktə Et' : 'Mal Satışı'
        })}
      />
    </Stack.Navigator>
  );

  // Warehouse Stack Navigator
  const WarehouseStack = () => (
    <Stack.Navigator
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
      <Stack.Screen 
        name="WarehouseMain" 
        component={WarehouseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductRegistration" 
        component={ProductRegistrationScreen}
        options={({ route }) => ({
          title: route?.params?.isEdit ? 'Məhsulu Redaktə Et' : 'Mal Qeydiyyatı'
        })}
      />
    </Stack.Navigator>
  );

  // Partners Stack Navigator
  const PartnersStack = () => (
    <Stack.Navigator
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
      <Stack.Screen 
        name="PartnersMenu" 
        component={PartnersMenuScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CustomerScreen" 
        component={CustomerScreen}
        options={{ title: 'Müştərilər' }}
      />
      <Stack.Screen 
        name="SupplierScreen" 
        component={SupplierScreen}
        options={{ title: 'Satıcılar' }}
      />
      <Stack.Screen 
        name="CustomerRegistration" 
        component={CustomerRegistrationScreen}
        options={{ title: 'Müştəri Qeydiyyatı' }}
      />
    </Stack.Navigator>
  );

  // Reports Stack Navigator
  const ReportsStack = () => (
    <Stack.Navigator
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
      <Stack.Screen 
        name="ReportsMain" 
        component={ReportsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );

  // Main App Navigator (Bottom Tab + Stack)
  const MainAppNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'InvoicesTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'WarehouseTab') {
            iconName = focused ? 'archive' : 'archive-outline';
          } else if (route.name === 'ReportsTab') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'PartnersTab') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="InvoicesTab" 
        component={InvoicesStack}
        options={{ title: 'Qaimələr' }}
      />
      <Tab.Screen 
        name="WarehouseTab" 
        component={WarehouseStack}
        options={{ title: 'Anbar' }}
      />
      <Tab.Screen 
        name="ReportsTab" 
        component={ReportsStack}
        options={{ title: 'Hesabatlar' }}
      />
      <Tab.Screen 
        name="PartnersTab" 
        component={PartnersStack}
        options={{ title: 'Carilər' }}
      />
    </Tab.Navigator>
  );

  // Keep-alive service-i başlat (Render API-ni aktiv saxlamaq üçün)
  useEffect(() => {
    keepAliveService.start();
    
    // Timeout: Əgər 3 saniyə ərzində loading bitməsə, mütləq dayandır
    loadingTimeoutRef.current = setTimeout(() => {
      logger.warn('App: Loading timeout, mütləq dayandırılır');
      setIsLoading(false);
    }, 3000);
    
    // Component unmount olduqda dayandır
    return () => {
      keepAliveService.stop();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const checkAutoLogin = async () => {
    // Bir dəfə yoxla
    if (hasCheckedAutoLogin.current) {
      logger.debug('checkAutoLogin: Artıq yoxlanılıb, atlanılır');
      setIsLoading(false); // Yenə də loading-i dayandır
      return;
    }
    hasCheckedAutoLogin.current = true;

    try {
      logger.debug('checkAutoLogin: Başladı');
      const isLoggedIn = await authService.isLoggedIn();
      
      if (isLoggedIn) {
        // Token-in etibarlılığını yoxla
        const token = await authService.getToken();
        if (token) {
          // Token varsa, Home səhifəsinə yönləndir
          logger.success('checkAutoLogin: Token tapıldı, avtomatik giriş edilir');
          // Navigation hazır olduqda yönləndir
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          }, 100);
        } else {
          logger.debug('checkAutoLogin: Token yoxdur');
        }
      } else {
        logger.debug('checkAutoLogin: İstifadəçi giriş etməyib');
      }
    } catch (error) {
      logger.error('checkAutoLogin: Exception', error);
    } finally {
      setIsLoading(false);
      // Timeout-u təmizlə
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      logger.debug('checkAutoLogin: Bitdi');
    }
  };

  // Loading ekranı
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <StatusBar style="auto" />
      </View>
    );
  }
  
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        logger.info('NavigationContainer: Hazırdır');
        // Navigation hazır olduqda avtomatik girişi yoxla
        // Əgər artıq yoxlanılıbsa, yenə də loading-i dayandır
        if (hasCheckedAutoLogin.current) {
          setIsLoading(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        } else {
          checkAutoLogin().catch((error) => {
            logger.error('checkAutoLogin: Xəta', error);
            setIsLoading(false); // Xəta olsa belə loading-i dayandır
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
          });
        }
      }}
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
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen}
          options={{ title: 'Şifrəni Unutdum' }}
        />
        <Stack.Screen 
          name="Home" 
          component={MainAppNavigator}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

