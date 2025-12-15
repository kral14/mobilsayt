import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import networkVideo from '../assets/videos/network-background.mp4'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  // Yadda saxlanmış məlumatları yüklə
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedPassword = localStorage.getItem('rememberedPassword')
    const savedRemember = localStorage.getItem('rememberMe') === 'true'

    if (savedRemember && savedEmail && savedPassword) {
      setEmail(savedEmail)
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)

      // Yadda saxla seçilibsə, məlumatları saxla
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
        localStorage.setItem('rememberedPassword', password)
        localStorage.setItem('rememberMe', 'true')
      } else {
        // Yadda saxla seçilməyibsə, məlumatları sil
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberedPassword')
        localStorage.removeItem('rememberMe')
      }

      navigate('/products')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş zamanı xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');

        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }

        .video-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: -1;
        }

        .video-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 0;
        }

        /* Autocomplete arxa fonunu düzəlt */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: #fff !important;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px transparent !important;
          background-color: transparent !important;
        }
      `}</style>

      {/* Video arxa plan */}
      <video autoPlay loop muted playsInline className="video-background">
        <source src={networkVideo} type="video/mp4" />
      </video>

      {/* Video üzərində qaranlıq overlay */}
      <div className="video-overlay"></div>

      <div style={{
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        fontFamily: "'Poppins', sans-serif",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Login box */}
        <section style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            position: 'relative',
            width: '400px',
            minHeight: '450px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 45px rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 1s ease-in-out',
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              padding: '40px',
            }}>
              <form onSubmit={handleSubmit}>
                <h2 style={{
                  position: 'relative',
                  color: '#fff',
                  fontSize: '2em',
                  fontWeight: 600,
                  textAlign: 'center',
                  marginBottom: '40px',
                  letterSpacing: '1px',
                  textShadow: '0 0 10px rgba(0,0,0,0.5)',
                }}>Giriş</h2>

                {error && (
                  <div style={{
                    background: 'rgba(255, 0, 0, 0.3)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
                    {error}
                  </div>
                )}

                {/* Email input */}
                <div style={{
                  position: 'relative',
                  margin: '30px 0',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.8)',
                }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    autoComplete="email"
                    style={{
                      width: '100%',
                      height: '50px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '1em',
                      padding: '0 35px 0 5px',
                      color: '#fff',
                    }}
                  />
                  <label style={{
                    position: 'absolute',
                    top: emailFocused || email ? '-5px' : '50%',
                    left: '5px',
                    transform: emailFocused || email ? 'translateY(0)' : 'translateY(-50%)',
                    color: emailFocused || email ? '#03e9f4' : '#fff',
                    fontSize: emailFocused || email ? '0.8em' : '1em',
                    fontWeight: emailFocused || email ? 600 : 400,
                    pointerEvents: 'none',
                    transition: '.5s',
                  }}>Email</label>
                  <span style={{
                    position: 'absolute',
                    right: 0,
                    top: '15px',
                    color: 'white',
                    fontSize: '1.2em',
                  }}>✉</span>
                </div>

                {/* Password input */}
                <div style={{
                  position: 'relative',
                  margin: '30px 0',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.8)',
                }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      height: '50px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '1em',
                      padding: '0 35px 0 5px',
                      color: '#fff',
                    }}
                  />
                  <label style={{
                    position: 'absolute',
                    top: passwordFocused || password ? '-5px' : '50%',
                    left: '5px',
                    transform: passwordFocused || password ? 'translateY(0)' : 'translateY(-50%)',
                    color: passwordFocused || password ? '#03e9f4' : '#fff',
                    fontSize: passwordFocused || password ? '0.8em' : '1em',
                    fontWeight: passwordFocused || password ? 600 : 400,
                    pointerEvents: 'none',
                    transition: '.5s',
                  }}>Şifrə</label>
                  <span style={{
                    position: 'absolute',
                    right: 0,
                    top: '15px',
                    color: 'white',
                    fontSize: '1.2em',
                  }}>🔒</span>
                </div>

                {/* Remember me */}
                <div style={{
                  margin: '-15px 0 15px',
                  fontSize: '.9em',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'flex-start',
                }}>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ marginRight: '5px' }}
                    />
                    Yadda saxla
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '45px',
                    borderRadius: '40px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    outline: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1.1em',
                    fontWeight: 600,
                    color: '#000',
                    transition: '0.4s',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    opacity: loading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = '#03e9f4'
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.boxShadow = '0 0 20px #03e9f4'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                      e.currentTarget.style.color = '#000'
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {loading ? 'Yüklənir...' : 'Daxil ol'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
