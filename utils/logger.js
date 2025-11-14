// Debug Logger Utility
const DEBUG = true; // Production-da false etmək olar

export const logger = {
  info: (message, data = null) => {
    if (DEBUG) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
  
  error: (message, error = null) => {
    if (DEBUG) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    }
  },
  
  warn: (message, data = null) => {
    if (DEBUG) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
  
  debug: (message, data = null) => {
    if (DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
  
  success: (message, data = null) => {
    if (DEBUG) {
      console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
};

