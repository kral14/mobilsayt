import { logger } from '../utils/logger';
import { API_URL } from '../config/apiConfig';

export const purchaseService = {
  async createPurchase(purchaseData) {
    try {
      logger.debug('createPurchase: Başladı', purchaseData);
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(purchaseData),
      });

      logger.debug('createPurchase: Response status', response.status);
      const data = await response.json();
      logger.debug('createPurchase: Response data', data);

      if (response.ok) {
        logger.success('createPurchase: Uğurlu', data);
        return { success: true, data: data };
      } else {
        logger.error('createPurchase: Xəta', data.message);
        return { success: false, error: data.message || 'Alış qaiməsi yaradılarkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('createPurchase: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async getInvoices() {
    try {
      logger.debug('getInvoices (purchase): Başladı');
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/purchases/invoices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getInvoices (purchase): Response status', response.status);
      const data = await response.json();
      logger.debug('getInvoices (purchase): Response data', data);

      if (response.ok) {
        logger.success('getInvoices (purchase): Uğurlu', { count: data.length });
        return { success: true, data: data };
      } else {
        logger.error('getInvoices (purchase): Xəta', data.message);
        return { success: false, error: data.message || 'Qaimələr yüklənərkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('getInvoices (purchase): Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async getInvoice(invoiceId) {
    try {
      logger.debug('getInvoice (purchase): Başladı', { invoiceId });
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/purchases/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getInvoice (purchase): Response status', response.status);
      const data = await response.json();
      logger.debug('getInvoice (purchase): Response data', data);

      if (response.ok) {
        logger.success('getInvoice (purchase): Uğurlu', { invoiceId });
        return { success: true, data: data };
      } else {
        logger.error('getInvoice (purchase): Xəta', data.message);
        return { success: false, error: data.message || 'Qaimə tapılmadı' };
      }
    } catch (error) {
      logger.error('getInvoice (purchase): Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async deleteInvoice(invoiceId) {
    try {
      logger.debug('deleteInvoice (purchase): Başladı', { invoiceId });
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/purchases/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('deleteInvoice (purchase): Response status', response.status);
      const data = await response.json();
      logger.debug('deleteInvoice (purchase): Response data', data);

      if (response.ok) {
        logger.success('deleteInvoice (purchase): Uğurlu', { invoiceId });
        return { success: true, data: data };
      } else {
        logger.error('deleteInvoice (purchase): Xəta', data.message);
        return { success: false, error: data.message || 'Qaimə silinə bilmədi' };
      }
    } catch (error) {
      logger.error('deleteInvoice (purchase): Exception', error);
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

