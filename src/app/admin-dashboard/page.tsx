'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import UserHeader from '../../../components/layout/UserHeader';

// Icons
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

interface Teacher {
  id: string;
  email: string;
  full_name: string;
  school_name: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  joinDate: string;
  status: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, signOut, user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalPrincipals: 0,
    totalReports: 0
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 디버깅을 위한 useEffect
  useEffect(() => {
    console.log('🏛️ AdminDashboard 마운트됨')
    console.log('👤 사용자:', user?.email)
    console.log('📋 프로필:', profile)
    console.log('📋 프로필 역할:', profile?.role)
    console.log('⏳ Auth 로딩:', authLoading)
    // window 객체 사용 시 클라이언트에서만 실행되도록 수정
    if (typeof window !== 'undefined') {
      console.log('🔄 현재 경로:', window.location.pathname)
    }
  }, [user, profile, authLoading])

  const handleSignOut = async () => {
    await signOut();
    // 로그아웃 후 auth 페이지로 리다이렉트 (클라이언트에서만 실행)
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  };

  // 교사 목록 로드
  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/teachers');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '교사 목록을 불러올 수 없습니다.');
      }

      setTeachers(result.data);
      
      // 통계 업데이트
      setStats({
        totalUsers: result.data.length + 8, // 교사 + 원장 + 관리자
        totalTeachers: result.data.length,
        totalPrincipals: 8,
        totalReports: 127
      });

      console.log(`✅ 교사 목록 로드 완료: ${result.data.length}명`);

    } catch (err) {
      console.error('교사 목록 로드 실패:', err);
      setError(err instanceof Error ? err.message : '교사 목록을 불러올 수 없습니다.');
      
      // 에러 시 기본 통계값
      setStats({
        totalUsers: 45,
        totalTeachers: 35,
        totalPrincipals: 8,
        totalReports: 127
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // 하이드레이션이 완료되지 않았거나 인증 로딩 중이면 로딩 표시
  if (!isClient || authLoading) {
    return (
      <Box
        component="div"
        sx={{
          minHeight: '100vh',
          backgroundColor: '#FFFFF0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <>
      <UserHeader />
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          backgroundColor: '#FFFFF0',
          py: 4
        }}
      >
        <Container maxWidth="lg">
          {/* 헤더 */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              🛠️ 시스템 관리자 대시보드
            </Typography>
            <Typography variant="h6" color="text.secondary">
              안녕하세요, {profile?.full_name || user?.email}님! 시스템 전체를 관리할 수 있습니다.
            </Typography>
          </Box>

          <Alert severity="success" sx={{ mb: 4 }}>
            <strong>관리자 권한으로 로그인되었습니다!</strong> 모든 시스템 기능에 접근할 수 있습니다.
          </Alert>

          {/* 통계 카드 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', bgcolor: '#e3f2fd' }}>
                <CardContent>
                  <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body1">
                    총 사용자 수
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', bgcolor: '#f3e5f5' }}>
                <CardContent>
                  <SchoolIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalTeachers}
                  </Typography>
                  <Typography variant="body1">
                    등록된 교사
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', bgcolor: '#e8f5e8' }}>
                <CardContent>
                  <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalPrincipals}
                  </Typography>
                  <Typography variant="body1">
                    등록된 원장
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', bgcolor: '#fff3e0' }}>
                <CardContent>
                  <BarChartIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalReports}
                  </Typography>
                  <Typography variant="body1">
                    분석 리포트
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 관리 메뉴 */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    👥 사용자 관리
                  </Typography>
                  <List>
                    <ListItem sx={{ cursor: 'pointer' }} onClick={() => router.push('/admin/teachers')}>
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="교사 목록 관리" 
                        secondary="등록된 교사 계정 조회 및 관리"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem sx={{ cursor: 'pointer' }} onClick={() => router.push('/admin/schools')}>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="학교 관리" 
                        secondary="등록된 학교 및 기관 관리"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    📊 시스템 분석
                  </Typography>
                  <List>
                    <ListItem sx={{ cursor: 'pointer' }} onClick={() => router.push('/admin/analytics')}>
                      <ListItemIcon>
                        <AssessmentIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="전체 분석 데이터" 
                        secondary="모든 수업 분석 결과 및 통계"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem sx={{ cursor: 'pointer' }} onClick={() => router.push('/admin/reports')}>
                      <ListItemIcon>
                        <BarChartIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="시스템 리포트" 
                        secondary="사용량, 성능, 오류 리포트"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    ⚙️ 시스템 설정
                  </Typography>
                  <List>
                    <ListItem sx={{ cursor: 'pointer' }} onClick={() => router.push('/admin/settings')}>
                      <ListItemIcon>
                        <SettingsIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="시스템 환경설정" 
                        secondary="API 키, 서버 설정, 보안 설정 관리"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 현재 권한 정보 */}
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🔐 현재 권한 정보
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="비디오 업로드" color="primary" />
                <Chip label="모든 리포트 조회" color="primary" />
                <Chip label="사용자 관리" color="primary" />
                <Chip label="시스템 관리" color="error" />
                <Chip label="분석 데이터 조회" color="primary" />
              </Box>
            </CardContent>
          </Card>

          {/* 등록된 교사 목록 */}
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                👨‍🏫 등록된 교사 목록
                <Chip 
                  label={`${teachers.length}명`} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 2 }} 
                />
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>교사 목록을 불러오는 중...</Typography>
                </Box>
              ) : teachers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    등록된 교사가 없습니다
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>교사명</strong></TableCell>
                        <TableCell><strong>이메일</strong></TableCell>
                        <TableCell><strong>학교</strong></TableCell>
                        <TableCell><strong>전화번호</strong></TableCell>
                        <TableCell><strong>가입일</strong></TableCell>
                        <TableCell><strong>상태</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teachers.slice(0, 10).map((teacher) => (
                        <TableRow key={teacher.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon color="primary" />
                              <Typography variant="body1" fontWeight="medium">
                                {teacher.full_name || '이름 없음'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {teacher.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SchoolIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {teacher.school_name || '미등록'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {teacher.phone_number || '미등록'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarTodayIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {teacher.joinDate}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="활성"
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {teachers.length > 10 && (
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => router.push('/admin/teachers')}
                    startIcon={<PeopleIcon />}
                  >
                    전체 교사 목록 보기 ({teachers.length}명)
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* 로그아웃 버튼 */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleSignOut}
            >
              관리자 로그아웃
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
} 