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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { purchaseService } from '../../services/purchaseService';
import { productService } from '../../services/productService';
import { supplierService } from '../../services/supplierService';
import BarcodeScanner from '../../components/BarcodeScanner';
import { logger } from '../../utils/logger';

export default function ProductPurchaseScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Satıcı axtarışı
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showSupplierList, setShowSupplierList] = useState(false);
  
  // Məhsul axtarışı
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductList, setShowProductList] = useState(false);

  useEffect(() => {
    loadData();
    generateInvoiceNumber();
  }, []);
  
  useEffect(() => {
    // Route params-dan seçilmiş satıcı və məhsul gələ bilər
    if (route?.params?.selectedSupplier) {
      setSelectedSupplier(route.params.selectedSupplier);
      setSupplierSearchQuery(route.params.selectedSupplier.name);
    }
    if (route?.params?.selectedProduct) {
      addToCart(route.params.selectedProduct);
    }
  }, [route?.params]);
  
  useEffect(() => {
    // Satıcı axtarışı
    if (supplierSearchQuery.trim()) {
      const filtered = suppliers.filter(supplier => 
        supplier.name?.toLowerCase().includes(supplierSearchQuery.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowSupplierList(true);
    } else {
      setFilteredSuppliers([]);
      setShowSupplierList(false);
    }
  }, [supplierSearchQuery, suppliers]);
  
  useEffect(() => {
    // Məhsul axtarışı
    if (productSearchQuery.trim()) {
      const filtered = products.filter(product => 
        product.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        product.code?.includes(productSearchQuery) ||
        product.barcode?.includes(productSearchQuery)
      );
      setFilteredProducts(filtered);
      setShowProductList(true);
    } else {
      setFilteredProducts([]);
      setShowProductList(false);
    }
  }, [productSearchQuery, products]);

  const loadData = async () => {
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        productService.getProducts(),
        supplierService.getSuppliers(),
      ]);
      if (productsRes.success) {
        setProducts(productsRes.data);
      }
      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data);
      }
    } catch (error) {
      logger.error('loadData: Exception', error);
      console.error('Error loading data:', error);
    }
  };
  
  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearchQuery(supplier.name);
    setShowSupplierList(false);
  };
  
  const handleProductSelect = (product) => {
    addToCart(product);
    setProductSearchQuery('');
    setShowProductList(false);
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const number = `AL-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`;
    setInvoiceNumber(number);
  };

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.product_id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => {
        if (item.product_id === product.id) {
          const newQuantity = parseFloat(item.quantity || 0) + 1;
          return {
            ...item,
            quantity: newQuantity,
            total_price: newQuantity * parseFloat(item.unit_price || 0),
          };
        }
        return item;
      }));
    } else {
      const unitPrice = parseFloat(product.purchase_price || 0);
      setCartItems([...cartItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
      }]);
    }
  };

  const updateCartItem = (productId, field, value) => {
    setCartItems(cartItems.map(item => {
      if (item.product_id === productId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_price = parseFloat(updated.quantity || 0) * parseFloat(updated.unit_price || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      Alert.alert('Xəta', 'Zəhmət olmasa satıcı seçin');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Xəta', 'Səbətə məhsul əlavə edin');
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseService.createPurchase({
        invoice_number: invoiceNumber,
        supplier_id: selectedSupplier.id,
        items: cartItems,
        total_amount: calculateTotal(),
      });

      if (result.success) {
        Alert.alert('Uğurlu', 'Alış qaiməsi yaradıldı', [
          { text: 'Tamam', onPress: () => {
            // Alış qaimələri səhifəsinə qayıt
            navigation.navigate('PurchaseInvoices');
          }}
        ]);
      } else {
        Alert.alert('Xəta', result.error || 'Xəta baş verdi');
      }
    } catch (error) {
      Alert.alert('Xəta', 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qaimə Nömrəsi</Text>
            <TextInput
              style={styles.input}
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="Qaimə nömrəsi"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Satıcı Seçin</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Satıcı adı yazın..."
                placeholderTextColor="#999"
                value={supplierSearchQuery}
                onChangeText={setSupplierSearchQuery}
                onFocus={() => {
                  if (supplierSearchQuery.trim()) {
                    setShowSupplierList(true);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.folderButton}
                onPress={() => {
                  navigation.navigate('SupplierScreen', {
                    onSelect: (supplier) => {
                      handleSupplierSelect(supplier);
                      navigation.goBack();
                    }
                  });
                }}
              >
                <Ionicons name="folder-outline" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
            
            {/* Satıcı listi */}
            {showSupplierList && filteredSuppliers.length > 0 && (
              <View style={styles.dropdownList}>
                {filteredSuppliers.map((supplier) => (
                  <TouchableOpacity
                    key={supplier.id}
                    style={[
                      styles.dropdownItem,
                      selectedSupplier?.id === supplier.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleSupplierSelect(supplier)}
                  >
                    <Text style={styles.dropdownItemText}>{supplier.name}</Text>
                    {selectedSupplier?.id === supplier.id && (
                      <Ionicons name="checkmark" size={20} color="#667eea" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {selectedSupplier && (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>Seçilmiş: {selectedSupplier.name}</Text>
                <TouchableOpacity onPress={() => {
                  setSelectedSupplier(null);
                  setSupplierSearchQuery('');
                }}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Məhsul Seçin</Text>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
              >
                <Ionicons name="camera" size={24} color="#2196F3" />
                <Text style={styles.scanButtonText}>Barkod Skan</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Məhsul adı, kodu və ya barkodu yazın..."
                placeholderTextColor="#999"
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                onFocus={() => {
                  if (productSearchQuery.trim()) {
                    setShowProductList(true);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.folderButton}
                onPress={() => {
                  navigation.navigate('WarehouseMain', {
                    onSelect: (product) => {
                      handleProductSelect(product);
                      navigation.goBack();
                    }
                  });
                }}
              >
                <Ionicons name="folder-outline" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
            
            {/* Məhsul listi */}
            {showProductList && filteredProducts.length > 0 && (
              <View style={styles.dropdownList}>
                {filteredProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.dropdownItem}
                    onPress={() => handleProductSelect(product)}
                  >
                    <View style={styles.productDropdownInfo}>
                      <Text style={styles.productDropdownName}>{product.name}</Text>
                      <View style={styles.productDropdownMeta}>
                        {product.code && (
                          <Text style={styles.productDropdownMetaText}>Kod: {product.code}</Text>
                        )}
                        {product.barcode && (
                          <Text style={styles.productDropdownMetaText}>Barkod: {product.barcode}</Text>
                        )}
                        <Text style={styles.productDropdownPrice}>
                          {parseFloat(product.purchase_price || 0).toFixed(2)} AZN
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="add-circle" size={24} color="#2196F3" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Səbət</Text>
            {cartItems.map((item) => (
              <View key={item.product_id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.product_name}</Text>
                  <View style={styles.cartItemControls}>
                    <TextInput
                      style={styles.quantityInput}
                      value={item.quantity.toString()}
                      onChangeText={(text) => updateCartItem(item.product_id, 'quantity', text)}
                      keyboardType="numeric"
                    />
                    <Text style={styles.cartItemX}>x</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={item.unit_price.toString()}
                      onChangeText={(text) => updateCartItem(item.product_id, 'unit_price', text)}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.cartItemTotal}>{(item.total_price || 0).toFixed(2)} AZN</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.product_id)}>
                  <Ionicons name="trash-outline" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
            {cartItems.length > 0 && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>Cəmi: {calculateTotal().toFixed(2)} AZN</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Qaiməni Yarat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Barkod Scanner Modal */}
      <BarcodeScanner
        visible={showScanner}
        onScan={async (barcode) => {
          logger.debug('Barcode scanned in Purchase:', barcode);
          setShowScanner(false);
          
          // Barkod ilə məhsul tap
          const result = await productService.getProductByBarcode(barcode);
          if (result.success && result.data) {
            addToCart(result.data);
            Alert.alert('Uğurlu', `Məhsul tapıldı: ${result.data.name}`);
          } else {
            Alert.alert('Xəta', result.error || 'Bu barkod ilə məhsul tapılmadı');
          }
        }}
        onClose={() => setShowScanner(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  folderButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownList: {
    marginTop: 10,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  selectedItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  productDropdownInfo: {
    flex: 1,
  },
  productDropdownName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDropdownMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  productDropdownMetaText: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  productDropdownPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 'auto',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    width: 60,
    textAlign: 'center',
  },
  cartItemX: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    width: 80,
    textAlign: 'center',
  },
  cartItemTotal: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

