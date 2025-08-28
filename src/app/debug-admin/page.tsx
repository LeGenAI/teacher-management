'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Alert,
  TextField,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { createSupabaseBrowserClient, Profile } from '../../../lib/supabase';

export default function DebugAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [adminProfiles, setAdminProfiles] = useState<Profile[]>([]);
  const [testEmail, setTestEmail] = useState('admin@test.com');
  const [testPassword, setTestPassword] = useState('123456');
  const supabase = createSupabaseBrowserClient();

  // 관리자 프로필 조회
  const checkAdminProfiles = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🔍 관리자 프로필 조회 시작...');
      
      // 1. profiles 테이블에서 admin 역할 조회
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin');

      let resultText = '=== 관리자 프로필 조회 결과 ===\n';
      
      if (profileError) {
        resultText += `❌ 프로필 조회 실패: ${profileError.message}\n`;
      } else {
        resultText += `✅ 프로필 조회 성공\n`;
        resultText += `📊 관리자 계정 수: ${profiles?.length || 0}개\n\n`;
        
        if (profiles && profiles.length > 0) {
          profiles.forEach((profile, index) => {
            resultText += `관리자 ${index + 1}:\n`;
            resultText += `  - ID: ${profile.id}\n`;
            resultText += `  - 이메일: ${profile.email}\n`;
            resultText += `  - 이름: ${profile.full_name}\n`;
            resultText += `  - 역할: ${profile.role}\n`;
            resultText += `  - 학교: ${profile.school_name}\n`;
            resultText += `  - 전화번호: ${profile.phone_number}\n`;
            resultText += `  - 생성일: ${profile.created_at}\n\n`;
          });
          setAdminProfiles(profiles);
        } else {
          resultText += '⚠️ 관리자 프로필이 없습니다.\n\n';
        }
      }

      // 2. 모든 프로필 조회 (역할별 통계)
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('role');

      if (!allError && allProfiles) {
        const roleStats = allProfiles.reduce((acc: Record<string, number>, profile) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1;
          return acc;
        }, {});

        resultText += '=== 전체 사용자 통계 ===\n';
        Object.entries(roleStats).forEach(([role, count]) => {
          resultText += `${role}: ${count}명\n`;
        });
      }

      setResult(resultText);
      
    } catch (error) {
      console.error('💥 관리자 조회 중 오류:', error);
      setResult(`💥 예상치 못한 오류: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // 관리자 로그인 테스트
  const testAdminLogin = async () => {
    setLoading(true);
    
    try {
      console.log('🔐 관리자 로그인 테스트 시작...');
      
      let resultText = '=== 관리자 로그인 테스트 ===\n';
      resultText += `테스트 이메일: ${testEmail}\n`;
      resultText += `테스트 비밀번호: ${testPassword}\n\n`;

      // 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (error) {
        resultText += `❌ 로그인 실패: ${error.message}\n`;
      } else if (data.user) {
        resultText += `✅ 로그인 성공!\n`;
        resultText += `사용자 ID: ${data.user.id}\n`;
        resultText += `이메일: ${data.user.email}\n`;
        
        // 프로필 조회
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          resultText += `⚠️ 프로필 조회 실패: ${profileError.message}\n`;
        } else if (profile) {
          resultText += `\n프로필 정보:\n`;
          resultText += `  - 이름: ${profile.full_name}\n`;
          resultText += `  - 역할: ${profile.role}\n`;
          resultText += `  - 학교: ${profile.school_name}\n`;
        }

        // 로그아웃
        await supabase.auth.signOut();
        resultText += `\n✅ 테스트 완료 후 로그아웃\n`;
      }

      setResult(prev => prev + '\n\n' + resultText);
      
    } catch (error) {
      console.error('💥 로그인 테스트 중 오류:', error);
      setResult(prev => prev + `\n\n💥 로그인 테스트 오류: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminProfiles();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          🔧 관리자 계정 디버그
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Supabase 데이터베이스의 관리자 계정을 확인하고 로그인을 테스트합니다.
        </Alert>

        {/* 관리자 프로필 테이블 */}
        {adminProfiles.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 등록된 관리자 계정
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>이메일</strong></TableCell>
                      <TableCell><strong>이름</strong></TableCell>
                      <TableCell><strong>역할</strong></TableCell>
                      <TableCell><strong>학교</strong></TableCell>
                      <TableCell><strong>생성일</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminProfiles.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>{admin.full_name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={admin.role} 
                            color="error" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{admin.school_name || '미설정'}</TableCell>
                        <TableCell>
                          {new Date(admin.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* 로그인 테스트 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔐 관리자 로그인 테스트
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                label="이메일"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="비밀번호"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <Button 
                variant="contained" 
                onClick={testAdminLogin}
                disabled={loading}
              >
                로그인 테스트
              </Button>
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>일반적인 관리자 계정:</strong><br/>
              • admin@teacher-system.com (스크립트로 생성)<br/>
              • admin@test.com (테스트용)
            </Alert>
          </CardContent>
        </Card>

        {/* 액션 버튼들 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button 
            variant="contained" 
            onClick={checkAdminProfiles}
            disabled={loading}
          >
            관리자 프로필 새로고침
          </Button>
        </Box>

        {/* 결과 표시 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 조회 결과
            </Typography>
            
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography>처리 중...</Typography>
              </Box>
            )}
            
            <Box 
              component="pre" 
              sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflow: 'auto'
              }}
            >
              {result || '결과가 여기에 표시됩니다...'}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
} 