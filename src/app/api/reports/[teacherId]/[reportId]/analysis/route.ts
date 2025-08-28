import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teacherId: string; reportId: string }> }
) {
  try {
    // 파라미터를 비동기적으로 처리
    const params = await context.params;
    let { teacherId, reportId } = params;
    
    // URL 디코딩 처리 (이중 인코딩 대응)
    try {
      teacherId = decodeURIComponent(teacherId);
      // 이중 인코딩된 경우를 대비해 한 번 더 디코딩
      if (teacherId.includes('%')) {
        teacherId = decodeURIComponent(teacherId);
      }
    } catch (error) {
      console.error('URL 디코딩 오류:', error);
      // 디코딩 실패 시 원본 사용
    }
    
    console.log('처리할 파라미터:', { teacherId, reportId });
    
    // 프로젝트 루트 경로 확인
    const projectRoot = process.cwd();
    console.log('프로젝트 루트:', projectRoot);
    
    // 실제 파일 경로 구성
    const filePath = path.join(
      projectRoot,
      'public',
      'reports',
      teacherId,
      reportId,
      'analysis.json'
    );

    console.log('분석 파일 경로:', filePath);

    // 파일 존재 여부 확인
    try {
      await fs.access(filePath);
      console.log('파일 존재 확인됨');
    } catch (error) {
      console.error(`파일이 존재하지 않음: ${filePath}`);
      return NextResponse.json(
        { error: '분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // UTF-8 BOM을 고려하여 파일 읽기
    const fileContent = await fs.readFile(filePath);
    let jsonString = fileContent.toString('utf8');
    
    // BOM 제거
    if (jsonString.charCodeAt(0) === 0xFEFF) {
      jsonString = jsonString.slice(1);
    }
    
    const analysis = JSON.parse(jsonString);
    console.log('분석 결과 로드 완료');

    if (!analysis) {
      return NextResponse.json(
        { error: '분석 결과가 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('분석 파일 로드 오류:', error);
    return NextResponse.json(
      { error: '분석 결과를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 