'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useRouter } from 'next/navigation';

export default function ConsultationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    consultationType: '',
    preferredDate: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 여기에 form 제출 로직 구현
    console.log('상담 신청 데이터:', formData);
    alert('상담 신청이 완료되었습니다.');
    router.push('/');
  };

  return (
    <Container 
      maxWidth={false}
      sx={{ 
        py: 8,
        backgroundColor: '#FFFFF0',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" component="h1" className="font-sogang" sx={{ mb: 4, textAlign: 'center' }}>
              📝 상담 신청하기
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="이름"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="font-sogang"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="연락처"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="font-sogang"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="이메일"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="font-sogang"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>상담 유형</InputLabel>
                    <Select
                      name="consultationType"
                      value={formData.consultationType}
                      onChange={handleChange}
                      className="font-sogang"
                    >
                      <MenuItem value="학습상담">학습상담</MenuItem>
                      <MenuItem value="진로상담">진로상담</MenuItem>
                      <MenuItem value="입시상담">입시상담</MenuItem>
                      <MenuItem value="기타상담">기타상담</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="희망 상담 날짜"
                    name="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    className="font-sogang"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="상담 내용"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="font-sogang"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      className="font-sogang"
                      sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        color: 'white',
                        px: 4
                      }}
                    >
                      상담 신청하기
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => router.push('/')}
                      className="font-sogang"
                      sx={{ px: 4 }}
                    >
                      취소
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Container>
  );
}
