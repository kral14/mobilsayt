import { useWindowStore } from '../store/windowStore'

export default function WindowTest() {
    const { createWindow } = useWindowStore()

    const handleCreateWindow = () => {
        createWindow('Test Pəncərəsi', (
            <div>
                <h3>Test Məzmunu</h3>
                <p>Bu test pəncərəsidir.</p>
                <p>Pəncərəni sürükləyə, ölçüsünü dəyişə və idarə edə bilərsiniz.</p>
                <h4 style={{ marginTop: '20px' }}>Sistem Hissələri:</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ margin: '10px 0' }}>
                        <strong>1. Navbar</strong> - Üst menyu (z-index: 1000)
                    </li>
                    <li style={{ margin: '10px 0' }}>
                        <strong>2. İşçi Masası</strong> - Pəncərələr burada açılır
                    </li>
                    <li style={{ margin: '10px 0' }}>
                        <strong>3. Taskbar</strong> - Alt panel (z-index: 10000)
                    </li>
                </ul>
                <p style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                    <strong>Test:</strong> Pəncərəni hər yerə sürükləyin.
                    Navbar və Taskbar-ın üstünə çıxmamalıdır!
                </p>
            </div>
        ))
    }

    return (
        <div style={{
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            <h1>Pəncərə Test Səhifəsi</h1>
            <p>Bu səhifədə yeni pəncərə sistemini test edə bilərsiniz.</p>

            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={handleCreateWindow}
                    style={{
                        padding: '12px 24px',
                        background: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    ➕ Yeni Test Pəncərəsi Aç
                </button>
            </div>

            <div style={{ marginTop: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                <h3>Funksiyalar:</h3>
                <ul>
                    <li>✅ Pəncərə yaratma və bağlama</li>
                    <li>✅ Sürükləmə (drag)</li>
                    <li>✅ Ölçü dəyişdirmə (resize)</li>
                    <li>✅ Minimize/Maximize/Close</li>
                    <li>✅ Taskbar inteqrasiyası</li>
                    <li>✅ Z-index idarəetməsi (fokus)</li>
                    <li>✅ Workspace sərhədləri daxilində saxlama</li>
                </ul>
            </div>
        </div>
    )
}
