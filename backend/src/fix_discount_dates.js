
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Checking for invalid discount documents...')

    const allDocs = await prisma.discount_documents.findMany()

    for (const doc of allDocs) {
        const start = new Date(doc.start_date)
        const end = new Date(doc.end_date)

        // Check if End Date is before or equal to Start Date (invalid for a discount that should exist)
        // Or strictly equal if that's the specific bug
        if (start.getTime() >= end.getTime()) {
            console.log(`Fixing Document ${doc.document_number} (ID: ${doc.id})`)
            console.log(`Original: ${start.toISOString()} -> ${end.toISOString()}`)

            const newEnd = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000) // +1 Year

            await prisma.discount_documents.update({
                where: { id: doc.id },
                data: {
                    end_date: newEnd
                }
            })
            console.log(`Fixed: -> ${newEnd.toISOString()}`)
        }
    }

    console.log('Done.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
