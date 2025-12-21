import { Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

// Alış fakturaları (purchase_invoices)
export const getAllPurchaseInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.purchase_invoices.findMany({
      include: {
        customer: true,
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
        customer: true,
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
    const { customer_id, items, notes, is_active, invoice_date, payment_date } = req.body

    // Yadda saxla düyməsi üçün boş qaimə yarada bilər
    // Validasiya yalnız OK düyməsi üçün frontend-dədir

    // Faktura nömrəsi yarat (ardıcıl format: AQ00000001)
    // Əvvəlcə "AQ" ilə başlayan bütün faktura nömrələrini al
    const allInvoices = await prisma.purchase_invoices.findMany({
      where: {
        invoice_number: {
          startsWith: 'AQ'
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
      const match = invoice.invoice_number.match(/AQ(\d+)/)
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

    // 8 rəqəmli format: AQ00000001
    const invoiceNumber = `AQ${String(nextNumber).padStart(8, '0')}`

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

    // Təchizatçı (Customer) yoxlaması
    if (customer_id) {
      const customerExists = await prisma.customers.findUnique({
        where: { id: customer_id }
      })

      if (!customerExists) {
        return res.status(400).json({
          message: `Müştəri/Təchizatçı ID ${customer_id} tapılmadı. Zəhmət olmasa mövcud təchizatçı seçin.`
        })
      }
    }

    // Faktura yarat
    const invoice = await prisma.purchase_invoices.create({
      data: {
        invoice_number: invoiceNumber,
        customer_id: customer_id || null,
        total_amount: totalAmount,
        notes: notes || null,
        is_active: is_active !== undefined ? is_active : true,
        invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
        payment_date: payment_date ? new Date(payment_date) : null,
      },
    })

    // Faktura maddələrini yarat (əgər items varsa)
    const createdItems = []
    if (itemsArray.length > 0) {
      for (const item of itemsArray) {
        const createdItem = await prisma.purchase_invoice_items.create({
          data: {
            invoice_id: invoice.id,
            product_id: item.product_id,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price),
            discount_auto: item.discount_auto ? parseFloat(item.discount_auto) : 0,
            discount_manual: item.discount_manual ? parseFloat(item.discount_manual) : 0,
          },
        })
        createdItems.push(createdItem)
      }
    }

    // Anbar yenilənməsi (əgər qaimə aktivdirsə)
    if (invoice.is_active) {
      for (const item of createdItems) {
        if (item.product_id) {
          const warehouse = await prisma.warehouse.findFirst({
            where: { product_id: item.product_id },
          })

          if (warehouse) {
            await prisma.warehouse.update({
              where: { id: warehouse.id },
              data: {
                quantity: Number(warehouse.quantity || 0) + Number(item.quantity || 0),
              },
            })
          } else {
            await prisma.warehouse.create({
              data: {
                product_id: item.product_id,
                quantity: Number(item.quantity || 0),
              },
            })
          }
        }
      }
    }

    const result = await prisma.purchase_invoices.findUnique({
      where: { id: invoice.id },
      include: {
        customer: true,
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
    const { customer_id, items, notes, is_active, invoice_date, payment_date } = req.body

    const invoice = await prisma.purchase_invoices.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchase_invoice_items: true,
      },
    })

    if (!invoice) {
      return res.status(404).json({ message: 'Qaimə tapılmadı' })
    }

    // 1. Köhnə anbar təsirini geri qaytar (əgər qaimə aktiv idisə)
    if (invoice.is_active) {
      for (const item of invoice.purchase_invoice_items) {
        if (item.product_id) {
          const warehouse = await prisma.warehouse.findFirst({
            where: { product_id: item.product_id },
          })

          if (warehouse) {
            await prisma.warehouse.update({
              where: { id: warehouse.id },
              data: {
                quantity: Number(warehouse.quantity || 0) - Number(item.quantity || 0),
              },
            })
          }
        }
      }
    }

    // Köhnə item-ləri sil
    await prisma.purchase_invoice_items.deleteMany({
      where: { invoice_id: parseInt(id) },
    })

    // Yeni item-ləri əlavə et
    const createdNewItems = []
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const createdItem = await prisma.purchase_invoice_items.create({
          data: {
            invoice_id: parseInt(id),
            product_id: item.product_id,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price),
            discount_auto: item.discount_auto ? parseFloat(item.discount_auto) : 0,
            discount_manual: item.discount_manual ? parseFloat(item.discount_manual) : 0,
          },
        })
        createdNewItems.push(createdItem)
      }
    }

    // Ümumi məbləği hesabla
    const totalAmount = items && Array.isArray(items)
      ? items.reduce((sum: number, item: any) => sum + parseFloat(item.total_price || 0), 0)
      : invoice.total_amount

    // Qaiməni yenilə
    const updateData: any = {}
    if (customer_id !== undefined) updateData.customer_id = customer_id || null

    if (totalAmount !== undefined) updateData.total_amount = totalAmount
    if (notes !== undefined) updateData.notes = notes || null
    if (is_active !== undefined) updateData.is_active = is_active
    if (invoice_date !== undefined) updateData.invoice_date = invoice_date ? new Date(invoice_date) : null
    if (payment_date !== undefined) updateData.payment_date = payment_date ? new Date(payment_date) : null

    const updatedInvoice = await prisma.purchase_invoices.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        customer: true,
        purchase_invoice_items: {
          include: {
            products: true,
          },
        },
      },
    })

    // 2. Yeni anbar təsirini tətbiq et (əgər yeni status aktivdirsə)
    // Yeni status req.body.is_active ola bilər, ya da köhnə invoice.is_active
    const finalIsActive = is_active !== undefined ? is_active : invoice.is_active

    if (finalIsActive) {
      for (const item of createdNewItems) {
        if (item.product_id) {
          const warehouse = await prisma.warehouse.findFirst({
            where: { product_id: item.product_id },
          })

          if (warehouse) {
            await prisma.warehouse.update({
              where: { id: warehouse.id },
              data: {
                quantity: Number(warehouse.quantity || 0) + Number(item.quantity || 0),
              },
            })
          } else {
            await prisma.warehouse.create({
              data: {
                product_id: item.product_id,
                quantity: Number(item.quantity || 0),
              },
            })
          }
        }
      }
    }

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

    // Əvvəlki statusu yoxla
    const currentInvoice = await prisma.purchase_invoices.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchase_invoice_items: true,
      },
    })

    if (!currentInvoice) {
      return res.status(404).json({ message: 'Qaimə tapılmadı' })
    }

    // Statusu yenilə
    const invoice = await prisma.purchase_invoices.update({
      where: { id: parseInt(id) },
      data: {
        is_active: is_active,
      },
      include: {
        customer: true,
        purchase_invoice_items: {
          include: {
            products: true,
          },
        },
      },
    })

    // Anbar yenilənməsi: yalnız status dəyişəndə
    if (currentInvoice.is_active !== is_active) {
      for (const item of currentInvoice.purchase_invoice_items) {
        if (item.product_id) {
          const warehouse = await prisma.warehouse.findFirst({
            where: { product_id: item.product_id },
          })

          if (is_active) {
            // Təsdiqlənir - anbara əlavə et
            if (warehouse) {
              await prisma.warehouse.update({
                where: { id: warehouse.id },
                data: {
                  quantity: Number(warehouse.quantity || 0) + Number(item.quantity || 0),
                },
              })
            } else {
              // Warehouse yoxdursa yarat
              await prisma.warehouse.create({
                data: {
                  product_id: item.product_id,
                  quantity: Number(item.quantity || 0),
                },
              })
            }
          } else {
            // Təsdiq ləğv edilir - anbardan çıxart
            if (warehouse) {
              await prisma.warehouse.update({
                where: { id: warehouse.id },
                data: {
                  quantity: Number(warehouse.quantity || 0) - Number(item.quantity || 0),
                },
              })
            }
          }
        }
      }
    }

    res.json(invoice)
  } catch (error) {
    console.error('Update purchase invoice status error:', error)
    res.status(500).json({ message: 'Alış qaiməsi statusu yenilənərkən xəta baş verdi' })
  }
}

export const deletePurchaseInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Qaiməni tap
    const invoice = await prisma.purchase_invoices.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchase_invoice_items: true,
      },
    })

    if (!invoice) {
      return res.status(404).json({ message: 'Qaimə tapılmadı' })
    }

    // Yalnız təsdiqli qaimələr üçün anbarı yenilə
    if (invoice.is_active) {
      for (const item of invoice.purchase_invoice_items) {
        if (item.product_id) {
          const warehouse = await prisma.warehouse.findFirst({
            where: { product_id: item.product_id },
          })

          if (warehouse) {
            const newQuantity = Number(warehouse.quantity || 0) - Number(item.quantity || 0)
            await prisma.warehouse.update({
              where: { id: warehouse.id },
              data: {
                quantity: newQuantity,
              },
            })
          }
        }
      }
    }

    // Faktura maddələrini sil
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

