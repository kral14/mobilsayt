import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import * as SecureStore from 'expo-secure-store';

export default function HomeScreen({ navigation }) {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    try {
      const email = await SecureStore.getItemAsync('userEmail');
      if (email) {
        setUserEmail(email);
      }
    } catch (error) {
      console.error('Error loading user email:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıxış',
      'Hesabdan çıxmaq istədiyinizə əminsiniz?',
      [
        {
          text: 'Ləğv et',
          style: 'cancel',
        },
        {
          text: 'Çıx',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { id: 1, title: 'Mal Qeydiyyatı', icon: 'cube-outline', screen: 'ProductRegistration', color: '#4CAF50' },
    { id: 2, title: 'Mal Alışı', icon: 'cart-outline', screen: 'ProductPurchase', color: '#2196F3' },
    { id: 3, title: 'Müştəri Qeydiyyatı', icon: 'person-add-outline', screen: 'CustomerRegistration', color: '#FF9800' },
    { id: 4, title: 'Mal Satışı', icon: 'cash-outline', screen: 'ProductSale', color: '#9C27B0' },
    { id: 5, title: 'Müştəri Səhifəsi', icon: 'people-outline', screen: 'CustomerScreen', color: '#00BCD4' },
    { id: 6, title: 'Satıcı Səhifəsi', icon: 'storefront-outline', screen: 'SupplierScreen', color: '#F44336' },
    { id: 7, title: 'Anbar Səhifəsi', icon: 'archive-outline', screen: 'WarehouseScreen', color: '#795548' },
    { id: 8, title: 'Alış Qaimələri', icon: 'receipt-outline', screen: 'PurchaseInvoices', color: '#3F51B5' },
    { id: 9, title: 'Satış Qaimələri', icon: 'document-text-outline', screen: 'SaleInvoices', color: '#E91E63' },
  ];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Ana Səhifə</Text>
        {userEmail && (
          <Text style={styles.emailText}>{userEmail}</Text>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={28} color="#fff" />
            </View>
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Çıxış</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  menuContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 15,
    margin: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

