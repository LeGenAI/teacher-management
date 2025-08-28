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

// FFmpeg 경로 설정 (OS 감지)
const FFMPEG_PATH = process.platform === 'win32' 
  ? 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
  : 'ffmpeg'; // macOS/Linux는 PATH에서 찾음

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

// reportId 저장을 위한 Map
const transcriptToReportIdMap = new Map<string, string>();

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
      // 하이라이트 관련 텍스트나 빈 줄은 제외
      if (point && 
          !point.includes('점:') && 
          !point.includes('하이라이트') && 
          !point.startsWith('시간:') &&
          !point.startsWith('교사:') &&
          !point.startsWith('학생:') &&
          !point.startsWith('이유:') &&
          !point.startsWith('유형:')) {
        개선점.push(point);
      }
    });
  }

  // 하이라이트 파싱 - 개선점에서 하이라이트 정보를 추출하고 제거
  const 하이라이트End = text.length;
  
  // 먼저 개선점에서 하이라이트 정보 추출
  let currentHighlight: Partial<AnalysisResult['highlights'][0]> = {};
  const improvedPoints: string[] = [];
  
  개선점.forEach(point => {
    if (point.includes('하이라이트') || point.startsWith('시간:') || point.startsWith('교사:') || 
        point.startsWith('학생:') || point.startsWith('이유:') || point.startsWith('유형:')) {
      
      if (point.startsWith('시간:')) {
        if (Object.keys(currentHighlight).length > 0 && currentHighlight.timestamp && currentHighlight.type) {
          highlights.push(currentHighlight as AnalysisResult['highlights'][0]);
          currentHighlight = {};
        }
        currentHighlight.timestamp = point.replace('시간:', '').trim();
      } else if (point.startsWith('교사:')) {
        currentHighlight.teacherText = point.replace('교사:', '').trim().replace(/^"/, '').replace(/"$/, '');
      } else if (point.startsWith('학생:')) {
        currentHighlight.studentText = point.replace('학생:', '').trim().replace(/^"/, '').replace(/"$/, '');
      } else if (point.startsWith('이유:')) {
        currentHighlight.reason = point.replace('이유:', '').trim();
      } else if (point.startsWith('유형:')) {
        const type = point.replace('유형:', '').trim();
        if (['개념이해', '적극참여', '긍정피드백'].includes(type)) {
          currentHighlight.type = type as '개념이해' | '적극참여' | '긍정피드백';
        }
      }
    } else {
      // 실제 개선점만 유지
      improvedPoints.push(point);
    }
  });
  
  // 마지막 하이라이트 추가
  if (Object.keys(currentHighlight).length > 0 && currentHighlight.timestamp && currentHighlight.type) {
    highlights.push(currentHighlight as AnalysisResult['highlights'][0]);
  }
  
  // 개선점 배열을 정제된 것으로 교체
  개선점.length = 0;
  개선점.push(...improvedPoints);
  
  // 기존 하이라이트 파싱 로직도 유지 (정상적인 형식의 경우)
  if (하이라이트Start !== -1) {
    const 하이라이트Text = text.slice(하이라이트Start, 하이라이트End);
    const 하이라이트Lines = 하이라이트Text.split('\n').slice(1);
    currentHighlight = {};

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
    console.log('📥 POST /api/analyze 요청 시작');
    
    const formData = await req.formData();
    const video = formData.get('video') as File;
    const teacherId = formData.get('teacherId') as string;
    const title = formData.get('title') as string;

    console.log('📋 받은 데이터:', {
      videoName: video?.name,
      videoSize: video?.size ? `${(video.size / 1024 / 1024).toFixed(2)}MB` : 'unknown',
      videoType: video?.type,
      teacherId,
      title
    });

    if (!video || !teacherId) {
      console.error('❌ 필수 필드 누락:', { video: !!video, teacherId: !!teacherId });
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 파일 타입 검증 - 비디오 파일만 허용
    const allowedVideoTypes = [
      'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
      'video/x-msvideo', 'video/webm', 'video/ogg'
    ];
    
    if (!allowedVideoTypes.includes(video.type)) {
      console.error(`❌ 지원하지 않는 파일 타입: ${video.type}`);
      return NextResponse.json({ 
        error: `지원하지 않는 파일 형식입니다. 비디오 파일(MP4, MOV, AVI 등)만 업로드 가능합니다. 현재 파일 타입: ${video.type}` 
      }, { status: 400 });
    }

    // 파일 확장자도 추가 검증
    const fileName = video.name.toLowerCase();
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      console.error(`❌ 지원하지 않는 파일 확장자: ${fileName}`);
      return NextResponse.json({ 
        error: `지원하지 않는 파일 확장자입니다. 비디오 파일(MP4, MOV, AVI 등)만 업로드 가능합니다.` 
      }, { status: 400 });
    }

    // reportId 생성
    const reportId = Date.now().toString();
    console.log('생성된 reportId:', reportId);  // reportId 로깅
    
    // 선생님별 디렉토리 생성 (teacherId를 선생님 이름으로 사용)
    const reportDir = path.join(
      process.cwd(),
      'public',
      'reports',
      teacherId, // 이미 선생님 이름이 전달됨
      reportId
    );

    await fs.mkdir(reportDir, { recursive: true });

    try {
      // 비디오 파일을 메모리에서만 처리 (저장하지 않음)
      const videoBuffer = Buffer.from(await video.arrayBuffer());
      const audioPath = path.join(reportDir, 'audio.mp3');
      // 임시 비디오 파일 경로 (오디오 추출용)
      const tempVideoPath = path.join(reportDir, 'temp_video.mp4');
      
      console.log(`📹 영상 파일 처리 중: ${video.name} (${(video.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // 상태 업데이트
      statusEmitter.get(reportId)?.('{"status":"uploading","progress":30,"step":"비디오 파일 처리 완료"}');

      // FFmpeg를 사용하여 비디오에서 오디오 추출
      try {
        // 임시 비디오 파일 생성 (오디오 추출 후 삭제)
        await writeFile(tempVideoPath, videoBuffer);
        
        const ffmpegCommand = `"${FFMPEG_PATH}" -i "${tempVideoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}"`;
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
      
      // 트랜스크립션 시작 (영어 원문 추출)
      const transcript = await assemblyai.transcripts.transcribe({
        audio: uploadResponse,
        
        // 기본 설정 - 영어로 변경
        language_code: 'en', // 영어 설정 (원문 추출)
        punctuate: true, // 구두점 추가
        format_text: true, // 텍스트 포맷팅
        
        // 화자 구분 설정 (완전 자동 감지)
        speaker_labels: true,
        // speakers_expected 제거 - AssemblyAI가 자동으로 화자 수 감지
        
        // 품질 향상 설정
        speech_model: 'best', // 최고 품질 모델 사용
        word_boost: ['teacher', 'student', 'math', 'problem', 'answer', 'calculation', 'fraction', 'multiplication', 'division'], // 교육 관련 영어 단어 부스트
        boost_param: 'high', // 단어 부스트 강도
        
        // 노이즈 감소 및 정확도 향상
        filter_profanity: false, // 교육 컨텍스트
        disfluencies: false, // "um", "uh" 같은 간투사 제거
        
        // 영어 특화 설정
        entity_detection: true, // 개체명 인식 활성화 (영어 정확도 향상)
        dual_channel: false,
        multichannel: false,
      });

      // transcriptId와 reportId 매핑 저장
      if (transcript.id) {
        transcriptToReportIdMap.set(transcript.id, reportId);
        console.log(`transcriptId ${transcript.id}를 reportId ${reportId}와 매핑`);
      }

      // 화자 구분 품질 확인 및 개선
      console.log(`🎤 화자 구분 결과:`, {
        totalUtterances: transcript.utterances?.length || 0,
        speakerA: transcript.utterances?.filter(u => u.speaker === "A").length || 0,
        speakerB: transcript.utterances?.filter(u => u.speaker === "B").length || 0,
        speakerC: transcript.utterances?.filter(u => u.speaker === "C").length || 0,
        otherSpeakers: transcript.utterances?.filter(u => !["A", "B", "C"].includes(u.speaker)).length || 0
      });

      // 화자 구분 품질 개선 (교육 상황 특화)
      const speakerACount = transcript.utterances?.filter(u => u.speaker === "A").length || 0;
      const totalUtterances = transcript.utterances?.length || 1;
      const speakerARatio = speakerACount / totalUtterances;

      if (transcript.utterances && transcript.utterances.length > 0) {
        // 교육 상황에 맞는 화자 구분 개선
        transcript.utterances = transcript.utterances.map((utterance, index) => {
          const text = utterance.text.trim();
          
          // 교사 패턴 감지
          const teacherPatterns = [
            /^(좋아요|잘했어|맞아요|그렇죠|네|자|이제|그럼|봅시다)/,
            /선생님|교사|설명|문제|질문/,
            /(어떻게|무엇을|왜|어디서).*(할까요|인가요|일까요)/,
            /답은|정답|계산|해결/
          ];
          
          // 학생 패턴 감지
          const studentPatterns = [
            /^(네|아니요|모르겠어요|잘 모르겠어요)/,
            /선생님|질문있어요|도와주세요/,
            /^[0-9]+$/, // 숫자만 있는 답변
            /(이해|못해|어려워|쉬워)/
          ];
          
          const isLikelyTeacher = teacherPatterns.some(pattern => pattern.test(text)) || 
                                 (text.length > 80 && !text.match(/^[0-9\s]+$/));
          const isLikelyStudent = studentPatterns.some(pattern => pattern.test(text)) ||
                                 (text.length < 30 && text.match(/^[0-9\s!?]+$/));
          
          if (isLikelyTeacher && utterance.speaker !== 'A') {
            return { ...utterance, speaker: 'A' };
          } else if (isLikelyStudent && utterance.speaker === 'A') {
            return { ...utterance, speaker: 'B' };
          }
          
          return utterance;
        });
        
        console.log(`🔧 교육 상황 맞춤 화자 구분 후처리 완료`);
      }

      // 트랜스크립션 데이터 저장
      const transcriptPath = path.join(reportDir, 'transcript.json');
      await fs.writeFile(transcriptPath, JSON.stringify(transcript, null, 2));
      statusEmitter.get(reportId)?.('{"status":"processing","progress":80,"step":"트랜스크립션 완료 (화자 구분 최적화됨)"}');

          // GPT-4.1-2025-04-14로 대화 분석 및 점수 산출 (한국어 교육 맥락 최적화)
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
        messages: [
          {
            role: "system",
            content: `당신은 한국어 교육 현장의 수업 대화를 분석하는 전문가입니다. 
                       음성인식 결과에 일부 오류가 있을 수 있으니, 전체적인 맥락을 파악하여 분석해주세요.
                       영어로 추출된 음성인식 결과를 받아서 한국어 교육 상황으로 이해하고 분석해주세요.
                       
                       다음 5개 항목을 0-20점으로 평가하고, 반드시 아래 형식으로만 응답해주세요:

                        학생 참여: [숫자]
                        개념 설명: [숫자]
                        피드백: [숫자]
                        체계성: [숫자]
                        상호작용: [숫자]

                        우수점:
                        - [구체적인 우수한 점 1]
                        - [구체적인 우수한 점 2]
                        - [구체적인 우수한 점 3]

                        개선점:
                        - [구체적인 개선할 점 1]
                        - [구체적인 개선할 점 2]
                        - [구체적인 개선할 점 3]

                        하이라이트:
                        시간: [MM:SS 형식]
                        교사: [교사의 실제 발화 내용]
                        학생: [학생의 실제 발화 내용]
                        이유: [이 상호작용이 교육적으로 의미있는 구체적 이유]
                        유형: [개념이해/적극참여/긍정피드백 중 하나]
                        
                        시간: [MM:SS 형식]
                        교사: [교사의 실제 발화 내용]
                        학생: [학생의 실제 발화 내용]
                        이유: [이 상호작용이 교육적으로 의미있는 구체적 이유]
                        유형: [개념이해/적극참여/긍정피드백 중 하나]
                        
                        IMPORTANT: 하이라이트 정보는 반드시 '하이라이트:' 섹션 아래에만 작성하고, 개선점 섹션에는 포함하지 마세요.

                        평가 기준:
                        - 학생 참여: 학생들의 적극적 발언, 질문, 반응 정도
                        - 개념 설명: 교사의 명확하고 체계적인 개념 전달
                        - 피드백: 학생 답변에 대한 적절하고 건설적인 피드백
                        - 체계성: 수업의 논리적 흐름과 구조
                        - 상호작용: 교사-학생, 학생-학생 간 활발한 소통

                        평가 기준:
                         - 15-20점: 탁월한 성과
                         - 10-14점: 기본 요구사항 충족
                         - 5-9점: 개선 필요
                         - 0-4점: 심각한 문제
                        
                        주의사항:
                        - 영어로 추출된 음성인식 결과이지만 실제로는 한국어 수업임을 고려
                        - 음성인식 오류로 인한 반복/오타는 무시하고 전체 맥락으로 판단
                        - 실제 교육 상황의 자연스러운 대화 특성을 고려
                        - 최소 2-3개의 의미있는 하이라이트 포함`
          },
          {
            role: "user",
            content: `다음은 실제 수업 대화 내용입니다 (영어로 추출되었지만 실제로는 한국어 수업):

=== 교사 발화 (화자 A) ===
${transcript.utterances?.filter(msg => msg.speaker === "A").map((msg, idx) => 
  `[${Math.floor(msg.start / 1000 / 60)}:${String(Math.floor((msg.start / 1000) % 60)).padStart(2, '0')}] ${msg.text}`
).join('\n')}

=== 학생 발화 (화자 B, C 등) ===
${transcript.utterances?.filter(msg => msg.speaker !== "A").map((msg, idx) => 
  `[${Math.floor(msg.start / 1000 / 60)}:${String(Math.floor((msg.start / 1000) % 60)).padStart(2, '0')}] 화자 ${msg.speaker}: ${msg.text}`
).join('\n')}

=== 전체 대화 흐름 (시간순) ===
${transcript.utterances?.slice(0, 20).map((msg, idx) => 
  `[${Math.floor(msg.start / 1000 / 60)}:${String(Math.floor((msg.start / 1000) % 60)).padStart(2, '0')}] ${msg.speaker === 'A' ? '교사' : '학생'}: ${msg.text}`
).join('\n')}

총 발화 수: ${transcript.utterances?.length || 0}개
교사 발화 비율: ${Math.round((transcript.utterances?.filter(msg => msg.speaker === "A").length || 0) / (transcript.utterances?.length || 1) * 100)}%
학생 발화 비율: ${Math.round((transcript.utterances?.filter(msg => msg.speaker !== "A").length || 0) / (transcript.utterances?.length || 1) * 100)}%

주의: 위 대화 내용은 영어로 음성인식된 결과이지만, 실제로는 한국어 수업 상황입니다. 맥락을 고려하여 분석해주세요.`
          }
        ]
      });

      // 분석 결과 저장
      if (analysisResponse.choices[0].message?.content) {
        const analysisResult = parseAnalysisResult(analysisResponse.choices[0].message.content);
        
        // FFmpeg를 사용해서 비디오 재생 시간 추출
        let videoDuration = null;
        try {
          const { stdout } = await execAsync(`${FFMPEG_PATH} -i "${tempVideoPath}" -f null - 2>&1 | grep "Duration" | head -n 1 | sed 's/.*Duration: \\([^,]*\\).*/\\1/'`);
          const durationMatch = stdout.trim();
          if (durationMatch && durationMatch.includes(':')) {
            videoDuration = durationMatch;
            console.log(`비디오 재생 시간: ${videoDuration}`);
          }
        } catch (error) {
          console.warn('비디오 재생 시간 추출 실패:', error);
          // 트랜스크립션 데이터에서 총 길이 추정
          if (transcript.utterances && transcript.utterances.length > 0) {
            const lastUtterance = transcript.utterances[transcript.utterances.length - 1];
            const totalSeconds = Math.ceil(lastUtterance.end / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            videoDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            console.log(`트랜스크립션에서 추정한 재생 시간: ${videoDuration}`);
          }
        }
        
        // 제목과 메타데이터 추가
        const analysisWithMeta = {
          ...analysisResult,
          title: title || video.name.replace(/\.[^/.]+$/, ""), // 제목 또는 파일명 (확장자 제거)
          teacherId: teacherId,
          uploadDate: new Date().toISOString(),
          filename: video.name,
          fileSize: video.size,
          videoDuration: videoDuration // 실제 비디오 재생 시간 추가
        };
        
        const analysisPath = path.join(reportDir, 'analysis.json');
        
        // UTF-8 BOM 추가
        const jsonString = JSON.stringify(analysisWithMeta, null, 2);
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
        fs.unlink(tempVideoPath).catch(e => console.error('임시 비디오 파일 삭제 실패:', e)),
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
      const tempVideoPath = path.join(reportDir, 'temp_video.mp4');
      const audioPath = path.join(reportDir, 'audio.mp3');
      
      await Promise.all([
        fs.unlink(tempVideoPath).catch(() => {}),
        fs.unlink(audioPath).catch(() => {})
      ]);

      throw error;
    }

  } catch (error) {
    console.error('❌ 분석 오류 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.stack : undefined
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