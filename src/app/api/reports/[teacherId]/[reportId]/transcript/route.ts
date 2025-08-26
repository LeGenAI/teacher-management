import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teacherId: string; reportId: string }> }
) {
  const params = await context.params;
  const { teacherId, reportId } = params;

  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'reports',
      teacherId,
      reportId,
      'transcript.json'
    );

    console.log('트랜스크립트 파일 경로:', filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(fileContent));
  } catch (error) {
    console.error('트랜스크립트 파일 로드 오류:', error);
    return NextResponse.json(
      { error: '트랜스크립트를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }
} 