import { logger } from '../utils/logger';
import { API_URL } from '../config/apiConfig';

export const supplierService = {
  async getSuppliers() {
    try {
      logger.debug('getSuppliers: Başladı');
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/suppliers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getSuppliers: Response status', response.status);
      const data = await response.json();
      logger.debug('getSuppliers: Response data', data);

      if (response.ok) {
        logger.success('getSuppliers: Uğurlu', { count: data.length });
        return { success: true, data: data };
      } else {
        logger.error('getSuppliers: Xəta', data.message);
        return { success: false, error: data.message || 'Satıcılar yüklənərkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('getSuppliers: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async createSupplier(supplierData) {
    try {
      logger.debug('createSupplier: Başladı', supplierData);
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(supplierData),
      });

      logger.debug('createSupplier: Response status', response.status);
      const data = await response.json();
      logger.debug('createSupplier: Response data', data);

      if (response.ok) {
        logger.success('createSupplier: Uğurlu', data);
        return { success: true, data: data };
      } else {
        logger.error('createSupplier: Xəta', data.message);
        return { success: false, error: data.message || 'Satıcı yaradılarkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('createSupplier: Exception', error);
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

