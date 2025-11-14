import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../utils/logger';

export default function PartnersMenuScreen({ navigation }) {
  logger.info('PartnersMenuScreen: Komponent mount olundu');

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Carilər</Text>
        <Text style={styles.subtitle}>Cari növünü seçin</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CustomerScreen')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#00BCD4' }]}>
              <Ionicons name="people-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.menuItemText}>Alıcılar</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { marginTop: 20 }]}
            onPress={() => navigation.navigate('SupplierScreen')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#F44336' }]}>
              <Ionicons name="storefront-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.menuItemText}>Satıcılar</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  menuContainer: {
    // gap: 20, // React Native-də gap işləmir
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

