import { useState, useEffect } from 'react'
import { type LogLevel, type LogCategory } from '../store/logStore'
import { API_BASE_URL } from '../utils/constants'


interface User {
    id: number
    email: string
    full_name?: string
    role: string
    is_admin: boolean
    is_active: boolean
    created_at: string
    updated_at?: string
}

interface UserFormData {
    email: string
    password: string
    full_name: string
    role: string
    is_admin: boolean
}

export default function Admin() {
    const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'logs'>('users')
    // const { manualSync } = useLogSync() // Removed unused log sync

    // User Management State
    const [users, setUsers] = useState<User[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [showUserForm, setShowUserForm] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [userFormData, setUserFormData] = useState<UserFormData>({
        email: '',
        password: '',
        full_name: '',
        role: 'USER',
        is_admin: false,
    })

    // Admin Log Management State
    const [adminLogs, setAdminLogs] = useState<any[]>([])
    const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all')
    const [loadingAdminLogs, setLoadingAdminLogs] = useState(false)
    const [adminLogTotal, setAdminLogTotal] = useState(0)

    // Log filters
    const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all')
    const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')

    // Load users when users tab is active
    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers()
        }
    }, [activeTab])

    // Load admin logs when logs tab is active or filters change
    useEffect(() => {
        if (activeTab === 'logs') {
            loadAdminLogs()
        }
    }, [activeTab, selectedUserId, categoryFilter, levelFilter])

    // User Management Functions
    const loadUsers = async () => {
        setLoadingUsers(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            } else {
                alert('İstifadəçilər yüklənə bilmədi')
            }
        } catch (error) {
            console.error('Load users error:', error)
            alert('Server xətası')
        } finally {
            setLoadingUsers(false)
        }
    }

    const handleCreateUser = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(userFormData),
            })

            if (response.ok) {
                alert('İstifadəçi yaradıldı')
                setShowUserForm(false)
                resetUserForm()
                loadUsers()
            } else {
                const error = await response.json()
                alert(error.message || 'Xəta baş verdi')
            }
        } catch (error) {
            console.error('Create user error:', error)
            alert('Server xətası')
        }
    }

    const handleUpdateUser = async () => {
        if (!editingUser) return

        try {
            const token = localStorage.getItem('token')
            const updateData: any = {
                email: userFormData.email,
                full_name: userFormData.full_name,
                role: userFormData.role,
                is_admin: userFormData.is_admin,
                is_active: true,
            }

            if (userFormData.password) {
                updateData.password = userFormData.password
            }

            const response = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            })

            if (response.ok) {
                alert('İstifadəçi yeniləndi')
                setShowUserForm(false)
                setEditingUser(null)
                resetUserForm()
                loadUsers()
            } else {
                const error = await response.json()
                alert(error.message || 'Xəta baş verdi')
            }
        } catch (error) {
            console.error('Update user error:', error)
            alert('Server xətası')
        }
    }

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('İstifadəçini silmək istədiyinizə əminsiniz?')) return

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                alert('İstifadəçi silindi')
                loadUsers()
            } else {
                const error = await response.json()
                alert(error.message || 'Xəta baş verdi')
            }
        } catch (error) {
            console.error('Delete user error:', error)
            alert('Server xətası')
        }
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setUserFormData({
            email: user.email,
            password: '',
            full_name: user.full_name || '',
            role: user.role,
            is_admin: user.is_admin,
        })
        setShowUserForm(true)
    }

    // Admin Log Management Functions
    const loadAdminLogs = async () => {
        console.log('[ADMIN LOGS] Loading logs, selectedUserId:', selectedUserId)
        setLoadingAdminLogs(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams({
                page: '1',
                limit: '100',
            })

            if (selectedUserId !== 'all') {
                params.append('userId', selectedUserId.toString())
            }
            if (categoryFilter !== 'all') {
                params.append('category', categoryFilter)
            }
            if (levelFilter !== 'all') {
                params.append('level', levelFilter)
            }

            const url = `${API_BASE_URL}/admin/logs?${params}`
            console.log('[ADMIN LOGS] Fetching from:', url)

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            console.log('[ADMIN LOGS] Response status:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('[ADMIN LOGS] Data received:', data)
                setAdminLogs(data.logs)
                setAdminLogTotal(data.total)
            } else {
                const error = await response.text()
                console.error('[ADMIN LOGS] Error response:', error)
                alert('Loglar yüklənə bilmədi: ' + response.status)
            }
        } catch (error) {
            console.error('[ADMIN LOGS] Load admin logs error:', error)
            alert('Server xətası')
        } finally {
            setLoadingAdminLogs(false)
        }
    }

    const handleExportLogs = () => {
        if (adminLogs.length === 0) {
            alert('Export ediləcək log yoxdur')
            return
        }

        const content = adminLogs.map(log => {
            const time = new Date(log.timestamp).toLocaleString('az-AZ')
            return `[${time}] [${log.level.toUpperCase()}] [${log.category}] [User: ${log.user_email || 'N/A'}] ${log.action} - ${log.details || ''}`
        }).join('\n')

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `admin_logs_${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const deleteUserLogs = async (userId: number) => {
        if (!confirm('Bu istifadəçinin bütün loglarını silmək istədiyinizə əminsiniz?')) {
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/logs/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                alert('Loglar uğurla silindi')
                loadAdminLogs() // Reload logs
            } else {
                alert('Logları silmə xətası')
            }
        } catch (error) {
            console.error('Delete logs error:', error)
            alert('Server xətası')
        }
    }

    const resetUserForm = () => {
        setUserFormData({
            email: '',
            password: '',
            full_name: '',
            role: 'USER',
            is_admin: false,
        })
        setEditingUser(null)
    }





    return (
        <div style={{ padding: '2rem', height: '100%', overflow: 'auto' }}>
            <h1 style={{ marginBottom: '2rem', color: '#333' }}>⚙️ Admin Panel</h1>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                borderBottom: '2px solid #e0e0e0'
            }}>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'users' ? '#007bff' : 'transparent',
                        color: activeTab === 'users' ? 'white' : '#666',
                        border: 'none',
                        borderBottom: activeTab === 'users' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: activeTab === 'users' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >
                    👥 İstifadəçilər
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'settings' ? '#007bff' : 'transparent',
                        color: activeTab === 'settings' ? 'white' : '#666',
                        border: 'none',
                        borderBottom: activeTab === 'settings' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: activeTab === 'settings' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                    }}
                >
                    ⚙️ Ayarlar
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'logs' ? '#007bff' : 'transparent',
                        color: activeTab === 'logs' ? 'white' : '#666',
                        border: 'none',
                        borderBottom: activeTab === 'logs' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: activeTab === 'logs' ? 'bold' : 'normal',
                        transition: 'all 0.2s',
                        position: 'relative'
                    }}
                >
                    📋 Loglar

                </button>
            </div>

            {/* Content */}
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>İstifadəçi İdarəetməsi</h2>
                            <button
                                onClick={() => {
                                    resetUserForm()
                                    setShowUserForm(true)
                                }}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                ➕ Yeni İstifadəçi
                            </button>
                        </div>

                        {/* User Form Modal */}
                        {showUserForm && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000
                            }}>
                                <div style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '8px',
                                    width: '90%',
                                    maxWidth: '500px'
                                }}>
                                    <h3>{editingUser ? 'İstifadəçini Redaktə Et' : 'Yeni İstifadəçi Yarat'}</h3>

                                    <div style={{ marginTop: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={userFormData.email}
                                            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                marginBottom: '1rem'
                                            }}
                                        />

                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                            Ad Soyad
                                        </label>
                                        <input
                                            type="text"
                                            value={userFormData.full_name}
                                            onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                marginBottom: '1rem'
                                            }}
                                        />

                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                            Şifrə {editingUser && '(boş buraxın dəyişdirməmək üçün)'}
                                        </label>
                                        <input
                                            type="password"
                                            value={userFormData.password}
                                            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                marginBottom: '1rem'
                                            }}
                                        />

                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                            Rol
                                        </label>
                                        <select
                                            value={userFormData.role}
                                            onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                marginBottom: '1rem'
                                            }}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={userFormData.is_admin}
                                                onChange={(e) => setUserFormData({ ...userFormData, is_admin: e.target.checked })}
                                            />
                                            <span>Admin icazələri</span>
                                        </label>

                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setShowUserForm(false)
                                                    resetUserForm()
                                                }}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Ləğv et
                                            </button>
                                            <button
                                                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: '#007bff',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {editingUser ? 'Yenilə' : 'Yarat'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users Table */}
                        {loadingUsers ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Yüklənir...</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ad Soyad</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rol</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Admin</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Əməliyyatlar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '0.75rem' }}>{user.id}</td>
                                            <td style={{ padding: '0.75rem' }}>{user.email}</td>
                                            <td style={{ padding: '0.75rem' }}>{user.full_name || '-'}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: user.role === 'ADMIN' ? '#ffc107' : '#17a2b8',
                                                    color: 'white',
                                                    borderRadius: '3px',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {user.is_admin ? '✅' : '❌'}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: user.is_active ? '#28a745' : '#dc3545',
                                                    color: 'white',
                                                    borderRadius: '3px',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {user.is_active ? 'Aktiv' : 'Deaktiv'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        background: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        marginRight: '0.5rem'
                                                    }}
                                                >
                                                    ✏️ Redaktə
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        background: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    🗑️ Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {users.length === 0 && !loadingUsers && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                İstifadəçi tapılmadı
                            </div>
                        )}
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div>
                        <h2 style={{ marginBottom: '1.5rem' }}>📋 İstifadəçi Logları (Admin)</h2>

                        {/* User Selection */}
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                            <label style={{ fontWeight: 'bold', minWidth: '100px' }}>İstifadəçi:</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    flex: 1,
                                    maxWidth: '400px'
                                }}
                            >
                                <option value="all">📊 Bütün İstifadəçilər</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.email} {user.full_name ? `(${user.full_name})` : ''}
                                    </option>
                                ))}
                            </select>

                            <label style={{ fontWeight: 'bold' }}>Kat:</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value as any)}
                                style={{
                                    padding: '0.5rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    flex: 1
                                }}
                            >
                                <option value="all">Bütün</option>
                                <option value="window">🪟 Pəncərə</option>
                                <option value="invoice">📋 Qaimə</option>
                                <option value="user">👤 İstifadəçi</option>
                                <option value="system">⚙️ Sistem</option>
                                <option value="data">💾 Data</option>
                            </select>

                            <label style={{ fontWeight: 'bold' }}>Səv:</label>
                            <select
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value as any)}
                                style={{
                                    padding: '0.5rem',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    flex: 1
                                }}
                            >
                                <option value="all">Bütün</option>
                                <option value="info">INFO</option>
                                <option value="success">SUCCESS</option>
                                <option value="warning">WARNING</option>
                                <option value="error">ERROR</option>
                            </select>

                            <button
                                onClick={loadAdminLogs}
                                disabled={loadingAdminLogs}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loadingAdminLogs ? 'not-allowed' : 'pointer',
                                    opacity: loadingAdminLogs ? 0.6 : 1,
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {loadingAdminLogs ? '⏳' : '🔄'}
                            </button>

                            <button
                                onClick={handleExportLogs}
                                title="TXT kimi yüklə"
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                📥 Export
                            </button>

                            {selectedUserId !== 'all' && (
                                <button
                                    onClick={() => deleteUserLogs(selectedUserId as number)}
                                    title="İstifadəçi loglarını sil"
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    🗑️ Sil
                                </button>
                            )}
                        </div>

                        {/* Log Stats */}
                        <div style={{
                            padding: '1rem',
                            background: '#e7f3ff',
                            borderRadius: '4px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            gap: '2rem',
                            border: '1px solid #b3d9ff'
                        }}>
                            <div>
                                <strong>📊 Toplam Log:</strong> <span style={{ color: '#007bff', fontSize: '1.1rem', fontWeight: 'bold' }}>{adminLogTotal}</span>
                            </div>
                            <div>
                                <strong>📋 Göstərilən:</strong> <span style={{ color: '#28a745', fontSize: '1.1rem', fontWeight: 'bold' }}>{adminLogs.length}</span>
                            </div>
                            {selectedUserId !== 'all' && (
                                <div>
                                    <strong>👤 İstifadəçi:</strong> <span style={{ color: '#6c757d' }}>{users.find(u => u.id === selectedUserId)?.email || 'Seçilməyib'}</span>
                                </div>
                            )}
                        </div>


                        {/* Admin Logs Table */}
                        {loadingAdminLogs ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                                <div>Loglar yüklənir...</div>
                            </div>
                        ) : adminLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#999', background: '#f8f9fa', borderRadius: '4px' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                                <div>Log tapılmadı</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.9rem',
                                    background: 'white'
                                }}>
                                    <thead>
                                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Vaxt</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>İstifadəçi</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Səviyyə</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Kateqoriya</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Əməliyyat</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold' }}>Detallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminLogs.map((log, index) => (
                                            <tr
                                                key={log.log_id || index}
                                                style={{
                                                    borderBottom: '1px solid #dee2e6',
                                                    background: index % 2 === 0 ? 'white' : '#f8f9fa'
                                                }}
                                            >
                                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#666' }}>
                                                    {new Date(log.timestamp).toLocaleString('az-AZ')}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{log.user_email || 'N/A'}</div>
                                                    {log.user_name && <div style={{ fontSize: '0.85rem', color: '#666' }}>{log.user_name}</div>}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '3px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 'bold',
                                                        background: log.level === 'error' ? '#dc3545' : log.level === 'warning' ? '#ffc107' : log.level === 'success' ? '#28a745' : '#17a2b8',
                                                        color: log.level === 'warning' ? '#000' : '#fff'
                                                    }}>
                                                        {log.level}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>{log.category}</td>
                                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{log.action}</td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#666' }}>{log.details || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div>
                        <h2>Sistem Ayarları</h2>
                        <p style={{ color: '#666' }}>Sistem ayarları funksiyası hazırlanır...</p>
                    </div>
                )}
            </div>
        </div>
    )
}
