import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';
import { API_URL } from '../config/apiConfig';

export const authService = {
  // Login function
  async login(email, password) {
    try {
      logger.debug('login: Başladı', { email });
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      logger.debug('login: Response status', response.status);
      const data = await response.json();
      logger.debug('login: Response data', { hasToken: !!data.token });

      if (response.ok) {
        // Save token securely
        await SecureStore.setItemAsync('authToken', data.token);
        await SecureStore.setItemAsync('userEmail', email);
        logger.success('login: Uğurlu', { email });
        return { success: true, data };
      } else {
        logger.error('login: Xəta', data.message);
        return { success: false, error: data.message || 'Giriş uğursuz oldu' };
      }
    } catch (error) {
      logger.error('login: Exception', error);
      return { success: false, error: 'Bağlantı xətası. Zəhmət olmasa yenidən cəhd edin.' };
    }
  },

  // Register function
  async register(email, password) {
    try {
      console.log('[authService] Register başladı:', { email, API_URL });
      logger.debug('register: Başladı', { email });
      
      const url = `${API_URL}/auth/register`;
      console.log('[authService] Request URL:', url);
      
      // Timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 saniyə timeout
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('[authService] Response status:', response.status);
        logger.debug('register: Response status', response.status);
        
        const data = await response.json();
        console.log('[authService] Response data:', data);
        logger.debug('register: Response data', { hasToken: !!data.token });

        if (response.ok && data.success !== false) {
          // Save token securely
          if (data.token) {
            await SecureStore.setItemAsync('authToken', data.token);
            await SecureStore.setItemAsync('userEmail', email);
            console.log('[authService] Token saxlanıldı');
          }
          logger.success('register: Uğurlu', { email });
          return { success: true, data };
        } else {
          const errorMsg = data.message || 'Qeydiyyat uğursuz oldu';
          console.error('[authService] Register xətası:', errorMsg);
          logger.error('register: Xəta', errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('[authService] Request timeout');
          logger.error('register: Timeout');
          return { success: false, error: 'Request timeout. Zəhmət olmasa yenidən cəhd edin.' };
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('[authService] Register exception:', error);
      logger.error('register: Exception', error);
      
      let errorMessage = 'Bağlantı xətası';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error.message && error.message.includes('Network request failed')) {
        errorMessage = 'İnternet bağlantısını yoxlayın və ya Render API işləyir.';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Forgot password function
  async forgotPassword(email) {
    try {
      logger.debug('forgotPassword: Başladı', { email });
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      logger.debug('forgotPassword: Response status', response.status);
      const data = await response.json();
      logger.debug('forgotPassword: Response data', data);

      if (response.ok) {
        logger.success('forgotPassword: Uğurlu', { email });
        return { success: true, message: data.message || 'Şifrə sıfırlama linki e-poçt ünvanınıza göndərildi' };
      } else {
        logger.error('forgotPassword: Xəta', data.message);
        return { success: false, error: data.message || 'Xəta baş verdi' };
      }
    } catch (error) {
      logger.error('forgotPassword: Exception', error);
      return { success: false, error: 'Bağlantı xətası. Zəhmət olmasa yenidən cəhd edin.' };
    }
  },

  // Check if user is logged in
  async isLoggedIn() {
    try {
      logger.debug('isLoggedIn: Yoxlanılır');
      const token = await SecureStore.getItemAsync('authToken');
      const isLoggedIn = token !== null;
      logger.debug('isLoggedIn: Nəticə', { isLoggedIn });
      return isLoggedIn;
    } catch (error) {
      logger.error('isLoggedIn: Exception', error);
      return false;
    }
  },

  // Logout function
  async logout() {
    try {
      logger.debug('logout: Başladı');
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userEmail');
      logger.success('logout: Uğurlu');
      return { success: true };
    } catch (error) {
      logger.error('logout: Exception', error);
      return { success: false, error: 'Çıxış zamanı xəta baş verdi' };
    }
  },

  // Get stored token
  async getToken() {
    try {
      logger.debug('getToken: Token alınır');
      const token = await SecureStore.getItemAsync('authToken');
      logger.debug('getToken: Nəticə', { hasToken: !!token });
      return token;
    } catch (error) {
      logger.error('getToken: Exception', error);
      return null;
    }
  },
};

