import assemblyai as aai
from pydub import AudioSegment
import os
import subprocess
from config import AAI_API_KEY
from typing import List, Dict
import sys

def convert_mp4_to_mp3(mp4_path, mp3_path):
    """MP4 파일을 MP3로 변환 (ffmpeg 사용)"""
    command = f'ffmpeg -i "{mp4_path}" -q:a 0 -map a "{mp3_path}"'
    try:
        subprocess.call(command, shell=True)
    except Exception as e:
        print(f"Error converting file: {str(e)}")
        return False
    return True

def split_audio(mp3_path, chunk_duration=10):
    """MP3 파일을 지정된 시간(분) 단위로 분할"""
    audio = AudioSegment.from_mp3(mp3_path)
    chunks = []
    
    # 분할 크기 계산 (밀리초 단위)
    chunk_length_ms = chunk_duration * 60 * 1000
    
    # 오디오 분할
    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        chunk_path = f"chunk_{i//chunk_length_ms}.mp3"
        chunk.export(chunk_path, format="mp3")
        chunks.append(chunk_path)
    
    return chunks

def transcribe_audio(file_path, api_key):
    """오디오 파일을 텍스트로 변환"""
    aai.settings.api_key = api_key
    transcriber = aai.Transcriber()
    
    # 화자 구분을 위한 설정 (지원되는 파라미터만 사용)
    config = aai.TranscriptionConfig(
        speaker_labels=True,
        speakers_expected=3
    )
    
    transcript = transcriber.transcribe(file_path, config=config)
    if transcript.status == aai.TranscriptStatus.error:
        return f"Error: {transcript.error}"
    
    return _analyze_speaker_patterns(transcript.utterances)

def _analyze_speaker_patterns(utterances) -> List[Dict]:
    """화자 패턴 분석을 통한 교사/학생 구분"""
    speaker_stats = {}
    
    # 1단계: 통계 수집 및 교사 특징 분석
    for utterance in utterances:
        speaker = utterance.speaker
        text = utterance.text
        
        if speaker not in speaker_stats:
            speaker_stats[speaker] = {
                "말한_횟수": 0,
                "총_발화_길이": 0,
                "교사_특징_점수": 0
            }
        
        # 기본 통계
        speaker_stats[speaker]["말한_횟수"] += 1
        speaker_stats[speaker]["총_발화_길이"] += len(text)
        
        # 교사 특징 점수 계산
        teacher_patterns = [
            "let's", "look at", "can anyone", "tell me",
            "does anyone", "remember", "explain",
            "understand", "question", "next",
            "class", "everyone", "please"
        ]
        
        for pattern in teacher_patterns:
            if pattern in text.lower():
                speaker_stats[speaker]["교사_특징_점수"] += 1
    
    # 2단계: 교사 식별
    teacher_speaker = None
    max_teacher_score = -1
    
    for speaker, stats in speaker_stats.items():
        if stats["말한_횟수"] > 0:
            avg_length = stats["총_발화_길이"] / stats["말한_횟수"]
            teacher_score = (
                stats["교사_특징_점수"] * 2 +  # 교사 특징 가중치
                avg_length * 0.5 +            # 평균 발화 길이 가중치
                stats["말한_횟수"] * 0.3       # 발화 빈도 가중치
            )
            
            if teacher_score > max_teacher_score:
                max_teacher_score = teacher_score
                teacher_speaker = speaker
    
    # 3단계: 결과 변환 (교사/학생으로만 구분)
    processed_utterances = []
    for utterance in utterances:
        speaker_role = "Teacher" if utterance.speaker == teacher_speaker else "Student"
        processed_utterances.append({
            "speaker": speaker_role,
            "text": utterance.text
        })
    
    return processed_utterances

def main(input_video_path, teacher_id):
    try:
        # API 키 설정
        API_KEY = AAI_API_KEY
        
        # 동적 출력 경로 설정
        base_dir = os.path.join(os.path.dirname(input_video_path), 'outputs', teacher_id)
        os.makedirs(base_dir, exist_ok=True)
        
        mp3_file = os.path.join(base_dir, 'output.mp3')
        transcript_file = os.path.join(base_dir, 'transcript.txt')
        
        # 대화 내용을 텍스트 파일로 저장
        try:
            with open(transcript_file, 'w', encoding='utf-8') as f:
                f.write("#Lecture transcript\n\n")  # 파일 초기화
        except Exception as e:
            print(f"파일 생성 중 오류 발생: {str(e)}")
            raise
        
        print("Progress: 10")  # 초기 설정 완료
        
        # MP4를 MP3로 변환
        convert_mp4_to_mp3(input_video_path, mp3_file)
        print("Progress: 30")  # 변환 완료
        
        # MP3 파일 분할
        chunks = split_audio(mp3_file)
        print("Progress: 40")  # 분할 완료
        
        total_chunks = len(chunks)
        for i, chunk in enumerate(chunks):
            utterances = transcribe_audio(chunk, API_KEY)
            progress = int(40 + (i / total_chunks * 50))  # 40%에서 90%까지 진행
            print(f"Progress: {progress}")
            
            # 변환된 내용을 바로 파일에 추가
            try:
                with open(transcript_file, 'a', encoding='utf-8') as f:
                    for utterance in utterances:
                        # 단순화된 화자 구분 (Teacher/Student)
                        speaker = "Teacher" if utterance.get("speaker") == "Teacher" else "Student"
                        f.write(f"{speaker}: {utterance.get('text')}\n")
            except Exception as e:
                print(f"파일 저장 중 오류 발생: {str(e)}")
                raise
                
            # 청크 파일 삭제
            os.remove(chunk)
        
        # 임시 MP3 파일 삭제
        os.remove(mp3_file)
        print(f"변환된 텍스트가 {transcript_file}에 저장되었습니다.")
        
        print("Progress: 100")  # 완료
        
        return {
            "transcript_path": transcript_file,
            "status": "completed"
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python text_transcript.py <video_path> <teacher_id>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    teacher_id = sys.argv[2]
    main(video_path, teacher_id)
