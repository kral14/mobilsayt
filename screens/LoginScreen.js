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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    logger.info('LoginScreen: Komponent mount olundu');
    
    // Saxlanılmış email və remember me statusunu yüklə
    loadSavedCredentials();
    
    return () => {
      logger.info('LoginScreen: Komponent unmount olundu');
    };
  }, []);

  const loadSavedCredentials = async () => {
    try {
      logger.debug('loadSavedCredentials: Başladı');
      const savedEmail = await SecureStore.getItemAsync('savedEmail');
      const rememberMeStatus = await SecureStore.getItemAsync('rememberMe');
      
      if (savedEmail && rememberMeStatus === 'true') {
        setEmail(savedEmail);
        setRememberMe(true);
        logger.debug('loadSavedCredentials: Saxlanılmış məlumatlar yükləndi', { email: savedEmail });
      }
    } catch (error) {
      logger.error('loadSavedCredentials: Exception', error);
    }
  };

  const handleLogin = async () => {
    logger.debug('handleLogin: Başladı', { email: email.substring(0, 3) + '***' });
    
    // Validation
    if (!email.trim()) {
      logger.warn('handleLogin: E-poçt boşdur');
      Alert.alert('Xəta', 'Zəhmət olmasa e-poçt ünvanınızı daxil edin');
      return;
    }

    if (!password.trim()) {
      logger.warn('handleLogin: Şifrə boşdur');
      Alert.alert('Xəta', 'Zəhmət olmasa şifrənizi daxil edin');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('handleLogin: E-poçt formatı yanlışdır', { email });
      Alert.alert('Xəta', 'Zəhmət olmasa düzgün e-poçt ünvanı daxil edin');
      return;
    }

    setLoading(true);
    logger.debug('handleLogin: Loading başladı');

    try {
      const result = await authService.login(email, password);
      logger.debug('handleLogin: Login nəticəsi', { success: result.success });

      if (result.success) {
        // Remember me seçildisə, email-i saxla
        if (rememberMe) {
          await SecureStore.setItemAsync('savedEmail', email);
          await SecureStore.setItemAsync('rememberMe', 'true');
          logger.debug('handleLogin: Email saxlanıldı (Remember Me)');
        } else {
          // Remember me seçilməyibsə, saxlanılmış məlumatları sil
          await SecureStore.deleteItemAsync('savedEmail');
          await SecureStore.deleteItemAsync('rememberMe');
          logger.debug('handleLogin: Saxlanılmış məlumatlar silindi');
        }
        
        logger.success('handleLogin: Giriş uğurlu, Home səhifəsinə keçilir');
        navigation.replace('Home');
      } else {
        logger.error('handleLogin: Giriş uğursuz', result.error);
        Alert.alert('Giriş Xətası', result.error || 'Giriş uğursuz oldu');
      }
    } catch (error) {
      logger.error('handleLogin: Exception', error);
      Alert.alert('Xəta', 'Giriş zamanı xəta baş verdi');
    } finally {
      setLoading(false);
      logger.debug('handleLogin: Loading bitdi');
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
        <View style={styles.content}>
          <Text style={styles.title}>Xoş Gəlmisiniz</Text>
          <Text style={styles.subtitle}>Hesabınıza daxil olun</Text>

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
                placeholder="Şifrənizi daxil edin"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.rememberMeContainer}>
              <TouchableOpacity
                style={styles.rememberMeCheckbox}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Məni xatırla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Şifrəni unutdum?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Daxil Ol</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerLinkText}>
                Hesabınız yoxdur? <Text style={styles.registerLinkBold}>Qeydiyyatdan Keçin</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  rememberMeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#fff',
    fontSize: 14,
  },
  registerLinkBold: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

