'use client'

import React from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent,
  Button,
  Avatar,
  Chip
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'
import UserHeader from '../../../components/layout/UserHeader'
import SchoolIcon from '@mui/icons-material/School'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import PeopleIcon from '@mui/icons-material/People'
import AssessmentIcon from '@mui/icons-material/Assessment'

export default function PrincipalDashboard() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth')
  }

  const handleGoToTeachers = () => {
    router.push('/')
  }

  return (
    <ProtectedRoute allowedRoles={['principal', 'admin']}>
      <UserHeader />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#FFFFF0',
          py: 4
        }}
      >
        <Container maxWidth="lg">
          {/* 헤더 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
              p: 3,
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <SchoolIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" className="font-sogang">
                  원장님 대시보드
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {profile?.full_name || profile?.email}님, 안녕하세요!
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label="원장님" 
                color="primary" 
                variant="filled"
                sx={{ fontWeight: 'bold' }}
              />
              <Button 
                variant="outlined" 
                onClick={handleSignOut}
                sx={{ borderRadius: 2 }}
              >
                로그아웃
              </Button>
            </Box>
          </Box>

          {/* 메인 콘텐츠 */}
          <Grid container spacing={3}>
            {/* 교사 관리 카드 */}
            <Grid item xs={12} md={6} lg={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
                onClick={handleGoToTeachers}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <PeopleIcon 
                    sx={{ 
                      fontSize: 60, 
                      color: 'primary.main', 
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    교사 관리
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    선생님들의 수업 분석 결과를 확인하고 관리하세요
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large"
                    sx={{ borderRadius: 2 }}
                  >
                    교사 목록 보기
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* 전체 분석 현황 카드 */}
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <AnalyticsIcon 
                    sx={{ 
                      fontSize: 60, 
                      color: 'success.main', 
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    분석 현황
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    전체 학교의 수업 분석 통계를 확인하세요
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="large"
                    sx={{ borderRadius: 2 }}
                    disabled
                  >
                    준비 중
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* 종합 리포트 카드 */}
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <AssessmentIcon 
                    sx={{ 
                      fontSize: 60, 
                      color: 'warning.main', 
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    종합 리포트
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    학교 전체의 교육 품질 종합 리포트를 생성하세요
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="large"
                    sx={{ borderRadius: 2 }}
                    disabled
                  >
                    준비 중
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* 안내 메시지 */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'info.light',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'info.main'
                }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  🎓 원장님 권한 안내
                </Typography>
                <Typography variant="body1">
                  • <strong>교사 관리:</strong> 모든 선생님들의 수업 분석 결과를 확인하고 관리할 수 있습니다<br/>
                  • <strong>전체 현황:</strong> 학교 전체의 교육 품질 현황을 한눈에 파악할 수 있습니다<br/>
                  • <strong>종합 리포트:</strong> 정기적인 교육 품질 개선 리포트를 생성할 수 있습니다
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ProtectedRoute>
  )
} 