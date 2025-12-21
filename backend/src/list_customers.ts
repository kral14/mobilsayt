import prisma from './config/database'

async function listAll() {
    const all = await prisma.customers.findMany({
        select: { id: true, name: true, type: true, code: true }
    })
    console.table(all)
    await prisma.$disconnect()
}

listAll()
