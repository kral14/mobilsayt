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

export default function ProductRegistrationScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    description: '',
    unit: 'ədəd',
    purchase_price: '',
    sale_price: '',
  });

  useEffect(() => {
    logger.info('ProductRegistrationScreen: Komponent mount olundu');
    return () => {
      logger.info('ProductRegistrationScreen: Komponent unmount olundu');
    };
  }, []);

  const handleSubmit = async () => {
    logger.debug('handleSubmit: Başladı', { productName: formData.name });
    
    if (!formData.name.trim()) {
      logger.warn('handleSubmit: Məhsul adı boşdur');
      Alert.alert('Xəta', 'Məhsul adı tələb olunur');
      return;
    }

    setLoading(true);
    logger.debug('handleSubmit: Loading başladı');
    
    try {
      const result = await productService.createProduct(formData);
      logger.debug('handleSubmit: Nəticə', { success: result.success });
      
      if (result.success) {
        logger.success('handleSubmit: Məhsul uğurla yaradıldı', { productName: formData.name });
        Alert.alert('Uğurlu', 'Məhsul uğurla qeydiyyata alındı', [
          { text: 'Tamam', onPress: () => {
            logger.debug('handleSubmit: Form təmizlənir');
            setFormData({
              name: '',
              barcode: '',
              description: '',
              unit: 'ədəd',
              purchase_price: '',
              sale_price: '',
            });
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
            <TextInput
              style={styles.input}
              placeholder="Barkod"
              value={formData.barcode}
              onChangeText={(text) => setFormData({ ...formData, barcode: text })}
              keyboardType="numeric"
            />
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
                <Text style={styles.submitButtonText}>Qeydiyyata Al</Text>
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
});

