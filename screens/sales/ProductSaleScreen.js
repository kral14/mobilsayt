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
import { saleService } from '../../services/saleService';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';

export default function ProductSaleScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    loadData();
    generateInvoiceNumber();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        productService.getProducts(),
        customerService.getCustomers(),
      ]);
      if (productsRes.success) setProducts(productsRes.data);
      if (customersRes.success) setCustomers(customersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const number = `SAT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`;
    setInvoiceNumber(number);
  };

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.product_id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: parseFloat(item.quantity) + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.sale_price || 0,
        total_price: product.sale_price || 0,
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
    if (!selectedCustomer) {
      Alert.alert('Xəta', 'Zəhmət olmasa müştəri seçin');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Xəta', 'Səbətə məhsul əlavə edin');
      return;
    }

    setLoading(true);
    try {
      const result = await saleService.createSale({
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer.id,
        items: cartItems,
        total_amount: calculateTotal(),
      });

      if (result.success) {
        Alert.alert('Uğurlu', 'Satış qaiməsi yaradıldı', [
          { text: 'Tamam', onPress: () => {
            setCartItems([]);
            setSelectedCustomer(null);
            generateInvoiceNumber();
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
            <Text style={styles.sectionTitle}>Müştəri Seçin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerCard,
                    selectedCustomer?.id === customer.id && styles.customerCardSelected
                  ]}
                  onPress={() => setSelectedCustomer(customer)}
                >
                  <Text style={styles.customerName}>{customer.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Məhsul Seçin</Text>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => addToCart(item)}
                >
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>{item.sale_price || 0} AZN</Text>
                  <Ionicons name="add-circle" size={24} color="#9C27B0" />
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
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
                    <Text style={styles.cartItemTotal}>{item.total_price.toFixed(2)} AZN</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  customerCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    minWidth: 100,
  },
  customerCardSelected: {
    backgroundColor: '#9C27B0',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#9C27B0',
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

