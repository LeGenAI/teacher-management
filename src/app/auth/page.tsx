'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Tabs, 
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { useAuth } from '../../../contexts/AuthContext'
import LoginForm from '../../../components/auth/LoginForm'
import SignUpForm from '../../../components/auth/SignUpForm'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AuthPage() {
  const [tabValue, setTabValue] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const { user, profile, loading, profileLoading } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    setMounted(true)
  }, [])

  // 이미 로그인된 경우 역할에 따라 리다이렉트 (auth 페이지에서만)
  useEffect(() => {
    console.log('🔐 Auth 페이지 - Auth 상태 확인:', { 
      user: !!user, 
      userEmail: user?.email,
      profile: profile?.role, 
      loading, 
      profileLoading, 
      redirecting,
      currentPath: window.location.pathname
    })
    
    // admin 계정인지 즉시 확인
    if (!loading && user && user.email === 'admin@test.com' && !redirecting) {
      console.log('👨‍💼 Admin 계정 감지, 즉시 admin-dashboard로 리다이렉트')
      setRedirecting(true)
      window.location.href = '/admin-dashboard'
      return
    }
    
    // 사용자가 로그인되어 있고 로딩이 완료된 경우, 그리고 아직 리다이렉트하지 않은 경우
    if (!loading && user && profile && !redirecting) {
      console.log('✅ Auth 페이지 - 사용자 로그인 및 프로필 확인됨')
      console.log('🎯 사용자 역할:', profile.role)
      console.log('📧 사용자 이메일:', user.email)
      console.log('🔄 Auth 페이지에서 리다이렉트 중...')
      
      // 현재 경로가 /auth인 경우에만 리다이렉트
      if (window.location.pathname === '/auth') {
        setRedirecting(true) // 리다이렉트 시작
        
        if (profile.role === 'principal') {
          console.log('👨‍🏫 원장으로 리다이렉트: /principal-dashboard')
          router.replace('/principal-dashboard')
        } else {
          console.log('👨‍🏫 교사로 리다이렉트: /')
          router.replace('/')
        }
      } else {
        console.log('⚠️ 현재 /auth 페이지가 아니므로 리다이렉트 건너뜀')
      }
    }
  }, [user, profile, loading, profileLoading, router, redirecting])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAuthSuccess = () => {
    console.log('🎉 인증 성공!')
    console.log('📧 현재 사용자 이메일:', user?.email)
    console.log('📋 현재 프로필:', profile?.role)
    
    // 이미 리다이렉트 중이면 건너뜀
    if (redirecting) {
      console.log('⚠️ 이미 리다이렉트 중이므로 건너뜀')
      return
    }
    
    setRedirecting(true) // 리다이렉트 시작
    
    // admin 계정인지 즉시 확인하고 리다이렉트
    if (user?.email === 'admin@test.com') {
      console.log('👨‍💼 Admin 계정 감지, 즉시 admin-dashboard로 리다이렉트')
      window.location.href = '/admin-dashboard'
      return
    }
    
    // 다른 계정들은 프로필 로딩을 기다린 후 리다이렉트
    setTimeout(() => {
      console.log('⏰ 리다이렉트 실행 - 최종 상태 확인')
      console.log('📧 사용자 이메일:', user?.email)
      console.log('📋 프로필 역할:', profile?.role)
      
      if (profile?.role === 'principal') {
        console.log('👨‍🏫 원장으로 리다이렉트: /principal-dashboard')
        router.replace('/principal-dashboard')
      } else {
        console.log('👨‍🏫 교사로 리다이렉트: /')
        router.replace('/')
      }
    }, 1000) // 1초 대기
  }

  // 마운트되지 않았거나 로딩 중인 경우 로딩 화면 표시
  if (!mounted || loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#FFFFF0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6">로딩 중...</Typography>
      </Box>
    )
  }

  // 이미 로그인된 경우 빈 화면 표시 (리다이렉트는 useEffect에서 처리)
  if (user && profile) {
    return <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFFF0' }} />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#FFFFF0',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: 'white'
          }}
        >
          {/* 헤더 */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center',
              py: 4,
              px: 3
            }}
          >
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" gutterBottom>
              🎓 Teacher Analytics
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              AI 기반 교사 분석 플랫폼
            </Typography>
          </Box>

          {/* 탭 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '1rem'
                }
              }}
            >
              <Tab label="로그인" />
              <Tab label="회원가입" />
            </Tabs>
          </Box>

          {/* 탭 내용 */}
          <TabPanel value={tabValue} index={0}>
            <LoginForm onSuccess={handleAuthSuccess} />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <SignUpForm onSuccess={handleAuthSuccess} />
          </TabPanel>
        </Paper>

        {/* 푸터 정보 */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            © 2024 Teacher Management System
          </Typography>
        </Box>
      </Container>
    </Box>
  )
} 