import { Request, Response } from 'express'
import prisma from '../config/database'
import { Prisma } from '@prisma/client'

// POST /api/logs - Batch receive and store logs
export const createLogs = async (req: Request, res: Response) => {
    try {
        const { logs } = req.body

        if (!Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({ message: 'Logs array tələb olunur' })
        }

        const syncedIds: string[] = []

        for (const log of logs) {
            let { log_id, user_id, timestamp, level, category, action, details, metadata } = log

            // Generate UUID if log_id is missing
            if (!log_id) {
                log_id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                console.log(`[LOGS] Generated log_id: ${log_id}`)
            }

            try {
                // Check if log already exists (avoid duplicates)
                const existingLog = await prisma.$queryRaw`
          SELECT log_id FROM activity_logs WHERE log_id = ${log_id}
        `

                if ((existingLog as any[]).length === 0) {
                    // Insert new log - convert timestamp string to Date
                    const timestampDate = new Date(timestamp)
                    await prisma.$executeRaw`
            INSERT INTO activity_logs 
            (log_id, user_id, timestamp, level, category, action, details, metadata) 
            VALUES (${log_id}, ${user_id || null}, ${timestampDate}, ${level}, ${category}, ${action}, ${details || null}, ${metadata ? JSON.stringify(metadata) : null}::jsonb)
          `
                    syncedIds.push(log_id)
                } else {
                    // Already exists, still mark as synced
                    syncedIds.push(log_id)
                }
            } catch (error: any) {
                console.error(`❌ [LOGS] Log ${log_id} saxlama xətası:`, error.message)
                // Continue with other logs
            }
        }

        console.log(`✅ [LOGS] ${syncedIds.length} log sinxronizasiya olundu`)

        res.json({
            success: true,
            syncedIds,
            message: `${syncedIds.length} log uğurla saxlanıldı`
        })
    } catch (error: any) {
        console.error('❌ [LOGS] Logları saxlama xətası:', error)
        res.status(500).json({
            message: 'Logları saxlama xətası',
            error: error.message
        })
    }
}

// GET /api/logs/:userId - Get user's logs with pagination and filters
export const getUserLogs = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params
        const {
            page = '1',
            limit = '50',
            category,
            level,
            startDate,
            endDate
        } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const offset = (pageNum - 1) * limitNum

        // Build WHERE conditions
        let whereConditions = [`user_id = ${userId}`]

        if (category) {
            whereConditions.push(`category = '${category}'`)
        }
        if (level) {
            whereConditions.push(`level = '${level}'`)
        }
        if (startDate) {
            whereConditions.push(`timestamp >= '${startDate}'`)
        }
        if (endDate) {
            whereConditions.push(`timestamp <= '${endDate}'`)
        }

        const whereClause = whereConditions.join(' AND ')

        // Get total count
        const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activity_logs WHERE ${Prisma.raw(whereClause)}
    ` as any[]
        const total = parseInt(countResult[0]?.count || '0')

        // Get logs
        const logsResult = await prisma.$queryRaw`
      SELECT * FROM activity_logs 
      WHERE ${Prisma.raw(whereClause)}
      ORDER BY timestamp DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    ` as any[]

        res.json({
            logs: logsResult,
            total,
            page: pageNum,
            limit: limitNum,
            hasMore: offset + logsResult.length < total
        })
    } catch (error: any) {
        console.error('❌ [LOGS] Logları gətirmə xətası:', error)
        res.status(500).json({
            message: 'Logları gətirmə xətası',
            error: error.message
        })
    }
}

// DELETE /api/logs/:userId - Clear user's logs
export const clearUserLogs = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params

        const result = await prisma.$executeRaw`
      DELETE FROM activity_logs WHERE user_id = ${parseInt(userId)}
    `

        console.log(`✅ [LOGS] İstifadəçi ${userId} üçün ${result} log silindi`)

        res.json({
            success: true,
            deletedCount: result,
            message: `${result} log silindi`
        })
    } catch (error: any) {
        console.error('❌ [LOGS] Logları silmə xətası:', error)
        res.status(500).json({
            message: 'Logları silmə xətası',
            error: error.message
        })
    }
}

// GET /api/admin/logs - Admin: Get all users' logs (with optional user filter)
export const getAllLogs = async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '50',
            userId,
            category,
            level,
            startDate,
            endDate
        } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const offset = (pageNum - 1) * limitNum

        // Build WHERE conditions
        let whereConditions: string[] = []

        if (userId) {
            whereConditions.push(`user_id = ${parseInt(userId as string)}`)
        }
        if (category) {
            whereConditions.push(`category = '${category}'`)
        }
        if (level) {
            whereConditions.push(`level = '${level}'`)
        }
        if (startDate) {
            whereConditions.push(`timestamp >= '${startDate}'`)
        }
        if (endDate) {
            whereConditions.push(`timestamp <= '${endDate}'`)
        }

        const whereClause = whereConditions.length > 0
            ? whereConditions.join(' AND ')
            : '1=1'

        // Get total count
        const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activity_logs WHERE ${Prisma.raw(whereClause)}
    ` as any[]
        const total = parseInt(countResult[0]?.count || '0')

        // Get logs with user info
        const logsResult = await prisma.$queryRaw`
      SELECT 
        al.*,
        u.email as user_email,
        u.full_name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${Prisma.raw(whereClause)}
      ORDER BY al.timestamp DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    ` as any[]

        res.json({
            logs: logsResult,
            total,
            page: pageNum,
            limit: limitNum,
            hasMore: offset + logsResult.length < total
        })
    } catch (error: any) {
        console.error('❌ [LOGS] Admin logları gətirmə xətası:', error)
        res.status(500).json({
            message: 'Logları gətirmə xətası',
            error: error.message
        })
    }
}

