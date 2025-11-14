import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { warehouseService } from '../../services/warehouseService';
import { productService } from '../../services/productService';
import { logger } from '../../utils/logger';

export default function WarehouseScreen({ navigation, route }) {
  const [warehouse, setWarehouse] = useState([]);
  const [filteredWarehouse, setFilteredWarehouse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState(['Hamısı']);
  const [selectedCategory, setSelectedCategory] = useState('Hamısı');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadWarehouse();
    });

    loadWarehouse();

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Axtarış və filtr tətbiq et
    let filtered = warehouse;

    // Axtarış
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code?.includes(searchQuery) ||
        item.barcode?.includes(searchQuery)
      );
    }

    // Filtr (kateqoriya)
    if (selectedCategory !== 'Hamısı') {
      filtered = filtered.filter(item => 
        item.product_name?.charAt(0).toUpperCase() === selectedCategory
      );
    }

    // Sort
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        // String comparison
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aVal.localeCompare(bVal);
          } else {
            return bVal.localeCompare(aVal);
          }
        }
        // Number comparison
        else {
          aVal = parseFloat(aVal || 0);
          bVal = parseFloat(bVal || 0);
          if (sortDirection === 'asc') {
            return aVal - bVal;
          } else {
            return bVal - aVal;
          }
        }
      });
    }

    setFilteredWarehouse(filtered);
  }, [warehouse, searchQuery, selectedCategory, sortColumn, sortDirection]);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      const result = await warehouseService.getWarehouse();
      if (result.success) {
        setWarehouse(result.data);
        setFilteredWarehouse(result.data);
        // Kateqoriyaları yüklə (məsələn, məhsul adlarının ilk hərflərinə görə)
        const cats = ['Hamısı', ...new Set(result.data.map(item => 
          item.product_name?.charAt(0).toUpperCase() || 'Digər'
        ))];
        setCategories(cats);
      }
    } catch (error) {
      Alert.alert('Xəta', 'Anbar məlumatları yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    logger.debug('handleEdit: Başladı', { productId: selectedProduct.product_id });
    try {
      const result = await productService.getProduct(selectedProduct.product_id);
      if (result.success) {
        navigation.navigate('ProductRegistration', { 
          product: result.data,
          isEdit: true 
        });
        setSelectedProduct(null);
      } else {
        Alert.alert('Xəta', result.error || 'Məhsul məlumatları yüklənə bilmədi');
      }
    } catch (error) {
      logger.error('handleEdit: Exception', error);
      Alert.alert('Xəta', 'Xəta baş verdi');
    }
  };

  const handleDelete = () => {
    if (!selectedProduct) return;
    logger.debug('handleDelete: Başladı', { productId: selectedProduct.product_id });
    Alert.alert(
      'Məhsulu Sil',
      `"${selectedProduct.product_name}" məhsulunu silmək istədiyinizə əminsiniz?`,
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await productService.deleteProduct(selectedProduct.product_id);
              if (result.success) {
                logger.success('handleDelete: Məhsul silindi', { productId: selectedProduct.product_id });
                Alert.alert('Uğurlu', 'Məhsul uğurla silindi');
                setSelectedProduct(null);
                loadWarehouse();
              } else {
                Alert.alert('Xəta', result.error || 'Məhsul silinə bilmədi');
              }
            } catch (error) {
              logger.error('handleDelete: Exception', error);
              Alert.alert('Xəta', 'Xəta baş verdi');
            }
          },
        },
      ]
    );
  };

  const handleCopy = async () => {
    if (!selectedProduct) return;
    logger.debug('handleCopy: Başladı', { productId: selectedProduct.product_id });
    try {
      const result = await productService.getProduct(selectedProduct.product_id);
      if (result.success) {
        const product = result.data;
        navigation.navigate('ProductRegistration', { 
          product: { ...product, barcode: '', id: undefined },
          isEdit: false 
        });
        setSelectedProduct(null);
      } else {
        Alert.alert('Xəta', result.error || 'Məhsul məlumatları yüklənə bilmədi');
      }
    } catch (error) {
      logger.error('handleCopy: Exception', error);
      Alert.alert('Xəta', 'Xəta baş verdi');
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Eyni sütuna basıldıqda istiqaməti dəyiş
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Yeni sütuna basıldıqda
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
    // Əgər onSelect callback varsa (ProductPurchaseScreen və ya ProductSaleScreen-dən açılıbsa)
    if (route?.params?.onSelect) {
      // Məhsul məlumatlarını tam yüklə
      productService.getProduct(item.product_id).then((result) => {
        if (result.success) {
          route.params.onSelect(result.data);
        }
      });
      return;
    }
    // Normal seçim
    setSelectedProduct(selectedProduct?.product_id === item.product_id ? null : item);
  };

  const renderTableRow = (item, index) => (
    <TouchableOpacity
      key={item.product_id || index}
      style={[
        styles.tableRow,
        selectedProduct?.product_id === item.product_id && styles.tableRowSelected
      ]}
      onPress={() => handleRowPress(item)}
    >
      <Text style={[styles.tableCell, styles.tableCellCode]}>{item.code || '-'}</Text>
      <Text style={[styles.tableCell, styles.tableCellName]} numberOfLines={1}>
        {item.product_name || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellSupplier]} numberOfLines={1}>
        {item.last_supplier_name || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellPrice]}>
        {parseFloat(item.last_purchase_price || 0).toFixed(2)} AZN
      </Text>
      <Text style={[styles.tableCell, styles.tableCellQuantity]}>
        {parseFloat(item.quantity || 0).toFixed(2)} {item.unit || 'ədəd'}
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
            onPress={() => navigation.navigate('ProductRegistration', { isEdit: false })}
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
            onPress={() => setShowFilter(!showFilter)}
          >
            <Ionicons name="filter" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Ionicons 
              name={showCategories ? "folder" : "folder-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={() => {
              // Ayarlar funksionallığı burada olacaq
              Alert.alert('Ayarlar', 'Ayarlar funksionallığı tezliklə əlavə ediləcək');
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }, !selectedProduct && styles.headerButtonDisabled]}
            onPress={handleEdit}
            disabled={!selectedProduct}
          >
            <Ionicons 
              name="create-outline" 
              size={24} 
              color={selectedProduct ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }, !selectedProduct && styles.headerButtonDisabled]}
            onPress={handleCopy}
            disabled={!selectedProduct}
          >
            <Ionicons 
              name="copy-outline" 
              size={24} 
              color={selectedProduct ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, !selectedProduct && styles.headerButtonDisabled]}
            onPress={handleDelete}
            disabled={!selectedProduct}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color={selectedProduct ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Axtarış (ad, kod, barkod)..."
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

      {/* Filter Info */}
      {showFilter && selectedCategory !== 'Hamısı' && (
        <View style={styles.filterInfo}>
          <Text style={styles.filterInfoText}>
            Filtr: {selectedCategory}
          </Text>
          <TouchableOpacity onPress={() => setSelectedCategory('Hamısı')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}


      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Left Side - Categories (Papkalam) - Toggle */}
        {showCategories && (
          <View style={styles.categoriesContainer}>
            <View style={styles.categoriesHeader}>
              <Text style={styles.categoriesTitle}>Papkalar</Text>
              <TouchableOpacity onPress={() => setShowCategories(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoriesList}>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category && styles.categoryItemSelected
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Ionicons 
                    name={selectedCategory === category ? "folder" : "folder-outline"} 
                    size={20} 
                    color={selectedCategory === category ? "#fff" : "#666"} 
                  />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Right Side - Table */}
        <View style={styles.tableContainer}>
          {filteredWarehouse.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="archive-outline" size={64} color="#fff" />
              <Text style={styles.emptyText}>Məhsul tapılmadı</Text>
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
                    style={[styles.tableHeaderCell, styles.tableCellCode]}
                    onPress={() => handleSort('code')}
                  >
                    <Text style={styles.tableHeaderText}>Kod</Text>
                    <Ionicons 
                      name={getSortIcon('code')} 
                      size={16} 
                      color={sortColumn === 'code' ? '#667eea' : '#999'} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tableHeaderCell, styles.tableCellName]}
                    onPress={() => handleSort('product_name')}
                  >
                    <Text style={styles.tableHeaderText}>Məhsul Adı</Text>
                    <Ionicons 
                      name={getSortIcon('product_name')} 
                      size={16} 
                      color={sortColumn === 'product_name' ? '#667eea' : '#999'} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tableHeaderCell, styles.tableCellSupplier]}
                    onPress={() => handleSort('last_supplier_name')}
                  >
                    <Text style={styles.tableHeaderText}>Satıcı</Text>
                    <Ionicons 
                      name={getSortIcon('last_supplier_name')} 
                      size={16} 
                      color={sortColumn === 'last_supplier_name' ? '#667eea' : '#999'} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tableHeaderCell, styles.tableCellPrice]}
                    onPress={() => handleSort('last_purchase_price')}
                  >
                    <Text style={styles.tableHeaderText}>Qiymət</Text>
                    <Ionicons 
                      name={getSortIcon('last_purchase_price')} 
                      size={16} 
                      color={sortColumn === 'last_purchase_price' ? '#667eea' : '#999'} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tableHeaderCell, styles.tableCellQuantity]}
                    onPress={() => handleSort('quantity')}
                  >
                    <Text style={styles.tableHeaderText}>Miqdar</Text>
                    <Ionicons 
                      name={getSortIcon('quantity')} 
                      size={16} 
                      color={sortColumn === 'quantity' ? '#667eea' : '#999'} 
                    />
                  </TouchableOpacity>
                </View>
                {/* Table Rows */}
                {filteredWarehouse.map((item, index) => renderTableRow(item, index))}
              </View>
            </ScrollView>
          )}
        </View>
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
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  filterInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  categoriesContainer: {
    width: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoriesList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ccc',
  },
  categoryTextSelected: {
    color: '#fff',
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
  tableCellCode: {
    width: 80,
    fontWeight: '600',
  },
  tableCellName: {
    width: 150,
  },
  tableCellSupplier: {
    width: 120,
  },
  tableCellPrice: {
    width: 100,
    textAlign: 'right',
  },
  tableCellQuantity: {
    width: 100,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
});
