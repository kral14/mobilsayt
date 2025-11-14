import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API URL konfiqurasiyası
// Development zamanı avtomatik IP ünvanını tapır

// Expo development server ünvanı (LAN)
const getExpoHost = () => {
  try {
    // Expo development server-dən gələn host
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // Expo Constants-dan host al
      const manifest = Constants.expoConfig || Constants.manifest;
      
      if (manifest?.hostUri) {
        const hostUri = manifest.hostUri;
        // hostUri formatı: "192.168.1.100:8081" və ya "exp://192.168.1.100:8081"
        const host = hostUri.replace(/^exp:\/\//, '').split(':')[0];
        return `http://${host}:3000/api`;
      }
      
      // DebuggerHost istifadə et
      if (manifest?.debuggerHost) {
        const host = manifest.debuggerHost.split(':')[0];
        return `http://${host}:3000/api`;
      }
    }
  } catch (error) {
    console.warn('[API Config] Expo host tapılmadı:', error);
  }
  
  // Fallback: localhost (emulator/simulator üçün)
  return 'http://localhost:3000/api';
};

// Production API URL (Render-dən aldığınız URL)
const PRODUCTION_API_URL = 'https://mobil-sayt-api.onrender.com/api'; // ← Render URL-inizi buraya yazın

// Platform üçün API URL
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    // Web üçün localhost
    return 'http://localhost:3000/api';
  }
  
  // Development zamanı local backend istifadə et (tunnel mode-da işləyir)
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // Tunnel mode-da local backend istifadə etmək üçün ngrok və ya local IP lazımdır
    // Amma ən asan yol: Render API istifadə et (ilk request zamanı cold start olacaq)
    // Və ya local backend işə salın və IP ünvanını daxil edin
    return PRODUCTION_API_URL;
  }
  
  // Production üçün Render API
  return PRODUCTION_API_URL;
};

export const API_URL = getApiUrl();

// Debug üçün
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('[API Config] ========================================');
  console.log('[API Config] API_URL:', API_URL);
  console.log('[API Config] Platform:', Platform.OS);
  console.log('[API Config] Expo Config:', Constants.expoConfig);
  console.log('[API Config] Manifest:', Constants.manifest);
  console.log('[API Config] ========================================');
  
  // Əgər API_URL localhost-dursa, xəbərdarlıq ver
  if (API_URL.includes('localhost')) {
    console.warn('[API Config] ⚠️  XƏBƏRDARLIQ: API_URL localhost istifadə edir!');
    console.warn('[API Config] Fiziki cihazda işləməyəcək. IP ünvanınızı yoxlayın.');
    console.warn('[API Config] Manual dəyişdirmək üçün: config/apiConfig.js faylında API_URL-i dəyişdirin');
  }
}

