import { logger } from '../utils/logger';
import { API_URL } from '../config/apiConfig';

export const warehouseService = {
  async getWarehouse() {
    try {
      logger.debug('getWarehouse: Başladı');
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/warehouse`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getWarehouse: Response status', response.status);
      const data = await response.json();
      logger.debug('getWarehouse: Response data', data);

      if (response.ok) {
        logger.success('getWarehouse: Uğurlu', { count: data.length });
        return { success: true, data: data };
      } else {
        logger.error('getWarehouse: Xəta', data.message);
        return { success: false, error: data.message || 'Anbar məlumatları yüklənərkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('getWarehouse: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async getToken() {
    try {
      const { authService } = await import('./authService');
      return await authService.getToken();
    } catch (error) {
      logger.error('getToken: Xəta', error);
      return null;
    }
  },
};

