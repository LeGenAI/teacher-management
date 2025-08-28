'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Pagination,
  Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import UserHeader from '../../components/layout/UserHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import BarChartIcon from '@mui/icons-material/BarChart';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

const fadeAnimation = keyframes`
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
`;

const StyledCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
`;

const GradientBackground = styled(Box)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E");
  }
`;

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const lessonsPerPage = 3;
  const [lessons, setLessons] = useState([
    {
      id: 1,
      title: '분수의 개념과 덧셈',
      date: '2024-01-15',
      status: 'completed',
      score: 92,
      duration: '45분',
      reportId: 'report_001'
    },
    {
      id: 2,
      title: '곱셈과 나눗셈의 관계',
      date: '2024-01-12',
      status: 'completed',
      score: 88,
      duration: '40분',
      reportId: 'report_002'
    },
    {
      id: 3,
      title: '도형의 넓이 구하기',
      date: '2024-01-10',
      status: 'completed',
      score: 85,
      duration: '42분',
      reportId: 'report_007'
    },
    {
      id: 4,
      title: '소수의 이해와 활용',
      date: '2024-01-08',
      status: 'completed',
      score: 95,
      duration: '50분',
      reportId: 'report_003'
    },
    {
      id: 5,
      title: '평면도형의 특성',
      date: '2024-01-05',
      status: 'completed',
      score: 87,
      duration: '43분',
      reportId: 'report_004'
    },
    {
      id: 6,
      title: '분모가 다른 분수의 덧셈',
      date: '2024-01-03',
      status: 'completed',
      score: 91,
      duration: '48분',
      reportId: 'report_005'
    },
    {
      id: 7,
      title: '원의 둘레와 넓이',
      date: '2024-01-01',
      status: 'completed',
      score: 89,
      duration: '46분',
      reportId: 'report_006'
    }
  ]);

  useEffect(() => {
    setMounted(true);
    
    // localStorage에서 완료된 리포트 목록 로드
    const loadSavedReports = () => {
      if (typeof window !== 'undefined' && profile?.full_name) {
        const savedReports = localStorage.getItem(`reports_${profile.full_name}`);
        if (savedReports) {
          try {
            const parsedReports = JSON.parse(savedReports);
            setLessons(parsedReports);
          } catch (error) {
            console.error('Failed to load saved reports:', error);
          }
        }
      }
    };
    
    if (profile?.full_name) {
      loadSavedReports();
    }
  }, [profile?.full_name]);

  if (!mounted) {
    return null;
  }

  // 비디오 재생 시간 추출 함수
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('비디오 메타데이터를 읽을 수 없습니다.'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // 초를 분:초 형태로 변환하는 함수
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 타입 검증
      const allowedVideoTypes = [
        'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
        'video/x-msvideo', 'video/webm', 'video/ogg'
      ];
      
      const fileName = file.name.toLowerCase();
      const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg'];
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!allowedVideoTypes.includes(file.type) || !hasValidExtension) {
        alert(`지원하지 않는 파일 형식입니다.\n비디오 파일(MP4, MOV, AVI 등)만 업로드 가능합니다.\n\n선택된 파일: ${file.name}\n파일 타입: ${file.type}`);
        // 파일 입력 필드 초기화
        event.target.value = '';
        return;
      }
      
      // 파일 크기 검증 (500MB 제한)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        alert(`파일 크기가 너무 큽니다.\n최대 500MB까지 업로드 가능합니다.\n\n선택된 파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        event.target.value = '';
        return;
      }
      
      try {
        // 비디오 재생 시간 추출
        const duration = await getVideoDuration(file);
        console.log(`비디오 재생 시간: ${formatDuration(duration)}`);
        
        // 파일 객체에 duration 정보 추가 (확장된 파일 객체 생성)
        const fileWithDuration = Object.assign(file, { 
          videoDuration: duration,
          formattedDuration: formatDuration(duration)
        });
        
        setSelectedFile(fileWithDuration);
      } catch (error) {
        console.warn('비디오 재생 시간을 가져올 수 없습니다:', error);
        // 재생 시간을 가져올 수 없어도 파일 선택은 계속 진행
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 수업 제목이 없으면 파일명 사용 (확장자 제거)
      const finalTitle = lessonTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, "");
      
      setUploadProgress(10);
      
      // FormData 생성 - teacherId는 로그인한 사용자 이름으로 설정
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('teacherId', profile?.full_name || 'Unknown Teacher'); // 로그인한 사용자 이름으로 폴더 생성
      formData.append('title', finalTitle); // 수업 제목 추가

      setUploadProgress(30);

              // 원본 분석 API 호출 (기존 AssemblyAI + GPT 파이프라인)
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

      setUploadProgress(70);

      if (!response.ok) {
        // 서버 에러 응답에서 상세 메시지 추출
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || '업로드 실패');
        } catch (parseError) {
          throw new Error(`업로드 실패 (HTTP ${response.status})`);
        }
      }

      const result = await response.json();
      setUploadProgress(90);

      console.log('✅ 분석 API 응답:', result);

      // 새 수업 추가 (원본 API 응답 형식에 맞게)
      const actualDuration = (selectedFile as any).formattedDuration || '45:00';
      const newLesson = {
        id: lessons.length + 1,
        title: finalTitle,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        score: 85, // 기본 점수 (실제 점수는 분석 결과에서 계산)
        duration: actualDuration, // 실제 비디오 재생 시간
        fileSize: selectedFile.size, // 파일 크기는 별도 필드로 저장
        reportId: result.reportId || Date.now().toString() // 원본 API는 reportId를 반환
      };

      setLessons(prev => {
        const updatedLessons = [newLesson, ...prev];
        
        // localStorage에 저장
        if (typeof window !== 'undefined' && profile?.full_name) {
          localStorage.setItem(`reports_${profile.full_name}`, JSON.stringify(updatedLessons));
        }
        
        return updatedLessons;
      });
      setUploadProgress(100);
      
      // 다이얼로그 닫기
      setTimeout(() => {
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setLessonTitle('');
      }, 500);
      
    } catch (error) {
      console.error('Upload failed:', error);
      
      // 에러 메시지 파싱 및 사용자 친화적 메시지 표시
      let errorMessage = '업로드 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        if (error.message.includes('지원하지 않는 파일')) {
          errorMessage = error.message;
        } else if (error.message.includes('업로드 실패')) {
          errorMessage = '서버에서 파일 처리 중 오류가 발생했습니다.\n비디오 파일인지 확인해주세요.';
        } else {
          errorMessage = `업로드 중 오류가 발생했습니다:\n${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleViewReport = (reportId: string) => {
    // 로그인한 사용자 이름으로 리포트 접근
    const teacherId = profile?.full_name || 'Unknown Teacher';
    router.push(`/reports/${teacherId}/${reportId}`);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // 페이지네이션을 위한 데이터 계산
  const totalPages = Math.ceil(lessons.length / lessonsPerPage);
  const startIndex = (currentPage - 1) * lessonsPerPage;
  const currentLessons = lessons.slice(startIndex, startIndex + lessonsPerPage);

  const averageScore = lessons
    .filter(lesson => lesson.status === 'completed' && lesson.score)
    .reduce((sum, lesson) => sum + (lesson.score || 0), 0) / 
    lessons.filter(lesson => lesson.status === 'completed').length;

  const completedLessons = lessons.filter(lesson => lesson.status === 'completed').length;
  const analyzingLessons = lessons.filter(lesson => lesson.status === 'analyzing').length;

  return (
          <ProtectedRoute allowedRoles={['teacher', 'principal', 'admin']}>
      <UserHeader />
      <GradientBackground>
        <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
          {/* 헤더 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                <SchoolIcon fontSize="large" />
              </Avatar>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                {profile?.full_name || '선생님'} 대시보드
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                수업 분석 및 성과 관리
              </Typography>
            </Box>
          </motion.div>

          {/* 통계 카드들 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <StyledCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4CAF50, #45a049)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                    <AssessmentIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {completedLessons}
                    </Typography>
                    <Typography variant="body2">
                      완료된 수업
                    </Typography>
                  </CardContent>
                </Card>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={3}>
              <StyledCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2196F3, #1976D2)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                    <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {averageScore ? Math.round(averageScore) : '-'}
                    </Typography>
                    <Typography variant="body2">
                      평균 점수
                    </Typography>
                  </CardContent>
                </Card>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={3}>
              <StyledCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #FF9800, #F57C00)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                    <PendingIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {analyzingLessons}
                    </Typography>
                    <Typography variant="body2">
                      분석 중
                    </Typography>
                  </CardContent>
                </Card>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={3}>
              <StyledCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)' }}>
                  <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                    <StarIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      A+
                    </Typography>
                    <Typography variant="body2">
                      종합 등급
                    </Typography>
                  </CardContent>
                </Card>
              </StyledCard>
            </Grid>
          </Grid>

          {/* 메인 콘텐츠 */}
          <Grid container spacing={3}>
            {/* 수업 업로드 섹션 */}
            <Grid item xs={12} md={4}>
              <StyledCard
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <VideoLibraryIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        새 수업 업로드
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        수업 영상을 업로드하여 AI 분석을 받아보세요
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => setUploadDialogOpen(true)}
                      sx={{
                        width: '100%',
                        py: 2,
                        borderRadius: 3,
                        background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1976D2, #1CB5E0)',
                        }
                      }}
                    >
                      수업 영상 업로드
                    </Button>
                  </CardContent>
                </Card>
              </StyledCard>
            </Grid>

            {/* 수업 목록 */}
            <Grid item xs={12} md={8}>
              <StyledCard
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <BarChartIcon sx={{ fontSize: 30, color: 'primary.main', mr: 2 }} />
                      <Typography variant="h5" fontWeight="bold">
                        수업 분석 결과
                      </Typography>
                    </Box>

                    <List>
                      {currentLessons.map((lesson, index) => (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <ListItem
                            sx={{
                              border: '1px solid #e0e0e0',
                              borderRadius: 2,
                              mb: 2,
                              '&:hover': {
                                backgroundColor: '#f5f5f5'
                              }
                            }}
                          >
                            <ListItemIcon>
                              <PlayCircleOutlineIcon color="primary" />
                            </ListItemIcon>
                            
                            <ListItemText
                              primary={lesson.title}
                              secondary={`날짜: ${lesson.date} | 시간: ${lesson.duration}`}
                            />
                            
                            <ListItemSecondaryAction>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewReport(lesson.reportId)}
                                sx={{
                                  borderRadius: 3,
                                  textTransform: 'none',
                                  fontWeight: 'bold'
                                }}
                              >
                                보고서 보기
                              </Button>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </motion.div>
                      ))}
                    </List>

                    {/* 페이지네이션 */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination 
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton 
                        showLastButton
                      />
                    </Box>
                  </CardContent>
                </Card>
              </StyledCard>
            </Grid>
          </Grid>
        </Container>
      </GradientBackground>

      {/* 업로드 다이얼로그 */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CloudUploadIcon sx={{ mr: 2, color: 'primary.main' }} />
            수업 영상 업로드
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            label="수업 제목 (선택사항)"
            placeholder="비워두면 파일명이 제목으로 사용됩니다"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            margin="normal"
            disabled={uploading}
            helperText={selectedFile && !lessonTitle.trim() ? 
              `제목: ${selectedFile.name.replace(/\.[^/.]+$/, "")}` : 
              ""
            }
          />
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="video-upload"
              disabled={uploading}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<VideoLibraryIcon />}
                disabled={uploading}
                sx={{ width: '100%', py: 2 }}
              >
                {selectedFile ? selectedFile.name : '영상 파일 선택'}
              </Button>
            </label>
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                업로드 진행률: {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {selectedFile && (
            <Alert severity="info" sx={{ mt: 2 }}>
              파일 크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              {(selectedFile as any).formattedDuration && (
                <>
                  <br />
                  재생 시간: {(selectedFile as any).formattedDuration}
                </>
              )}
              <br />
              예상 분석 시간: 5-10분
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setUploadDialogOpen(false)} 
            disabled={uploading}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {uploading ? '업로드 중...' : '업로드 시작'}
          </Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
}
