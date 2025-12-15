
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- ZAN DISCOUNT ANALYSIS ---')

    const zan = await prisma.products.findFirst({
        where: { name: { contains: 'Zan', mode: 'insensitive' } }
    })

    if (!zan) {
        console.log('Zan product not found')
        return
    }
    console.log(`Product: ${zan.name} (ID: ${zan.id})`)

    // Zan'a bağlı tüm indirim satırlarını bul (Belgesiyle beraber)
    const items = await prisma.discount_document_items.findMany({
        where: { product_id: zan.id },
        include: {
            document: true
        }
    })

    console.log(`Total Discount Items for Zan: ${items.length}`)

    const now = new Date()

    items.forEach(item => {
        const doc = item.document
        const start = doc.start_date ? new Date(doc.start_date) : new Date(doc.document_date)
        const end = doc.end_date ? new Date(doc.end_date) : new Date(doc.document_date)
        const isActive = doc.is_active && now >= start && now <= end

        console.log(`\nDocument #${doc.id} (${doc.type}) - ${doc.document_number}`)
        console.log(`  Status: ${doc.is_active ? 'Active' : 'Inactive'} in DB`)
        console.log(`  Date Valid: ${now >= start && now <= end} (${start.toISOString()} - ${end.toISOString()})`)
        console.log(`  IS EFFECTIVE: ${isActive}`)
        console.log(`  Discount: ${item.discount_percent}%`)
        console.log(`  Supplier ID: ${doc.entity_id}`)
    })

    console.log('\n--- ZAN ANALYSIS END ---')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
