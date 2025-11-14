// Server-side Logger Utility
const DEBUG = true;

const getTimestamp = () => {
  return new Date().toISOString();
};

const logger = {
  info: (message, data = null) => {
    if (DEBUG) {
      console.log(`[INFO] ${getTimestamp()} - ${message}`, data || '');
    }
  },
  
  error: (message, error = null) => {
    if (DEBUG) {
      console.error(`[ERROR] ${getTimestamp()} - ${message}`, error || '');
    }
  },
  
  warn: (message, data = null) => {
    if (DEBUG) {
      console.warn(`[WARN] ${getTimestamp()} - ${message}`, data || '');
    }
  },
  
  debug: (message, data = null) => {
    if (DEBUG) {
      console.log(`[DEBUG] ${getTimestamp()} - ${message}`, data || '');
    }
  },
  
  success: (message, data = null) => {
    if (DEBUG) {
      console.log(`[SUCCESS] ${getTimestamp()} - ${message}`, data || '');
    }
  },
  
  request: (req) => {
    if (DEBUG) {
      logger.debug(`Request: ${req.method} ${req.path}`, {
        body: req.body,
        query: req.query,
        params: req.params,
      });
    }
  },
};

module.exports = logger;

