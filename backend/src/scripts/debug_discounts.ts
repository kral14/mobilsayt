
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG START ---')

    // 1. Tedarikçiyi Bul
    const supplier = await prisma.suppliers.findFirst({
        where: { name: { contains: 'merhemet', mode: 'insensitive' } }
    })
    console.log('Supplier:', supplier ? `${supplier.name} (ID: ${supplier.id})` : 'Not Found')

    // 2. Ürünleri Bul
    const products = await prisma.products.findMany({
        where: { name: { in: ['Zan', 'old spice', 'dancing'] } }
    })
    console.log('Products:', products.map(p => `${p.name} (ID: ${p.id})`))

    const zan = products.find(p => p.name === 'Zan')

    // 3. Tedarikçi İndirim Belgeleri
    if (supplier) {
        const supplierDocs = await prisma.discount_documents.findMany({
            where: {
                type: 'SUPPLIER',
                entity_id: supplier.id,
                is_active: true
            },
            include: { items: true }
        })
        console.log('\n--- Active Supplier Docs ---')
        supplierDocs.forEach(doc => {
            console.log(`Doc #${doc.id} (${doc.document_number}):`)
            console.log(`  Date Range: ${doc.start_date} - ${doc.end_date}`)
            doc.items.forEach(item => {
                const pName = item.product_id ? products.find(p => p.id === item.product_id)?.name || `Prod #${item.product_id}` : 'GENERAL (All Products)'
                console.log(`  - ${pName}: ${item.discount_percent}%`)
            })
        })
    }

    // 4. Ürün İndirim Belgeleri (Kampanyalar)
    const productDocs = await prisma.discount_documents.findMany({
        where: {
            type: 'PRODUCT',
            is_active: true
        },
        include: { items: true }
    })

    console.log('\n--- Active Product Docs (Campaigns) ---')
    const now = new Date()
    productDocs.forEach(doc => {
        // Tarih kontrolü (JS tarafında da simüle edelim)
        const start = doc.start_date ? new Date(doc.start_date) : new Date(doc.document_date)
        const end = doc.end_date ? new Date(doc.end_date) : new Date(doc.document_date)
        const isValid = now >= start && now <= end

        console.log(`Doc #${doc.id} (${doc.document_number}) [Valid: ${isValid}]:`)
        console.log(`  Date Range: ${start.toISOString()} - ${end.toISOString()}`)
        doc.items.forEach(item => {
            const pName = item.product_id ? products.find(p => p.id === item.product_id)?.name || `Prod #${item.product_id}` : 'GENERAL'
            if (products.some(p => p.id === item.product_id) || item.product_id === null) {
                console.log(`  - ${pName}: ${item.discount_percent}%`)
            }
        })
    })

    console.log('--- DEBUG END ---')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
