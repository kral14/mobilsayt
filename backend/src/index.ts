import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { execSync } from 'child_process'
import authRoutes from './routes/authRoutes'
import productRoutes from './routes/productRoutes'
import orderRoutes from './routes/orderRoutes'
import userRoutes from './routes/userRoutes'
import categoryRoutes from './routes/categoryRoutes'
import customerRoutes from './routes/customerRoutes'
import customerFolderRoutes from './routes/customerFolderRoutes'
import supplierRoutes from './routes/supplierRoutes'
import purchaseInvoiceRoutes from './routes/purchaseInvoiceRoutes'
import testRoutes from './routes/testRoutes'

dotenv.config()

// Production-də Prisma migration-ları avtomatik işə sal
if (process.env.NODE_ENV === 'production') {
  try {
    console.log('🔄 [PRISMA] Database schema sinxronizasiya edilir...')
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      cwd: __dirname + '/..'
    })
    console.log('✅ [PRISMA] Database schema sinxronizasiya olundu')
  } catch (error) {
    console.error('⚠️  [PRISMA] Database sinxronizasiya xətası:', error)
    // Xəta olsa belə serveri başlat (migration-lar sonra manual işə salına bilər)
  }
}

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend API is running' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/customer-folders', customerFolderRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/purchase-invoices', purchaseInvoiceRoutes)
app.use('/api/test', testRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route tapılmadı' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ [ERROR] Global error handler:')
  console.error('❌ [ERROR] Error message:', err.message)
  console.error('❌ [ERROR] Error code:', err.code)
  console.error('❌ [ERROR] Error stack:', err.stack)
  console.error('❌ [ERROR] Request path:', req.path)
  console.error('❌ [ERROR] Request method:', req.method)
  console.error('❌ [ERROR] Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
  
  res.status(500).json({ 
    message: 'Server xətası',
    error: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// Bütün interfeyslərdə dinlə (telefondan qoşulmaq üçün)
const HOST = process.env.HOST || '0.0.0.0'
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`)
  console.log(`📝 API endpoints:`)
  console.log(`   - POST /api/auth/register`)
  console.log(`   - POST /api/auth/login`)
  console.log(`   - GET  /api/products`)
  console.log(`   - POST /api/products`)
  console.log(`   - GET  /api/orders`)
  console.log(`   - POST /api/orders`)
  console.log(`   - GET  /api/users/profile`)
})

// Graceful shutdown for ts-node-dev hot reload
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('✅ HTTP server closed')
  })
})

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server')
  server.close(() => {
    console.log('✅ HTTP server closed')
    process.exit(0)
  })
})

// Handle ts-node-dev restart
if (process.env.NODE_ENV !== 'production') {
  process.once('SIGUSR2', () => {
    console.log('⚠️  SIGUSR2 signal received: closing HTTP server for restart')
    server.close(() => {
      console.log('✅ HTTP server closed, restarting...')
      process.kill(process.pid, 'SIGUSR2')
    })
  })
}
