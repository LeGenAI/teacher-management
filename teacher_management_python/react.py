from typing import Dict, List
from dataclasses import dataclass
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
import config as config

@dataclass
class ProblemTemplate:
    subject: str
    difficulty: str
    problem_type: str
    concept: str

class AIBookGenerator:
    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=config.OPENAI_API_KEY,
            model="gpt-4.1-2025-04-14",
            temperature=0.7
        )
        
    def generate_similar_problem(self, template: ProblemTemplate) -> Dict:
        """유사 문제 생성"""
        prompt = f"""
다음 조건에 맞는 문제와 상세한 풀이 과정을 생성해주세요:

과목: {template.subject}
난이도: {template.difficulty}
문제 유형: {template.problem_type}
관련 개념: {template.concept}

1. 문제는 명확하고 학습 목표에 부합해야 합니다.
2. 풀이 과정은 단계별로 자세히 설명해주세요.
3. 교사가 수업에서 바로 활용할 수 있도록 작성해주세요.
"""
        response = self.llm.invoke([
            SystemMessage(content="당신은 숙련된 교사입니다."),
            HumanMessage(content=prompt)
        ])
        
        return self._parse_problem_response(response.content)
    
    def generate_concept_popup(self, concept: str) -> Dict:
        """개념 팝업 생성"""
        prompt = f"""
다음 개념에 대한 교사용 설명 자료를 생성해주세요:

개념: {concept}

포함할 내용:
1. 핵심 개념 정리 (3-5개 bullet points)
2. 학생들이 자주 겪는 오개념
3. 교수 팁 (실생활 예시, 시각화 방법 등)
4. 심화 학습 연계 포인트
"""
        response = self.llm.invoke([
            SystemMessage(content="당신은 교육과정 전문가입니다."),
            HumanMessage(content=prompt)
        ])
        
        return self._parse_concept_response(response.content)
    
    def _parse_problem_response(self, response: str) -> Dict:
        """문제 생성 응답 파싱"""
        sections = {
            "문제": "",
            "풀이": "",
            "교사_팁": []
        }
        
        current_section = None
        for line in response.split('\n'):
            if "문제:" in line:
                current_section = "문제"
            elif "풀이:" in line:
                current_section = "풀이"
            elif "교사 팁:" in line:
                current_section = "교사_팁"
            elif current_section and line.strip():
                if current_section == "교사_팁":
                    sections[current_section].append(line.strip())
                else:
                    sections[current_section] += line + "\n"
                    
        return sections
    
    def _parse_concept_response(self, response: str) -> Dict:
        """개념 설명 응답 파싱"""
        sections = {
            "핵심_개념": [],
            "오개념": [],
            "교수_팁": [],
            "심화_학습": []
        }
        
        current_section = None
        for line in response.split('\n'):
            if "핵심 개념:" in line:
                current_section = "핵심_개념"
            elif "오개념:" in line:
                current_section = "오개념"
            elif "교수 팁:" in line:
                current_section = "교수_팁"
            elif "심화 학습:" in line:
                current_section = "심화_학습"
            elif current_section and line.strip():
                if line.startswith('-') or line.startswith('•'):
                    sections[current_section].append(line[1:].strip())
                    
        return sections
