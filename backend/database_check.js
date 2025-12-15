
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
    try {
        const prod = await prisma.products.findFirst({ where: { name: { contains: 'Zan' } } })
        if (!prod) return console.log('Zan not found')

        const items = await prisma.discount_document_items.findMany({
            where: { product_id: prod.id },
            include: { document: true }
        })

        const activeItems = items.filter(i => {
            const doc = i.document
            const now = new Date()
            const start = new Date(doc.start_date || doc.document_date)
            const end = new Date(doc.end_date || doc.document_date)
            return doc.is_active && now >= start && now <= end
        })

        console.log('--- ACTIVE ITEMS FOR ZAN ---')
        console.log(JSON.stringify(activeItems, null, 2))

        // Ayrıca Tedarikçi Merhemet'in genel indirimi var mı?
        const supplier = await prisma.suppliers.findFirst({ where: { name: { contains: 'merhemet' } } })
        if (supplier) {
            const supplierDocs = await prisma.discount_documents.findMany({
                where: { type: 'SUPPLIER', entity_id: supplier.id, is_active: true },
                include: { items: true }
            })
            console.log('--- SUPPLIER DOCS ---')
            console.log(JSON.stringify(supplierDocs, null, 2))
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}
run()
