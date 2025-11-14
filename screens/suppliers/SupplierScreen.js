import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supplierService } from '../../services/supplierService';
import { logger } from '../../utils/logger';

export default function SupplierScreen({ navigation, route }) {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const result = await supplierService.getSuppliers();
      if (result.success) {
        setSuppliers(result.data);
        setFilteredSuppliers(result.data);
      }
    } catch (error) {
      logger.error('loadSuppliers: Exception', error);
      Alert.alert('Xəta', 'Satıcılar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Axtarış və sort tətbiq et
    let filtered = suppliers;

    // Axtarış
    if (searchQuery.trim()) {
      filtered = filtered.filter(supplier => 
        supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone?.includes(searchQuery) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
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

    setFilteredSuppliers(filtered);
  }, [searchQuery, suppliers, sortColumn, sortDirection]);

  const handleEdit = () => {
    if (!selectedSupplier) return;
    logger.debug('handleEdit: Başladı', { supplierId: selectedSupplier.id });
    Alert.alert('Xəbərdarlıq', 'Satıcı redaktə funksionallığı tezliklə əlavə ediləcək');
    setSelectedSupplier(null);
  };

  const handleDelete = () => {
    if (!selectedSupplier) return;
    logger.debug('handleDelete: Başladı', { supplierId: selectedSupplier.id });
    Alert.alert(
      'Satıcını Sil',
      `"${selectedSupplier.name}" satıcısını silmək istədiyinizə əminsiniz?`,
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Xəbərdarlıq', 'Satıcı silmə funksionallığı tezliklə əlavə ediləcək');
            setSelectedSupplier(null);
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Xəta', 'Satıcı adı tələb olunur');
      return;
    }

    setSubmitting(true);
    try {
      const result = await supplierService.createSupplier(formData);
      if (result.success) {
        Alert.alert('Uğurlu', 'Satıcı uğurla qeydiyyata alındı', [
          { text: 'Tamam', onPress: () => {
            setFormData({
              name: '',
              phone: '',
              email: '',
              address: '',
            });
            setShowForm(false);
            loadSuppliers();
          }}
        ]);
      } else {
        Alert.alert('Xəta', result.error || 'Xəta baş verdi');
      }
    } catch (error) {
      Alert.alert('Xəta', 'Xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
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
    // Əgər onSelect callback varsa (ProductPurchaseScreen-dən açılıbsa)
    if (route?.params?.onSelect) {
      route.params.onSelect(item);
      return;
    }
    // Normal seçim
    setSelectedSupplier(selectedSupplier?.id === item.id ? null : item);
  };

  const renderTableRow = (item, index) => (
    <TouchableOpacity
      key={item.id || index}
      style={[
        styles.tableRow,
        selectedSupplier?.id === item.id && styles.tableRowSelected
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
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons name={showForm ? "close" : "add"} size={24} color="#fff" />
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
            style={[styles.headerButton, { marginRight: 8 }, !selectedSupplier && styles.headerButtonDisabled]}
            onPress={handleEdit}
            disabled={!selectedSupplier}
          >
            <Ionicons 
              name="create-outline" 
              size={24} 
              color={selectedSupplier ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, !selectedSupplier && styles.headerButtonDisabled]}
            onPress={handleDelete}
            disabled={!selectedSupplier}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color={selectedSupplier ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
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

      {showForm && (
        <View style={styles.formContainer}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>Yeni Satıcı</Text>
            <TextInput
              style={styles.input}
              placeholder="Satıcı adı *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefon"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="E-poçt"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ünvan"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={2}
            />
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Əlavə Et</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content - Table */}
      <View style={styles.tableContainer}>
        {filteredSuppliers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#fff" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Axtarış nəticəsi tapılmadı' : 'Satıcı yoxdur'}
            </Text>
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
              {filteredSuppliers.map((item, index) => renderTableRow(item, index))}
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
  formContainer: {
    padding: 15,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
});

