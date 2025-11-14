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

  async getInvoice(invoiceId) {
    try {
      logger.debug('getInvoice (sale): Başladı', { invoiceId });
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/sales/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getInvoice (sale): Response status', response.status);
      const data = await response.json();
      logger.debug('getInvoice (sale): Response data', data);

      if (response.ok) {
        logger.success('getInvoice (sale): Uğurlu', { invoiceId });
        return { success: true, data: data };
      } else {
        logger.error('getInvoice (sale): Xəta', data.message);
        return { success: false, error: data.message || 'Qaimə tapılmadı' };
      }
    } catch (error) {
      logger.error('getInvoice (sale): Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async deleteInvoice(invoiceId) {
    try {
      logger.debug('deleteInvoice (sale): Başladı', { invoiceId });
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/sales/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('deleteInvoice (sale): Response status', response.status);
      const data = await response.json();
      logger.debug('deleteInvoice (sale): Response data', data);

      if (response.ok) {
        logger.success('deleteInvoice (sale): Uğurlu', { invoiceId });
        return { success: true, data: data };
      } else {
        logger.error('deleteInvoice (sale): Xəta', data.message);
        return { success: false, error: data.message || 'Qaimə silinə bilmədi' };
      }
    } catch (error) {
      logger.error('deleteInvoice (sale): Exception', error);
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

