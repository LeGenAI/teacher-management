'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  Avatar,
  Chip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import Confetti from 'react-confetti';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const fadeAnimation = keyframes`
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
`;

const subtleFloatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const StyledCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.4s cubic-beㅁzier(0.4, 0, 0.2, 1);
  height: 700px;
  width: 400px;
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  }
`;

const ProfileAvatar = styled(Avatar)`
  animation: ${subtleFloatAnimation} 4s ease-in-out infinite;
`;

const ProfessionalButton = styled(Button)`
  background: linear-gradient(135deg, #2C3E50, #3498DB);
  color: #fff;
  font-weight: 500;
  letter-spacing: 0.5px;
  
  &:hover {
    background: linear-gradient(135deg, #34495E, #2980B9);
    transform: translateY(-2px);
  }
`;

export default function TeacherSelection() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [lessonsStatus, setLessonsStatus] = useState<Record<number, { status: string; reportId: string | null; date: string | null; }>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      const storedStatus = localStorage.getItem(`lessons_status_${selectedTeacher}`);
      if (storedStatus) {
        setLessonsStatus(JSON.parse(storedStatus));
      } else {
        // 초기 상태 설정 (1회차만 언락)
        setLessonsStatus({
          1: { status: 'unlocked', reportId: null, date: null }
        });
      }
    }
  }, [selectedTeacher]);

  const teachers = [
    {
      id: 1,
      name: 'Jasmine',
      subject: '초등 수학',
      experience: '5년',
      specialty: '수학적 사고력 향상, 개념 이해 중심 교육',
      description: '체계적인 커리큘럼으로 수학의 기초를 탄탄히 다집니다.',
      imageUrl: '/images/jasmine.png',
      color: '#2C3E50',
      aiScore: '93.5%',
      aiStrengths: ['체계적인 개념 설명', '실생활 예시 활용']
    },
    {
      id: 2, 
      name: 'Kami',
      subject: '초등 수학',
      experience: '7년',
      specialty: '문제해결력 향상, 논리적 사고 개발',
      description: '개별 맞춤형 학습으로 수학적 잠재력을 극대화합니다.',
      imageUrl: '/images/kami.png',
      color: '#34495E',
      aiScore: '95.2%',
      aiStrengths: ['맞춤형 학습 설계', '논리적 사고 훈련']
    }
  ];

  const handleTeacherClick = (teacherId: number) => {
    const teacherName = teacherId === 1 ? 'jasmine' : 'kami';
    router.push(`/teachers/${teacherName}`);
  };

  const handleConsultClick = () => {
    router.push('/QnA');
  };

  const handleLessonClick = (lessonNumber: number) => {
    if (!selectedTeacher) {
      alert('선생님을 먼저 선택해주세요.');
      return;
    }

    const lessonStatus = lessonsStatus[lessonNumber];
    if (!lessonStatus || lessonStatus.status === 'locked') {
      return;
    }

    if (lessonStatus.status === 'completed' && lessonStatus.reportId) {
      router.push(`/reports/${selectedTeacher}/${lessonStatus.reportId}`);
    } else {
      router.push(`/reports/${selectedTeacher}/analyze`);
    }
  };

  const getLessonButtonStyle = (lessonNumber: number) => {
    const status = lessonsStatus[lessonNumber]?.status;
    
    if (status === 'completed') {
      return {
        backgroundColor: '#4CAF50',
        color: 'white',
        '&:hover': {
          backgroundColor: '#45a049',
        }
      };
    }
    
    if (status === 'unlocked') {
      return {
        backgroundColor: '#2196F3',
        color: 'white',
        '&:hover': {
          backgroundColor: '#1976D2',
        }
      };
    }
    
    return {
      backgroundColor: '#9E9E9E',
      color: 'white',
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: '#9E9E9E',
      }
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <Container 
      maxWidth={false} 
      className="page-container"
      sx={{ 
        py: 8,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#FFFFF0',
        maxWidth: '100%',
        padding: '0 !important',
      }}
    >
      <Container maxWidth="lg" sx={{ height: '100%', pt: 4 }}>
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            align="center" 
            className="font-sogang"
            sx={{ 
              mb: 2,
              color: '#2C3E50',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}
          >
            수학 교육의 새로운 패러다임
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 6 }}>
            <Chip
              icon={<SmartToyIcon />}
              label="AI 기반 교사 평가 시스템"
              color="primary"
              className="font-sogang"
            />
            <Chip
              icon={<PsychologyIcon />}
              label="실시간 수업 분석"
              color="secondary"
              className="font-sogang"
            />
          </Box>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={6} justifyContent="center">
            {teachers.map((teacher, index) => (
              <Grid item key={teacher.id}>
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <StyledCard>
                    <Card sx={{ 
                      background: '#FFFFFF',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                      borderRadius: '12px',
                      overflow: 'visible',
                      height: '100%'
                    }}>
                      <Box sx={{ 
                        position: 'relative',
                        height: '300px',
                        overflow: 'hidden'
                      }}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardMedia
                            component="img"
                            height="300"
                            image={teacher.imageUrl}
                            alt={teacher.name}
                            sx={{ 
                              filter: 'brightness(0.95)',
                              borderRadius: '12px 12px 0 0',
                              objectFit: 'cover'
                            }}
                          />
                        </motion.div>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <SmartToyIcon color="primary" />
                          <Typography className="font-sogang" sx={{ fontWeight: 600 }}>
                            AI 평가 점수: {teacher.aiScore}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <CardContent sx={{ pt: 2, pb: 3 }}>
                        <Typography variant="h5" align="center" className="font-sogang" sx={{
                          fontWeight: '600',
                          color: teacher.color,
                          mb: 2
                        }}>
                          {teacher.name} 교사
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" className="font-sogang" sx={{ color: '#34495E', mb: 1 }}>
                            전문 분야: {teacher.subject}
                          </Typography>
                          <Typography variant="subtitle1" className="font-sogang" sx={{ color: '#34495E', mb: 1 }}>
                            교육 경력: {teacher.experience}
                          </Typography>
                          <Typography variant="subtitle1" className="font-sogang" sx={{ color: '#34495E', mb: 2 }}>
                            전문성: {teacher.specialty}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {teacher.aiStrengths.map((strength, idx) => (
                              <Chip 
                                key={idx}
                                label={strength}
                                size="small"
                                color="primary"
                                variant="outlined"
                                className="font-sogang"
                              />
                            ))}
                          </Box>
                          <Typography variant="body2" className="font-sogang" sx={{ 
                            mt: 2, 
                            color: '#5D6D7E',
                            lineHeight: 1.6
                          }}>
                            {teacher.description}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ flex: 1 }}
                          >
                            <ProfessionalButton 
                              variant="contained"
                              fullWidth
                              className="font-sogang"
                              onClick={() => handleTeacherClick(teacher.id)}
                              sx={{
                                py: 1.5,
                                borderRadius: '8px',
                                textTransform: 'none'
                              }}
                            >
                              상세 정보
                            </ProfessionalButton>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ flex: 1 }}
                          >
                            <ProfessionalButton 
                              variant="contained"
                              fullWidth
                              className="font-sogang"
                              onClick={handleConsultClick}
                              sx={{ 
                                py: 1.5,
                                borderRadius: '8px',
                                textTransform: 'none'
                              }}
                            >
                              상담 신청
                            </ProfessionalButton>
                          </motion.div>
                        </Box>
                      </CardContent>
                    </Card>
                  </StyledCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>
    </Container>
  );
}
