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
import { purchaseService } from '../../services/purchaseService';

export default function PurchaseInvoicesScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const result = await purchaseService.getInvoices();
      if (result.success) {
        setInvoices(result.data);
      }
    } catch (error) {
      Alert.alert('Xəta', 'Qaimələr yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const renderInvoice = ({ item }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => navigation.navigate('PurchaseInvoiceDetail', { invoiceId: item.id })}
    >
      <View style={styles.invoiceHeader}>
        <View>
          <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
          <Text style={styles.invoiceDate}>{formatDate(item.invoice_date)}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{parseFloat(item.total_amount || 0).toFixed(2)} AZN</Text>
        </View>
      </View>
      {item.supplier_name && (
        <View style={styles.supplierInfo}>
          <Ionicons name="storefront-outline" size={16} color="#666" />
          <Text style={styles.supplierName}>{item.supplier_name}</Text>
        </View>
      )}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
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

  const totalAmount = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alış Qaimələri</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="receipt-outline" size={24} color="#fff" />
          <Text style={styles.summaryValue}>{invoices.length}</Text>
          <Text style={styles.summaryLabel}>Qaimə Sayı</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="cash-outline" size={24} color="#fff" />
          <Text style={styles.summaryValue}>{totalAmount.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Ümumi Məbləğ</Text>
        </View>
      </View>

      {invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#fff" />
          <Text style={styles.emptyText}>Alış qaiməsi yoxdur</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderInvoice}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadInvoices}
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 15,
    paddingTop: 0,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  list: {
    padding: 15,
  },
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  invoiceDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  supplierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  supplierName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  arrowContainer: {
    position: 'absolute',
    right: 15,
    top: 15,
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

