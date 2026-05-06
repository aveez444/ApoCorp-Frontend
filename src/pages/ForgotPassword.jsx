// ForgotPassword.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicApi } from '../api/axios'  // Import publicApi instead of api

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    company_code: '',
    username: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [emailSentTo, setEmailSentTo] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Use publicApi instead of api
      const response = await publicApi.post('/accounts/forgot-password/', formData)
      
      if (response.data.message) {
        setMessage(response.data.message)
        // Extract email from message if present
        const emailMatch = response.data.message.match(/sent to (.*)/)
        if (emailMatch) {
          setEmailSentTo(emailMatch[1])
        }
        setSubmitted(true)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Check Your Email</h2>
          <p style={styles.successMessage}>
            We've sent a password reset link to:
          </p>
          <p style={styles.emailHighlight}>{emailSentTo || 'your registered email'}</p>
          <p style={styles.infoText}>
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </p>
          <button 
            onClick={() => navigate('/login')} 
            style={styles.button}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot Password?</h1>
        <p style={styles.subtitle}>
          Enter your company code and username. We'll send a password reset link to your registered email address.
        </p>

        {error && (
          <div style={styles.errorAlert}>
            <span>⚠️</span> {error}
          </div>
        )}

        {message && !submitted && (
          <div style={styles.successAlert}>
            <span>✓</span> {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Company Code</label>
            <input
              type="text"
              name="company_code"
              value={formData.company_code}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter your company code"
              autoComplete="off"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter your username"
              autoComplete="off"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{...styles.button, opacity: loading ? 0.7 : 1}}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
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
    margin: '0 0 24px 0',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
  successAlert: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#166534',
    fontSize: '14px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
    marginBottom: '8px',
  },
  emailHighlight: {
    textAlign: 'center',
    color: '#122C41',
    fontWeight: 600,
    marginBottom: '16px',
    wordBreak: 'break-all',
  },
  infoText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#6c757d',
    marginBottom: '24px',
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
}