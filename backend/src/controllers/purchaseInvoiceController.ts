import { Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

// Alış fakturaları (purchase_invoices)
export const getAllPurchaseInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.purchase_invoices.findMany({
      include: {
        suppliers: true,
        purchase_invoice_items: {
          include: {
            products: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    res.json(invoices)
  } catch (error) {
    console.error('Get purchase invoices error:', error)
    res.status(500).json({ message: 'Alış qaimələri yüklənərkən xəta baş verdi' })
  }
}

export const getPurchaseInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const invoice = await prisma.purchase_invoices.findUnique({
      where: { id: parseInt(id) },
      include: {
        suppliers: true,
        purchase_invoice_items: {
          include: {
            products: true,
          },
        },
      },
    })

    if (!invoice) {
      return res.status(404).json({ message: 'Alış qaiməsi tapılmadı' })
    }

    res.json(invoice)
  } catch (error) {
    console.error('Get purchase invoice error:', error)
    res.status(500).json({ message: 'Alış qaiməsi yüklənərkən xəta baş verdi' })
  }
}

export const createPurchaseInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { supplier_id, items, notes, is_active, invoice_date, payment_date } = req.body

    // Yadda saxla düyməsi üçün boş qaimə yarada bilər
    // Validasiya yalnız OK düyməsi üçün frontend-dədir
    // if (!items || items.length === 0) {
    //   return res.status(400).json({ message: 'Məhsul seçilməlidir' })
    // }

    // Faktura nömrəsi yarat (ardıcıl format: AL00000001)
    // Əvvəlcə "AL" ilə başlayan bütün faktura nömrələrini al
    const allInvoices = await prisma.purchase_invoices.findMany({
      where: {
        invoice_number: {
          startsWith: 'AL'
        }
      },
      select: {
        invoice_number: true
      },
      orderBy: {
        invoice_number: 'asc'
      }
    })

    // İstifadə olunmuş nömrələri çıxar və rəqəmə çevir
    const usedNumbers = new Set<number>()
    allInvoices.forEach(invoice => {
      const match = invoice.invoice_number.match(/AL(\d+)/)
      if (match) {
        const number = parseInt(match[1], 10)
        usedNumbers.add(number)
      }
    })

    // İlk boş nömrəni tap (1-dən başlayaraq)
    let nextNumber = 1
    while (nextNumber <= 99999999 && usedNumbers.has(nextNumber)) {
      nextNumber++
    }

    if (nextNumber > 99999999) {
      return res.status(400).json({ message: 'Faktura nömrəsi maksimuma çatıb (99999999)' })
    }

    // 8 rəqəmli format: AL00000001
    const invoiceNumber = `AL${String(nextNumber).padStart(8, '0')}`

    // Son yoxlama - eyni faktura nömrəsi ola bilməz
    const existingInvoice = await prisma.purchase_invoices.findUnique({
      where: {
        invoice_number: invoiceNumber
      }
    })

    if (existingInvoice) {
      return res.status(400).json({ message: `Faktura nömrəsi ${invoiceNumber} artıq mövcuddur` })
    }

    // Ümumi məbləği hesabla
    let totalAmount = 0
    const itemsArray = items || []
    itemsArray.forEach((item: any) => {
      totalAmount += parseFloat(item.total_price || 0)
    })

    // Faktura yarat
    const invoice = await prisma.purchase_invoices.create({
      data: {
        invoice_number: invoiceNumber,
        supplier_id: supplier_id || null,
        total_amount: totalAmount,
        notes: notes || null,
        is_active: is_active !== undefined ? is_active : true,
        invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
        payment_date: payment_date ? new Date(payment_date) : null,
      },
    })

    // Faktura maddələrini yarat (əgər items varsa)
    const invoiceItems = itemsArray.length > 0
      ? await Promise.all(
        itemsArray.map((item: any) =>
          prisma.purchase_invoice_items.create({
            data: {
              invoice_id: invoice.id,
              product_id: item.product_id,
              quantity: parseFloat(item.quantity),
              unit_price: parseFloat(item.unit_price),
              total_price: parseFloat(item.total_price),
            },
          })
        )
      )
      : []

    // Anbar qalığını artır (əgər items varsa)
    for (const item of itemsArray) {
      const warehouse = await prisma.warehouse.findFirst({
        where: { product_id: item.product_id },
      })

      if (warehouse) {
        await prisma.warehouse.update({
          where: { id: warehouse.id },
          data: {
            quantity: Number(warehouse.quantity || 0) + parseFloat(item.quantity),
          },
        })
      } else {
        // Əgər warehouse yoxdursa, yarat
        await prisma.warehouse.create({
          data: {
            product_id: item.product_id,
            quantity: parseFloat(item.quantity),
          },
        })
      }
    }

    const result = await prisma.purchase_invoices.findUnique({
      where: { id: invoice.id },
      include: {
        suppliers: true,
        purchase_invoice_items: {
          include: {
            products: true,
          },
        },
      },
    })

    res.status(201).json(result)
  } catch (error) {
    console.error('Create purchase invoice error:', error)
    res.status(500).json({ message: 'Alış qaiməsi yaradılarkən xəta baş verdi' })
  }
}

