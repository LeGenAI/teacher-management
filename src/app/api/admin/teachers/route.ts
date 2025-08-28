import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성 (서버용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('📚 교사 목록 조회 요청');

    // profiles 테이블에서 교사 역할을 가진 사용자들만 조회
    const { data: teachers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 교사 목록 조회 실패:', error);
      return NextResponse.json(
        { error: '교사 목록을 가져올 수 없습니다.', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ 교사 목록 조회 성공: ${teachers?.length || 0}명`);

    // 민감한 정보 제거 및 추가 정보 포함
    const processedTeachers = teachers?.map(teacher => ({
      id: teacher.id,
      email: teacher.email,
      full_name: teacher.full_name,
      school_name: teacher.school_name,
      phone_number: teacher.phone_number,
      created_at: teacher.created_at,
      updated_at: teacher.updated_at,
      // 추가 정보 계산
      joinDate: new Date(teacher.created_at).toLocaleDateString('ko-KR'),
      status: 'active', // 실제로는 마지막 로그인 시간 등을 기반으로 계산
    })) || [];

    return NextResponse.json({
      success: true,
      data: processedTeachers,
      count: processedTeachers.length,
      message: `총 ${processedTeachers.length}명의 교사를 찾았습니다.`
    });

  } catch (error) {
    console.error('💥 교사 목록 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 교사 정보 업데이트 (PUT)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: '교사 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`📝 교사 정보 업데이트 요청: ${id}`);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('role', 'teacher')
      .select()
      .single();

    if (error) {
      console.error('❌ 교사 정보 업데이트 실패:', error);
      return NextResponse.json(
        { error: '교사 정보를 업데이트할 수 없습니다.', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ 교사 정보 업데이트 성공');

    return NextResponse.json({
      success: true,
      data: data,
      message: '교사 정보가 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('💥 교사 정보 업데이트 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 교사 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '교사 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 교사 삭제 요청: ${id}`);

    // 먼저 해당 교사가 존재하는지 확인
    const { data: teacher, error: fetchError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', id)
      .eq('role', 'teacher')
      .single();

    if (fetchError || !teacher) {
      return NextResponse.json(
        { error: '해당 교사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 프로필 삭제
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('role', 'teacher');

    if (deleteError) {
      console.error('❌ 교사 삭제 실패:', deleteError);
      return NextResponse.json(
        { error: '교사를 삭제할 수 없습니다.', details: deleteError.message },
        { status: 500 }
      );
    }

    // Auth 사용자도 삭제 (선택사항)
    try {
      await supabase.auth.admin.deleteUser(id);
    } catch (authError) {
      console.warn('⚠️ Auth 사용자 삭제 실패 (프로필은 삭제됨):', authError);
    }

    console.log('✅ 교사 삭제 성공');

    return NextResponse.json({
      success: true,
      message: `${teacher.full_name} 교사가 성공적으로 삭제되었습니다.`
    });

  } catch (error) {
    console.error('💥 교사 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 