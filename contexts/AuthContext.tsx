'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient, Profile, ROLE_PERMISSIONS, UserRole } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData: { full_name: string; role: UserRole }) => Promise<{ error: any }>
  signOut: () => Promise<void>
  permissions: typeof ROLE_PERMISSIONS.teacher | typeof ROLE_PERMISSIONS.principal | typeof ROLE_PERMISSIONS.admin | null
  isTeacher: () => boolean
  isPrincipal: () => boolean
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createSupabaseBrowserClient()

  // 권한 계산
  const permissions = profile ? ROLE_PERMISSIONS[profile.role] : null

  // 디버깅: profile 변경 시 로그
  useEffect(() => {
    if (profile) {
      console.log('🎯 AuthContext - 프로필 업데이트:', {
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name
      })
    } else if (user) {
      console.log('⚠️ AuthContext - 사용자는 있지만 프로필 없음:', {
        email: user.email
      })
    }
  }, [profile, user])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        // 2초 타임아웃으로 빠르게 처리
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('세션 확인 타임아웃')), 2000)
        )
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (error) {
          console.error('❌ Supabase 세션 오류:', error)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        
        setLoading(false)
      } catch (error) {
        // 타임아웃 오류는 조용히 처리 (개발 중이므로 예상된 오류)
        if (error instanceof Error && error.message.includes('타임아웃')) {
          console.log('⚠️  Supabase 연결 실패 - 로그인 페이지로 표시')
        } else {
          console.error('💥 예상치 못한 오류:', error)
        }
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    getInitialSession()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔄 인증 상태 변경:', event, session?.user?.email)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 사용자 로그인됨, 프로필 조회 시작...')
          try {
            await fetchProfile(session.user.id)
          } catch (error) {
            console.error('💥 프로필 조회 실패:', error)
            setProfile(null)
            setProfileLoading(false)
            setLoading(false)
          }
        } else {
          console.log('👤 사용자 로그아웃됨')
          setProfile(null)
          setProfileLoading(false)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [mounted])

    const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 REST API 프로필 조회 시도:', userId)
      setProfileLoading(true)
      
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
      }
      
      console.log('🌐 REST API 호출 시작...')
      
      const response = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('⏰ REST API 응답 완료:', response.status)
      
      if (response.ok) {
        const profiles = await response.json()
        const profileData = profiles[0] || null
        
        console.log('📋 REST API 응답 데이터:', profiles)
        
        if (profileData) {
          console.log('✅ REST API로 프로필 로드 성공:', profileData)
          console.log('🎯 사용자 역할 확인:', profileData.role)
          setProfile(profileData)
        } else {
          console.log('⚠️ 프로필 데이터 없음, 이메일 기반으로 기본값 설정')
          // admin 계정인지 확인
          const userEmail = user?.email || ''
          let defaultRole: UserRole = 'teacher'
          let defaultName = '선생님'
          
          if (userEmail === 'admin@test.com') {
            defaultRole = 'admin'
            defaultName = '관리자'
            console.log('👨‍💼 Admin 계정 감지, admin 역할로 설정')
          }
          
          const defaultProfile = {
            id: userId,
            email: userEmail,
            full_name: defaultName,
            role: defaultRole,
            school_name: null,
            phone_number: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          console.log('✅ 기본 프로필 설정:', defaultProfile)
          setProfile(defaultProfile)
          
          // admin 계정인 경우 즉시 프로필 설정 완료 알림
          if (userEmail === 'admin@test.com') {
            console.log('🚀 Admin 프로필 설정 완료, 리다이렉트 준비됨')
          }
        }
      } else {
        console.log('❌ REST API 오류:', response.status, response.statusText)
        
        // 오류 시에도 이메일 기반으로 기본값 설정
        console.log('⚠️ 오류로 인해 이메일 기반 기본값 설정')
        const userEmail = user?.email || ''
        let defaultRole: UserRole = 'teacher'
        let defaultName = '선생님'
        
        if (userEmail === 'admin@test.com') {
          defaultRole = 'admin'
          defaultName = '관리자'
          console.log('👨‍💼 Admin 계정 감지, admin 역할로 설정')
        }
        
        const defaultProfile = {
          id: userId,
          email: userEmail,
          full_name: defaultName,
          role: defaultRole,
          school_name: null,
          phone_number: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('✅ 기본 프로필 설정:', defaultProfile)
        setProfile(defaultProfile)
      }
      
    } catch (error) {
      console.error('💥 프로필 조회 예외:', error)
      
      // 예외 발생 시에도 이메일 기반으로 기본값 설정
      console.log('⚠️ 예외로 인해 이메일 기반 기본값 설정')
      const userEmail = user?.email || ''
      let defaultRole: UserRole = 'teacher'
      let defaultName = '선생님'
      
      if (userEmail === 'admin@test.com') {
        defaultRole = 'admin'
        defaultName = '관리자'
        console.log('👨‍💼 Admin 계정 감지, admin 역할로 설정')
      }
      
      const defaultProfile = {
        id: userId,
        email: userEmail,
        full_name: defaultName,
        role: defaultRole,
        school_name: null,
        phone_number: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      console.log('✅ 기본 프로필 설정:', defaultProfile)
      setProfile(defaultProfile)
    } finally {
      console.log('🔚 프로필 조회 종료')
      setProfileLoading(false)
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthContext: 로그인 시도 중...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (data?.user) {
      console.log('✅ AuthContext: 로그인 성공, 사용자 ID:', data.user.id)
      console.log('📧 로그인한 사용자 이메일:', data.user.email)
      
      // admin 계정인 경우 즉시 프로필 설정
      if (data.user.email === 'admin@test.com') {
        console.log('👨‍💼 Admin 계정 로그인 감지, 즉시 프로필 설정')
        const adminProfile = {
          id: data.user.id,
          email: data.user.email,
          full_name: '관리자',
          role: 'admin' as const,
          school_name: null,
          phone_number: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('✅ Admin 프로필 즉시 설정:', adminProfile)
        setProfile(adminProfile)
      }
    }
    
    if (error) {
      console.log('❌ AuthContext: 로그인 오류:', error.message)
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string, userData: { full_name: string; role: UserRole }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    // 리다이렉트는 각 컴포넌트에서 처리
  }

  const isTeacher = () => profile?.role === 'teacher'
  const isPrincipal = () => profile?.role === 'principal'
  const isAdmin = () => profile?.role === 'admin'

  const value = {
    user,
    profile,
    loading: loading || !mounted,
    profileLoading,
    signIn,
    signUp,
    signOut,
    permissions,
    isTeacher,
    isPrincipal,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 