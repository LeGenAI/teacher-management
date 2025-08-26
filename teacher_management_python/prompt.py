from typing import Dict, List, Tuple

class TeachingPrompts:
    SCORING_SYSTEM_PROMPT = "당신은 매우 엄격한 교육 평가 전문가입니다."
    
    @staticmethod
    def get_assessment_prompt(chunk_data: Dict) -> str:
        return f"""
다음 수업 데이터를 분석하여 평가해주세요:

1. 정량적 지표:
{TeachingPrompts._format_metrics(chunk_data)}

2. 질적 분석:
{chunk_data.get('질적_분석', {})}

3. 대화 내용:
{TeachingPrompts._format_conversations(chunk_data['대화_세션'])}

각 영역별로 구체적인 근거와 함께 평가해주세요.
"""

    @staticmethod
    def get_scoring_prompt(detailed_eval: str, qualitative_analysis: Dict, metrics: Dict) -> str:
        return f"""
다음 데이터를 바탕으로 각 영역의 점수를 산출해주세요:

1. 세부 평가:
{detailed_eval}

2. 질적 분석:
{qualitative_analysis}

3. 정량적 지표:
{metrics}

각 영역은 0-20점 사이의 정수로 평가해주세요.
"""

    @staticmethod
    def _format_metrics(data: Dict) -> str:
        return "\n".join([
            f"- {key}: {value}"
            for key, value in data.items()
            if key in ["핵심_지표", "교사_전략", "학생_참여", "피드백_분석"]
        ])

    @staticmethod
    def _format_conversations(conversations: List[Tuple[str, str]]) -> str:
        return "\n".join([f"{speaker}: {text}" for speaker, text in conversations])
