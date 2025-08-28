'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { 
  Container, 
  Box, 
  Typography, 
  LinearProgress, 
  Paper,
  Button
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MovieIcon from '@mui/icons-material/Movie';
import styled from '@emotion/styled';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

const UploadContainer = styled(motion.div)`
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.18);
  padding: 2rem;
  text-align: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const DropZone = styled.div`
  border: 2px dashed #4A90E2;
  border-radius: 15px;
  padding: 3rem;
  background: rgba(255,255,255,0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(74,144,226,0.1);
    border-color: #2171D1;
    transform: scale(1.02);
  }
`;

export default function AnalyzePage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const pathname = usePathname();
  const teacherId = pathname.split('/')[2];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('teacherId', teacherId); // teacherId가 실제로는 선생님 이름

      // 분석 시작
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.transcriptId) {
        setTranscriptId(data.transcriptId);
        checkStatus(data.transcriptId);
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      setUploading(false);
    }
  };

  const checkStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analyze-status?transcriptId=${id}&teacherId=${teacherId}`);
        const data = await response.json();
        
        setUploadProgress(data.progress);
        
        if (data.step) {
          setStatusMessage(data.step);
        }

        if (data.status === 'completed' && data.reportId) {
          clearInterval(interval);
          console.log('분석 완료. 이동할 reportId:', data.reportId);
          await new Promise(resolve => setTimeout(resolve, 1000));
          router.push(`/reports/${teacherId}/${data.reportId}`);
        } else if (data.status === 'error') {
          clearInterval(interval);
          setUploading(false);
          setError('분석 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('상태 확인 오류:', error);
        clearInterval(interval);
        setUploading(false);
        setError('상태 확인 중 오류가 발생했습니다.');
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  return (
    <Container 
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
      }}
    >
      <UploadContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            className="font-sogang"
            sx={{ 
              color: '#2C3E50',
              mb: 4,
              fontWeight: 'bold'
            }}
          >
            수업 영상 업로드
          </Typography>
        </motion.div>

        <DropZone {...getRootProps()}>
          <input {...getInputProps()} />
          <motion.div
            animate={{
              y: isDragActive ? -10 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <CloudUploadIcon sx={{ fontSize: 60, color: '#4A90E2', mb: 2 }} />
            <Typography variant="h6" gutterBottom className="font-sogang">
              {isDragActive ? 
                '여기에 놓아주세요!' : 
                '영상을 드래그하거나 클릭하여 업로드하세요'}
            </Typography>
            <Typography variant="body2" color="textSecondary" className="font-sogang">
              지원 형식: MP4, MOV, AVI
            </Typography>
          </motion.div>
        </DropZone>

        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper 
              elevation={3}
              sx={{ 
                mt: 3, 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                gap: 2,
                background: 'rgba(255,255,255,0.9)'
              }}
            >
              <MovieIcon color="primary" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" className="font-sogang">
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="textSecondary" className="font-sogang">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              </Box>
            </Paper>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={uploading}
                sx={{ 
                  mt: 3,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  color: 'white',
                  padding: '10px 30px',
                }}
                className="font-sogang"
              >
                {uploading ? '업로드 중...' : '분석 시작하기'}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: '2rem' }}
          >
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                }
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ mt: 1 }}
              className="font-sogang"
            >
              {uploadProgress}% 완료
            </Typography>
          </motion.div>
        )}
      </UploadContainer>
    </Container>
  );
} 