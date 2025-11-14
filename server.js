const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('./config/database');
const logger = require('./utils/serverLogger');
const { authenticateToken } = require('./middleware/auth');
const { getLocalIP } = require('./utils/getLocalIP');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOCAL_IP = NODE_ENV === 'production' ? null : getLocalIP();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (favicon və .well-known request-lərini skip et)
app.use((req, res, next) => {
  // Favicon və Chrome DevTools request-lərini log etmə
  if (!req.path.includes('favicon') && !req.path.includes('.well-known')) {
    logger.request(req);
  }
  next();
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    logger.debug('POST /api/auth/login: Başladı');
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('POST /api/auth/login: E-poçt və ya şifrə boşdur');
      return res.status(400).json({ message: 'E-poçt və şifrə tələb olunur' });
    }

    logger.debug('POST /api/auth/login: İstifadəçi axtarılır', { email });
    // Find user in database
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn('POST /api/auth/login: İstifadəçi tapılmadı', { email });
      return res.status(401).json({ message: 'E-poçt və ya şifrə yanlışdır' });
    }

    const user = result.rows[0];
    logger.debug('POST /api/auth/login: İstifadəçi tapıldı', { userId: user.id });

    // Compare password
    logger.debug('POST /api/auth/login: Şifrə yoxlanılır');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn('POST /api/auth/login: Şifrə yanlışdır', { email });
      return res.status(401).json({ message: 'E-poçt və ya şifrə yanlışdır' });
    }

    // Generate JWT token
    logger.debug('POST /api/auth/login: Token yaradılır');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.success('POST /api/auth/login: Uğurlu', { userId: user.id, email });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error('POST /api/auth/login: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    logger.debug('POST /api/auth/forgot-password: Başladı');
    const { email } = req.body;

    if (!email) {
      logger.warn('POST /api/auth/forgot-password: E-poçt boşdur');
      return res.status(400).json({ message: 'E-poçt tələb olunur' });
    }

    logger.debug('POST /api/auth/forgot-password: İstifadəçi axtarılır', { email });
    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      logger.warn('POST /api/auth/forgot-password: İstifadəçi tapılmadı', { email });
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'Əgər bu e-poçt ünvanı qeydiyyatdan keçibsə, şifrə sıfırlama linki göndəriləcək',
      });
    }

    const user = userResult.rows[0];
    logger.debug('POST /api/auth/forgot-password: İstifadəçi tapıldı', { userId: user.id });

    // Generate reset token
    logger.debug('POST /api/auth/forgot-password: Reset token yaradılır');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Save token to database
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // TODO: Send email with reset link
    // For now, we'll just return success
    // You'll need to configure email service (e.g., SendGrid, Nodemailer, etc.)
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    logger.success('POST /api/auth/forgot-password: Uğurlu', { email });
    res.json({
      success: true,
      message: 'Şifrə sıfırlama linki e-poçt ünvanınıza göndərildi',
    });
  } catch (error) {
    logger.error('POST /api/auth/forgot-password: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Register endpoint (optional, for creating new users)
app.post('/api/auth/register', async (req, res) => {
  try {
    logger.debug('POST /api/auth/register: Başladı');
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('POST /api/auth/register: E-poçt və ya şifrə boşdur');
      return res.status(400).json({ message: 'E-poçt və şifrə tələb olunur' });
    }

    logger.debug('POST /api/auth/register: İstifadəçi mövcudluğu yoxlanılır', { email });
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      logger.warn('POST /api/auth/register: İstifadəçi artıq mövcuddur', { email });
      return res.status(400).json({ message: 'Bu e-poçt ünvanı artıq istifadə olunur' });
    }

    // Hash password
    logger.debug('POST /api/auth/register: Şifrə hash edilir');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    logger.debug('POST /api/auth/register: İstifadəçi yaradılır');
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT token
    logger.debug('POST /api/auth/register: Token yaradılır');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.success('POST /api/auth/register: Uğurlu', { userId: user.id, email });
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error('POST /api/auth/register: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Products endpoints
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/products: Başladı');
    
    // Barkod ilə axtarış
    const { barcode } = req.query;
    if (barcode) {
      logger.debug('GET /api/products: Barkod ilə axtarış', { barcode });
      const result = await pool.query(
        'SELECT * FROM products WHERE barcode = $1 ORDER BY created_at DESC',
        [barcode]
      );
      logger.success('GET /api/products: Barkod ilə axtarış uğurlu', { count: result.rows.length });
      res.json(result.rows);
      return;
    }
    
    // Bütün məhsullar
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    logger.success('GET /api/products: Uğurlu', { count: result.rows.length });
    res.json(result.rows);
  } catch (error) {
    logger.error('GET /api/products: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    logger.debug('POST /api/products: Başladı', req.body);
    const { name, barcode, description, unit, purchase_price, sale_price } = req.body;

    if (!name) {
      logger.warn('POST /api/products: Məhsul adı boşdur');
      return res.status(400).json({ message: 'Məhsul adı tələb olunur' });
    }

    // Barkod unikal yoxlaması
    if (barcode) {
      logger.debug('POST /api/products: Barkod unikal yoxlanılır', { barcode });
      const existingProduct = await pool.query(
        'SELECT id FROM products WHERE barcode = $1',
        [barcode]
      );
      
      if (existingProduct.rows.length > 0) {
        logger.warn('POST /api/products: Bu barkod artıq mövcuddur', { barcode });
        return res.status(400).json({ message: 'Bu barkod artıq qeydiyyatdan keçib. Zəhmət olmasa başqa barkod istifadə edin.' });
      }
    }

    // Kodlanma: Barkodun axır 6 rəqəmi
    let code = null;
    if (barcode && barcode.length >= 6) {
      code = barcode.slice(-6);
      logger.debug('POST /api/products: Kodlanma yaradıldı', { code, barcode });
    }

    const result = await pool.query(
      `INSERT INTO products (name, barcode, code, description, unit, purchase_price, sale_price) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, barcode || null, code, description || null, unit || 'ədəd', purchase_price || 0, sale_price || 0]
    );

    // Initialize warehouse entry
    await pool.query(
      'INSERT INTO warehouse (product_id, quantity) VALUES ($1, 0)',
      [result.rows[0].id]
    );

    logger.success('POST /api/products: Uğurlu', { productId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('POST /api/products: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Update product endpoint
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('PUT /api/products/:id: Başladı', { id: req.params.id, body: req.body });
    const { id } = req.params;
    const { name, barcode, description, unit, purchase_price, sale_price } = req.body;

    if (!name) {
      logger.warn('PUT /api/products/:id: Məhsul adı boşdur');
      return res.status(400).json({ message: 'Məhsul adı tələb olunur' });
    }

    // Barkod unikal yoxlaması (özü istisna olmaqla)
    if (barcode) {
      logger.debug('PUT /api/products/:id: Barkod unikal yoxlanılır', { barcode, id });
      const existingProduct = await pool.query(
        'SELECT id FROM products WHERE barcode = $1 AND id != $2',
        [barcode, id]
      );
      
      if (existingProduct.rows.length > 0) {
        logger.warn('PUT /api/products/:id: Bu barkod artıq mövcuddur', { barcode });
        return res.status(400).json({ message: 'Bu barkod artıq başqa məhsulda istifadə olunur. Zəhmət olmasa başqa barkod istifadə edin.' });
      }
    }

    // Kodlanma: Barkodun axır 6 rəqəmi
    let code = null;
    if (barcode && barcode.length >= 6) {
      code = barcode.slice(-6);
      logger.debug('PUT /api/products/:id: Kodlanma yeniləndi', { code, barcode });
    }

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, barcode = $2, code = $3, description = $4, unit = $5, purchase_price = $6, sale_price = $7, updated_at = NOW()
       WHERE id = $8 
       RETURNING *`,
      [name, barcode || null, code, description || null, unit || 'ədəd', purchase_price || 0, sale_price || 0, id]
    );

    if (result.rows.length === 0) {
      logger.warn('PUT /api/products/:id: Məhsul tapılmadı', { id });
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }

    logger.success('PUT /api/products/:id: Uğurlu', { productId: id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('PUT /api/products/:id: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Delete product endpoint
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('DELETE /api/products/:id: Başladı', { id: req.params.id });
    const { id } = req.params;

    // Öncə warehouse-dən sil
    await pool.query('DELETE FROM warehouse WHERE product_id = $1', [id]);

    // Sonra product-u sil
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      logger.warn('DELETE /api/products/:id: Məhsul tapılmadı', { id });
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }

    logger.success('DELETE /api/products/:id: Uğurlu', { productId: id });
    res.json({ success: true, message: 'Məhsul uğurla silindi' });
  } catch (error) {
    logger.error('DELETE /api/products/:id: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Get single product endpoint
app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/products/:id: Başladı', { id: req.params.id });
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      logger.warn('GET /api/products/:id: Məhsul tapılmadı', { id });
      return res.status(404).json({ message: 'Məhsul tapılmadı' });
    }

    logger.success('GET /api/products/:id: Uğurlu', { productId: id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('GET /api/products/:id: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Customers endpoints
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/customers: Başladı');
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    logger.success('GET /api/customers: Uğurlu', { count: result.rows.length });
    res.json(result.rows);
  } catch (error) {
    logger.error('GET /api/customers: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    logger.debug('POST /api/customers: Başladı', req.body);
    const { name, phone, email, address } = req.body;

    if (!name) {
      logger.warn('POST /api/customers: Müştəri adı boşdur');
      return res.status(400).json({ message: 'Müştəri adı tələb olunur' });
    }

    const result = await pool.query(
      `INSERT INTO customers (name, phone, email, address) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone || null, email || null, address || null]
    );

    logger.success('POST /api/customers: Uğurlu', { customerId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('POST /api/customers: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Suppliers endpoints
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/suppliers: Başladı');
    const result = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
    logger.success('GET /api/suppliers: Uğurlu', { count: result.rows.length });
    res.json(result.rows);
  } catch (error) {
    logger.error('GET /api/suppliers: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    logger.debug('POST /api/suppliers: Başladı', req.body);
    const { name, phone, email, address } = req.body;

    if (!name) {
      logger.warn('POST /api/suppliers: Satıcı adı boşdur');
      return res.status(400).json({ message: 'Satıcı adı tələb olunur' });
    }

    const result = await pool.query(
      `INSERT INTO suppliers (name, phone, email, address) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone || null, email || null, address || null]
    );

    logger.success('POST /api/suppliers: Uğurlu', { supplierId: result.rows[0].id });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('POST /api/suppliers: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Purchases endpoints
app.post('/api/purchases', authenticateToken, async (req, res) => {
  try {
    logger.debug('POST /api/purchases: Başladı', req.body);
    const { invoice_number, supplier_id, items, total_amount } = req.body;

    if (!invoice_number || !supplier_id || !items || items.length === 0) {
      logger.warn('POST /api/purchases: Məlumatlar natamamdır');
      return res.status(400).json({ message: 'Məlumatlar natamamdır' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO purchase_invoices (invoice_number, supplier_id, total_amount) 
         VALUES ($1, $2, $3) RETURNING *`,
        [invoice_number, supplier_id, total_amount || 0]
      );
      const invoiceId = invoiceResult.rows[0].id;

      // Insert items
      for (const item of items) {
        await client.query(
          `INSERT INTO purchase_invoice_items (invoice_id, product_id, quantity, unit_price, total_price) 
           VALUES ($1, $2, $3, $4, $5)`,
          [invoiceId, item.product_id, item.quantity, item.unit_price, item.total_price]
        );

        // Update warehouse
        const warehouseResult = await client.query(
          'SELECT * FROM warehouse WHERE product_id = $1',
          [item.product_id]
        );

        if (warehouseResult.rows.length > 0) {
          await client.query(
            'UPDATE warehouse SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
            [item.quantity, item.product_id]
          );
        } else {
          await client.query(
            'INSERT INTO warehouse (product_id, quantity) VALUES ($1, $2)',
            [item.product_id, item.quantity]
          );
        }
      }

      await client.query('COMMIT');
      logger.success('POST /api/purchases: Uğurlu', { invoiceId });
      res.status(201).json({ success: true, invoice: invoiceResult.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('POST /api/purchases: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

app.get('/api/purchases/invoices', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/purchases/invoices: Başladı');
    const result = await pool.query(
      `SELECT pi.*, s.name as supplier_name 
       FROM purchase_invoices pi 
       LEFT JOIN suppliers s ON pi.supplier_id = s.id 
       ORDER BY pi.created_at DESC`
    );
    logger.success('GET /api/purchases/invoices: Uğurlu', { count: result.rows.length });
    res.json(result.rows);
  } catch (error) {
    logger.error('GET /api/purchases/invoices: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Get single purchase invoice with items
app.get('/api/purchases/invoices/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/purchases/invoices/:id: Başladı', { id: req.params.id });
    const { id } = req.params;

    // Get invoice
    const invoiceResult = await pool.query(
      `SELECT pi.*, s.name as supplier_name 
       FROM purchase_invoices pi 
       LEFT JOIN suppliers s ON pi.supplier_id = s.id 
       WHERE pi.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      logger.warn('GET /api/purchases/invoices/:id: Qaimə tapılmadı', { id });
      return res.status(404).json({ message: 'Qaimə tapılmadı' });
    }

    // Get items
    const itemsResult = await pool.query(
      `SELECT pii.*, p.name as product_name 
       FROM purchase_invoice_items pii 
       LEFT JOIN products p ON pii.product_id = p.id 
       WHERE pii.invoice_id = $1`,
      [id]
    );

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    logger.success('GET /api/purchases/invoices/:id: Uğurlu', { invoiceId: id });
    res.json(invoice);
  } catch (error) {
    logger.error('GET /api/purchases/invoices/:id: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Delete purchase invoice
app.delete('/api/purchases/invoices/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('DELETE /api/purchases/invoices/:id: Başladı', { id: req.params.id });
    const { id } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get items to reverse warehouse changes
      const itemsResult = await client.query(
        'SELECT product_id, quantity FROM purchase_invoice_items WHERE invoice_id = $1',
        [id]
      );

      // Reverse warehouse changes
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE warehouse SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Delete items
      await client.query('DELETE FROM purchase_invoice_items WHERE invoice_id = $1', [id]);

      // Delete invoice
      const result = await client.query('DELETE FROM purchase_invoices WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        logger.warn('DELETE /api/purchases/invoices/:id: Qaimə tapılmadı', { id });
        return res.status(404).json({ message: 'Qaimə tapılmadı' });
      }

      await client.query('COMMIT');
      logger.success('DELETE /api/purchases/invoices/:id: Uğurlu', { invoiceId: id });
      res.json({ success: true, message: 'Qaimə uğurla silindi' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('DELETE /api/purchases/invoices/:id: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Sales endpoints
app.post('/api/sales', authenticateToken, async (req, res) => {
  try {
    logger.debug('POST /api/sales: Başladı', req.body);
    const { invoice_number, customer_id, items, total_amount } = req.body;

    if (!invoice_number || !customer_id || !items || items.length === 0) {
      logger.warn('POST /api/sales: Məlumatlar natamamdır');
      return res.status(400).json({ message: 'Məlumatlar natamamdır' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check warehouse availability
      for (const item of items) {
        const warehouseResult = await client.query(
          'SELECT quantity FROM warehouse WHERE product_id = $1',
          [item.product_id]
        );
        const availableQuantity = warehouseResult.rows[0]?.quantity || 0;
        if (availableQuantity < item.quantity) {
          throw new Error(`Məhsul ${item.product_id} üçün kifayət qədər qalıq yoxdur`);
        }
      }

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO sale_invoices (invoice_number, customer_id, total_amount) 
         VALUES ($1, $2, $3) RETURNING *`,
        [invoice_number, customer_id, total_amount || 0]
      );
      const invoiceId = invoiceResult.rows[0].id;

      // Insert items and update warehouse
      for (const item of items) {
        await client.query(
          `INSERT INTO sale_invoice_items (invoice_id, product_id, quantity, unit_price, total_price) 
           VALUES ($1, $2, $3, $4, $5)`,
          [invoiceId, item.product_id, item.quantity, item.unit_price, item.total_price]
        );

        // Update warehouse
        await client.query(
          'UPDATE warehouse SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }

      await client.query('COMMIT');
      logger.success('POST /api/sales: Uğurlu', { invoiceId });
      res.status(201).json({ success: true, invoice: invoiceResult.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('POST /api/sales: Exception', error);
    res.status(500).json({ message: error.message || 'Server xətası' });
  }
});

app.get('/api/sales/invoices', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/sales/invoices: Başladı');
    const result = await pool.query(
      `SELECT si.*, c.name as customer_name 
       FROM sale_invoices si 
       LEFT JOIN customers c ON si.customer_id = c.id 
       ORDER BY si.created_at DESC`
    );
    logger.success('GET /api/sales/invoices: Uğurlu', { count: result.rows.length });
    res.json(result.rows);
  } catch (error) {
    logger.error('GET /api/sales/invoices: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Get single sale invoice with items
app.get('/api/sales/invoices/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/sales/invoices/:id: Başladı', { id: req.params.id });
    const { id } = req.params;

    // Get invoice
    const invoiceResult = await pool.query(
      `SELECT si.*, c.name as customer_name 
       FROM sale_invoices si 
       LEFT JOIN customers c ON si.customer_id = c.id 
       WHERE si.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      logger.warn('GET /api/sales/invoices/:id: Qaimə tapılmadı', { id });
      return res.status(404).json({ message: 'Qaimə tapılmadı' });
    }

    // Get items
    const itemsResult = await pool.query(
      `SELECT sii.*, p.name as product_name 
       FROM sale_invoice_items sii 
       LEFT JOIN products p ON sii.product_id = p.id 
       WHERE sii.invoice_id = $1`,
      [id]
    );

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    logger.success('GET /api/sales/invoices/:id: Uğurlu', { invoiceId: id });
    res.json(invoice);
  } catch (error) {
    logger.error('GET /api/sales/invoices/:id: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Delete sale invoice
app.delete('/api/sales/invoices/:id', authenticateToken, async (req, res) => {
  try {
    logger.debug('DELETE /api/sales/invoices/:id: Başladı', { id: req.params.id });
    const { id } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get items to reverse warehouse changes
      const itemsResult = await client.query(
        'SELECT product_id, quantity FROM sale_invoice_items WHERE invoice_id = $1',
        [id]
      );

      // Reverse warehouse changes (add back to warehouse)
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE warehouse SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Delete items
      await client.query('DELETE FROM sale_invoice_items WHERE invoice_id = $1', [id]);

      // Delete invoice
      const result = await client.query('DELETE FROM sale_invoices WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        logger.warn('DELETE /api/sales/invoices/:id: Qaimə tapılmadı', { id });
        return res.status(404).json({ message: 'Qaimə tapılmadı' });
      }

      await client.query('COMMIT');
      logger.success('DELETE /api/sales/invoices/:id: Uğurlu', { invoiceId: id });
      res.json({ success: true, message: 'Qaimə uğurla silindi' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('DELETE /api/sales/invoices/:id: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Warehouse endpoint
app.get('/api/warehouse', authenticateToken, async (req, res) => {
  try {
    logger.debug('GET /api/warehouse: Başladı');
    const result = await pool.query(
      `SELECT 
        w.*, 
        p.name as product_name, 
        p.unit,
        p.barcode,
        p.code,
        p.purchase_price,
        p.sale_price,
        COALESCE(
          (SELECT s.name 
           FROM purchase_invoice_items pii
           JOIN purchase_invoices pi ON pii.invoice_id = pi.id
           JOIN suppliers s ON pi.supplier_id = s.id
           WHERE pii.product_id = p.id
           ORDER BY pi.invoice_date DESC
           LIMIT 1),
          'Məlumat yoxdur'
        ) as last_supplier_name,
        COALESCE(
          (SELECT pii.unit_price
           FROM purchase_invoice_items pii
           JOIN purchase_invoices pi ON pii.invoice_id = pi.id
           WHERE pii.product_id = p.id
           ORDER BY pi.invoice_date DESC
           LIMIT 1),
          p.purchase_price
        ) as last_purchase_price
       FROM warehouse w 
       LEFT JOIN products p ON w.product_id = p.id 
       ORDER BY p.name`
    );
    logger.success('GET /api/warehouse: Uğurlu', { count: result.rows.length });
    res.json(result.rows);
  } catch (error) {
    logger.error('GET /api/warehouse: Exception', error);
    res.status(500).json({ message: 'Server xətası' });
  }
});

// Favicon handler (404 xətasını qarşısını almaq üçün - ən əvvəl olmalıdır)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content - favicon yoxdur
});

// Chrome DevTools .well-known handler (bütün .well-known path-ləri üçün)
app.use('/.well-known', (req, res) => {
  res.status(204).end(); // No Content - Chrome extension request-ləri üçün
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mobil Sayt Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/login, /api/auth/register, /api/auth/forgot-password',
      products: '/api/products',
      customers: '/api/customers',
      suppliers: '/api/suppliers',
      purchases: '/api/purchases',
      sales: '/api/sales',
      warehouse: '/api/warehouse'
    },
    docs: 'Backend API server is running. Use the endpoints above.'
  });
});

// 404 handler (sonuncu olmalıdır)
app.use((req, res) => {
  // Favicon və .well-known kimi yayılmış request-ləri log etmə
  if (!req.path.includes('favicon') && !req.path.includes('.well-known')) {
    logger.warn(`404: ${req.method} ${req.path}`);
  }
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
  
  if (NODE_ENV === 'production') {
    logger.info(`✅ Production mode`);
    logger.info(`API is ready at: https://mobil-sayt-api.onrender.com/api`);
    logger.info(`Frontend config updated: config/apiConfig.js`);
  } else {
    logger.info(`🔧 Development mode`);
    logger.info(`API URL: http://localhost:${PORT}/api`);
    logger.info(`Root URL: http://localhost:${PORT}/`);
    if (LOCAL_IP) {
      logger.info(`Network URL: http://${LOCAL_IP}:${PORT}/api`);
      logger.info(`Mobil cihazdan bu URL-i istifadə edin: http://${LOCAL_IP}:${PORT}/api`);
      logger.info(`\n📱 QR kod ilə bağlanarkən, mobil cihaz və kompüter eyni Wi-Fi şəbəkəsində olmalıdır!`);
    }
  }
});

