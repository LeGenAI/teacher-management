'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import UserHeader from '../../../../components/layout/UserHeader';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Teacher {
  id: string;
  email: string;
  full_name: string;
  school_name: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  joinDate: string;
  status: string;
}

export default function TeachersListPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 교사 목록 로드
  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/teachers');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '교사 목록을 불러올 수 없습니다.');
      }

      setTeachers(result.data);
      setFilteredTeachers(result.data);
      console.log(`✅ 교사 목록 로드 완료: ${result.data.length}명`);

    } catch (err) {
      console.error('교사 목록 로드 실패:', err);
      setError(err instanceof Error ? err.message : '교사 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링
  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredTeachers(teachers);
      return;
    }

    const filtered = teachers.filter(teacher =>
      teacher.full_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      teacher.school_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      teacher.phone_number?.includes(searchValue)
    );

    setFilteredTeachers(filtered);
  };

  // 교사 삭제
  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await fetch(`/api/admin/teachers?id=${selectedTeacher.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '교사를 삭제할 수 없습니다.');
      }

      // 목록에서 삭제된 교사 제거
      const updatedTeachers = teachers.filter(t => t.id !== selectedTeacher.id);
      setTeachers(updatedTeachers);
      setFilteredTeachers(updatedTeachers.filter(teacher =>
        !searchTerm.trim() || 
        teacher.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.phone_number?.includes(searchTerm)
      ));

      setDeleteDialogOpen(false);
      setSelectedTeacher(null);

    } catch (err) {
      console.error('교사 삭제 실패:', err);
      setError(err instanceof Error ? err.message : '교사를 삭제할 수 없습니다.');
    }
  };

  // 메뉴 핸들러
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, teacher: Teacher) => {
    setAnchorEl(event.currentTarget);
    setSelectedTeacher(teacher);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTeacher(null);
  };

  const handleEditTeacher = () => {
    if (selectedTeacher) {
      router.push(`/admin/teachers/edit/${selectedTeacher.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      default: return 'primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      default: return '알 수 없음';
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <UserHeader />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', py: 4 }}>
        <Container maxWidth="lg">
          {/* 헤더 */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/admin-dashboard')}
                variant="outlined"
              >
                관리자 대시보드로
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  👨‍🏫 교사 관리
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  등록된 모든 교사의 정보를 관리할 수 있습니다
                </Typography>
              </Box>
            </Box>

            {/* 검색 및 통계 */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="교사 이름, 이메일, 학교명, 전화번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                      {filteredTeachers.length}명
                    </Typography>
                    <Typography variant="body2">
                      {searchTerm ? '검색 결과' : '전체 교사'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* 교사 목록 테이블 */}
          <Card>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>교사 목록을 불러오는 중...</Typography>
                </Box>
              ) : filteredTeachers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {searchTerm ? '검색 결과가 없습니다' : '등록된 교사가 없습니다'}
                  </Typography>
                  {searchTerm && (
                    <Button
                      variant="outlined"
                      onClick={() => handleSearch('')}
                      sx={{ mt: 2 }}
                    >
                      전체 목록 보기
                    </Button>
                  )}
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>교사명</strong></TableCell>
                        <TableCell><strong>이메일</strong></TableCell>
                        <TableCell><strong>학교</strong></TableCell>
                        <TableCell><strong>전화번호</strong></TableCell>
                        <TableCell><strong>가입일</strong></TableCell>
                        <TableCell><strong>상태</strong></TableCell>
                        <TableCell align="center"><strong>관리</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon color="primary" />
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {teacher.full_name || '이름 없음'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {teacher.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SchoolIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {teacher.school_name || '미등록'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {teacher.phone_number || '미등록'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarTodayIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {teacher.joinDate}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusText(teacher.status)}
                              color={getStatusColor(teacher.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={(e) => handleMenuClick(e, teacher)}
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* 액션 메뉴 */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEditTeacher}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              정보 수정
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              삭제
            </MenuItem>
          </Menu>

          {/* 삭제 확인 다이얼로그 */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>교사 삭제 확인</DialogTitle>
            <DialogContent>
              <Typography>
                <strong>{selectedTeacher?.full_name}</strong> 교사를 정말 삭제하시겠습니까?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                이 작업은 되돌릴 수 없습니다. 해당 교사의 모든 데이터가 삭제됩니다.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleDeleteTeacher}
                color="error"
                variant="contained"
              >
                삭제
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ProtectedRoute>
  );
} 