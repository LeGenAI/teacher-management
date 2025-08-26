import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

if (!process.env.AAI_API_KEY) {
  throw new Error('AAI_API_KEY가 설정되지 않았습니다.');
}

const assemblyai = new AssemblyAI({
  apiKey: process.env.AAI_API_KEY as string
});

export async function GET(req: NextRequest) {
  const transcriptId = req.nextUrl.searchParams.get('transcriptId');
  
  if (!transcriptId) {
    return NextResponse.json({ error: 'transcriptId is required' }, { status: 400 });
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
            const reportId = Date.now().toString();
            response.step = '분석 완료!';
            response.progress = 100;
            response.reportId = reportId;
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