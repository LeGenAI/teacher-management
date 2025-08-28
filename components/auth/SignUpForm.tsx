'use client'

import React, { useState } from 'react'
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../lib/supabase'

interface SignUpFormProps {
  onSuccess?: () => void
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'teacher' as UserRole
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 회원가입 시도:', {
        email: formData.email,
        password: formData.password.length + '자리',
        userData: { full_name: formData.fullName, role: formData.role }
      })

      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        role: formData.role
      })
      
      console.log('📋 회원가입 결과:', { error })
      
      if (error) {
        console.error('❌ 회원가입 오류 상세:', {
          message: error.message,
          status: error.status,
          code: error.code || 'N/A'
        })
        setError(`회원가입 실패: ${error.message}`)
      } else {
        console.log('✅ 회원가입 성공!')
        onSuccess?.()
      }
    } catch (err) {
      console.error('💥 회원가입 예외:', err)
      setError(`회원가입 중 오류: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="이름"
        value={formData.fullName}
        onChange={handleChange('fullName')}
        margin="normal"
        required
        disabled={loading}
      />

      <TextField
        fullWidth
        label="이메일"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        margin="normal"
        required
        disabled={loading}
      />

      <FormControl fullWidth margin="normal" required>
        <InputLabel>역할</InputLabel>
        <Select
          value={formData.role}
          onChange={handleChange('role')}
          disabled={loading}
        >
          <MenuItem value="teacher">선생님</MenuItem>
          <MenuItem value="principal">원장님</MenuItem>
        </Select>
      </FormControl>
      
      <TextField
        fullWidth
        label="비밀번호"
        type="password"
        value={formData.password}
        onChange={handleChange('password')}
        margin="normal"
        required
        disabled={loading}
      />

      <TextField
        fullWidth
        label="비밀번호 확인"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange('confirmPassword')}
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
        {loading ? <CircularProgress size={24} /> : '회원가입'}
      </Button>
    </Box>
  )
} 