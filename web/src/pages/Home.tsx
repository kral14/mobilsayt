import { useAuthStore } from '../store/authStore'
import { useDashboardStore } from '../store/dashboardStore'
import Layout from '../components/Layout'
import { DashboardRenderer } from '../components/Dashboard/DashboardRenderer'
import { DashboardToolbar } from '../components/Dashboard/DashboardToolbar'

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const {
    tabs,
    activeTabId,
    setActiveTab,
    isEditMode,
    addTab,
    removeTab
  } = useDashboardStore()

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top Tab Bar - Exact 2px gap with navbar */}
        {isAuthenticated && (
          <div style={{
            background: 'transparent',
            padding: '2px 20px 5px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            zIndex: 10,
            scrollbarWidth: 'none',
            // @ts-ignore
            msOverflowStyle: 'none',
          }}>
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {tabs.map(tab => (
              <div
                key={tab.id}
                style={{ position: 'relative' }}
              >
                <button
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '8px',
                    background: activeTabId === tab.id ? 'white' : 'rgba(255, 255, 255, 0.15)',
                    color: activeTabId === tab.id ? '#764ba2' : 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '700',
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem',
                    boxShadow: activeTabId === tab.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    letterSpacing: '0.3px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTabId !== tab.id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
                  }}
                  onMouseLeave={(e) => {
                    if (activeTabId !== tab.id) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  }}
                >
                  {tab.title}
                </button>

                {isEditMode && tabs.length > 1 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#ff4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '1px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}

            {isEditMode && (
              <button
                onClick={() => {
                  const title = prompt('Yeni tab adı:')
                  if (title) addTab(title)
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255, 255, 255, 0.5)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  marginLeft: '10px'
                }}
              >
                + Yeni Tab
              </button>
            )}
          </div>
        )}

        <div style={{
          padding: '1.5rem 2rem',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          overflowY: 'auto',
          flex: 1,
          background: '#f5f5f5',
          borderTopLeftRadius: '30px',
          borderTopRightRadius: '30px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>

          {/* Toolbar in Edit Mode */}
          {isAuthenticated && isEditMode && (
            <DashboardToolbar tabId={activeTabId} />
          )}

          {/* Dashboard Content */}
          {isAuthenticated ? (
            <DashboardRenderer
              tab={activeTab}
              isEditMode={isEditMode}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Xoş gəlmisiniz!</h2>
              <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                Davam etmək üçün zəhmət olmasa giriş edin
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

