from typing import Dict, List, Tuple
import re
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
import config as config

class TeachingDataProcessor:
    def __init__(self, raw_text: str):
        self.raw_text = raw_text
        self.llm = ChatOpenAI(
            api_key=config.OPENAI_API_KEY,
            model="gpt-4.1-2025-04-14",
            temperature=0
        )
        self.processed_data = {
            "대화_세션": [],
            "교사_발화": [], 
            "학생_발화": [],
            "수업_주제": set(),
            "상호작용_패턴": [],
            "핵심_지표": {
                "질문_횟수": 0,
                "피드백_횟수": 0,
                "칭찬_횟수": 0,
                "설명_횟수": 0
            },
            "교사_전략": {
                "스캐폴딩": [],
                "질문_유형": {
                    "지식": 0,
                    "이해": 0,
                    "적용": 0,
                    "분석": 0,
                    "종합": 0,
                    "평가": 0
                },
                "개념_설명_전략": [],
                "오개념_교정": []
            },
            "학생_참여": {
                "자발적_질문": 0,
                "토론_참여": 0,
                "문제해결_시도": 0
            },
            "피드백_분석": {
                "즉각_피드백": 0,
                "지연_피드백": 0,
                "긍정_강화": 0,
                "교정_피드백": 0
            },
            "질적_분석": {
                "교사_전문성": [],
                "수업_담화": [],
                "학습_환경": []
            }
        }
        self.CHUNK_SIZE = 100

    def analyze_chunk_with_llm(self, chunk: List[Tuple[str, str]]) -> Dict:
        """LLM을 사용한 대화 청크 질적 분석"""
        conversation_text = "\n".join([f"{speaker}: {text}" for speaker, text in chunk])
        
        prompt = """
다음 수업 대화를 분석하여 세 가지 관점에서 평가해주세요:

1. 교사 전문성
- 개념 설명의 명확성
- 학생 이해도 점검
- 교사 전략의 적절성

2. 수업 담화
- 대화의 질
- 질문의 수준
- 피드백의 효과성

3. 학습 환경
- 학생 참여도
- 상호작용의 질
- 수업 분위기

대화 내용:
{conversations}

각 관점별로 구체적인 예시와 함께 분석해주세요.
"""

        response = self.llm.invoke([
            SystemMessage(content="당신은 교육 평가 전문가입니다."),
            HumanMessage(content=prompt.format(conversations=conversation_text))
        ])
        
        return self._parse_llm_analysis(response.content)

    def _parse_llm_analysis(self, response: str) -> Dict:
        """LLM 응답 파싱"""
        analysis = {
            "교사_전문성": [],
            "수업_담화": [],
            "학습_환경": []
        }
        
        current_section = None
        
        for line in response.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            if "교사 전문성" in line:
                current_section = "교사_전문성"
            elif "수업 담화" in line:
                current_section = "수업_담화"
            elif "학습 환경" in line:
                current_section = "학습_환경"
            elif current_section and line.startswith('-'):
                analysis[current_section].append(line[1:].strip())
        
        return analysis

    def extract_conversations(self) -> List[Tuple[str, str]]:
        """대화 세션과 화자별 발화를 추출"""
        lines = self.raw_text.split('\n')
        conversations = []
        teacher_utterances = []
        student_utterances = []
        
        current_speaker = ""
        current_text = ""
        
        for line in lines:
            # 화자 구분을 위한 패턴 체크
            if ": " in line:  # 콜론과 공백으로 구분
                # 이전 대화가 있으면 저장
                if current_speaker and current_text:
                    conversations.append((current_speaker, current_text.strip()))
                    if current_speaker == "Teacher":
                        teacher_utterances.append(current_text.strip())
                    else:
                        student_utterances.append(current_text.strip())
                
                # 새로운 대화 시작
                parts = line.split(": ", 1)  # 최대 1번만 분할
                current_speaker = "Teacher" if "teacher" in parts[0].lower() else "Student"
                current_text = parts[1]
            else:
                # 현재 발화에 텍스트 추가
                if current_text:  # 현재 진행 중인 발화가 있는 경우에만
                    current_text += " " + line.strip()
        
        # 마지막 대화 처리
        if current_speaker and current_text:
            conversations.append((current_speaker, current_text.strip()))
            if current_speaker == "Teacher":
                teacher_utterances.append(current_text.strip())
            else:
                student_utterances.append(current_text.strip())
        
        # 결과 저장
        self.processed_data["대화_세션"] = conversations
        self.processed_data["교사_발화"] = teacher_utterances
        self.processed_data["학생_발화"] = student_utterances
        
        print(f"추출된 교사 발화 수: {len(teacher_utterances)}")
        print(f"추출된 학생 발화 수: {len(student_utterances)}")
        
        return conversations

    def analyze_teaching_patterns(self) -> Dict:
        """교수 패턴 심층 분석"""
        for speaker, text in self.processed_data["대화_세션"]:
            if speaker == "Teacher":
                # 스캐폴딩 분석
                scaffolding_patterns = [
                    (r"let'?s break this down", "단계별 분해"),
                    (r"remember when we", "이전 학습 연계"),
                    (r"think about what happens if", "사고 확장"),
                    (r"can you explain why", "설명 유도")
                ]
                for pattern, strategy in scaffolding_patterns:
                    if re.search(pattern, text, re.IGNORECASE):
                        self.processed_data["교사_전략"]["스캐폴딩"].append({
                            "전략": strategy,
                            "예시": text
                        })

                # 질문 유형 분석 (블룸의 분류)
                if "what is" in text.lower():
                    self.processed_data["교사_전략"]["질문_유형"]["지식"] += 1
                elif "why do you think" in text.lower():
                    self.processed_data["교사_전략"]["질문_유형"]["분석"] += 1
                # ... 기타 질문 유형 분석

            elif speaker in ["Michael", "Abby"]:
                # 학생 참여 분석
                if "?" in text:
                    self.processed_data["학생_참여"]["자발적_질문"] += 1
                if "i think" in text.lower():
                    self.processed_data["학생_참여"]["문제해결_시도"] += 1

        return self.processed_data["교사_전략"]

    def analyze_feedback_patterns(self):
        """피드백 패턴 상세 분석"""
        conversations = self.processed_data["대화_세션"]
        for i, (speaker, text) in enumerate(conversations):
            if speaker == "Teacher":
                # 즉각 피드백 분석
                if i > 0 and conversations[i-1][0] in ["Michael", "Abby"]:
                    self.processed_data["피드백_분석"]["즉각_피드백"] += 1
                    
                # 피드백 유형 분석
                if any(word in text.lower() for word in ["good", "excellent", "right"]):
                    self.processed_data["피드백_분석"]["긍정_강화"] += 1
                elif "instead" in text.lower() or "try" in text.lower():
                    self.processed_data["피드백_분석"]["교정_피드백"] += 1

    def extract_subjects(self) -> set:
        """Extract lesson topics in chunks"""
        subjects = set()
        keywords = ["fraction", "multiply", "divide", "add", "subtract", 
                   "equation", "problem solving", "pizza", "pumpkin"]
        
        conversations = self.processed_data["대화_세션"]
        chunks = [conversations[i:i + self.CHUNK_SIZE] 
                 for i in range(0, len(conversations), self.CHUNK_SIZE)]
                 
        for chunk in chunks:
            for _, text in chunk:
                for keyword in keywords:
                    if keyword in text.lower():
                        subjects.add(keyword)
        
        self.processed_data["수업_주제"] = subjects
        return subjects

    def process(self) -> Dict:
        """전체 처리 프로세스"""
        # 1. 기존 정량적 분석
        self.extract_conversations()
        self.analyze_teaching_patterns()
        self.analyze_feedback_patterns()
        self.extract_subjects()
        
        # 2. 새로운 질적 분석
        chunks = [self.processed_data["대화_세션"][i:i + self.CHUNK_SIZE] 
                 for i in range(0, len(self.processed_data["대화_세션"]), self.CHUNK_SIZE)]
        
        for chunk in chunks:
            analysis = self.analyze_chunk_with_llm(chunk)
            for category, items in analysis.items():
                self.processed_data["질적_분석"][category].extend(items)
        
        return self.processed_data

def process_teaching_text(raw_text: str) -> Dict:
    """편의 함수"""
    processor = TeachingDataProcessor(raw_text)
    return processor.process()
