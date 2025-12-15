import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { AuthRequest } from '../middleware/adminAuth'

const prisma = new PrismaClient()

// Bütün istifadəçiləri əldə et (Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_admin: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        })

        res.json(users)
    } catch (error) {
        console.error('Get all users xətası:', error)
        res.status(500).json({ message: 'Server xətası' })
    }
}

// İstifadəçi yarat (Admin only)
export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, full_name, role, is_admin } = req.body

        // Email yoxlama
        const existingUser = await prisma.users.findUnique({
            where: { email },
        })

        if (existingUser) {
            return res.status(400).json({ message: 'Bu email artıq istifadə olunur' })
        }

        // Password hash
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.users.create({
            data: {
                email,
                password: hashedPassword,
                full_name,
                role: role || 'USER',
                is_admin: is_admin || false,
                is_active: true,
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_admin: true,
                is_active: true,
                created_at: true,
            },
        })

        // Activity log
        await prisma.activity_logs.create({
            data: {
                user_id: req.user!.id,
                log_id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                action: 'İstifadəçi yaradıldı',
                category: 'user',
                level: 'success',
                details: `Yeni istifadəçi: ${email}`,
                metadata: { created_user_id: user.id, role: user.role },
            },
        })

        res.status(201).json(user)
    } catch (error) {
        console.error('Create user xətası:', error)
        res.status(500).json({ message: 'Server xətası' })
    }
}

// İstifadəçini yenilə (Admin only)
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params
        const { email, full_name, role, is_admin, is_active, password } = req.body

        const updateData: any = {
            email,
            full_name,
            role,
            is_admin,
            is_active,
            updated_at: new Date(),
        }

        // Əgər password dəyişdirilirsə
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        const user = await prisma.users.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                is_admin: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        })

        // Activity log
        await prisma.activity_logs.create({
            data: {
                user_id: req.user!.id,
                log_id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                action: 'İstifadəçi yeniləndi',
                category: 'user',
                level: 'info',
                details: `İstifadəçi yeniləndi: ${user.email}`,
                metadata: { updated_user_id: user.id },
            },
        })

        res.json(user)
    } catch (error) {
        console.error('Update user xətası:', error)
        res.status(500).json({ message: 'Server xətası' })
    }
}

// İstifadəçini sil (Admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params

        // Özünü silməyə icazə vermə
        if (req.user?.id === parseInt(id)) {
            return res.status(400).json({ message: 'Özünüzü silə bilməzsiniz' })
        }

        const user = await prisma.users.findUnique({
            where: { id: parseInt(id) },
        })

        if (!user) {
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' })
        }

        await prisma.users.delete({
            where: { id: parseInt(id) },
        })

        // Activity log
        await prisma.activity_logs.create({
            data: {
                user_id: req.user!.id,
                log_id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                action: 'İstifadəçi silindi',
                category: 'user',
                level: 'warning',
                details: `İstifadəçi silindi: ${user.email}`,
                metadata: { deleted_user_id: user.id },
            },
        })

        res.json({ message: 'İstifadəçi silindi' })
    } catch (error) {
        console.error('Delete user xətası:', error)
        res.status(500).json({ message: 'Server xətası' })
    }
}

// İstifadəçi statistikası (Admin only)
export const getUserStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalUsers = await prisma.users.count()
        const activeUsers = await prisma.users.count({
            where: { is_active: true },
        })
        const adminUsers = await prisma.users.count({
            where: { is_admin: true },
        })

        const recentUsers = await prisma.users.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                email: true,
                full_name: true,
                created_at: true,
            },
        })

        res.json({
            total: totalUsers,
            active: activeUsers,
            admins: adminUsers,
            inactive: totalUsers - activeUsers,
            recent: recentUsers,
        })
    } catch (error) {
        console.error('Get user stats xətası:', error)
        res.status(500).json({ message: 'Server xətası' })
    }
}
