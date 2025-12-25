
import { PrismaClient } from '@prisma/client'
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding invoices...')
    console.log('DB URL:', process.env.DATABASE_URL ? 'Defined' : 'Missing')

    // Get necessary data
    const customers = await prisma.customers.findMany({ select: { id: true }, take: 50 })
    const products = await prisma.products.findMany({ select: { id: true, sale_price: true }, take: 100 })

    console.log(`Found ${customers.length} customers and ${products.length} products.`)

    if (customers.length === 0 || products.length === 0) {
        console.error('No customers or products found. Seed them first.')
        return
    }

    const INVOICE_COUNT = 10000
    const BATCH_SIZE = 100

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

        // Use transaction for batch insert (Prisma doesn't support deep createMany with relations well, so promise.all)
        console.log(`Creating batch ${i / BATCH_SIZE + 1}...`)

        await prisma.$transaction(
            invoicesData.map(invoice => prisma.sale_invoices.create({ data: invoice }))
        )
    }

    console.log(`Seeding finished. Created ${INVOICE_COUNT} invoices.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
