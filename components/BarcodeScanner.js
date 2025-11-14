import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../utils/logger';

const { width, height } = Dimensions.get('window');

export default function BarcodeScanner({ visible, onScan, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    logger.info('BarcodeScanner: Komponent mount olundu');
    
    // Kamera icazəsini yoxla və tələb et
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }

    return () => {
      logger.info('BarcodeScanner: Komponent unmount olundu');
    };
  }, [permission]);

  useEffect(() => {
    // Modal açılanda scanned-i reset et
    if (visible) {
      setScanned(false);
      hasScannedRef.current = false;
    } else {
      // Modal bağlandıqda da reset et
      hasScannedRef.current = false;
      setScanned(false);
    }
  }, [visible]);

  const handleBarCodeScanned = ({ data, type }) => {
    // useRef ilə bir dəfə skan edildikdən sonra callback-in çağırılmasını qadağan et
    if (hasScannedRef.current || scanned) {
      return;
    }
    
    hasScannedRef.current = true;
    setScanned(true);
    logger.success('BarcodeScanner: Barkod skan edildi', { type, data });
    
    // Barkod məlumatını parent komponentə göndər
    if (onScan) {
      onScan(data);
    }
    
    // Modal-ı bağla
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Kamera icazəsi yoxlanılır...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          <View style={styles.messageContainer}>
            <Ionicons name="camera-outline" size={64} color="#fff" />
            <Text style={styles.messageText}>Kamera icazəsi verilməyib</Text>
            <Text style={styles.subMessageText}>
              Zəhmət olmasa tətbiq parametrlərindən kamera icazəsi verin
            </Text>
            {permission.canAskAgain && (
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>İcazə Ver</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Bağla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
          }}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Text style={styles.title}>Barkod Skan Et</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Scanning area */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Bottom instructions */}
          <View style={styles.bottomBar}>
            <Text style={styles.instructionText}>
              Barkodu kameraya yönəldin
            </Text>
            {scanned && (
              <Text style={styles.successText}>
                ✓ Barkod skan edildi!
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.8,
    height: width * 0.8,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomBar: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
  },
  messageText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  subMessageText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  permissionButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

