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
import { productService } from '../../services/productService';
import { logger } from '../../utils/logger';
import BarcodeScanner from '../../components/BarcodeScanner';

export default function ProductRegistrationScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const isEdit = route?.params?.isEdit || false;
  const productData = route?.params?.product || null;
  
  const [formData, setFormData] = useState({
    name: productData?.name || '',
    barcode: productData?.barcode || '',
    description: productData?.description || '',
    unit: productData?.unit || 'ədəd',
    purchase_price: productData?.purchase_price?.toString() || '',
    sale_price: productData?.sale_price?.toString() || '',
  });

  useEffect(() => {
    logger.info('ProductRegistrationScreen: Komponent mount olundu', { isEdit, hasProduct: !!productData });
    return () => {
      logger.info('ProductRegistrationScreen: Komponent unmount olundu');
    };
  }, []);

  useEffect(() => {
    // Route params dəyişdikdə form-u yenilə
    if (productData) {
      setFormData({
        name: productData.name || '',
        barcode: productData.barcode || '',
        description: productData.description || '',
        unit: productData.unit || 'ədəd',
        purchase_price: productData.purchase_price?.toString() || '',
        sale_price: productData.sale_price?.toString() || '',
      });
    }
  }, [productData]);

  const handleSubmit = async () => {
    logger.debug('handleSubmit: Başladı', { productName: formData.name });
    
    if (!formData.name.trim()) {
      logger.warn('handleSubmit: Məhsul adı boşdur');
      Alert.alert('Xəta', 'Məhsul adı tələb olunur');
      return;
    }

    setLoading(true);
    logger.debug('handleSubmit: Loading başladı', { isEdit });
    
    try {
      let result;
      if (isEdit && productData?.id) {
        // Redaktə rejimi
        result = await productService.updateProduct(productData.id, formData);
        logger.debug('handleSubmit: Update nəticəsi', { success: result.success });
      } else {
        // Yeni məhsul
        result = await productService.createProduct(formData);
        logger.debug('handleSubmit: Create nəticəsi', { success: result.success });
      }
      
      if (result.success) {
        const message = isEdit ? 'Məhsul uğurla yeniləndi' : 'Məhsul uğurla qeydiyyata alındı';
        logger.success('handleSubmit: Uğurlu', { productName: formData.name, isEdit });
        Alert.alert('Uğurlu', message, [
          { text: 'Tamam', onPress: () => {
            logger.debug('handleSubmit: Anbar səhifəsinə qayıdılır');
            // Anbar səhifəsinə qayıt
            navigation.navigate('WarehouseScreen');
          }}
        ]);
      } else {
        logger.error('handleSubmit: Xəta', result.error);
        Alert.alert('Xəta', result.error || 'Xəta baş verdi');
      }
    } catch (error) {
      logger.error('handleSubmit: Exception', error);
      Alert.alert('Xəta', 'Xəta baş verdi');
    } finally {
      setLoading(false);
      logger.debug('handleSubmit: Loading bitdi');
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Məhsul Adı *</Text>
            <TextInput
              style={styles.input}
              placeholder="Məhsul adını daxil edin"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Barkod</Text>
            <View style={styles.barcodeContainer}>
              <TextInput
                style={[styles.input, styles.barcodeInput]}
                placeholder="Barkod"
                value={formData.barcode}
                onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
              >
                <Ionicons name="camera" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Təsvir</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Məhsul təsviri"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ölçü Vahidi</Text>
            <TextInput
              style={styles.input}
              placeholder="ədəd, kq, litr və s."
              value={formData.unit}
              onChangeText={(text) => setFormData({ ...formData, unit: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Alış Qiyməti</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.purchase_price}
              onChangeText={(text) => setFormData({ ...formData, purchase_price: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Satış Qiyməti</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.sale_price}
              onChangeText={(text) => setFormData({ ...formData, sale_price: text })}
              keyboardType="decimal-pad"
            />
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
                <Text style={styles.submitButtonText}>
                  {isEdit ? 'Yenilə' : 'Qeydiyyata Al'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Barkod Scanner Modal */}
      <BarcodeScanner
        visible={showScanner}
        onScan={(barcode) => {
          logger.debug('Barcode scanned:', barcode);
          setFormData({ ...formData, barcode: barcode });
          setShowScanner(false);
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
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
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
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeInput: {
    flex: 1,
    marginRight: 10,
  },
  scanButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

