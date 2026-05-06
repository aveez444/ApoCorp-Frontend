// ResetPassword.jsx
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { publicApi } from '../api/axios'  // Import publicApi

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const companyCode = searchParams.get('company_code')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [username, setUsername] = useState('')

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No reset token provided')
        setValidating(false)
        return
      }

      if (!companyCode) {
        setError('Company code is missing from reset link')
        setValidating(false)
        return
      }

      try {
        // Use publicApi instead of api
        const response = await publicApi.post('/accounts/validate-reset-token/', {
          token,
          company_code: companyCode
        })
        setTokenValid(true)
        setUserEmail(response.data.email)
        setUsername(response.data.username)
      } catch (err) {
        setError(err.response?.data?.error || 'Invalid or expired reset link')
        setTokenValid(false)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token, companyCode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Use publicApi instead of api
      await publicApi.post('/accounts/reset-password/', {
        token,
        company_code: companyCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Validating your reset link...</p>
        </div>
      </div>
    )
  }

  if (error && !tokenValid) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Invalid Reset Link</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button 
            onClick={() => navigate('/forgot-password')} 
            style={styles.button}
          >
            Request New Reset Link
          </button>
          <button 
            onClick={() => navigate('/login')} 
            style={{...styles.button, ...styles.secondaryButton}}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Password Reset Successful!</h2>
          <p style={styles.successMessage}>
            Your password has been changed successfully.
          </p>
          <p style={styles.infoText}>
            Redirecting you to login page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create New Password</h1>
        <p style={styles.subtitle}>
          Set a new password for <strong>{username}</strong>
        </p>
        <p style={styles.emailNote}>
          (Email: {userEmail})
        </p>

        {error && (
          <div style={styles.errorAlert}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p style={styles.hint}>Must be at least 8 characters</p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Confirm your new password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{...styles.button, opacity: loading ? 0.7 : 1}}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div style={styles.loginLink}>
            <a href="/login" style={styles.link}>← Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#122C41',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: '40px 50px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
  },
  title: {
    fontFamily: 'Lato, sans-serif',
    fontWeight: 700,
    fontSize: '28px',
    color: '#122C41',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontFamily: 'Lato, sans-serif',
    fontSize: '16px',
    color: '#384048',
    margin: '0 0 4px 0',
  },
  emailNote: {
    fontFamily: 'Lato, sans-serif',
    fontSize: '13px',
    color: '#6c757d',
    margin: '0 0 24px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontFamily: 'Lato, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    color: '#122C41',
  },
  input: {
    width: '100%',
    height: '44px',
    padding: '0 14px',
    border: '1px solid #122C41',
    borderRadius: 4,
    fontSize: '15px',
    fontFamily: 'Lato, sans-serif',
    boxSizing: 'border-box',
    outline: 'none',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
  },
  button: {
    width: '100%',
    height: '48px',
    background: '#122C41',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: '16px',
    fontFamily: 'Lato, sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  secondaryButton: {
    background: '#f5f5f5',
    color: '#122C41',
    marginTop: '12px',
  },
  errorAlert: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  errorTitle: {
    textAlign: 'center',
    color: '#dc2626',
    marginBottom: '12px',
  },
  errorMessage: {
    textAlign: 'center',
    color: '#384048',
    marginBottom: '24px',
  },
  successIcon: {
    width: '48px',
    height: '48px',
    background: '#22c55e',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    margin: '0 auto 20px',
  },
  successTitle: {
    textAlign: 'center',
    color: '#122C41',
    marginBottom: '12px',
  },
  successMessage: {
    textAlign: 'center',
    color: '#384048',
    marginBottom: '16px',
  },
  infoText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#6c757d',
  },
  hint: {
    fontSize: '12px',
    color: '#6c757d',
    marginTop: '4px',
  },
  loginLink: {
    textAlign: 'center',
    marginTop: '8px',
  },
  link: {
    color: '#122C41',
    textDecoration: 'none',
    fontSize: '14px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #122C41',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  loadingText: {
    textAlign: 'center',
    color: '#384048',
  },
}

// Add animation to your global CSS or component
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(styleSheet)