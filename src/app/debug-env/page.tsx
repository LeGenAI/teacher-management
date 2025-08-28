'use client'

import { useState } from 'react'
import { Button, Box, Typography, Alert, Paper } from '@mui/material'

export default function DebugEnv() {
  const [envCheck, setEnvCheck] = useState('')
  const [connectionTest, setConnectionTest] = useState('')

  const checkEnvironment = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let result = '🔧 환경변수 체크:\n'
    result += `URL: ${url ? '✅ 존재' : '❌ 없음'}\n`
    result += `Key: ${key ? '✅ 존재' : '❌ 없음'}\n`
    
    if (url) {
      result += `URL 값: ${url}\n`
      result += `URL 형식: ${url.includes('supabase.co') ? '✅ 올바름' : '❌ 잘못됨'}\n`
    }
    
    if (key) {
      result += `Key 앞 20자: ${key.substring(0, 20)}...\n`
      result += `Key 형식: ${key.startsWith('eyJ') ? '✅ JWT 형식' : '❌ 잘못된 형식'}\n`
    }

    setEnvCheck(result)
  }

  const testBasicConnection = async () => {
    setConnectionTest('테스트 중...')
    
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        setConnectionTest('❌ 환경변수가 없습니다')
        return
      }

      // 기본 REST API 호출로 연결 테스트
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setConnectionTest(`✅ 연결 성공! 상태: ${response.status}`)
      } else {
        setConnectionTest(`❌ 연결 실패! 상태: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      setConnectionTest(`💥 오류 발생: ${error}`)
    }
  }

  const testAuthAPI = async () => {
    setConnectionTest('Auth API 테스트 중...')
    
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // profiles 테이블에서 특정 사용자 조회 테스트
      const specificUserResponse = await fetch(`${url}/rest/v1/profiles?id=eq.7221ee18-05d5-4e9b-83c9-bd1382b07505&select=*`, {
        headers: {
          'apikey': key!,
          'Authorization': `Bearer ${key!}`,
          'Content-Type': 'application/json'
        }
      })

      let result = `특정 사용자 프로필 조회: ${specificUserResponse.status}\n`
      
      if (specificUserResponse.ok) {
        const userData = await specificUserResponse.json()
        result += `✅ 조회 성공!\n`
        result += `데이터: ${JSON.stringify(userData, null, 2)}\n`
      } else {
        result += `❌ 조회 실패: ${specificUserResponse.statusText}\n`
      }

      // 전체 profiles 테이블 조회
      const allProfilesResponse = await fetch(`${url}/rest/v1/profiles?select=id,email,role`, {
        headers: {
          'apikey': key!,
          'Authorization': `Bearer ${key!}`,
          'Content-Type': 'application/json'
        }
      })

      result += `\n전체 프로필 조회: ${allProfilesResponse.status}\n`
      
      if (allProfilesResponse.ok) {
        const allProfiles = await allProfilesResponse.json()
        result += `✅ 전체 조회 성공!\n`
        result += `총 ${allProfiles.length}개 프로필\n`
        result += `데이터: ${JSON.stringify(allProfiles, null, 2)}\n`
      } else {
        result += `❌ 전체 조회 실패: ${allProfilesResponse.statusText}\n`
      }

      setConnectionTest(result)
    } catch (error) {
      setConnectionTest(`💥 프로필 조회 테스트 오류: ${error}`)
    }
  }

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔍 환경변수 & 연결 디버깅
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={checkEnvironment}>
          환경변수 체크
        </Button>
        <Button variant="outlined" onClick={testBasicConnection}>
          기본 연결 테스트
        </Button>
        <Button variant="outlined" onClick={testAuthAPI} color="secondary">
          Auth API 테스트
        </Button>
      </Box>

      {envCheck && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>환경변수 결과:</Typography>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
            {envCheck}
          </Typography>
        </Paper>
      )}

      {connectionTest && (
        <Alert 
          severity={connectionTest.includes('✅') ? 'success' : 'error'}
          sx={{ whiteSpace: 'pre-wrap' }}
        >
          {connectionTest}
        </Alert>
      )}

      <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>📝 체크리스트:</Typography>
        <Typography variant="body2">
          1. URL이 https://프로젝트ID.supabase.co 형식인가?<br/>
          2. Key가 eyJ로 시작하는가?<br/>
          3. .env.local 파일이 프로젝트 루트에 있는가?<br/>
          4. 환경변수 이름이 NEXT_PUBLIC_ 접두사가 있는가?<br/>
          5. Supabase 프로젝트가 활성화되어 있는가?
        </Typography>
      </Box>
    </Box>
  )
} 