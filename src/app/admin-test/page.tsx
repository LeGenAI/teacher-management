'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminTestPage() {
  const router = useRouter();
  const { user, profile, signIn, loading } = useAuth();
  const [email, setEmail] = useState('admin@teacher-system.com');
  const [password, setPassword] = useState('Admin123!@#');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginLoading(true);
    setError(null);
    
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      // 어드민 로그인 성공 시 어드민 대시보드로 이동
      setTimeout(() => {
        router.push('/admin-dashboard');
      }, 2000);
    }
  }, [profile, router]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ pt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>로딩 중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ pt: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            🔧 어드민 계정 테스트
          </Typography>
          
          {!user && (
            <>
              <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
                Supabase에 생성한 어드민 계정으로 로그인해보세요
              </Typography>

              <TextField
                fullWidth
                label="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
              />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleLogin}
                disabled={loginLoading}
                sx={{ mb: 2 }}
              >
                {loginLoading ? <CircularProgress size={24} /> : '어드민 로그인 테스트'}
              </Button>
            </>
          )}

          {user && profile && (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ 어드민 계정 로그인 성공!
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                사용자 정보:
              </Typography>
              <Box sx={{ textAlign: 'left', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography><strong>이메일:</strong> {profile.email}</Typography>
                <Typography><strong>이름:</strong> {profile.full_name}</Typography>
                <Typography><strong>역할:</strong> {profile.role}</Typography>
                <Typography><strong>학교:</strong> {profile.school_name}</Typography>
                <Typography><strong>권한:</strong></Typography>
                <ul>
                  <li>비디오 업로드: ✅</li>
                  <li>모든 리포트 조회: ✅</li>
                  <li>사용자 관리: ✅</li>
                  <li>시스템 관리: ✅</li>
                  <li>분석 데이터 조회: ✅</li>
                </ul>
              </Box>

              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                2초 후 메인 페이지로 이동합니다...
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/')}
            sx={{ mt: 2 }}
          >
            메인 페이지로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
} 