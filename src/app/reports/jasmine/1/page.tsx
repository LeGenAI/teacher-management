'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Rating,
  LinearProgress,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';
import StarIcon from '@mui/icons-material/Star';

export default function TeacherEvaluation() {
  const router = useRouter();
  const pathname = usePathname();
  const [teacherName, lessonNumber] = pathname.split('/').slice(-2);

  const [evaluationData] = useState({
    teacherName: teacherName.charAt(0).toUpperCase() + teacherName.slice(1),
    lessonNumber: parseInt(lessonNumber),
    totalScore: 41,
    grade: 'D',
    strengths: '개념 설명',
    improvementArea: '상호작용',
    categories: [
      { name: '학생 참여 유도', score: 2, maxScore: 20, grade: 'D', percentage: 10, details: ['심층적 사고 촉진', '참여도 관리'] },
      { name: '개념 설명', score: 18, maxScore: 20, grade: 'A+', percentage: 90, details: ['논리적 전개: ⭐⭐⭐⭐', '실용적 연계: ⭐⭐⭐'] },
      { name: '피드백', score: 3, maxScore: 20, grade: 'D', percentage: 15, details: ['구체성', '발전 지향성'] },
      { name: '수업 체계성', score: 17, maxScore: 20, grade: 'A', percentage: 85, details: ['목표 명확성: ⭐⭐⭐⭐', '진행 체계성: ⭐⭐'] },
      { name: '상호작용', score: 1, maxScore: 20, grade: 'D', percentage: 5, details: ['개별화 지도', '학습 분위기'] },
    ],
    findings: [
      '교사는 학생에게 질문을 던져 자발적인 참여를 유도하였고, 학생이 문제를 풀어보도록 하여 심층적 사고를 유도하였습니다.',
      '교사는 개념을 체계적으로 설명하였고, 실생활 예시를 활용하여 학생의 이해를 돕고 있습니다. 이는 학생이 개념을 이해하는 데 큰 도움이 됩니다.'
    ],
    improvements: [
      {
        area: '수업 진행의 체계성',
        score: 15,
        actions: ['구체적인 피드백 전략 수립', '단계적 개선 계획 수립']
      },
      {
        area: '학생과의 상호작용',
        score: 10,
        actions: ['구체적인 피드백 전략 수립', '단계적 개선 계획 수립']
      }
    ]
  });

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" className="font-sogang">
              🎓 {evaluationData.teacherName} 선생님의 {evaluationData.lessonNumber}회차 수업 평가
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" className="font-sogang">
              평가일: {new Date().toLocaleDateString('ko-KR')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
            className="font-sogang"
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              color: 'white',
            }}
          >
            홈으로
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* 종합 평가 결과 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom className="font-sogang">
                  📊 종합 평가 결과
                </Typography>
                <Typography className="font-sogang">전체 평가 등급: <strong>{evaluationData.grade}</strong> ({evaluationData.totalScore}점)</Typography>
                <Typography className="font-sogang">강점 영역: <strong>{evaluationData.strengths}</strong></Typography>
                <Typography className="font-sogang">중점 개선 영역: <strong>{evaluationData.improvementArea}</strong></Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 영역별 평가 */}
          {evaluationData.categories.map((category, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom className="font-sogang">
                    {category.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating 
                      value={category.score / 4} 
                      readOnly 
                      max={5}
                      sx={{ mr: 2 }}
                      icon={<StarIcon sx={{ color: category.grade === 'A+' ? '#FFD700' : undefined }} />}
                    />
                    <Typography className="font-sogang">
                      {category.score}/{category.maxScore}점 ({category.grade})
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={category.percentage} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: category.grade === 'A+' ? '#4CAF50' : 
                                       category.grade === 'A' ? '#8BC34A' : '#FF9800'
                      }
                    }}
                  />
                  <Box sx={{ mt: 2 }}>
                    {category.details.map((detail, idx) => (
                      <Chip 
                        key={idx}
                        label={detail}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1, mt: 1 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* 주요 발견사항 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom className="font-sogang">
                  💡 주요 발견사항
                </Typography>
                <List>
                  {evaluationData.findings.map((finding, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={finding}
                        className="font-sogang"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Container>
  );
}
