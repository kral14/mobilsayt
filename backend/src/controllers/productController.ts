import { Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 [DEBUG] getAllProducts çağırıldı')
    console.log('🔍 [DEBUG] Query params:', req.query)

    const { category_id, search, page, limit } = req.query

    // Pagination defaults
    const pageNum = page ? parseInt(page as string) : 1
    const limitNum = limit ? parseInt(limit as string) : 50
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    // Search filter
    if (search) {
      const searchStr = search as string
      where['OR'] = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { code: { contains: searchStr, mode: 'insensitive' } },
        { barcode: { contains: searchStr, mode: 'insensitive' } }
      ]
    }

    // Check if category_id column exists/is valid before filtering
    if (category_id && category_id !== 'null' && category_id !== 'undefined') {
      where.category_id = parseInt(category_id as string)
    }

    // Filter by IDs
    const { ids } = req.query
    if (ids) {
      const idsArray = (ids as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      if (idsArray.length > 0) {
        where.id = { in: idsArray }
      }
    }

    // Build include options
    const includeOptions: any = {
      warehouse: true,
      category: true, // Include category relation
    }

    console.log(`🔍 [DEBUG] Fetching page ${pageNum} (limit ${limitNum})`)

    const products = await prisma.products.findMany({
      where,
      include: includeOptions,
      orderBy: {
        created_at: 'desc',
      },
      skip: skip,
      take: limitNum
    })

    console.log('✅ [DEBUG] Prisma query uğurlu, məhsul sayı:', products.length)

    res.json(products)
  } catch (error: any) {
    console.error('❌ [ERROR] Get products error:', error)
    res.status(500).json({
      message: 'Məhsullar yüklənərkən xəta baş verdi',
      error: error.message
    })
  }
}

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const product = await prisma.products.findUnique({
      where: { id: parseInt(id) },
      include: {
        warehouse: true,
      },
    })

    if (!product) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' })
    }

    res.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ message: 'Məhsul yüklənərkən xəta baş verdi' })
  }
}

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, barcode, description, unit, purchase_price, sale_price, code, article,
      category_id, type, brand, model, color, size, weight, country, manufacturer,
      warranty_period, production_date, expiry_date, min_stock, max_stock, tax_rate, is_active
    } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Məhsul adı məcburidir' })
    }

    // Build data object with only existing fields
    const productData: any = {
      name,
      barcode: barcode || null,
      description: description || null,
      unit: unit || 'ədəd',
      purchase_price: purchase_price ? parseFloat(purchase_price) : 0,
      sale_price: sale_price ? parseFloat(sale_price) : 0,
      code: code || null,
    }

    // Check if new columns exist before adding them
    try {
      const columnCheck: any = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name IN ('article', 'category_id', 'type', 'brand', 'model', 'color', 'size', 'weight', 'country', 'manufacturer', 'warranty_period', 'production_date', 'expiry_date', 'min_stock', 'max_stock', 'tax_rate', 'is_active')
      `
      const existingColumns = columnCheck.map((c: any) => c.column_name)

      if (existingColumns.includes('article')) productData.article = article || null
      if (existingColumns.includes('category_id') && category_id) productData.category_id = parseInt(category_id)
      if (existingColumns.includes('type')) productData.type = type || null
      if (existingColumns.includes('brand')) productData.brand = brand || null
      if (existingColumns.includes('model')) productData.model = model || null
      if (existingColumns.includes('color')) productData.color = color || null
      if (existingColumns.includes('size')) productData.size = size || null
      if (existingColumns.includes('weight') && weight) productData.weight = parseFloat(weight)
      if (existingColumns.includes('country')) productData.country = country || null
      if (existingColumns.includes('manufacturer')) productData.manufacturer = manufacturer || null
      if (existingColumns.includes('warranty_period') && warranty_period) productData.warranty_period = parseInt(warranty_period)
      if (existingColumns.includes('production_date') && production_date) productData.production_date = new Date(production_date)
      if (existingColumns.includes('expiry_date') && expiry_date) productData.expiry_date = new Date(expiry_date)
      if (existingColumns.includes('min_stock')) productData.min_stock = min_stock ? parseFloat(min_stock) : 0
      if (existingColumns.includes('max_stock') && max_stock) productData.max_stock = parseFloat(max_stock)
      if (existingColumns.includes('tax_rate')) productData.tax_rate = tax_rate ? parseFloat(tax_rate) : 0
      if (existingColumns.includes('is_active')) productData.is_active = is_active !== undefined ? Boolean(is_active) : true
    } catch (e) {
      // New columns don't exist yet, use only basic fields
      console.log('New product columns not found, using basic fields only')
    }

    const product = await prisma.products.create({
      data: productData,
    })

    // Anbar qeydiyyatı yarat
    await prisma.warehouse.create({
      data: {
        product_id: product.id,
        quantity: 0,
      },
    })

    res.status(201).json(product)
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ message: 'Məhsul yaradılarkən xəta baş verdi' })
  }
}

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const {
      name, barcode, description, unit, purchase_price, sale_price, code, article,
      category_id, type, brand, model, color, size, weight, country, manufacturer,
      warranty_period, production_date, expiry_date, min_stock, max_stock, tax_rate, is_active
    } = req.body

    const product = await prisma.products.findUnique({
      where: { id: parseInt(id) },
    })

    if (!product) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' })
    }

    // Build update data with only existing fields
    const updateData: any = {}

    if (name) updateData.name = name
    if (barcode !== undefined) updateData.barcode = barcode
    if (description !== undefined) updateData.description = description
    if (unit) updateData.unit = unit
    if (purchase_price !== undefined) updateData.purchase_price = parseFloat(purchase_price)
    if (sale_price !== undefined) updateData.sale_price = parseFloat(sale_price)
    if (code !== undefined) updateData.code = code

    // Check if new columns exist before adding them
    try {
      const columnCheck: any = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name IN ('article', 'category_id', 'type', 'brand', 'model', 'color', 'size', 'weight', 'country', 'manufacturer', 'warranty_period', 'production_date', 'expiry_date', 'min_stock', 'max_stock', 'tax_rate', 'is_active')
      `
      const existingColumns = columnCheck.map((c: any) => c.column_name)

      if (existingColumns.includes('article') && article !== undefined) updateData.article = article
      if (existingColumns.includes('category_id') && category_id !== undefined) {
        updateData.category_id = category_id ? parseInt(category_id) : null
      }
      if (existingColumns.includes('type') && type !== undefined) updateData.type = type
      if (existingColumns.includes('brand') && brand !== undefined) updateData.brand = brand
      if (existingColumns.includes('model') && model !== undefined) updateData.model = model
      if (existingColumns.includes('color') && color !== undefined) updateData.color = color
      if (existingColumns.includes('size') && size !== undefined) updateData.size = size
      if (existingColumns.includes('weight') && weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null
      if (existingColumns.includes('country') && country !== undefined) updateData.country = country
      if (existingColumns.includes('manufacturer') && manufacturer !== undefined) updateData.manufacturer = manufacturer
      if (existingColumns.includes('warranty_period') && warranty_period !== undefined) updateData.warranty_period = warranty_period ? parseInt(warranty_period) : null
      if (existingColumns.includes('production_date') && production_date !== undefined) updateData.production_date = production_date ? new Date(production_date) : null
      if (existingColumns.includes('expiry_date') && expiry_date !== undefined) updateData.expiry_date = expiry_date ? new Date(expiry_date) : null
      if (existingColumns.includes('min_stock') && min_stock !== undefined) updateData.min_stock = parseFloat(min_stock)
      if (existingColumns.includes('max_stock') && max_stock !== undefined) updateData.max_stock = max_stock ? parseFloat(max_stock) : null
      if (existingColumns.includes('tax_rate') && tax_rate !== undefined) updateData.tax_rate = parseFloat(tax_rate)
      if (existingColumns.includes('is_active') && is_active !== undefined) updateData.is_active = Boolean(is_active)
    } catch (e) {
      // New columns don't exist yet, skip them
      console.log('New product columns not found, skipping them')
    }

    const updatedProduct = await prisma.products.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    res.json(updatedProduct)
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ message: 'Məhsul yenilənərkən xəta baş verdi' })
  }
}

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const product = await prisma.products.findUnique({
      where: { id: parseInt(id) },
    })

    if (!product) {
      return res.status(404).json({ message: 'Məhsul tapılmadı' })
    }

    await prisma.products.delete({
      where: { id: parseInt(id) },
    })

    res.json({ message: 'Məhsul silindi' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ message: 'Məhsul silinərkən xəta baş verdi' })
  }
}
