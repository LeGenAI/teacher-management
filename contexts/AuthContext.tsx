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
  const [isHydrated, setIsHydrated] = useState(false)
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
    // 하이드레이션 완료를 표시
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        console.log('🔍 초기 세션 확인 시작...')
        
        // 3초 타임아웃으로 여유있게 처리 (admin 로그인 안정성 향상)
        let session = null
        let error = null
        
        try {
          console.log('⏰ getSession 호출 중... (3초 타임아웃)')
          
          const sessionPromise = supabase.auth.getSession()
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 3000)
          )
          
          const result = await Promise.race([sessionPromise, timeoutPromise])
          session = (result as any).data.session
          error = (result as any).error
          console.log('✅ getSession 호출 완료')
        } catch (sessionError) {
          console.log('⚠️ getSession 3초 내 완료되지 않음, 계속 진행')
          session = null
          error = null
        }
        
        console.log('🔍 세션 확인 결과:', { session: !!session, error: !!error })
        console.log('🔍 세션 사용자:', session?.user?.email)
        
        if (error) {
          console.error('❌ Supabase 세션 오류:', error)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('✅ 세션에서 사용자 발견, 프로필 조회 시작')
          await fetchProfile(session.user.id)
        } else {
          console.log('⚠️ 세션에 사용자 없음')
        }
        
        setLoading(false)
      } catch (error) {
        // 조용히 처리 - 에러 로그 제거
        console.log('⚠️ 초기 세션 확인 실패, 로그인 페이지로 이동')
        setUser(null)
        setProfile(null)
        setLoading(false)
      } finally {
        // 강제로 로딩 상태 해제
        console.log('🔚 getInitialSession 완료, 로딩 상태 해제')
        setLoading(false)
        setProfileLoading(false)
        
        // 추가 보장을 위해 200ms 후에 한 번 더 해제
        setTimeout(() => {
          console.log('🔚 최종 로딩 상태 해제')
          setLoading(false)
          setProfileLoading(false)
        }, 200)
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
          console.log('⚠️ 프로필 데이터 없음 - Supabase profiles 테이블에 해당 사용자 없음')
          console.log('📧 조회한 사용자 이메일:', user?.email)
          console.log('🆔 조회한 사용자 ID:', userId)
          
          // 프로필이 없으면 null로 설정하여 로그인 실패로 처리
          setProfile(null)
          console.log('❌ 프로필이 없으므로 로그인 거부')
        }
      } else {
        console.log('❌ REST API 오류:', response.status, response.statusText)
        
        // 오류 시에는 프로필을 null로 설정
        console.log('❌ REST API 오류로 인해 프로필 조회 실패')
        console.log('📧 사용자 이메일:', user?.email)
        setProfile(null)
      }
      
    } catch (error) {
      console.error('💥 프로필 조회 예외:', error)
      
      // 예외 발생 시에는 프로필을 null로 설정
      console.log('💥 예외로 인해 프로필 조회 실패')
      console.log('📧 사용자 이메일:', user?.email)
      setProfile(null)
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
      
      // 로그인 성공 후 항상 프로필 조회 (하드코딩 제거)
      console.log('🔍 로그인 성공, 프로필 조회 시작...')
      // fetchProfile 함수가 실제 Supabase 데이터를 조회하므로 이를 사용
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
    loading: loading || !mounted || !isHydrated,
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