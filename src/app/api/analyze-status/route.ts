import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';
import fs from 'fs/promises';
import path from 'path';

if (!process.env.AAI_API_KEY) {
  throw new Error('AAI_API_KEY가 설정되지 않았습니다.');
}

const assemblyai = new AssemblyAI({
  apiKey: process.env.AAI_API_KEY as string
});

// 파일 시스템에서 transcriptId로 reportId 찾기
async function findReportIdByTranscriptId(transcriptId: string, teacherId: string): Promise<string | null> {
  try {
    const reportsDir = path.join(process.cwd(), 'public', 'reports', teacherId);
    const reportDirs = await fs.readdir(reportsDir);
    
    for (const reportId of reportDirs) {
      const transcriptPath = path.join(reportsDir, reportId, 'transcript.json');
      try {
        const transcriptContent = await fs.readFile(transcriptPath, 'utf8');
        const transcript = JSON.parse(transcriptContent);
        if (transcript.id === transcriptId) {
          return reportId;
        }
      } catch {
        // 파일이 없거나 파싱 오류 - 무시하고 계속
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const transcriptId = req.nextUrl.searchParams.get('transcriptId');
  const teacherId = req.nextUrl.searchParams.get('teacherId');
  
  if (!transcriptId) {
    return NextResponse.json({ error: 'transcriptId is required' }, { status: 400 });
  }

  if (!teacherId) {
    return NextResponse.json({ error: 'teacherId is required' }, { status: 400 });
  }

  try {
    const transcriptResult = await assemblyai.transcripts.get(transcriptId);
    
    let response = {
      status: transcriptResult.status,
      progress: 0,
      step: '',
      reportId: null as string | null
    };

    switch (transcriptResult.status) {
      case 'queued':
        response.step = '분석 대기 중...';
        response.progress = 20;
        break;
      case 'processing':
        response.step = '음성을 텍스트로 변환 중...';
        response.progress = 50;
        break;
      case 'completed':
        if (!transcriptResult.utterances || transcriptResult.utterances.length === 0) {
          response.step = '텍스트 처리 중...';
          response.progress = 70;
        } else {
          response.step = 'AI 분석 중...';
          response.progress = 90;
          
          try {
            // 파일 시스템에서 reportId 찾기
            const foundReportId = await findReportIdByTranscriptId(transcriptId, teacherId);
            if (foundReportId) {
              // 분석 파일이 실제로 존재하는지 확인
              const analysisPath = path.join(
                process.cwd(),
                'public',
                'reports',
                teacherId,
                foundReportId,
                'analysis.json'
              );
              
              try {
                await fs.access(analysisPath);
                response.step = '분석 완료!';
                response.progress = 100;
                response.reportId = foundReportId;
                response.status = 'completed';
              } catch {
                // 파일이 없으면 아직 분석 중
                response.step = 'AI 분석 중...';
                response.progress = 90;
              }
            } else {
              // reportId가 없으면 아직 분석 중
              response.step = 'AI 분석 중...';
              response.progress = 90;
            }
          } catch (error) {
            console.error('Analysis error:', error);
            response.step = '분석 중 오류 발생';
            response.status = 'error';
          }
        }
        break;
      case 'error':
        throw new Error('트랜스크립션 실패');
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: '상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 