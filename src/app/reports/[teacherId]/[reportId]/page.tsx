'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
  Button,
  Avatar
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface Utterance {
  speaker: 'A' | 'B';
  text: string;
}

interface Transcript {
  utterances: Utterance[];
}

interface AnalysisResult {
  scores?: Record<string, number>;
  우수점?: string[];
  개선점?: string[];
  highlights?: {
    timestamp: string;
    teacherText: string;
    studentText: string;
    reason: string;
    type: '개념이해' | '적극참여' | '긍정피드백';
  }[];
}

export default function ReportPage() {
  const pathname = usePathname();
  const [teacherId, reportId] = pathname.split('/').slice(2);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadReport = async () => {
      try {
        const analysisResponse = await fetch(`/api/reports/${teacherId}/${reportId}/analysis`);
        if (!analysisResponse.ok) {
          throw new Error('분석 결과를 불러오는데 실패했습니다.');
        }
        const analysisData = await analysisResponse.json();
        setAnalysis(analysisData);

        const transcriptResponse = await fetch(`/api/reports/${teacherId}/${reportId}/transcript`);
        if (!transcriptResponse.ok) {
          throw new Error('트랜스크립트를 불러오는데 실패했습니다.');
        }
        const transcriptData = await transcriptResponse.json();
        setTranscript(transcriptData);
      } catch (error) {
        console.error('보고서 로드 오류:', error);
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [teacherId, reportId]);

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>보고서 로딩 중...</Typography>
        <LinearProgress />
      </Container>
    );
  }

  if (error || !analysis) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography color="error">{error || '분석 결과를 찾을 수 없습니다.'}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, backgroundColor: '#FFFFF0' }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/teachers/${teacherId}`)}
          className="font-sogang"
        >
          선생님 페이지로
        </Button>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => router.push('/')}
          className="font-sogang"
        >
          홈으로
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom className="font-sogang">
                수업 평가 점수
              </Typography>
              <Box sx={{ mt: 2 }}>
                {analysis.scores && Object.keys(analysis.scores).length > 0 ? (
                  Object.entries(analysis.scores).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Typography variant="body1" gutterBottom className="font-sogang">
                        {key} ({value}/20)
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(value / 20) * 100} 
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                  ))
                ) : (
                  <Typography>평가 점수가 아직 없습니다.</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid> 

        {/* 우수점 & 개선점 섹션 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom className="font-sogang" color="primary">
                우수점
              </Typography>
              <List>
                {analysis.우수점?.length ? (
                  analysis.우수점.map((point, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={point} className="font-sogang" />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="우수점이 아직 없습니다." className="font-sogang" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom className="font-sogang" color="error">
                개선점
              </Typography>
              <List>
                {analysis.개선점?.length ? (
                  analysis.개선점.map((point, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={point} className="font-sogang" />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="개선점이 아직 없습니다." className="font-sogang" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 대화 하이라이트 섹션 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="font-sogang">
                ✨ 긍정적인 수업 순간들
              </Typography>
              <Box sx={{ mt: 2 }}>
                {analysis.highlights && analysis.highlights.length > 0 ? (
                  analysis.highlights.map((highlight, index) => (
                    <Box key={index} sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip 
                          label={highlight.type} 
                          color={
                            highlight.type === '개념이해' ? 'primary' :
                            highlight.type === '적극참여' ? 'success' :
                            'warning'
                          }
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {highlight.timestamp}
                        </Typography>
                      </Box>

                      {/* 교사 메시지 */}
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: '#2196F3',
                            width: 40,
                            height: 40,
                            mr: 2
                          }}
                        >
                          T
                        </Avatar>
                        <Paper
                          sx={{
                            p: 2,
                            maxWidth: '70%',
                            bgcolor: '#E3F2FD',
                            borderRadius: '15px 15px 15px 0'
                          }}
                        >
                          <Typography className="font-sogang">
                            {highlight.teacherText}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* 학생 메시지 */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Paper
                          sx={{
                            p: 2,
                            maxWidth: '70%',
                            bgcolor: '#FFF3E0',
                            borderRadius: '15px 15px 0 15px'
                          }}
                        >
                          <Typography className="font-sogang">
                            {highlight.studentText}
                          </Typography>
                        </Paper>
                        <Avatar 
                          sx={{ 
                            bgcolor: '#FF9800',
                            width: 40,
                            height: 40,
                            ml: 2
                          }}
                        >
                          S
                        </Avatar>
                      </Box>

                      {/* AI 분석 코멘트 */}
                      <Box sx={{ 
                        p: 2, 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 2,
                        border: '1px dashed #2196F3',
                        ml: 7,
                        mr: 7
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <SmartToyIcon color="primary" />
                          <Typography variant="subtitle2" color="primary" className="font-sogang">
                            AI 분석
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" className="font-sogang">
                          {highlight.reason}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary" className="font-sogang">
                    아직 하이라이트가 없습니다.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 대화 내용 섹션 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom className="font-sogang">
                수업 대화 내용
              </Typography>
              <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                {transcript?.utterances?.map((utterance, index) => (
                  <Paper 
                    key={index} 
                    sx={{ 
                      p: 2, 
                      mb: 1, 
                      backgroundColor: utterance.speaker === 'A' ? '#E3F2FD' : '#FFF3E0'
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary" className="font-sogang">
                      {utterance.speaker === 'A' ? '교사' : '학생'}
                    </Typography>
                    <Typography variant="body1" className="font-sogang">
                      {utterance.text}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
} 