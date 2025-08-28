'use client'

import React, { useState } from 'react'
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  CircularProgress
} from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 로그인 시도:', email)
      const { error } = await signIn(email, password)
      
      if (error) {
        console.log('❌ 로그인 실패:', error.message)
        setError(error.message)
      } else {
        console.log('✅ 로그인 성공!')
        // 로그인 성공 후 1초 후에 리다이렉트
        setTimeout(() => {
          onSuccess?.()
        }, 1000) // 1초 후 리다이렉트
      }
    } catch (err) {
      console.log('💥 로그인 예외:', err)
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        required
        disabled={loading}
      />
      
      <TextField
        fullWidth
        label="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
        disabled={loading}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ mt: 3, py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} /> : '로그인'}
      </Button>

      <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="subtitle2" gutterBottom>
          🧪 테스트 계정
        </Typography>
        <Typography variant="body2">
          <strong>원장님:</strong> admin@test.com / 123456<br/>
          <strong>선생님:</strong> teacher@test.com / 123456
        </Typography>
      </Box>
    </Box>
  )
} 