import { Request, Response } from 'express'
import prisma from '../config/database'

export const createDocument = async (req: Request, res: Response) => {
    try {
        const { document_number, document_date, type, entity_id, notes, items } = req.body

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create new document (No longer deactivating old ones to allow layering)
            const newDoc = await tx.discount_documents.create({
                data: {
                    document_number,
                    document_date: new Date(document_date),
                    start_date: new Date(req.body.start_date || document_date), // Default to doc date if missing
                    end_date: new Date(req.body.end_date || document_date),
                    type,
                    entity_id,
                    notes,
                    is_active: true,
                    items: {
                        create: items.map((item: any) => ({
                            product_id: item.product_id ? Number(item.product_id) : null,
                            discount_percent: Number(item.discount_percent),
                            description: item.description
                        }))
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            // 3. Automatically create/update product_discounts (the temporary ones) based on this document?
            // OR: Does the system use THIS document table as the source of truth for "active discounts"?
            // The Plan said: "Creating a new document... automatically deactivates previous... ensuring single source of truth".
            // AND "InvoiceModal... checks for Customer Permanent... and Product Temporary".
            // Currently `InvoiceModal` checks `product_discounts` table. 
            // We should probably SYNC this document to `product_discounts` table OR update `InvoiceModal` to read from here.
            // Given `product_discounts` table exists and is used by UI, it might be better to:
            // A) Update `activeDiscount` logic in InvoiceModal to read from `discount_documents` (complex join).
            // B) When a Document is created, it populates `product_discounts` table.
            // Let's go with B for now to keep InvoiceModal logic simple, OR 
            // ACTUALLY: The `product_discounts` table has start/end dates. This document system seems to be "Infinite until replaced".
            // Let's assume this Document system REPLACES the need for manual `product_discounts` entries, OR it manages them.
            // For Supplier type: It's likely global or per product.
            // For Product type: It's per product.

            // Decision: Let's stick to the Plan. The Plan says "New 'documents' table...". 
            // But we need to make sure `InvoiceModal` picks it up.
            // User said: "apply these to invoice".
            // Let's Implement this controller to just manage `discount_documents`. 
            // LATER we will update Invoice logic to check this table too if needed, or maybe we don't need to sync yet.
            // Actually, if this is "Discount Documents", maybe it's just a record?
            // No, user said "hansi musteriye ne teyin etmisik... onlari gorek" (see what is assigned).
            // Let's finish the CRUD first.

            return newDoc
        })

        res.json(result)
    } catch (error) {
        console.error('Error creating discount document:', error)
        res.status(500).json({ error: 'Failed to create discount document' })
    }
}

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { type, entity_id, active_only } = req.query

        const where: any = {}
        if (type) where.type = String(type)
        if (entity_id) where.entity_id = Number(entity_id)
        if (active_only === 'true') where.is_active = true

        const documents = await prisma.discount_documents.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                document_date: 'desc'
            }
        })

        res.json(documents)
    } catch (error) {
        console.error('Error fetching discount documents:', error)
        res.status(500).json({ error: 'Failed to fetch discount documents' })
    }
}

export const getDocumentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const document = await prisma.discount_documents.findUnique({
            where: { id: Number(id) },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        if (!document) {
            return res.status(404).json({ error: 'Document not found' })
        }

        res.json(document)
    } catch (error) {
        console.error('Error fetching discount document:', error)
        res.status(500).json({ error: 'Failed to fetch discount document' })
    }
}

// Update Discount Document
export const updateDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { document_number, document_date, type, entity_id, notes, is_active, items } = req.body

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update basic info
            const updatedDoc = await tx.discount_documents.update({
                where: { id: Number(id) },
                data: {
                    document_number,
                    document_date: new Date(document_date),
                    start_date: new Date(req.body.start_date || document_date),
                    end_date: new Date(req.body.end_date || document_date),
                    type,
                    entity_id,
                    notes,
                    is_active
                }
            })

            // 2. Update items (Delete all and recreate - simplest for now)
            await tx.discount_document_items.deleteMany({
                where: { document_id: Number(id) }
            })

            if (items && items.length > 0) {
                await tx.discount_document_items.createMany({
                    data: items.map((item: any) => ({
                        document_id: Number(id),
                        product_id: item.product_id ? Number(item.product_id) : null,
                        discount_percent: Number(item.discount_percent),
                        description: item.description
                    }))
                })
            }

            return updatedDoc
        })

        res.json(result)
    } catch (error) {
        console.error('Error updating discount document:', error)
        res.status(500).json({ error: 'Failed to update discount document' })
    }
}

// Delete Discount Document
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        // Items should be deleted by cascade if configured, but let's be safe inside transaction or just delete doc if cascade works
        // Prisma schema usually defines relations. Let's assume standard cascade relation or manual delete
        // If not cascade, we need to delete items first.

        await prisma.$transaction(async (tx) => {
            await tx.discount_document_items.deleteMany({
                where: { document_id: Number(id) }
            })
            await tx.discount_documents.delete({
                where: { id: Number(id) }
            })
        })

        res.json({ message: 'Document deleted successfully' })
    } catch (error) {
        console.error('Error deleting discount document:', error)
        res.status(500).json({ error: 'Failed to delete discount document' })
    }
}
