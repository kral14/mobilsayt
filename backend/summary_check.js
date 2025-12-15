
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const zan = await prisma.products.findFirst({ where: { name: { contains: 'Zan' } } })
    const supplier = await prisma.suppliers.findFirst({ where: { name: { contains: 'merhemet' } } })

    console.log(`Product: ${zan.name}, Supplier: ${supplier.name}`)

    // 1. Ürün Kampanyaları
    const prodItems = await prisma.discount_document_items.findMany({
        where: { product_id: zan.id },
        include: { document: true }
    })

    const now = new Date()
    const activeProdDiscounts = prodItems.filter(i => {
        const d = i.document
        return d.type === 'PRODUCT' && d.is_active &&
            now >= new Date(d.start_date || d.document_date) &&
            now <= new Date(d.end_date || d.document_date)
    }).map(i => Number(i.discount_percent))

    console.log('Active Product Campaigns:', activeProdDiscounts)

    // 2. Tedarikçi İndirimi
    let supplierDiscount = 0
    if (supplier) {
        const suppDocs = await prisma.discount_documents.findMany({
            where: { type: 'SUPPLIER', entity_id: supplier.id, is_active: true },
            include: { items: true }
        })

        suppDocs.forEach(doc => {
            if (now >= new Date(doc.start_date || doc.document_date) && now <= new Date(doc.end_date || doc.document_date)) {
                // Zan'a özel var mı?
                const special = doc.items.find(i => i.product_id === zan.id)
                if (special) {
                    console.log(`Supplier Special for Zan: ${special.discount_percent}`)
                    supplierDiscount = Number(special.discount_percent) // Benim kodum sonuncuyu mu alıyor? Benim kodum find() ile ilk bulduğunu alıyor.
                } else {
                    // Genel var mı?
                    const general = doc.items.find(i => i.product_id === null)
                    if (general) {
                        console.log(`Supplier General: ${general.discount_percent}`)
                        supplierDiscount = Number(general.discount_percent)
                    }
                }
            }
        })
    }

    console.log('Final Supplier Discount Used:', supplierDiscount)
    const total = supplierDiscount + activeProdDiscounts.reduce((a, b) => a + b, 0)
    console.log('Total Expected:', total)
}

main().finally(() => prisma.$disconnect())
