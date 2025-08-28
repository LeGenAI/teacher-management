'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Avatar, 
  Chip, 
  Tooltip,
  Container,
  LinearProgress,
  Paper,
  Divider
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AnalysisIcon from '@mui/icons-material/Assessment';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

type EvaluationScores = {
  round: number;
  date: string;
  totalScore: number;
  categoryScores: {
    teachingSkill: number;
    studentEngagement: number;
    contentDelivery: number;
    classroomManagement: number;
    feedback: number;
  };
};

// 임시 평가 데이터 생성 함수
const generateMockEvaluationData = (teacherName: string): EvaluationScores[] => {
  const baseScore = 80 + Math.random() * 15; // 80-95 사이 기본 점수
  
  return [
    {
      round: 1,
      date: '2024-01-15',
      totalScore: Math.round(baseScore),
      categoryScores: {
        teachingSkill: Math.round(baseScore + Math.random() * 10 - 5),
        studentEngagement: Math.round(baseScore + Math.random() * 10 - 5),
        contentDelivery: Math.round(baseScore + Math.random() * 10 - 5),
        classroomManagement: Math.round(baseScore + Math.random() * 10 - 5),
        feedback: Math.round(baseScore + Math.random() * 10 - 5)
      }
    },
    {
      round: 2,
      date: '2024-01-22',
      totalScore: Math.round(baseScore + 2),
      categoryScores: {
        teachingSkill: Math.round(baseScore + 2 + Math.random() * 8 - 4),
        studentEngagement: Math.round(baseScore + 2 + Math.random() * 8 - 4),
        contentDelivery: Math.round(baseScore + 2 + Math.random() * 8 - 4),
        classroomManagement: Math.round(baseScore + 2 + Math.random() * 8 - 4),
        feedback: Math.round(baseScore + 2 + Math.random() * 8 - 4)
      }
    },
    {
      round: 3,
      date: '2024-01-29',
      totalScore: Math.round(baseScore + 4),
      categoryScores: {
        teachingSkill: Math.round(baseScore + 4 + Math.random() * 6 - 3),
        studentEngagement: Math.round(baseScore + 4 + Math.random() * 6 - 3),
        contentDelivery: Math.round(baseScore + 4 + Math.random() * 6 - 3),
        classroomManagement: Math.round(baseScore + 4 + Math.random() * 6 - 3),
        feedback: Math.round(baseScore + 4 + Math.random() * 6 - 3)
      }
    }
  ];
};

