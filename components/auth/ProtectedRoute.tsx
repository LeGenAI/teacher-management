'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '../../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // 디버깅 로그
  useEffect(() => {
    console.log('🔒 ProtectedRoute 상태:', {
      user: !!user,
      profile: profile?.role,
      loading,
      requiredRole,
      allowedRoles
    })
  }, [user, profile, loading, requiredRole, allowedRoles])

  // 로그인하지 않은 경우 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      console.log('🚫 사용자 없음, /auth로 리다이렉트')
      router.push('/auth')
    }
  }, [user, loading, router])

  // 로딩 중
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#FFFFF0',
          gap: 3
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          로딩 중...
        </Typography>
      </Box>
    )
  }

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#FFFFF0',
          gap: 3
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          로그인 페이지로 이동 중...
        </Typography>
      </Box>
    )
  }

  // 프로필이 없는 경우
  if (!profile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#FFFFF0',
          gap: 3
        }}
      >
        <Typography variant="h6" color="error">
          사용자 프로필을 불러올 수 없습니다.
        </Typography>
      </Box>
    )
  }

  // 역할 기반 접근 제어
  if (requiredRole && profile.role !== requiredRole) {
    console.log('🚫 역할 불일치:', { 
      requiredRole, 
      userRole: profile.role, 
      userEmail: user?.email,
      profileId: profile.id
    })
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#FFFFF0',
          gap: 3
        }}
      >
        <Typography variant="h6" color="error">
          접근 권한이 없습니다.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {requiredRole === 'principal' ? '원장님만 접근할 수 있습니다.' : 
           requiredRole === 'admin' ? '관리자만 접근할 수 있습니다.' : 
           '선생님만 접근할 수 있습니다.'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          현재 역할: {profile.role} | 요구 역할: {requiredRole}
        </Typography>
      </Box>
    )
  }

  // 허용된 역할 목록 확인
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#FFFFF0',
          gap: 3
        }}
      >
        <Typography variant="h6" color="error">
          접근 권한이 없습니다.
        </Typography>
      </Box>
    )
  }

  return <>{children}</>
} 