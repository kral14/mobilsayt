import { logger } from '../utils/logger';
import { API_URL } from '../config/apiConfig';

export const customerService = {
  async getCustomers() {
    try {
      logger.debug('getCustomers: Başladı');
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getCustomers: Response status', response.status);
      const data = await response.json();
      logger.debug('getCustomers: Response data', data);

      if (response.ok) {
        logger.success('getCustomers: Uğurlu', { count: data.length });
        return { success: true, data: data };
      } else {
        logger.error('getCustomers: Xəta', data.message);
        return { success: false, error: data.message || 'Müştərilər yüklənərkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('getCustomers: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async createCustomer(customerData) {
    try {
      logger.debug('createCustomer: Başladı', customerData);
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(customerData),
      });

      logger.debug('createCustomer: Response status', response.status);
      const data = await response.json();
      logger.debug('createCustomer: Response data', data);

      if (response.ok) {
        logger.success('createCustomer: Uğurlu', data);
        return { success: true, data: data };
      } else {
        logger.error('createCustomer: Xəta', data.message);
        return { success: false, error: data.message || 'Müştəri yaradılarkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('createCustomer: Exception', error);
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

