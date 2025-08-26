from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime
from data_processing import process_teaching_text
from assess import TeachingAssessor
import config as config
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage

@dataclass
class ScoreData:
    raw_score: int
    max_score: int = 20
    
    @property
    def percentage(self) -> int:
        return int(self.raw_score / self.max_score * 100)
    
    @property
    def grade(self) -> str:
        if self.percentage >= 90: return "탁월 (A+)"
        elif self.percentage >= 80: return "우수 (A)"
        elif self.percentage >= 70: return "양호 (B)"
        elif self.percentage >= 60: return "보통 (C)"
        else: return "미흡 (D)"
    
    @property
    def stars(self) -> str:
        return "🌟" * (self.raw_score // 4)

class ReportGenerator:
    def __init__(self):
        self.report_template = self._load_report_template()
    
    def generate_fancy_report(self, assessment_result: Dict) -> str:
        """평가 결과를 바탕으로 팬시한 마크다운 리포트 생성"""
        scores = {
            key: ScoreData(value) 
            for key, value in assessment_result.get('scores', {}).items()
        }
        
        total_score = sum(score.raw_score for score in scores.values())
        strongest_area = max(scores.items(), key=lambda x: x[1].raw_score)[0].replace('_', ' ')
        weakest_area = min(scores.items(), key=lambda x: x[1].raw_score)[0].replace('_', ' ')
        
        # 영역별 상세 분석 생성
        qualitative_analysis = assessment_result.get('질적_분석', {})
        detailed_analysis = self._generate_detailed_analysis(qualitative_analysis)
        
        # 발견사항 테이블 생성
        findings_table = self._generate_findings_table(assessment_result.get('우수점', []))
        
        # 개선 권고사항 테이블 생성
        improvements_table = self._generate_improvements_table(assessment_result.get('개선점', []))
        
        return self.report_template.format(
            date=datetime.now().strftime('%Y-%m-%d %H:%M'),
            total_score=total_score,
            total_grade=ScoreData(total_score, 100).grade,
            strongest_area=strongest_area,
            weakest_area=weakest_area,
            score_table=self._generate_score_table(scores),
            detailed_analysis=detailed_analysis,
            findings=findings_table,
            improvements=improvements_table
        )
    
    def _generate_detailed_analysis(self, qualitative_analysis: Dict[str, List[str]]) -> str:
        sections = []
        for category, items in qualitative_analysis.items():
            emoji = self._get_category_emoji(category)
            sections.append(f"### {emoji} {category.replace('_', ' ')}")
            sections.extend([f"- {item}" for item in items])
        return "\n\n".join(sections)
    
    def _generate_findings_table(self, findings: List[str]) -> str:
        table = "| 영역 | 발견사항 |\n|:-----|:---------|\n"
        for finding in findings:
            table += f"| 수업 역량 | • {finding} |\n"
        return table
    
    def _generate_improvements_table(self, improvements: List[str]) -> str:
        table = "| 영역 | 개선사항 | 실천방안 |\n|:-----|:---------|:---------|\n"
        for improvement in improvements:
            if ':' in improvement:
                area, suggestion = improvement.split(':', 1)
                table += f"| {area.strip()} | {suggestion.strip()} | • 구체적인 실행 계획 수립\n• 단계별 개선 전략 마련\n• 정기적인 모니터링 실시 |\n"
            else:
                table += f"| 개선 필요 영역 | {improvement} | • 세부 실행 계획 수립\n• 구체적 목표 설정\n• 성과 측정 방안 마련 |\n"
        return table
    
    def _generate_score_table(self, scores: Dict[str, ScoreData]) -> str:
        rows = []
        for key, score in scores.items():
            rows.append(f"| {key.replace('_', ' ')} | {score.raw_score} | {score.max_score} | {score.grade} | {score.percentage}% |")
        return "\n".join(rows)
    
    @staticmethod
    def _get_category_emoji(category: str) -> str:
        emoji_map = {
            "교사_전문성": "👨‍🏫",
            "수업_담화": "💬",
            "학습_환경": "🏫"
        }
        return emoji_map.get(category, "📝")
    
    def _load_report_template(self) -> str:
        return """# 🎓 교사 역량 평가 보고서
생성일시: {date}

## 📊 종합 평가 결과
- 전체 평가 등급: **{total_grade}** ({total_score}점)
- 강점 영역: **{strongest_area}**
- 중점 개선 영역: **{weakest_area}**

### 평가 점수 상세
| 평가 영역 | 획득 점수 | 만점 | 등급 | 백분율 |
|:----------|:---------:|:----:|:----:|:------:|
{score_table}

---

## 📋 영역별 상세 분석
{detailed_analysis}

## 📈 주요 발견사항
{findings}

## ✍️ 개선 권고사항
{improvements}
"""

def generate_fancy_report(assessment_result: Dict) -> str:
    """외부에서 호출할 수 있는 리포트 생성 함수"""
    generator = ReportGenerator()
    return generator.generate_fancy_report(assessment_result)
