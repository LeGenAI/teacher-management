'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Grid, Card, CardContent, Typography, Box, Button, Avatar, Chip, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AnalysisIcon from '@mui/icons-material/Assessment';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
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
  ResponsiveContainer
} from 'recharts';

export type Teacher = {
  id: number;
  routeName: string;
  name: string;
  subject: string;  
  experience: string;
  specialty: string;
  description: string;
  imageUrl: string;
  color: string;
  aiScore: string;
  aiStrengths: string[];
};

export const TEACHERS: Teacher[] = [
  {
    id: 1,
    routeName: 'jasmine',
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
    routeName: 'kami',
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

type ReportStatus = {
  isCompleted: boolean;
  status: 'completed' | 'available' | 'locked';
  date?: string;
};

const reportStatuses: Record<string, Record<string, ReportStatus>> = {
  'jasmine': {
    '1': { isCompleted: true, status: 'completed', date: '2024-01-15' },
    '2': { isCompleted: true, status: 'completed', date: '2024-01-22' },
    '3': { isCompleted: false, status: 'available' },
    '4': { isCompleted: false, status: 'locked' },
    '5': { isCompleted: false, status: 'locked' },
    '6': { isCompleted: false, status: 'locked' },
    '7': { isCompleted: false, status: 'locked' },
    '8': { isCompleted: false, status: 'locked' },
    '9': { isCompleted: false, status: 'locked' }
  },
  'kami': {
    '1': { isCompleted: true, status: 'completed', date: '2024-01-16' },
    '2': { isCompleted: true, status: 'completed', date: '2024-01-23' },
    '3': { isCompleted: false, status: 'available' },
    '4': { isCompleted: false, status: 'locked' },
    '5': { isCompleted: false, status: 'locked' },
    '6': { isCompleted: false, status: 'locked' },
    '7': { isCompleted: false, status: 'locked' },
    '8': { isCompleted: false, status: 'locked' },
    '9': { isCompleted: false, status: 'locked' }
  }
};

// 평가 점수 타입 추가
type EvaluationScores = {
  round: number;
  date: string;
  totalScore: number;
  categoryScores: {
    teachingSkill: number;
    studentEngagement: number;
    contentDelivery: number;
    classroomManagement: number;
  };
};

// 평가 데이터를 임시로 하드코딩
const mockEvaluationData: Record<string, EvaluationScores[]> = {
  'jasmine': [
    {
      round: 1,
      date: '2024-01-15',
      totalScore: 92,
      categoryScores: {
        teachingSkill: 90,
        studentEngagement: 93,
        contentDelivery: 91,
        classroomManagement: 94
      }
    },
    {
      round: 2,
      date: '2024-01-22',
      totalScore: 94,
      categoryScores: {
        teachingSkill: 93,
        studentEngagement: 95,
        contentDelivery: 92,
        classroomManagement: 96
      }
    }
  ],
  'kami': [
    {
      round: 1,
      date: '2024-01-16',
      totalScore: 93,
      categoryScores: {
        teachingSkill: 92,
        studentEngagement: 94,
        contentDelivery: 93,
        classroomManagement: 93
      }
    },
    {
      round: 2,
      date: '2024-01-23',
      totalScore: 95,
      categoryScores: {
        teachingSkill: 94,
        studentEngagement: 96,
        contentDelivery: 95,
        classroomManagement: 95
      }
    }
  ]
};

export default function TeacherEvaluation() {
  const router = useRouter();
  const pathname = usePathname();
  const teacherId = pathname.split('/').pop() as string;
  const [evaluationData, setEvaluationData] = useState<EvaluationScores[]>([]);
  
  // 평가 데이터 가져오기
  useEffect(() => {
    const fetchEvaluationData = () => {
      try {
        const completedReports = reportStatuses[teacherId] || {};
        const completedRounds = Object.entries(completedReports)
          .filter(([_, status]) => status.status === 'completed')
          .map(([round]) => parseInt(round));

        // 임시 데이터에서 완료된 회차의 데이터만 필터링
        const data = mockEvaluationData[teacherId]?.filter(
          report => completedRounds.includes(report.round)
        ) || [];

        setEvaluationData(data);
      } catch (error) {
        console.error('Error fetching evaluation data:', error);
      }
    };

    if (teacherId) {
      fetchEvaluationData();
    }
  }, [teacherId]);

  // 총점 차트 데이터
  const getTotalScoreData = () => {
    return evaluationData.map(data => ({
      round: `${data.round}회차`,
      총점: data.totalScore
    }));
  };

  // 영역별 점수 차트 데이터
  const getCategoryScoreData = () => {
    return evaluationData.map(data => ({
      round: `${data.round}회차`,
      '교수 능력': data.categoryScores.teachingSkill,
      '학생 참여도': data.categoryScores.studentEngagement,
      '내용 전달력': data.categoryScores.contentDelivery,
      '수업 운영': data.categoryScores.classroomManagement
    }));
  };

  // 현재 선생님 정보 찾기
  const currentTeacher = TEACHERS.find(teacher => teacher.routeName === teacherId);

  const handleReportClick = (reportNumber: number) => {
    const reportId = reportNumber.toString();
    const reportStatus = reportStatuses[teacherId]?.[reportId];

    if (!reportStatus) return;

    if (reportStatus.status === 'completed') {
      // 완료된 보고서로 이동
      router.push(`/reports/${teacherId}/${reportId}`);
    } else if (reportStatus.status === 'available') {
      // 분석 페이지로 이동
      router.push(`/reports/${teacherId}/analyze`);
    }
  };

  const getReportButtonStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: '#4CAF50',
          color: 'white',
          '&:hover': {
            backgroundColor: '#45a049'
          }
        };
      case 'available':
        return {
          backgroundColor: '#2196F3',
          color: 'white',
          '&:hover': {
            backgroundColor: '#1976D2'
          }
        };
      default:
        return {
          backgroundColor: '#9E9E9E',
          color: 'white',
          cursor: 'not-allowed',
          '&:hover': {
            backgroundColor: '#9E9E9E'
          }
        };
    }
  };

  const getReportButtonText = (status: string) => {
    switch (status) {
      case 'completed':
        return '분석 결과 보기';
      case 'available':
        return '분석하기';
      default:
        return '잠김';
    }
  };

  if (!currentTeacher) {
    return <Typography>선생님을 찾을 수 없습니다.</Typography>;
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#FFFFF0', minHeight: '100vh' }}>
      <Button
        variant="contained"
        startIcon={<HomeIcon />}
        onClick={() => router.push('/')}
        sx={{
          mb: 3,
          backgroundColor: '#1976D2',
          '&:hover': {
            backgroundColor: '#1565C0'
          }
        }}
        className="font-sogang"
      >
        홈으로
      </Button>

      <Grid container spacing={3}>
        {/* 선생님 프로필 카드 */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={currentTeacher.imageUrl}
                  sx={{ width: 100, height: 100, mr: 3 }}
                />
                <Box>
                  <Typography variant="h4" className="font-sogang" gutterBottom>
                    {currentTeacher.name} 선생님
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip
                      icon={<SmartToyIcon />}
                      label={`AI 평가 점수: ${currentTeacher.aiScore}`}
                      color="primary"
                      className="font-sogang"
                    />
                    <Chip
                      label={currentTeacher.subject}
                      variant="outlined"
                      className="font-sogang"
                    />
                    <Chip
                      label={`경력 ${currentTeacher.experience}`}
                      variant="outlined"
                      className="font-sogang"
                    />
                  </Box>
                </Box>
              </Box>
              <Typography variant="h6" className="font-sogang" gutterBottom>
                전문 분야
              </Typography>
              <Typography paragraph className="font-sogang">
                {currentTeacher.specialty}
              </Typography>
              <Typography variant="h6" className="font-sogang" gutterBottom>
                AI 분석 강점
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {currentTeacher.aiStrengths.map((strength, index) => (
                  <Chip
                    key={index}
                    label={strength}
                    color="primary"
                    variant="outlined"
                    className="font-sogang"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 평가 점수 차트 섹션 */}
        {evaluationData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom className="font-sogang">
                  📊 회차별 평가 점수 분석
                </Typography>
                
                {/* 총점 추이 차트 */}
                <Typography variant="h6" className="font-sogang" sx={{ mt: 3, mb: 2 }}>
                  총점 추이
                </Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={getTotalScoreData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="round" />
                      <YAxis domain={[60, 100]} />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="총점"
                        stroke="#ff0000"
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>

                {/* 영역별 점수 히스토그램 */}
                <Typography variant="h6" className="font-sogang" sx={{ mt: 4, mb: 2 }}>
                  영역별 점수 분포
                </Typography>
                <Box sx={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={getCategoryScoreData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="round" />
                      <YAxis domain={[60, 100]} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="교수 능력" fill="#8884d8" />
                      <Bar dataKey="학생 참여도" fill="#82ca9d" />
                      <Bar dataKey="내용 전달력" fill="#ffc658" />
                      <Bar dataKey="수업 운영" fill="#ff7300" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                {/* 최신 회차 점수 요약 */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {evaluationData.length > 0 && (
                    <>
                      {Object.entries(evaluationData[evaluationData.length - 1].categoryScores).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={`${key === 'teachingSkill' ? '교수 능력' :
                                 key === 'studentEngagement' ? '학생 참여도' :
                                 key === 'contentDelivery' ? '내용 전달력' :
                                 '수업 운영'}: ${value}점`}
                          color="primary"
                          variant="outlined"
                          className="font-sogang"
                        />
                      ))}
                      <Chip
                        label={`총점: ${evaluationData[evaluationData.length - 1].totalScore}점`}
                        color="primary"
                        className="font-sogang"
                      />
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 수업 분석 보고서 섹션 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom className="font-sogang">
                📑 AI 수업 분석 보고서
              </Typography>
              <Typography paragraph className="font-sogang" color="text.secondary">
                각 회차별 수업 분석 결과를 확인할 수 있습니다. 
                분석되지 않은 회차는 순서대로 분석이 가능합니다.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {Array.from({ length: 9 }, (_, i) => {
                  const reportNumber = i + 1;
                  const reportId = reportNumber.toString();
                  const reportStatus = reportStatuses[teacherId]?.[reportId];
                  
                  return (
                    <Tooltip 
                      key={i}
                      title={
                        reportStatus?.status === 'completed' ? `완료됨 (${reportStatus.date})` :
                        reportStatus?.status === 'available' ? '분석 가능' :
                        '이전 회차 분석 후 가능'
                      }
                    >
                      <span>
                        <Button
                          variant={reportStatus?.status === 'locked' ? "outlined" : "contained"}
                          className="font-sogang"
                          onClick={() => handleReportClick(reportNumber)}
                          disabled={reportStatus?.status === 'locked'}
                          startIcon={
                            reportStatus?.status === 'completed' ? <AnalysisIcon /> :
                            reportStatus?.status === 'locked' ? <LockIcon /> :
                            null
                          }
                          sx={{
                            minWidth: '150px',
                            height: '48px',
                            ...getReportButtonStyle(reportStatus?.status || 'locked')
                          }}
                        >
                          {reportNumber}회차
                          <Box component="span" sx={{ ml: 1 }}>
                            {getReportButtonText(reportStatus?.status || 'locked')}
                          </Box>
                        </Button>
                      </span>
                    </Tooltip>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 