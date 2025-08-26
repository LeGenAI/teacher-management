import { NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

if (!process.env.AAI_API_KEY) {
  throw new Error('AAI_API_KEY is not defined');
}

const client = new AssemblyAI({
  apiKey: process.env.AAI_API_KEY
});

interface ProcessedData {
  대화_세션: Array<{speaker: string; text: string}>;
  교사_발화: string[];
  학생_발화: string[];
  핵심_지표: {
    질문_횟수: number;
    피드백_횟수: number;
    칭찬_횟수: number;
    설명_횟수: number;
  };
}

function processTranscript(utterances: any[]): ProcessedData {
  const processedData: ProcessedData = {
    대화_세션: [],
    교사_발화: [],
    학생_발화: [],
    핵심_지표: {
      질문_횟수: 0,
      피드백_횟수: 0,
      칭찬_횟수: 0,
      설명_횟수: 0
    }
  };

  utterances.forEach(utterance => {
    const { speaker, text } = utterance;
    
    // 대화 세션 추가
    processedData.대화_세션.push({ speaker, text });
    
    // 화자별 발화 분류
    if (speaker === 'Teacher') {
      processedData.교사_발화.push(text);
      
      // 핵심 지표 분석
      if (text.includes('?')) {
        processedData.핵심_지표.질문_횟수++;
      }
      
      const 피드백_키워드 = ['그렇죠', '맞아요', '좋아요', '다시'];
      if (피드백_키워드.some(keyword => text.includes(keyword))) {
        processedData.핵심_지표.피드백_횟수++;
      }
      
      const 칭찬_키워드 = ['잘했어', '훌륭해', '대단해', '좋은'];
      if (칭찬_키워드.some(keyword => text.includes(keyword))) {
        processedData.핵심_지표.칭찬_횟수++;
      }
      
      const 설명_키워드 = ['즉', '때문에', '따라서', '예를 들어'];
      if (설명_키워드.some(keyword => text.includes(keyword))) {
        processedData.핵심_지표.설명_횟수++;
      }
    } else {
      processedData.학생_발화.push(text);
    }
  });

  return processedData;
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const video = data.get('video') as File;
    const teacherId = data.get('teacherId') as string;

    if (!video || !teacherId) {
      return new NextResponse('필수 필드가 누락되었습니다.', { status: 400 });
    }

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const audioFile = await client.files.upload(buffer);
    const transcript = await client.transcripts.transcribe({
      audio: audioFile,
      speaker_labels: true,
      speakers_expected: 3
    });

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    const processedData = processTranscript(transcript.utterances || []);
    
    // 현재 시간을 reportId로 사용
    const reportId = Date.now().toString();

    return NextResponse.json({
      status: 'completed',
      reportId,
      teacherId,
      data: processedData
    });

  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse(
      `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};
