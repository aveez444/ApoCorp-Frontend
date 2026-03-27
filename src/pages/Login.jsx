import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const inputStyle = {
  width: '100%',
  height: '44px', // Reduced from 48px
  padding: '0 14px',
  border: '1px solid #122C41',
  borderRadius: 4,
  fontSize: '15px', // Slightly reduced
  fontFamily: 'Lato, sans-serif',
  fontWeight: 400,
  color: '#384048',
  outline: 'none',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle = {
  position: 'absolute',
  left: '12px',
  top: '-8px',
  background: '#FFFFFF',
  padding: '0 4px',
  fontFamily: 'Lato, sans-serif',
  fontSize: '11px', // Slightly reduced
  fontWeight: 400,
  lineHeight: '16px',
  color: '#122C41',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ company_code: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const role = await login(form.company_code, form.username, form.password)
      if (role === 'manager') navigate('/manager/dashboard')
      else navigate('/employee/dashboard')
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#122C41',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Right side geometric shape */}
      <div style={{
        position: 'absolute',
        width: '650px', // Slightly reduced
        height: '520px', // Slightly reduced
        right: 0,
        bottom: 0,
        background: '#1B3850',
        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
      }} />

      {/* Logo apoCorp */}
      <div style={{
        position: 'absolute',
        left: '60px', // Reduced from 80px
        top: '60px', // Reduced from 80px
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
        width: '260px', // Reduced
        height: '70px', // Reduced
      }}>
        {/* Vector shape/logo placeholder */}
        <div style={{
         
          height: '56px', // Reduced
          background: '#1B3850',
        }} />
        <span style={{
          fontFamily: 'Alata, sans-serif',
          fontWeight: 400,
          fontSize: '46px', // Reduced from 55.1724px
          lineHeight: '150%',
          letterSpacing: '-0.011em',
          color: '#1B3850',
          whiteSpace: 'nowrap',
        }}>
          ApoCorp
        </span>
      </div>

      {/* Login Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '40px 50px', // Reduced padding
        width: '480px', // Reduced from 557px
        position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px', // Reduced from 60px
      }}>
        {/* Welcome Text */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px', // Reduced from 24px
          width: '100%',
        }}>
          <h1 style={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 700,
            fontSize: '28px', // Reduced from 32px
            lineHeight: '135%', // Slightly tighter
            letterSpacing: '-0.011em',
            color: '#122C41',
            margin: 0,
          }}>
            ApoCorp welcomes you!
          </h1>
          <p style={{
            fontFamily: 'Lato, sans-serif',
            fontWeight: 400,
            fontSize: '18px', // Reduced from 20px
            lineHeight: '140%', // Slightly tighter
            letterSpacing: '-0.011em',
            color: '#122C41',
            margin: 0,
          }}>
            Enter your credentials and streamline your process
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '8px 12px', // Reduced padding
            color: '#dc2626',
            fontSize: '0.8rem',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px', // Reduced from 16px
          width: '100%',
        }}>
          {/* Company Code Field */}
          <div style={{ position: 'relative', width: '100%', height: '66px' }}> {/* Reduced height */}
            <div style={labelStyle}>Company Code</div>
            <input
              type="text"
              name="company_code"
              value={form.company_code}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#122C41'}
              onBlur={e => e.target.style.borderColor = '#122C41'}
            />
          </div>

          {/* User ID Field */}
          <div style={{ position: 'relative', width: '100%', height: '66px' }}> {/* Reduced height */}
            <div style={labelStyle}>User ID</div>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#122C41'}
              onBlur={e => e.target.style.borderColor = '#122C41'}
            />
          </div>

          {/* Password Field */}
          <div style={{ position: 'relative', width: '100%', height: '66px' }}> {/* Reduced height */}
            <div style={labelStyle}>Password</div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ ...inputStyle, paddingRight: '40px' }}
              onFocus={e => e.target.style.borderColor = '#122C41'}
              onBlur={e => e.target.style.borderColor = '#122C41'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '16px', // Adjusted for smaller input
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                zIndex: 10,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"> {/* Slightly smaller icon */}
                {showPassword ? (
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" 
                    stroke="#787878" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" 
                      stroke="#787878" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="#787878" strokeWidth="2"/>
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Login Button and Forgot Password */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px', // Reduced from 24px
            width: '100%',
            marginTop: '16px', // Reduced from 24px
          }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '54px', // Reduced from 64px
                padding: '16px', // Reduced padding
                background: loading ? '#94a3b8' : '#122C41',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10, // Slightly reduced from 12px
                fontSize: '18px', // Reduced from 20px
                fontFamily: 'Lato, sans-serif',
                fontWeight: 700,
                lineHeight: '22px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <a 
              href="#" 
              style={{
                fontFamily: 'Lato, sans-serif',
                fontWeight: 400,
                fontSize: '17px', // Reduced from 20px
                lineHeight: '140%',
                letterSpacing: '-0.011em',
                textAlign: 'center',
                color: '#122C41',
                textDecoration: 'none',
                width: '100%',
              }}
            >
              Forgot Password?
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}