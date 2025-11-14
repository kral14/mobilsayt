import { API_URL } from '../config/apiConfig';
import { logger } from './logger';

/**
 * Render API-ni aktiv saxlamaq üçün keep-alive service
 * Hər 10 dəqiqədən bir ping göndərir
 */
class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.interval = 10 * 60 * 1000; // 10 dəqiqə (millisaniyələrdə)
  }

  /**
   * Keep-alive service-i başlat
   */
  start() {
    if (this.isRunning) {
      logger.debug('KeepAlive: Artıq işləyir');
      return;
    }

    // Yalnız Render API üçün işləsin
    if (!API_URL.includes('onrender.com')) {
      logger.debug('KeepAlive: Render API deyil, keep-alive lazım deyil');
      return;
    }

    logger.info('KeepAlive: Service başladıldı');
    this.isRunning = true;

    // Dərhal bir ping göndər
    this.ping();

    // Sonra hər 10 dəqiqədən bir ping göndər
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.interval);
  }

  /**
   * Keep-alive service-i dayandır
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('KeepAlive: Service dayandırıldı');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Render API-yə ping göndər
   */
  async ping() {
    try {
      const url = API_URL.replace('/api', ''); // Root endpoint
      logger.debug('KeepAlive: Ping göndərilir', { url });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniyə timeout

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          logger.debug('KeepAlive: Ping uğurlu', { status: response.status });
        } else {
          logger.warn('KeepAlive: Ping uğursuz', { status: response.status });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name !== 'AbortError') {
          logger.warn('KeepAlive: Ping xətası', fetchError.message);
        }
      }
    } catch (error) {
      logger.error('KeepAlive: Exception', error);
    }
  }
}

// Singleton instance
const keepAliveService = new KeepAliveService();

export default keepAliveService;

