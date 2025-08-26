'use client';


import { useState } from 'react';
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
} from '@mui/material';
import { useRouter } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';

export default function TeacherEvaluation() {
  const router = useRouter();
  const [evaluationData] = useState({
    totalScore: 25,
    grade: 'D',
    strengths: '개념 설명',
    improvements: '피드백',
    categories: [
      { name: '학생 참여', score: 5, maxScore: 20, grade: 'D', percentage: 25 },
      { name: '개념 설명', score: 6, maxScore: 20, grade: 'D', percentage: 30 },
      { name: '피드백', score: 4, maxScore: 20, grade: 'D', percentage: 20 },
      { name: '체계성', score: 5, maxScore: 20, grade: 'D', percentage: 25 },
      { name: '상호작용', score: 5, maxScore: 20, grade: 'D', percentage: 25 },
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
      <Container maxWidth="lg" sx={{ 
        height: '100%',
        pt: 4
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" className="font-sogang">
            🎓 교사 역량 평가 보고서
          </Typography>
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
                <Typography className="font-sogang">중점 개선 영역: <strong>{evaluationData.improvements}</strong></Typography>
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
                    />
                    <Typography className="font-sogang">
                      {category.score}/{category.maxScore}점 ({category.grade})
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={category.percentage} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Container>
  );
}
