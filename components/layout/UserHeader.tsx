'use client'

import React from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  Avatar,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import SchoolIcon from '@mui/icons-material/School'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

export default function UserHeader() {
  const { user, profile, signOut, isTeacher, isPrincipal, isAdmin } = useAuth()
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = async () => {
    await signOut()
    handleMenuClose()
    // 로그아웃 후 auth 페이지로 리다이렉트
    window.location.href = '/auth'
  }

  if (!user || !profile) {
    return null
  }

  const getRoleInfo = () => {
    if (isAdmin()) {
      return {
        label: '관리자',
        color: 'error' as const,
        icon: <AccountCircleIcon fontSize="small" />
      }
    } else if (isPrincipal()) {
      return {
        label: '원장님',
        color: 'primary' as const,
        icon: <SchoolIcon fontSize="small" />
      }
    } else {
      return {
        label: '선생님',
        color: 'secondary' as const,
        icon: <PersonIcon fontSize="small" />
      }
    }
  }

  const roleInfo = getRoleInfo()

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 1000,
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottomLeftRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      {/* 사용자 정보 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: roleInfo.color + '.main' }}>
          {roleInfo.icon}
        </Avatar>
        
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
            {profile.full_name || profile.email}
          </Typography>
          <Chip 
            label={roleInfo.label}
            color={roleInfo.color}
            size="small"
            variant="filled"
            sx={{ 
              height: 20, 
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          />
        </Box>
      </Box>

      {/* 메뉴 버튼 */}
      <IconButton
        onClick={handleMenuOpen}
        sx={{ 
          width: 36, 
          height: 36,
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
        }}
      >
        <AccountCircleIcon />
      </IconButton>

      {/* 드롭다운 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
      >
        <MenuItem disabled sx={{ opacity: 0.7 }}>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {profile.full_name || '사용자'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {profile.email}
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          로그아웃
        </MenuItem>
      </Menu>
    </Box>
  )
} 