export default function TeacherEvaluation() {
  const router = useRouter();
  const pathname = usePathname();
  const teacherId = decodeURIComponent(pathname.split('/').pop() as string);
  const [evaluationData, setEvaluationData] = useState<EvaluationScores[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 임시 데이터 생성
    const mockData = generateMockEvaluationData(teacherId);
    setEvaluationData(mockData);
    setLoading(false);
  }, [teacherId]);

  // 총점 차트 데이터
  const getTotalScoreData = () => {
    return evaluationData.map(data => ({
      round: `${data.round}회차`,
      총점: data.totalScore,
      date: data.date
    }));
  };

  // 영역별 점수 차트 데이터
  const getCategoryScoreData = () => {
    return evaluationData.map(data => ({
      round: `${data.round}회차`,
      '교수 능력': data.categoryScores.teachingSkill,
      '학생 참여도': data.categoryScores.studentEngagement,
      '내용 전달력': data.categoryScores.contentDelivery,
      '수업 운영': data.categoryScores.classroomManagement,
      '피드백': data.categoryScores.feedback
    }));
  };

  // 레이더 차트 데이터 (최신 평가 기준)
  const getRadarData = () => {
    if (evaluationData.length === 0) return [];
    
    const latestData = evaluationData[evaluationData.length - 1];
    return [
      { subject: '교수 능력', score: latestData.categoryScores.teachingSkill, fullMark: 100 },
      { subject: '학생 참여도', score: latestData.categoryScores.studentEngagement, fullMark: 100 },
      { subject: '내용 전달력', score: latestData.categoryScores.contentDelivery, fullMark: 100 },
      { subject: '수업 운영', score: latestData.categoryScores.classroomManagement, fullMark: 100 },
      { subject: '피드백', score: latestData.categoryScores.feedback, fullMark: 100 }
    ];
  };

  // 평균 점수 계산
  const getAverageScore = () => {
    if (evaluationData.length === 0) return 0;
    const total = evaluationData.reduce((sum, data) => sum + data.totalScore, 0);
    return Math.round(total / evaluationData.length);
  };

  // 성장률 계산
  const getGrowthRate = () => {
    if (evaluationData.length < 2) return 0;
    const first = evaluationData[0].totalScore;
    const latest = evaluationData[evaluationData.length - 1].totalScore;
    return Math.round(((latest - first) / first) * 100);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">로딩 중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<HomeIcon />}
          onClick={() => router.push('/admin-dashboard')}
          sx={{ mb: 2 }}
        >
          관리자 대시보드로 돌아가기
        </Button>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {teacherId} 선생님
              </Typography>
              <Typography variant="h6" color="text.secondary">
                교육 성과 분석 보고서
              </Typography>
              <Chip 
                label={`평균 점수: ${getAverageScore()}점`} 
                color="primary" 
                sx={{ mt: 1 }} 
              />
              <Chip 
                label={`성장률: +${getGrowthRate()}%`} 
                color="success" 
                sx={{ mt: 1, ml: 1 }} 
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <CardContent>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {evaluationData.length}
              </Typography>
              <Typography variant="body1">
                총 평가 횟수
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#e8f5e8' }}>
            <CardContent>
              <AnalysisIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {getAverageScore()}
              </Typography>
              <Typography variant="body1">
                평균 점수
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#fff3e0' }}>
            <CardContent>
              <SmartToyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {evaluationData.length > 0 ? evaluationData[evaluationData.length - 1].totalScore : 0}
              </Typography>
              <Typography variant="body1">
                최신 점수
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#fce4ec' }}>
            <CardContent>
              <SchoolIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                A+
              </Typography>
              <Typography variant="body1">
                종합 등급
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 차트 영역 */}
      <Grid container spacing={3}>
        {/* 총점 추이 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 총점 추이
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getTotalScoreData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="총점" 
                    stroke="#2196f3" 
                    strokeWidth={3}
                    dot={{ fill: '#2196f3', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 영역별 점수 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📊 영역별 점수 비교
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCategoryScoreData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="교수 능력" fill="#8884d8" />
                  <Bar dataKey="학생 참여도" fill="#82ca9d" />
                  <Bar dataKey="내용 전달력" fill="#ffc658" />
                  <Bar dataKey="수업 운영" fill="#ff7300" />
                  <Bar dataKey="피드백" fill="#e91e63" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 레이더 차트 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🎯 최신 평가 분석 (레이더 차트)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="점수"
                    dataKey="score"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 상세 평가 내역 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📋 평가 내역
              </Typography>
              {evaluationData.map((data, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {data.round}회차 평가 ({data.date})
                  </Typography>
                  <Typography variant="h6" color="primary.main" sx={{ mb: 1 }}>
                    총점: {data.totalScore}점
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">교수 능력: {data.categoryScores.teachingSkill}점</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.categoryScores.teachingSkill} 
                      sx={{ mb: 0.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">학생 참여도: {data.categoryScores.studentEngagement}점</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.categoryScores.studentEngagement} 
                      sx={{ mb: 0.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">내용 전달력: {data.categoryScores.contentDelivery}점</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.categoryScores.contentDelivery} 
                      sx={{ mb: 0.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">수업 운영: {data.categoryScores.classroomManagement}점</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.categoryScores.classroomManagement} 
                      sx={{ mb: 0.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">피드백: {data.categoryScores.feedback}점</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.categoryScores.feedback} 
                      sx={{ mb: 0.5 }}
                    />
                  </Box>
                  
                  {index < evaluationData.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI 분석 요약 */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🤖 AI 분석 요약
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                  🌟 주요 강점
                </Typography>
                <Typography variant="body2">
                  • 학생 참여도가 지속적으로 높음<br/>
                  • 체계적인 수업 운영 능력 우수<br/>
                  • 개념 설명이 명확하고 이해하기 쉬움
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                  💡 개선 권장사항
                </Typography>
                <Typography variant="body2">
                  • 다양한 교수법 도입 고려<br/>
                  • 개별 학생 피드백 강화<br/>
                  • 실습 활동 비중 증대
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: '#e8f5e8', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                  📈 성장 추이
                </Typography>
                <Typography variant="body2">
                  • 전반적인 점수가 상승 추세<br/>
                  • 특히 수업 운영 능력 향상 눈에 띔<br/>
                  • 지속적인 자기계발 의지 확인
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
} 