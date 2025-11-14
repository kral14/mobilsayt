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
import { purchaseService } from '../../services/purchaseService';
import { logger } from '../../utils/logger';

export default function PurchaseInvoicesScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Səhifə fokuslandıqda qaimələri yenilə
      loadInvoices();
    });

    loadInvoices();

    return unsubscribe;
  }, [navigation]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const result = await purchaseService.getInvoices();
      if (result.success) {
        setInvoices(result.data);
        setFilteredInvoices(result.data);
      }
    } catch (error) {
      logger.error('loadInvoices: Exception', error);
      Alert.alert('Xəta', 'Qaimələr yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Axtarış və sort tətbiq et
    let filtered = invoices;

    // Axtarış
    if (searchQuery.trim()) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
          if (sortDirection === 'asc') {
            return aVal.localeCompare(bVal);
          } else {
            return bVal.localeCompare(aVal);
          }
        } else {
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

    setFilteredInvoices(filtered);
  }, [searchQuery, invoices, sortColumn, sortDirection]);

  const handleEdit = () => {
    if (!selectedInvoice) return;
    logger.debug('handleEdit: Başladı', { invoiceId: selectedInvoice.id });
    navigation.navigate('ProductPurchase', { 
      invoiceId: selectedInvoice.id,
      isEdit: true 
    });
    setSelectedInvoice(null);
  };

  const handleDelete = () => {
    if (!selectedInvoice) return;
    logger.debug('handleDelete: Başladı', { invoiceId: selectedInvoice.id });
    Alert.alert(
      'Qaiməni Sil',
      `"${selectedInvoice.invoice_number}" qaiməsini silmək istədiyinizə əminsiniz?`,
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await purchaseService.deleteInvoice(selectedInvoice.id);
              if (result.success) {
                logger.success('handleDelete: Qaimə silindi', { invoiceId: selectedInvoice.id });
                Alert.alert('Uğurlu', 'Qaimə uğurla silindi');
                loadInvoices();
                setSelectedInvoice(null);
              } else {
                Alert.alert('Xəta', result.error || 'Qaimə silinə bilmədi');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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

  const renderTableRow = (item, index) => (
    <TouchableOpacity
      key={item.id || index}
      style={[
        styles.tableRow,
        selectedInvoice?.id === item.id && styles.tableRowSelected
      ]}
      onPress={() => setSelectedInvoice(selectedInvoice?.id === item.id ? null : item)}
      onLongPress={() => navigation.navigate('PurchaseInvoiceDetail', { invoiceId: item.id })}
    >
      <Text style={[styles.tableCell, styles.cellInvoiceNumber]}>{item.invoice_number || '-'}</Text>
      <Text style={[styles.tableCell, styles.cellDate]}>{formatDate(item.invoice_date)}</Text>
      <Text style={[styles.tableCell, styles.cellSupplier]} numberOfLines={1}>
        {item.supplier_name || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.cellAmount]}>
        {parseFloat(item.total_amount || 0).toFixed(2)} AZN
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

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header with Toolbar */}
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { marginRight: 8 }]}
            onPress={() => navigation.navigate('ProductPurchase', { isEdit: false })}
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
            style={[styles.headerButton, { marginRight: 8 }, !selectedInvoice && styles.headerButtonDisabled]}
            onPress={handleEdit}
            disabled={!selectedInvoice}
          >
            <Ionicons 
              name="create-outline" 
              size={24} 
              color={selectedInvoice ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, !selectedInvoice && styles.headerButtonDisabled]}
            onPress={handleDelete}
            disabled={!selectedInvoice}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color={selectedInvoice ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Axtarış (qaimə nömrəsi, satıcı)..."
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
        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#fff" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Axtarış nəticəsi tapılmadı' : 'Alış qaiməsi yoxdur'}
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
                  style={[styles.tableHeaderCell, styles.cellInvoiceNumber]}
                  onPress={() => handleSort('invoice_number')}
                >
                  <Text style={styles.tableHeaderText}>Qaimə Nömrəsi</Text>
                  <Ionicons 
                    name={getSortIcon('invoice_number')} 
                    size={16} 
                    color={sortColumn === 'invoice_number' ? '#667eea' : '#999'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.cellDate]}
                  onPress={() => handleSort('invoice_date')}
                >
                  <Text style={styles.tableHeaderText}>Tarix</Text>
                  <Ionicons 
                    name={getSortIcon('invoice_date')} 
                    size={16} 
                    color={sortColumn === 'invoice_date' ? '#667eea' : '#999'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.cellSupplier]}
                  onPress={() => handleSort('supplier_name')}
                >
                  <Text style={styles.tableHeaderText}>Satıcı</Text>
                  <Ionicons 
                    name={getSortIcon('supplier_name')} 
                    size={16} 
                    color={sortColumn === 'supplier_name' ? '#667eea' : '#999'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tableHeaderCell, styles.cellAmount]}
                  onPress={() => handleSort('total_amount')}
                >
                  <Text style={styles.tableHeaderText}>Məbləğ</Text>
                  <Ionicons 
                    name={getSortIcon('total_amount')} 
                    size={16} 
                    color={sortColumn === 'total_amount' ? '#667eea' : '#999'} 
                  />
                </TouchableOpacity>
              </View>
              {/* Table Rows */}
              {filteredInvoices.map((item, index) => renderTableRow(item, index))}
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
  cellInvoiceNumber: {
    width: 120,
  },
  cellDate: {
    width: 100,
  },
  cellSupplier: {
    flex: 2,
  },
  cellAmount: {
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
    color: '#fff',
    marginTop: 20,
  },
});

