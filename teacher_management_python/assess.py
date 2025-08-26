from typing import Dict, List, Tuple
from prompt import TeachingPrompts
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
import config as config
import re
from tqdm import tqdm

class TeachingAssessor:
    def __init__(self):
        self.prompts = TeachingPrompts()
        self.llm = ChatOpenAI(
            api_key=config.OPENAI_API_KEY,
            model="gpt-4", 
            temperature=0
        )
    
    def assess_teaching(self, processed_data: Dict) -> Dict:
        """교사 평가 수행"""
        chunks = self._split_conversation_into_chunks(processed_data['대화_세션'])
        chunk_assessments = []
        
        for chunk in tqdm(chunks, desc="청크 평가 진행률"):
            # 기존 TeachingDataProcessor의 분석 결과 활용
            chunk_data = {
                "대화_세션": chunk,
                "교사_발화": [msg for speaker, msg in chunk if speaker == "Teacher"],
                "학생_발화": [msg for speaker, msg in chunk if speaker in ["Michael", "Abby"]],
                "핵심_지표": processed_data["핵심_지표"],
                "교사_전략": processed_data["교사_전략"],
                "학생_참여": processed_data["학생_참여"],
                "피드백_분석": processed_data["피드백_분석"],
                "질적_분석": processed_data["질적_분석"]
            }
            
            assessment_result = self._assess_chunk(chunk_data)
            chunk_assessments.append(assessment_result)
        
        return self._generate_final_assessment(chunk_assessments, processed_data)
    
    def _assess_chunk(self, chunk_data: Dict) -> Dict:
        """개별 청크 평가"""
        assessment_prompt = self.prompts.get_assessment_prompt(chunk_data)
        response = self.llm.invoke([
            SystemMessage(content=self.prompts.SCORING_SYSTEM_PROMPT),
            HumanMessage(content=assessment_prompt)
        ])
        
        return self._parse_assessment_result(response.content)
    
    def _generate_final_assessment(self, chunk_assessments: List[Dict], processed_data: Dict) -> Dict:
        """최종 평가 결과 생성"""
        merged = self._merge_chunk_assessments(chunk_assessments)
        
        scores_prompt = self.prompts.get_scoring_prompt(
            merged["세부_평가"],
            processed_data["질적_분석"],
            processed_data["핵심_지표"]
        )
        
        scores = self._generate_scores(scores_prompt)
        
        return {
            "scores": scores,
            "우수점": merged["우수점"],
            "개선점": merged["개선점"],
            "report_content": merged["세부_평가"]
        }

    def _split_conversation_into_chunks(self, conversation, chunk_size=30, overlap=5):
        """대화를 청크로 분할
        
        Args:
            conversation: 전체 대화 목록
            chunk_size: 청크당 대화 수 (기본값: 100)
            overlap: 청크 간 중복되는 대화 수 (기본값: 5)
        """
        chunks = []
        i = 0
        while i < len(conversation):
            # 마지막 청크는 남은 모든 대화를 포함
            if i + chunk_size >= len(conversation):
                chunk = conversation[i:]
            else:
                # 일반적인 경우 chunk_size만큼 가져오고
                chunk = conversation[i:i + chunk_size]
            
            chunks.append(chunk)
            # overlap을 고려하여 다음 시작점 계산
            i += (chunk_size - overlap)
        
        return chunks
    
    def _merge_chunk_assessments(self, chunk_assessments):
        """청크별 평가 결과를 통합"""
        merged = {
            "세부_평가": "",
            "우수점": [],
            "개선점": [],
            "총점": 0
        }
        
        # 개선점 카테고리별 정리
        improvement_categories = {
            "피드백": [],
            "개념_설명": [],
            "수업_체계성": [],
            "상호작용": [],
            "학생_참여": [],
            "기타": []
        }
        
        for assessment in chunk_assessments:
            merged["세부_평가"] += assessment["세부_평가"] + "\n"
            merged["우수점"].extend(assessment["우수점"])
            
            # 개선점 카테고리화
            for point in assessment["개선점"]:
                if "피드백" in point.lower():
                    improvement_categories["피드백"].append(point)
                elif "개념" in point.lower() or "설명" in point.lower():
                    improvement_categories["개념_설명"].append(point)
                elif "체계" in point.lower() or "흐름" in point.lower():
                    improvement_categories["수업_체계성"].append(point)
                elif "상호작용" in point.lower():
                    improvement_categories["상호작용"].append(point)
                elif "참여" in point.lower():
                    improvement_categories["학생_참여"].append(point)
                else:
                    improvement_categories["기타"].append(point)
        
        # 각 카테고리에서 가장 대표적인 개선점 선택
        for category, points in improvement_categories.items():
            if points:
                # 가장 긴 (상세한) 개선점을 선택
                best_point = max(points, key=len)
                merged["개선점"].append(f"{category}: {best_point}")
        
        # 중복 제거
        merged["우수점"] = list(set(merged["우수점"]))
        merged["개선점"] = list(set(merged["개선점"]))
        
        return merged
    
    def _generate_scores(self, detailed_eval: str) -> Dict[str, int]:
        """평가 내용을 바탕으로 점수 산출"""
        scores_prompt = f"""
다음 교사의 수업 평가 내용을 바탕으로 각 영역별 점수를 산출해주세요.
반드시 아래와 같은 형식으로만 응답해주세요:

학생 참여: [숫자]
개념 설명: [숫자]
피드백: [숫자]
체계성: [숫자]
상호작용: [숫자]

평가 내용:
{detailed_eval}

평가 기준:
- 15-20점: 탁월한 성과
- 10-14점: 기본 요구사항 충족
- 5-9점: 개선 필요
- 0-4점: 심각한 문제

각 항목은 0-20점 사이의 정수로 평가해주세요.
다른 설명은 일체 하지 말고, 오직 위 형식의 점수만 응답해주세요.
"""
        response = self.llm.invoke([
            SystemMessage(content="당신은 매우 엄격한 교육 평가 전문가입니다."),
            HumanMessage(content=scores_prompt)
        ])
        
        print("GPT 응답:", response.content)  # 디버깅용 로그
        return self._parse_scores(response.content)
    
    def _parse_assessment_result(self, response: str) -> Dict:
        """GPT-4의 평가 응답을 파싱"""
        parsed_result = {
            "세부_평가": "",
            "우수점": [],
            "개선점": [],
            "총점": 0
        }
        
        current_section = ""
        lines = response.split('\n')
        
        for line in lines:
            if not line:
                continue
            
            # 우수점 파싱
            if '특히 우수한 부분' in line or '강점' in line:
                current_section = "우수점"
            # 개선점 파싱
            elif '개선이 필요한 부분' in line or '약점' in line:
                current_section = "개선점"
            # 세부 평가 파싱
            elif '세부 평가' in line:
                current_section = "세부_평가"
            # 각 섹션에 내용 추가
            elif current_section and line.strip():
                if line.startswith('-') or line.startswith('•'):
                    content = line[1:].strip()
                    if current_section in ["우수점", "개선점"]:
                        parsed_result[current_section].append(content)
                elif current_section == "세부_평가":
                    if line.strip() and not line.startswith('세부 평가'):
                        parsed_result["세부_평가"] += line + "\n"
        
        return parsed_result
    
    def _parse_scores(self, response: str) -> dict:
        """GPT-4의 점수 평가 응답을 파싱"""
        scores = {
            "학생_참여": 0,
            "개념_설명": 0,
            "피드백": 0,
            "체계성": 0,
            "상호작용": 0
        }
        
        lines = response.split('\n')
        for line in lines:
            try:
                # 숫자만 추출
                digits = ''.join(filter(str.isdigit, line))
                
                # 숫자가 있는 경우에만 처리
                if digits:
                    if '학생 참여' in line:
                        scores['학생_참여'] = int(digits)
                    elif '개념 설명' in line:
                        scores['개념_설명'] = int(digits)
                    elif '피드백' in line:
                        scores['피드백'] = int(digits)
                    elif '체계성' in line:
                        scores['체계성'] = int(digits)
                    elif '상호작용' in line:
                        scores['상호작용'] = int(digits)
            except ValueError as e:
                print(f"Warning: 점수 파싱 중 오류 발생 (라인: {line})")
                continue
        
        # 모든 점수가 0인 경우 로그 출력
        if sum(scores.values()) == 0:
            print("Warning: 모든 점수가 0으로 파싱되었습니다.")
            print("응답 내용:", response)
        
        return scores
