import { Router } from 'express'
import prisma from '../config/database'

const router = Router()

// Migration status yoxlamaq üçün test endpoint
router.get('/migration-status', async (req, res) => {
  try {
    const status: any = {
      categories_table: false,
      products_columns: [] as string[],
      foreign_key: false,
      prisma_client: false,
    }

    // Categories cədvəlinin olub-olmadığını yoxla
    try {
      const tableCheck: any = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'categories'
        ) as exists;
      `
      status.categories_table = tableCheck[0]?.exists || false
    } catch (e) {
      status.categories_table = false
    }

    // Products cədvəlində yeni sütunların olub-olmadığını yoxla
    try {
      const columnCheck: any = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name IN ('article', 'category_id', 'type', 'brand', 'model', 'color', 'size', 'weight', 'country', 'manufacturer', 'warranty_period', 'min_stock', 'max_stock', 'tax_rate', 'is_active');
      `
      status.products_columns = columnCheck.map((c: any) => c.column_name)
    } catch (e) {
      status.products_columns = []
    }

    // Foreign key constraint yoxla
    try {
      const fkCheck: any = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'products_category_id_fkey'
        ) as exists;
      `
      status.foreign_key = fkCheck[0]?.exists || false
    } catch (e) {
      status.foreign_key = false
    }

    // Prisma Client-də categories model-inin olub-olmadığını yoxla
    try {
      // Try to access prisma.categories
      // Check if categories property exists and is not undefined
      const hasCategories = 'categories' in prisma
      let categoriesType: string = 'undefined'
      try {
        categoriesType = typeof (prisma as any).categories
      } catch (e) {
        categoriesType = 'error'
      }

      status.prisma_client = hasCategories && categoriesType !== 'undefined' && categoriesType !== 'error'

      // Debug info
      status.prisma_client_debug = {
        hasCategories,
        categoriesType,
        prismaKeys: Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'))
      }
    } catch (e: any) {
      status.prisma_client = false
      status.prisma_client_error = e.message
    }

    // Nəticə
    const allGood =
      status.categories_table &&
      status.products_columns.length === 15 &&
      status.foreign_key &&
      status.prisma_client

    res.json({
      success: allGood,
      message: allGood
        ? '✅ Migration uğurla tətbiq olunub!'
        : '❌ Migration tam tətbiq olunmayıb',
      status,
      required_columns: [
        'article', 'category_id', 'type', 'brand', 'model',
        'color', 'size', 'weight', 'country', 'manufacturer',
        'warranty_period', 'min_stock', 'max_stock', 'tax_rate', 'is_active'
      ],
      missing_columns: [
        'article', 'category_id', 'type', 'brand', 'model',
        'color', 'size', 'weight', 'country', 'manufacturer',
        'warranty_period', 'min_stock', 'max_stock', 'tax_rate', 'is_active'
      ].filter(col => !status.products_columns.includes(col))
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Migration status yoxlanıla bilmədi',
      error: error.message
    })
  }
})

// Bulk Invoice Seeding Endpoint
// Bulk Invoice Seeding Endpoint
router.post('/seed-invoices', async (req, res) => {
  try {
    console.log('[SEED] Starting invoice seeding...')
    const customers = await prisma.customers.findMany({ select: { id: true }, take: 50 })
    const products = await prisma.products.findMany({ select: { id: true, sale_price: true }, take: 100 })

    if (customers.length === 0 || products.length === 0) {
      return res.status(400).json({ message: 'No customers or products found. Seed them first.' })
    }

    const INVOICE_COUNT = 10000
    const BATCH_SIZE = 250

    // Run in background to avoid timeout
    setImmediate(async () => {
      try {
        let createdCount = 0
        for (let i = 0; i < INVOICE_COUNT; i += BATCH_SIZE) {
          const invoicesData: any[] = []

          for (let j = 0; j < BATCH_SIZE; j++) {
            if (i + j >= INVOICE_COUNT) break

            const customer = customers[Math.floor(Math.random() * customers.length)]
            const itemCount = Math.floor(Math.random() * 5) + 1
            const invoiceItems = []
            let totalAmount = 0

            for (let k = 0; k < itemCount; k++) {
              const product = products[Math.floor(Math.random() * products.length)]
              const quantity = Math.floor(Math.random() * 10) + 1
              const price = Number(product.sale_price) || 10
              const total = quantity * price

              invoiceItems.push({
                product_id: product.id,
                quantity: quantity,
                unit_price: price,
                total_price: total
              })
              totalAmount += total
            }

            invoicesData.push({
              invoice_number: `TEST-INV-${Date.now()}-${i + j}`,
              customer_id: customer.id,
              invoice_date: new Date(),
              total_amount: totalAmount,
              is_active: true, // Approved
              sale_invoice_items: {
                create: invoiceItems
              }
            })
          }

          // Use transaction for batch insert
          await prisma.$transaction(
            invoicesData.map(invoice => prisma.sale_invoices.create({ data: invoice }))
          )
          createdCount += invoicesData.length
          console.log(`[SEED] Created ${createdCount} invoices...`)
        }
        console.log(`[SEED] Finished. Created ${createdCount} invoices.`)
      } catch (bgError) {
        console.error('[SEED] Background error:', bgError)
      }
    })

    res.json({ success: true, message: 'Seeding started in background. Check logs or count endpoint for progress.' })

  } catch (error: any) {
    console.error('[SEED] Error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Count invoices
router.get('/count-invoices', async (req, res) => {
  try {
    const sales = await prisma.sale_invoices.count()
    const purchases = await prisma.purchase_invoices.count()
    const customers = await prisma.customers.count()
    const products = await prisma.products.count()
    res.json({ sales, purchases, customers, products })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// Sync Seed Endpoint for debugging
router.post('/seed-sync', async (req, res) => {
  try {
    console.log('[SEED-SYNC] Starting sync seeding...')
    const customers = await prisma.customers.findMany({ select: { id: true }, take: 50 })
    const products = await prisma.products.findMany({ select: { id: true, sale_price: true }, take: 100 })

    if (customers.length === 0 || products.length === 0) {
      return res.status(400).json({ message: 'No customers or products found.' })
    }

    const count = req.query.count ? Number(req.query.count) : 5
    const invoicesData: any[] = []
    let totalAmount = 0

    for (let i = 0; i < count; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)]
      const itemCount = Math.floor(Math.random() * 5) + 1
      const invoiceItems = []
      let currentInvoiceTotal = 0

      for (let k = 0; k < itemCount; k++) {
        const product = products[Math.floor(Math.random() * products.length)]
        const quantity = Math.floor(Math.random() * 10) + 1
        const price = Number(product.sale_price) || 10
        const total = quantity * price

        invoiceItems.push({
          product_id: product.id,
          quantity: quantity,
          unit_price: price,
          total_price: total
        })
        currentInvoiceTotal += total
      }
      totalAmount += currentInvoiceTotal

      invoicesData.push({
        invoice_number: `TEST-INV-SYNC-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
        customer_id: customer.id,
        invoice_date: new Date(),
        total_amount: currentInvoiceTotal,
        is_active: true,
        sale_invoice_items: {
          create: invoiceItems
        }
      })
    }

    // Transaction
    await prisma.$transaction(
      invoicesData.map(invoice => prisma.sale_invoices.create({ data: invoice }))
    )

    console.log(`[SEED-SYNC] Created ${count} invoices successfully.`)
    res.json({ success: true, count, message: `Created ${count} invoices synchronously.` })

  } catch (error: any) {
    console.error('[SEED-SYNC] Error:', error)
    res.status(500).json({ success: false, error: error.message, stack: error.stack })
  }
})

export default router

