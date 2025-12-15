import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
    user?: {
        id: number
        email: string
        role: string | null
        is_admin: boolean | null
        is_active: boolean | null
    }
}

// Admin yoxlama middleware
export const requireAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('[ADMIN_AUTH] Request to:', req.path)
        const token = req.headers.authorization?.split(' ')[1]

        if (!token) {
            console.log('[ADMIN_AUTH] No token provided')
            return res.status(401).json({ message: 'Token tapılmadı' })
        }

        console.log('[ADMIN_AUTH] Token found, verifying...')
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
            userId: number | string
        }
        const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId) : decoded.userId
        console.log('[ADMIN_AUTH] Token decoded, userId:', userId)

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                is_admin: true,
                is_active: true,
            },
        })

        console.log('[ADMIN_AUTH] User found:', user ? `${user.email} (admin: ${user.is_admin})` : 'null')

        if (!user) {
            return res.status(401).json({ message: 'İstifadəçi tapılmadı' })
        }

        if (!user.is_active) {
            console.log('[ADMIN_AUTH] User is not active')
            return res.status(403).json({ message: 'Hesab deaktiv edilib' })
        }

        if (!user.is_admin) {
            console.log('[ADMIN_AUTH] User is not admin')
            return res.status(403).json({ message: 'Admin icazəsi tələb olunur' })
        }

        console.log('[ADMIN_AUTH] ✅ Admin access granted')
        req.user = user
        next()
    } catch (error) {
        console.error('[ADMIN_AUTH] ❌ Error:', error)
        return res.status(401).json({ message: 'Etibarsız token' })
    }
}

// Normal user authentication (admin və ya user)
export const requireAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]

        if (!token) {
            return res.status(401).json({ message: 'Token tapılmadı' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
            userId: number | string
        }
        const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId) : decoded.userId

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                is_admin: true,
                is_active: true,
            },
        })

        if (!user) {
            return res.status(401).json({ message: 'İstifadəçi tapılmadı' })
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'Hesab deaktiv edilib' })
        }

        req.user = user
        next()
    } catch (error) {
        console.error('Auth middleware xətası:', error)
        return res.status(401).json({ message: 'Etibarsız token' })
    }
}
