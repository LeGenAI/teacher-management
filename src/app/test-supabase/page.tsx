'use client'

import { useState } from 'react'
import { Button, Box, Typography, Alert } from '@mui/material'
import { createSupabaseBrowserClient } from '../../../lib/supabase'

export default function TestSupabase() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseBrowserClient()

  const testConnection = async () => {
    setLoading(true)
    setResult('테스트 중...')
    
    try {
      // 간단한 연결 테스트
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
      
      if (error) {
        setResult(`❌ 연결 실패: ${error.message}`)
      } else {
        setResult(`✅ 연결 성공! profiles 테이블 존재함`)
      }
    } catch (err) {
      setResult(`💥 오류: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testSignUp = async () => {
    setLoading(true)
    setResult('회원가입 테스트 중...')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `teacher${Date.now()}@test.com`, // 고유한 이메일 생성
        password: '123456789', // 더 긴 비밀번호
        options: {
          data: {
            full_name: '김선생님',
            role: 'teacher'
          }
        }
      })
      
      if (error) {
        setResult(`❌ 회원가입 실패: ${error.message}\n코드: ${error.status}\n세부사항: ${JSON.stringify(error, null, 2)}`)
      } else {
        setResult(`✅ 회원가입 성공! 
사용자 ID: ${data.user?.id}
이메일: ${data.user?.email}
프로필 생성됨: ${data.user ? '예' : '아니오'}`)
      }
    } catch (err) {
      setResult(`💥 오류: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🧪 Supabase 연결 테스트
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={testConnection}
          disabled={loading}
        >
          연결 테스트
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={testSignUp}
          disabled={loading}
        >
          회원가입 테스트
        </Button>
      </Box>
      
      {result && (
        <Alert 
          severity={result.includes('✅') ? 'success' : 'error'}
          sx={{ whiteSpace: 'pre-wrap' }}
        >
          {result}
        </Alert>
      )}
    </Box>
  )
} 