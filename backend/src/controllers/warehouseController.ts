import { Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

// Warehouse locations (anbar yerləri) üçün controller
// Qeyd: Hal-hazırda backend-də warehouse_locations cədvəli yoxdur
// Bu endpoint mock data qaytarır, gələcəkdə database-ə əlavə edilə bilər
export const getAllWarehouses = async (req: AuthRequest, res: Response) => {
  try {
    // Hal-hazırda boş array qaytarırıq
    // Gələcəkdə database-dən oxuya bilərik:
    // const warehouses = await prisma.warehouse_locations.findMany({
    //   orderBy: { name: 'asc' }
    // })
    
    // Mock data - gələcəkdə database-dən gələcək
    const warehouses = [
      { id: 1, name: 'Əsas Anbar' },
      { id: 2, name: 'Filial Anbar' }
    ]

    res.json(warehouses)
  } catch (error) {
    console.error('Get warehouses error:', error)
    res.status(500).json({ message: 'Anbarlar yüklənərkən xəta baş verdi' })
  }
}

