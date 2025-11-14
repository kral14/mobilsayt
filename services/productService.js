import { logger } from '../utils/logger';
import { API_URL } from '../config/apiConfig';

export const productService = {
  async getProducts() {
    try {
      logger.debug('getProducts: Başladı');
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getProducts: Response status', response.status);
      const data = await response.json();
      logger.debug('getProducts: Response data', data);

      if (response.ok) {
        logger.success('getProducts: Uğurlu', { count: data.length });
        return { success: true, data: data };
      } else {
        logger.error('getProducts: Xəta', data.message);
        return { success: false, error: data.message || 'Məhsullar yüklənərkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('getProducts: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async createProduct(productData) {
    try {
      logger.debug('createProduct: Başladı', productData);
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      logger.debug('createProduct: Response status', response.status);
      const data = await response.json();
      logger.debug('createProduct: Response data', data);

      if (response.ok) {
        logger.success('createProduct: Uğurlu', data);
        return { success: true, data: data };
      } else {
        logger.error('createProduct: Xəta', data.message);
        return { success: false, error: data.message || 'Məhsul yaradılarkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('createProduct: Exception', error);
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

