
import { Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

export const getProductDiscounts = async (req: AuthRequest, res: Response) => {
    try {
        const { productId } = req.params

        const discounts = await prisma.product_discounts.findMany({
            where: { product_id: parseInt(productId) },
            orderBy: { created_at: 'desc' }
        })

        res.json(discounts)
    } catch (error) {
        console.error('Get discounts error:', error)
        res.status(500).json({ message: 'Endirimlər yüklənərkən xəta baş verdi' })
    }
}

export const createProductDiscount = async (req: AuthRequest, res: Response) => {
    try {
        const { productId } = req.params
        const { percentage, start_date, end_date } = req.body

        const discount = await prisma.product_discounts.create({
            data: {
                product_id: parseInt(productId),
                percentage: parseFloat(percentage),
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                is_active: true
            }
        })

        res.status(201).json(discount)
    } catch (error) {
        console.error('Create discount error:', error)
        res.status(500).json({ message: 'Endirim yaradılarkən xəta baş verdi' })
    }
}

export const deleteProductDiscount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params

        await prisma.product_discounts.delete({
            where: { id: parseInt(id) }
        })

        res.json({ message: 'Endirim silindi' })
    } catch (error) {
        console.error('Delete discount error:', error)
        res.status(500).json({ message: 'Endirim silinərkən xəta baş verdi' })
    }
}
