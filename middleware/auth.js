const jwt = require('jsonwebtoken');
const logger = require('../utils/serverLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  try {
    logger.debug('authenticateToken: Token yoxlanılır');
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('authenticateToken: Token tapılmadı');
      return res.status(401).json({ message: 'Token tələb olunur' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.error('authenticateToken: Token yanlışdır', err);
        return res.status(403).json({ message: 'Token yanlışdır və ya müddəti bitib' });
      }
      
      logger.debug('authenticateToken: Token uğurlu', { userId: user.userId });
      req.user = user;
      next();
    });
  } catch (error) {
    logger.error('authenticateToken: Exception', error);
    return res.status(500).json({ message: 'Server xətası' });
  }
};

module.exports = { authenticateToken };

