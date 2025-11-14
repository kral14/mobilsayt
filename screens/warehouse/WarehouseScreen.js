import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { warehouseService } from '../../services/warehouseService';

export default function WarehouseScreen({ navigation }) {
  const [warehouse, setWarehouse] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarehouse();
  }, []);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      const result = await warehouseService.getWarehouse();
      if (result.success) {
        setWarehouse(result.data);
      }
    } catch (error) {
      Alert.alert('Xəta', 'Anbar məlumatları yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product_name}</Text>
        <View style={styles.quantityContainer}>
          <Ionicons name="cube-outline" size={20} color="#795548" />
          <Text style={styles.quantityText}>
            {parseFloat(item.quantity || 0).toFixed(2)} {item.unit || 'ədəd'}
          </Text>
        </View>
      </View>
      {parseFloat(item.quantity || 0) <= 10 && (
        <View style={styles.lowStockBadge}>
          <Text style={styles.lowStockText}>Az qalıb</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </LinearGradient>
    );
  }

  const totalItems = warehouse.length;
  const totalQuantity = warehouse.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anbar</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cube" size={32} color="#fff" />
          <Text style={styles.statValue}>{totalItems}</Text>
          <Text style={styles.statLabel}>Məhsul Növü</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="layers" size={32} color="#fff" />
          <Text style={styles.statValue}>{totalQuantity.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Ümumi Miqdar</Text>
        </View>
      </View>

      {warehouse.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={64} color="#fff" />
          <Text style={styles.emptyText}>Anbarda məhsul yoxdur</Text>
        </View>
      ) : (
        <FlatList
          data={warehouse}
          keyExtractor={(item) => item.product_id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadWarehouse}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    paddingTop: 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  list: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    color: '#795548',
    marginLeft: 8,
    fontWeight: '600',
  },
  lowStockBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
  },
});

