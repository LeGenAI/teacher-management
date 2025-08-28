const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createAdminAccount() {
  try {
    console.log('🚀 어드민 계정 생성을 시작합니다...');
    
    // 어드민 계정 정보
    const adminEmail = 'admin@teacher-system.com';
    const adminPassword = 'Admin123!@#';
    const adminData = {
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: '시스템 관리자',
          role: 'admin'
        }
      }
    };

    // 1. 어드민 계정 생성
    console.log('📧 어드민 계정 생성 중...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: '시스템 관리자',
        role: 'admin'
      }
    });

    if (authError) {
      console.error('❌ 어드민 계정 생성 실패:', authError);
      return;
    }

    console.log('✅ 어드민 계정 생성 완료:', authData.user.id);

    // 2. 프로필 테이블에 어드민 정보 추가
    console.log('👤 프로필 정보 생성 중...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: adminEmail,
        full_name: '시스템 관리자',
        role: 'admin',
        school_name: '시스템 본부',
        phone_number: '010-0000-0000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('❌ 프로필 생성 실패:', profileError);
      return;
    }

    console.log('✅ 프로필 생성 완료');

    console.log('\n🎉 어드민 계정 생성이 완료되었습니다!');
    console.log('📧 이메일:', adminEmail);
    console.log('🔑 비밀번호:', adminPassword);
    console.log('👑 역할: 시스템 관리자');
    console.log('\n⚠️  보안을 위해 첫 로그인 후 비밀번호를 변경하세요.');

  } catch (error) {
    console.error('💥 예상치 못한 오류 발생:', error);
  }
}

// 기존 어드민 계정 확인
async function checkExistingAdmin() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');

    if (error) {
      console.error('❌ 어드민 계정 확인 실패:', error);
      return false;
    }

    if (data && data.length > 0) {
      console.log('⚠️  기존 어드민 계정이 발견되었습니다:');
      data.forEach(admin => {
        console.log(`   - ${admin.full_name} (${admin.email})`);
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('💥 어드민 확인 중 오류:', error);
    return false;
  }
}

// 메인 실행 함수
async function main() {
  console.log('🔍 기존 어드민 계정 확인 중...');
  
  const hasExistingAdmin = await checkExistingAdmin();
  
  if (hasExistingAdmin) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n새로운 어드민 계정을 추가로 생성하시겠습니까? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await createAdminAccount();
      } else {
        console.log('❌ 어드민 계정 생성이 취소되었습니다.');
      }
      rl.close();
    });
  } else {
    await createAdminAccount();
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { createAdminAccount, checkExistingAdmin }; 