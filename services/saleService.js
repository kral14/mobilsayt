import { logger } from '../utils/logger';
import { API_URL } from '../config/apiConfig';

export const saleService = {
  async createSale(saleData) {
    try {
      logger.debug('createSale: Başladı', saleData);
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });

      logger.debug('createSale: Response status', response.status);
      const data = await response.json();
      logger.debug('createSale: Response data', data);

      if (response.ok) {
        logger.success('createSale: Uğurlu', data);
        return { success: true, data: data };
      } else {
        logger.error('createSale: Xəta', data.message);
        return { success: false, error: data.message || 'Satış qaiməsi yaradılarkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('createSale: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async getInvoices() {
    try {
      logger.debug('getInvoices (sale): Başladı');
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/sales/invoices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getInvoices (sale): Response status', response.status);
      const data = await response.json();
      logger.debug('getInvoices (sale): Response data', data);

      if (response.ok) {
        logger.success('getInvoices (sale): Uğurlu', { count: data.length });
        return { success: true, data: data };
      } else {
        logger.error('getInvoices (sale): Xəta', data.message);
        return { success: false, error: data.message || 'Qaimələr yüklənərkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('getInvoices (sale): Exception', error);
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

