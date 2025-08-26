import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AssemblyAI } from 'assemblyai';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { Readable } from 'stream';

const execAsync = promisify(exec);

// FFmpeg 경로 설정
const FFMPEG_PATH = 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AssemblyAI 클라이언트 초기화
if (!process.env.AAI_API_KEY) {
  throw new Error('AAI_API_KEY가 설정되지 않았습니다.');
}

const assemblyai = new AssemblyAI({
  apiKey: process.env.AAI_API_KEY as string
});

// 상태 업데이트를 위한 EventEmitter
const statusEmitter = new Map<string, (data: string) => void>();

// 평가 점수 타입 정의
interface AnalysisResult {
  scores: Record<string, number>;
  우수점: string[];
  개선점: string[];
  highlights: {
    timestamp: string;
    teacherText: string;
    studentText: string;
    reason: string;
    type: '개념이해' | '적극참여' | '긍정피드백';
  }[];
}

// OpenAI 응답을 파싱하여 구조화된 데이터로 변환
function parseAnalysisResult(text: string): AnalysisResult {
  const scores: Record<string, number> = {};
  const 우수점: string[] = [];
  const 개선점: string[] = [];
  const highlights: AnalysisResult['highlights'] = [];

  // 점수 파싱
  const scoreLines = text.match(/[^:\n]+:\s*\d+/g) || [];
  for (const line of scoreLines) {
    const [category, scoreStr] = line.split(':').map(s => s.trim());
    const score = parseInt(scoreStr);
    if (!isNaN(score)) {
      switch (category) {
        case '학생 참여':
          scores['학생_참여도'] = score;
          break;
        case '개념 설명':
          scores['개념_설명'] = score;
          break;
        case '피드백':
          scores['피드백'] = score;
          break;
        case '체계성':
          scores['수업_체계성'] = score;
          break;
        case '상호작용':
          scores['상호작용'] = score;
          break;
      }
    }
  }

  // 우수점 파싱
  const 우수점Start = text.indexOf('우수점:');
  const 우수점End = text.indexOf('개선점:');
  if (우수점Start !== -1 && 우수점End !== -1) {
    const 우수점Text = text.slice(우수점Start, 우수점End);
    const 우수점Lines = 우수점Text.split('\n').slice(1);
    우수점Lines.forEach(line => {
      const point = line.replace(/^[- \d.]+/, '').trim();
      if (point && !point.includes('점:')) {
        우수점.push(point);
      }
    });
  }

  // 개선점 파싱
  const 개선점Start = text.indexOf('개선점:');
  const 하이라이트Start = text.indexOf('하이라이트:');
  if (개선점Start !== -1) {
    const 개선점End = 하이라이트Start !== -1 ? 하이라이트Start : text.length;
    const 개선점Text = text.slice(개선점Start, 개선점End);
    const 개선점Lines = 개선점Text.split('\n').slice(1);
    개선점Lines.forEach(line => {
      const point = line.replace(/^[- \d.]+/, '').trim();
      if (point && !point.includes('점:')) {
        개선점.push(point);
      }
    });
  }

  // 하이라이트 파싱
  const 하이라이트End = text.length;
  if (하이라이트Start !== -1) {
    const 하이라이트Text = text.slice(하이라이트Start, 하이라이트End);
    const 하이라이트Lines = 하이라이트Text.split('\n').slice(1);
    let currentHighlight: Partial<AnalysisResult['highlights'][0]> = {};

    하이라이트Lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (trimmedLine.startsWith('시간:')) {
        if (Object.keys(currentHighlight).length > 0) {
          highlights.push(currentHighlight as AnalysisResult['highlights'][0]);
          currentHighlight = {};
        }
        currentHighlight.timestamp = trimmedLine.replace('시간:', '').trim();
      } else if (trimmedLine.startsWith('교사:')) {
        currentHighlight.teacherText = trimmedLine.replace('교사:', '').trim();
      } else if (trimmedLine.startsWith('학생:')) {
        currentHighlight.studentText = trimmedLine.replace('학생:', '').trim();
      } else if (trimmedLine.startsWith('이유:')) {
        currentHighlight.reason = trimmedLine.replace('이유:', '').trim();
      } else if (trimmedLine.startsWith('유형:')) {
        const type = trimmedLine.replace('유형:', '').trim();
        if (['개념이해', '적극참여', '긍정피드백'].includes(type)) {
          currentHighlight.type = type as '개념이해' | '적극참여' | '긍정피드백';
        }
      }
    });

    if (Object.keys(currentHighlight).length > 0) {
      highlights.push(currentHighlight as AnalysisResult['highlights'][0]);
    }
  }

  return { scores, 우수점, 개선점, highlights };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const video = formData.get('video') as File;
    const teacherId = formData.get('teacherId') as string;

    if (!video || !teacherId) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // reportId 생성
    const reportId = Date.now().toString();
    console.log('생성된 reportId:', reportId);  // reportId 로깅
    
    // 디렉토리 생성
    const reportDir = path.join(
      process.cwd(),
      'public',
      'reports',
      teacherId,
      reportId
    );

    await fs.mkdir(reportDir, { recursive: true });

    try {
      // 비디오 파일 저장
      const videoBuffer = Buffer.from(await video.arrayBuffer());
      const videoPath = path.join(reportDir, 'video.mp4');
      const audioPath = path.join(reportDir, 'audio.mp3');
      
      await writeFile(videoPath, videoBuffer);
      
      // 상태 업데이트
      statusEmitter.get(reportId)?.('{"status":"uploading","progress":30,"step":"비디오 파일 저장 완료"}');

      // FFmpeg를 사용하여 비디오에서 오디오 추출
      try {
        const ffmpegCommand = `"${FFMPEG_PATH}" -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}"`;
        console.log('FFmpeg 명령어:', ffmpegCommand);
        
        const { stdout, stderr } = await execAsync(ffmpegCommand);
        console.log('FFmpeg 출력:', stdout);
        if (stderr) console.error('FFmpeg 오류:', stderr);
        
        statusEmitter.get(reportId)?.('{"status":"processing","progress":50,"step":"오디오 추출 완료"}');
      } catch (error) {
        console.error('오디오 추출 오류:', error);
        throw new Error(`오디오 추출에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }

      // 오디오 파일을 읽어서 AssemblyAI로 전송
      const audioBuffer = await fs.readFile(audioPath);
      const uploadResponse = await assemblyai.files.upload(audioBuffer);
      statusEmitter.get(reportId)?.('{"status":"processing","progress":70,"step":"오디오 파일 업로드 완료"}');
      
      // 트랜스크립션 시작
      const transcript = await assemblyai.transcripts.transcribe({
        audio: uploadResponse,
        speaker_labels: true,
        speakers_expected: 3
      });

      // 트랜스크립션 데이터 저장
      const transcriptPath = path.join(reportDir, 'transcript.json');
      await fs.writeFile(transcriptPath, JSON.stringify(transcript, null, 2));
      statusEmitter.get(reportId)?.('{"status":"processing","progress":80,"step":"트랜스크립션 완료"}');

      // GPT-4로 대화 분석 및 점수 산출
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `당신은 수업 대화를 분석하는 전문가입니다. 다음 항목들을 평가해주세요.
                       반드시 아래와 같은 형식으로만 응답해주세요:

                        학생 참여: [숫자]
                        개념 설명: [숫자]
                        피드백: [숫자]
                        체계성: [숫자]
                        상호작용: [숫자]

                        우수점:
                        - [우수한 점 1]
                        - [우수한 점 2]
                        - [우수한 점 3]

                        개선점:
                        - [개선할 점 1]
                        - [개선할 점 2]
                        - [개선할 점 3]

                        하이라이트:
                        시간: [대화가 발생한 시점]
                        교사: [교사의 발화]
                        학생: [학생의 발화]
                        이유: [이 상호작용이 긍정적인 이유]
                        유형: [개념이해/적극참여/긍정피드백 중 하나]

                        시간: [다음 하이라이트의 시점]
                        교사: [교사의 발화]
                        학생: [학생의 발화]
                        이유: [이 상호작용이 긍정적인 이유]
                        유형: [개념이해/적극참여/긍정피드백 중 하나]

                        평가 기준:
                        - 15-20점: 탁월한 성과
                        - 10-14점: 기본 요구사항 충족
                        - 5-9점: 개선 필요
                        - 0-4점: 심각한 문제

                        각 항목은 0-20점 사이의 정수로 평가해주세요.
                        반드시 하나 이상의 하이라이트를 포함해주세요.`
          },
          {
            role: "user",
            content: `교사 발화: ${transcript.utterances?.filter(msg => msg.speaker === "A").map(msg => msg.text).join('\n')}
                        학생 발화: ${transcript.utterances?.filter(msg => msg.speaker !== "A").map(msg => msg.text).join('\n')}`
          }
        ]
      });

      // 분석 결과 저장
      if (analysisResponse.choices[0].message?.content) {
        const analysisResult = parseAnalysisResult(analysisResponse.choices[0].message.content);
        const analysisPath = path.join(reportDir, 'analysis.json');
        
        // UTF-8 BOM 추가
        const jsonString = JSON.stringify(analysisResult, null, 2);
        const bomPrefix = Buffer.from([0xEF, 0xBB, 0xBF]);
        const contentBuffer = Buffer.concat([
          bomPrefix,
          Buffer.from(jsonString, 'utf8')
        ]);
        
        await fs.writeFile(analysisPath, contentBuffer);
        console.log('분석 결과 저장 완료. reportId:', reportId);  // reportId 로깅
      }

      // 임시 파일 정리
      await Promise.all([
        fs.unlink(videoPath).catch(e => console.error('비디오 파일 삭제 실패:', e)),
        fs.unlink(audioPath).catch(e => console.error('오디오 파일 삭제 실패:', e))
      ]);

      // 응답에 reportId 포함
      const response = {
        status: 'completed',
        transcriptId: transcript.id,
        reportId: reportId
      };
      console.log('분석 API 응답:', response);  // 응답 로깅
      return NextResponse.json(response);

    } catch (error) {
      // 오류 발생 시 임시 파일 정리
      const videoPath = path.join(reportDir, 'video.mp4');
      const audioPath = path.join(reportDir, 'audio.mp3');
      
      await Promise.all([
        fs.unlink(videoPath).catch(() => {}),
        fs.unlink(audioPath).catch(() => {})
      ]);

      throw error;
    }

  } catch (error) {
    console.error('분석 오류:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const reportId = searchParams.get('reportId');

  if (!reportId) {
    return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
  }

  // SSE 연결을 위한 응답
  const stream = new ReadableStream({
    start(controller) {
      statusEmitter.set(reportId, (data: string) => {
        controller.enqueue(`data: ${data}\n\n`);
      });

      // 초기 상태 전송
      controller.enqueue('data: {"status":"connected","progress":0}\n\n');
    },
    cancel() {
      statusEmitter.delete(reportId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false
  }
}; 