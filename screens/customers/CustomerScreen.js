import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { customerService } from '../../services/customerService';
import { logger } from '../../utils/logger';

export default function CustomerScreen({ navigation, route }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await customerService.getCustomers();
      if (result.success) {
        setCustomers(result.data);
        setFilteredCustomers(result.data);
      }
    } catch (error) {
      logger.error('loadCustomers: Exception', error);
      Alert.alert('Xəta', 'Müştərilər yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Axtarış və sort tətbiq et
    let filtered = customers;

    // Axtarış
    if (searchQuery.trim()) {
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortColumn] || '';
        let bVal = b[sortColumn] || '';
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
        if (sortDirection === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
    }

    setFilteredCustomers(filtered);
  }, [searchQuery, customers, sortColumn, sortDirection]);

  const handleEdit = () => {
    if (!selectedCustomer) return;
    logger.debug('handleEdit: Başladı', { customerId: selectedCustomer.id });
    navigation.navigate('CustomerRegistration', { 
      customer: selectedCustomer,
      isEdit: true 
    });
    setSelectedCustomer(null);
  };

  const handleDelete = () => {
    if (!selectedCustomer) return;
    logger.debug('handleDelete: Başladı', { customerId: selectedCustomer.id });
    Alert.alert(
      'Müştərini Sil',
      `"${selectedCustomer.name}" müştərisini silmək istədiyinizə əminsiniz?`,
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Xəbərdarlıq', 'Müştəri silmə funksionallığı tezliklə əlavə ediləcək');
            setSelectedCustomer(null);
          },
        },
      ]
    );
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return 'swap-vertical-outline';
    }
    return sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
  };

  const handleRowPress = (item) => {
    // Əgər onSelect callback varsa (ProductSaleScreen-dən açılıbsa)
    if (route?.params?.onSelect) {
      route.params.onSelect(item);
      return;
    }
    // Normal seçim
    setSelectedCustomer(selectedCustomer?.id === item.id ? null : item);
  };

  const renderTableRow = (item, index) => (
    <TouchableOpacity
      key={item.id || index}
      style={[
        styles.tableRow,
        selectedCustomer?.id === item.id && styles.tableRowSelected
      ]}
      onPress={() => handleRowPress(item)}
    >
      <Text style={[styles.tableCell, styles.cellName]} numberOfLines={1}>
        {item.name || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.cellPhone]} numberOfLines={1}>
        {item.phone || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.cellEmail]} numberOfLines={1}>
        {item.email || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.cellAddress]} numberOfLines={1}>
        {item.address || '-'}
      </Text>
    </TouchableOpacity>
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

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header with Toolbar */}
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={() => navigation.navigate('CustomerRegistration')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={() => {
              Alert.alert('Filtr', 'Filtr funksionallığı tezliklə əlavə ediləcək');
            }}
          >
            <Ionicons name="filter" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={() => {
              Alert.alert('Ayarlar', 'Ayarlar funksionallığı tezliklə əlavə ediləcək');
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }, !selectedCustomer && styles.headerButtonDisabled]}
            onPress={handleEdit}
            disabled={!selectedCustomer}
          >
            <Ionicons 
              name="create-outline" 
              size={24} 
              color={selectedCustomer ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, !selectedCustomer && styles.headerButtonDisabled]}
            onPress={handleDelete}
            disabled={!selectedCustomer}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color={selectedCustomer ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Axtarış (ad, telefon, e-poçt)..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main Content - Table */}
      <View style={styles.tableContainer}>
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#fff" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Axtarış nəticəsi tapılmadı' : 'Müştəri yoxdur'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('CustomerRegistration')}
              >
                <Text style={styles.emptyButtonText}>İlk müştərini əlavə et</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tableScrollContent}
          >
            <View style={styles.tableWrapper}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.cellName]}
                  onPress={() => handleSort('name')}
                >
                  <Text style={styles.tableHeaderText}>Ad</Text>
                  <Ionicons 
                    name={getSortIcon('name')} 
                    size={16} 
                    color={sortColumn === 'name' ? '#667eea' : '#999'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.cellPhone]}
                  onPress={() => handleSort('phone')}
                >
                  <Text style={styles.tableHeaderText}>Telefon</Text>
                  <Ionicons 
                    name={getSortIcon('phone')} 
                    size={16} 
                    color={sortColumn === 'phone' ? '#667eea' : '#999'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.cellEmail]}
                  onPress={() => handleSort('email')}
                >
                  <Text style={styles.tableHeaderText}>E-poçt</Text>
                  <Ionicons 
                    name={getSortIcon('email')} 
                    size={16} 
                    color={sortColumn === 'email' ? '#667eea' : '#999'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.cellAddress]}
                  onPress={() => handleSort('address')}
                >
                  <Text style={styles.tableHeaderText}>Ünvan</Text>
                  <Ionicons 
                    name={getSortIcon('address')} 
                    size={16} 
                    color={sortColumn === 'address' ? '#667eea' : '#999'} 
                  />
                </TouchableOpacity>
              </View>
              {/* Table Rows */}
              {filteredCustomers.map((item, index) => renderTableRow(item, index))}
            </View>
          </ScrollView>
        )}
      </View>
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
    padding: 10,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
  },
  tableScrollContent: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  tableWrapper: {
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
    marginRight: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingLeft: 0,
    paddingRight: 0,
  },
  tableRowSelected: {
    backgroundColor: '#E3F2FD',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 10,
  },
  cellName: {
    flex: 2,
  },
  cellPhone: {
    width: 120,
  },
  cellEmail: {
    flex: 2,
  },
  cellAddress: {
    flex: 2,
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    paddingHorizontal: 30,
  },
  emptyButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

