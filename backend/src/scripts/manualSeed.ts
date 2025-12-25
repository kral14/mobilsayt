import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'

// Explicitly load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') })

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Manual Invoice Seed...')
    console.log('📂 Database URL:', process.env.DATABASE_URL ? 'Loaded' : 'MISSING!')

    try {
        // 1. Get Dependencies
        const customers = await prisma.customers.findMany({ select: { id: true }, take: 50 })
        const products = await prisma.products.findMany({ select: { id: true, sale_price: true }, take: 100 })

        console.log(`✅ Found ${customers.length} customers and ${products.length} products.`)

        if (customers.length === 0 || products.length === 0) {
            console.error('❌ Error: No customers or products found. Please seed them first.')
            return
        }

        const INVOICE_COUNT = 1000 // Start with 1000 for safety, user can edit this
        const BATCH_SIZE = 100
        let createdCount = 0

        console.log(`Start generating ${INVOICE_COUNT} invoices in batches of ${BATCH_SIZE}...`)

        for (let i = 0; i < INVOICE_COUNT; i += BATCH_SIZE) {
            const invoicesData: any[] = []

            const currentBatchSize = Math.min(BATCH_SIZE, INVOICE_COUNT - i)

            for (let j = 0; j < currentBatchSize; j++) {
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
                    invoice_number: `MANUAL-INV-${Date.now()}-${i + j}-${Math.random().toString(36).substring(7)}`,
                    customer_id: customer.id,
                    invoice_date: new Date(),
                    total_amount: totalAmount,
                    is_active: true,
                    sale_invoice_items: {
                        create: invoiceItems
                    }
                })
            }

            await prisma.$transaction(
                invoicesData.map(invoice => prisma.sale_invoices.create({ data: invoice }))
            )

            createdCount += invoicesData.length
            console.log(`📦 Batch completed. Total created: ${createdCount}`)
        }

        console.log('✅ Seeding finished successfully!')

    } catch (error) {
        console.error('❌ Fatal Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
