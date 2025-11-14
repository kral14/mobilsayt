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

  async getProductByBarcode(barcode) {
    try {
      logger.debug('getProductByBarcode: Başladı', { barcode });
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/products?barcode=${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getProductByBarcode: Response status', response.status);
      const data = await response.json();
      logger.debug('getProductByBarcode: Response data', data);

      if (response.ok) {
        // Əgər array gəlirsə, ilk elementi götür
        const product = Array.isArray(data) ? data[0] : data;
        if (product) {
          logger.success('getProductByBarcode: Məhsul tapıldı', { productId: product.id });
          return { success: true, data: product };
        } else {
          logger.warn('getProductByBarcode: Məhsul tapılmadı', { barcode });
          return { success: false, error: 'Bu barkod ilə məhsul tapılmadı' };
        }
      } else {
        logger.error('getProductByBarcode: Xəta', data.message);
        return { success: false, error: data.message || 'Məhsul axtarılarkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('getProductByBarcode: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async getProduct(productId) {
    try {
      logger.debug('getProduct: Başladı', { productId });
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('getProduct: Response status', response.status);
      const data = await response.json();
      logger.debug('getProduct: Response data', data);

      if (response.ok) {
        logger.success('getProduct: Məhsul tapıldı', { productId });
        return { success: true, data: data };
      } else {
        logger.error('getProduct: Xəta', data.message);
        return { success: false, error: data.message || 'Məhsul tapılmadı' };
      }
    } catch (error) {
      logger.error('getProduct: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async updateProduct(productId, productData) {
    try {
      logger.debug('updateProduct: Başladı', { productId, productData });
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      logger.debug('updateProduct: Response status', response.status);
      const data = await response.json();
      logger.debug('updateProduct: Response data', data);

      if (response.ok) {
        logger.success('updateProduct: Uğurlu', { productId });
        return { success: true, data: data };
      } else {
        logger.error('updateProduct: Xəta', data.message);
        return { success: false, error: data.message || 'Məhsul yenilənərkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('updateProduct: Exception', error);
      return { success: false, error: 'Bağlantı xətası' };
    }
  },

  async deleteProduct(productId) {
    try {
      logger.debug('deleteProduct: Başladı', { productId });
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      logger.debug('deleteProduct: Response status', response.status);
      const data = await response.json();
      logger.debug('deleteProduct: Response data', data);

      if (response.ok) {
        logger.success('deleteProduct: Uğurlu', { productId });
        return { success: true, data: data };
      } else {
        logger.error('deleteProduct: Xəta', data.message);
        return { success: false, error: data.message || 'Məhsul silinərkən xəta baş verdi' };
      }
    } catch (error) {
      logger.error('deleteProduct: Exception', error);
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