export const updatePurchaseInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { supplier_id, items, notes, is_active, invoice_date, payment_date } = req.body

    const invoice = await prisma.purchase_invoices.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchase_invoice_items: true,
      },
    })

    if (!invoice) {
      return res.status(404).json({ message: 'Qaimə tapılmadı' })
    }

    // Köhnə item-ləri sil
    await prisma.purchase_invoice_items.deleteMany({
      where: { invoice_id: parseInt(id) },
    })

    // Yeni item-ləri əlavə et
    if (items && Array.isArray(items)) {
      await Promise.all(
        items.map((item: any) =>
          prisma.purchase_invoice_items.create({
            data: {
              invoice_id: parseInt(id),
              product_id: item.product_id,
              quantity: parseFloat(item.quantity),
              unit_price: parseFloat(item.unit_price),
              total_price: parseFloat(item.total_price),
            },
          })
        )
      )
    }

    // Ümumi məbləği hesabla
    const totalAmount = items && Array.isArray(items)
      ? items.reduce((sum: number, item: any) => sum + parseFloat(item.total_price || 0), 0)
      : invoice.total_amount

    // Qaiməni yenilə
    const updateData: any = {}
    if (supplier_id !== undefined) updateData.supplier_id = supplier_id || null
    if (totalAmount !== undefined) updateData.total_amount = totalAmount
    if (notes !== undefined) updateData.notes = notes || null
    if (is_active !== undefined) updateData.is_active = is_active
    if (invoice_date !== undefined) updateData.invoice_date = invoice_date ? new Date(invoice_date) : null
    if (payment_date !== undefined) updateData.payment_date = payment_date ? new Date(payment_date) : null

    const updatedInvoice = await prisma.purchase_invoices.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        suppliers: true,
        purchase_invoice_items: {
          include: {
            products: true,
          },
        },
      },
    })

    res.json(updatedInvoice)
  } catch (error) {
    console.error('Update purchase invoice error:', error)
    res.status(500).json({ message: 'Alış qaiməsi yenilənərkən xəta baş verdi' })
  }
}

export const updatePurchaseInvoiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { is_active } = req.body

    const invoice = await prisma.purchase_invoices.update({
      where: { id: parseInt(id) },
      data: {
        is_active: is_active,
      },
      include: {
        suppliers: true,
        purchase_invoice_items: {
          include: {
            products: true,
          },
        },
      },
    })

    res.json(invoice)
  } catch (error) {
    console.error('Update purchase invoice status error:', error)
    res.status(500).json({ message: 'Alış qaiməsi statusu yenilənərkən xəta baş verdi' })
  }
}

export const deletePurchaseInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Faktura maddələrini sil (cascade ilə avtomatik silinir, amma təhlükəsizlik üçün yoxlayırıq)
    await prisma.purchase_invoice_items.deleteMany({
      where: { invoice_id: parseInt(id) },
    })

    // Fakturanı sil
    await prisma.purchase_invoices.delete({
      where: { id: parseInt(id) },
    })

    res.json({ message: 'Alış qaiməsi silindi' })
  } catch (error) {
    console.error('Delete purchase invoice error:', error)
    res.status(500).json({ message: 'Alış qaiməsi silinərkən xəta baş verdi' })
  }
}

