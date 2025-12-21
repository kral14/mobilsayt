import prisma from './config/database'

async function debugPartners() {
    try {
        const all = await prisma.customers.findMany()
        console.log(`Total count: ${all.length}`)

        const targetNames = ['merhemet', 'murtuz', 'rehime', 'gulnar']
        const targets = all.filter(c => targetNames.some(t => c.name.toLowerCase().includes(t)))

        console.log('Target partners found:')
        console.table(targets.map(c => ({
            id: c.id,
            name: c.name,
            code: c.code,
            type: c.type
        })))

        const suppliers = all.filter(c => c.type === 'SUPPLIER')
        console.log(`Total suppliers found: ${suppliers.length}`)
        if (suppliers.length > 0) {
            console.table(suppliers.map(s => ({ id: s.id, name: s.name, code: s.code })))
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

debugPartners()
