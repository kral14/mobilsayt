import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logger.info('RegisterScreen: Komponent mount olundu');
    return () => {
      logger.info('RegisterScreen: Komponent unmount olundu');
    };
  }, []);

  const handleRegister = async () => {
    logger.debug('handleRegister: Başladı', { email: email.substring(0, 3) + '***' });
    
    // Validation
    if (!email.trim()) {
      logger.warn('handleRegister: E-poçt boşdur');
      Alert.alert('Xəta', 'Zəhmət olmasa e-poçt ünvanınızı daxil edin');
      return;
    }

    if (!password.trim()) {
      logger.warn('handleRegister: Şifrə boşdur');
      Alert.alert('Xəta', 'Zəhmət olmasa şifrənizi daxil edin');
      return;
    }

    if (password.length < 6) {
      logger.warn('handleRegister: Şifrə çox qısadır');
      Alert.alert('Xəta', 'Şifrə ən azı 6 simvol olmalıdır');
      return;
    }

    if (password !== confirmPassword) {
      logger.warn('handleRegister: Şifrələr eyni deyil');
      Alert.alert('Xəta', 'Şifrələr eyni deyil');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('handleRegister: E-poçt formatı yanlışdır', { email });
      Alert.alert('Xəta', 'Zəhmət olmasa düzgün e-poçt ünvanı daxil edin');
      return;
    }

    setLoading(true);
    logger.debug('handleRegister: Loading başladı');

    try {
      console.log('[RegisterScreen] Qeydiyyat başladı:', { email: email.substring(0, 3) + '***' });
      const result = await authService.register(email, password);
      console.log('[RegisterScreen] Register nəticəsi:', result);

      if (result && result.success) {
        logger.success('handleRegister: Qeydiyyat uğurlu, Home səhifəsinə keçilir');
        Alert.alert('Uğurlu', 'Qeydiyyat uğurla tamamlandı', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Home'),
          },
        ]);
      } else {
        const errorMessage = result?.error || 'Qeydiyyat uğursuz oldu';
        console.error('[RegisterScreen] Qeydiyyat xətası:', errorMessage);
        logger.error('handleRegister: Qeydiyyat uğursuz', errorMessage);
        Alert.alert('Qeydiyyat Xətası', errorMessage);
      }
    } catch (error) {
      console.error('[RegisterScreen] Exception:', error);
      logger.error('handleRegister: Exception', error);
      Alert.alert('Xəta', `Qeydiyyat zamanı xəta baş verdi: ${error.message || 'Naməlum xəta'}`);
    } finally {
      setLoading(false);
      logger.debug('handleRegister: Loading bitdi');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Yeni Hesab Yaradın</Text>
            <Text style={styles.subtitle}>Qeydiyyatdan keçin</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-poçt</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Şifrə</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ən azı 6 simvol"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Şifrəni Təsdiqlə</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Şifrəni yenidən daxil edin"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Qeydiyyatdan Keç</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginLinkText}>
                  Artıq hesabınız var? <Text style={styles.loginLinkBold}>Daxil Olun</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#fff',
    fontSize: 14,
  },
  loginLinkBold: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

