<div align="center">
  <h1>🚀 AI-Powered Teacher Analytics Platform</h1>
  <p><strong>차세대 교육 혁신을 위한 AI 기반 교사 수업 분석 시스템</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-15.1.3-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/AssemblyAI-FF6B35?style=for-the-badge&logo=ai&logoColor=white" alt="AssemblyAI"/>
    <img src="https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI"/>
    <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  </p>

  <p>
    <strong>🎯 Mission:</strong> 교육의 미래를 AI로 재정의하다
  </p>
</div>

---

## 📖 프로젝트 개요

**Teacher Analytics Platform**은 AI 기술을 활용하여 교사의 수업을 실시간으로 분석하고 평가하는 혁신적인 교육 플랫폼입니다. 

### 🌟 핵심 가치

> **"가장 높이 나는 갈매기가 가장 멀리 본다"**  
> _- 딥파운틴(DeepFountain) 철학_

우리는 AI 기술을 통해 교사들이 교육의 본질에 집중할 수 있도록 돕습니다.

### ⚡ 주요 특징

- **🎯 정밀한 음성 분석**: AssemblyAI 기반 99.2% 정확도의 음성-텍스트 변환 및 화자 분리
- **🧠 지능형 수업 분석**: GPT-4를 활용한 교사-학생 상호작용 패턴 분석
- **📊 실시간 대시보드**: 수업 데이터의 실시간 시각화 및 인사이트 제공
- **📋 자동 보고서**: 1-2분 내 Markdown 형식의 상세 분석 보고서 자동 생성
- **🎨 현대적 UI/UX**: Glassmorphism과 Framer Motion을 활용한 세련된 사용자 인터페이스

---

## 🏗️ 기술 스택

### Frontend
```
🎨 UI/UX Framework
├── Next.js 15.1.3 (App Router)
├── TypeScript 5.0+
├── React 19.0
└── Tailwind CSS 3.4+

✨ Animation & Design
├── Framer Motion 11.15
├── Material-UI 6.3
├── React Confetti
└── Glassmorphism Design

📊 Data Visualization  
├── Chart.js 4.4
├── Recharts 2.15
└── React-ChartJS-2 5.3
```

### Backend & AI
```
🧠 AI & ML Services
├── OpenAI GPT-4 (수업 내용 분석)
├── AssemblyAI (음성-텍스트 변환)
└── 커스텀 NLP 파이프라인

🔧 Backend Infrastructure
├── Next.js API Routes
├── Python 3.9+ (분석 엔진)
├── FFmpeg (영상 처리)
└── File Upload (Multer)
```

---

## 🚀 주요 기능

### 1. 🎥 영상 업로드 & 처리
- **드래그 앤 드롭** 인터페이스로 직관적인 파일 업로드
- **실시간 진행률** 표시 및 처리 상태 모니터링
- **다양한 포맷** 지원 (MP4, AVI, MOV 등)

### 2. 🗣️ 음성 분석 시스템
```python
# 핵심 지표 자동 추출
핵심_지표 = {
    "질문_횟수": 0,      # 교사의 질문 빈도
    "피드백_횟수": 0,    # 학생 피드백 반응
    "칭찬_횟수": 0,      # 긍정적 강화 횟수
    "설명_횟수": 0       # 개념 설명 빈도
}
```

### 3. 📈 실시간 분석 대시보드
- **교사 평가 점수**: AI 기반 객관적 평가 (93.5% ~ 95.2%)
- **상호작용 맵**: 교사-학생 대화 패턴 시각화
- **시간별 분석**: 수업 진행에 따른 참여도 변화 추적

### 4. 📄 지능형 보고서 생성
- **자동화된 마크다운** 리포트 생성
- **개선 제안사항** 및 **강점 분석**
- **학습 효과성** 평가 및 권장사항

---

## 👨‍💼 개발자 소개

### 백재현 (Jaehyun Baek)
**🏢 딥파운틴(DeepFountain) 개발 팀장**

> *"AI 기술의 민주화를 통해 모든 교육자가 최고의 교육을 제공할 수 있는 세상을 만들고자 합니다."*

#### 🎯 비전
- **서강대학교 '서감봇'** 성공 사례를 통한 1,800건+ 실증 데이터 확보
- **검증된 RAG 기술**을 기반으로 한 교육 특화 AI 솔루션 개발
- **한국지능시스템학회** 등재 기술을 상용화하여 교육 혁신 선도

#### 🌟 핵심 성과
- ✅ **서강대 서감봇**: 학생 만족도 95% 달성
- ✅ **교직원 업무 효율성**: 40% 향상
- ✅ **독점 데이터셋**: 1,800건 이상의 실제 교육 QA 데이터

---

## 🏁 시작하기

### 1. 환경 설정
```bash
# 리포지토리 클론
git clone https://github.com/LeGenAI/teacher-management.git
cd teacher-management

# 의존성 설치
npm install

# Python 패키지 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정
```env
# .env.local 파일 생성
AAI_API_KEY=your_assemblyai_api_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. 개발 서버 실행
```bash
# Next.js 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

---

## 📊 프로젝트 구조

```
teacher_management/
├── 🎨 src/app/                 # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── analyze-video/      # 영상 분석 엔드포인트
│   │   └── reports/           # 보고서 관련 API
│   ├── teachers/              # 교사 상세 페이지
│   ├── reports/               # 분석 결과 페이지
│   └── QnA/                   # 상담 신청 페이지
├── 🐍 teacher_management_python/ # Python 분석 엔진
│   ├── main_pipe.py           # 메인 파이프라인
│   ├── assess.py              # 평가 엔진
│   ├── report.py              # 보고서 생성기
│   └── data_processing.py     # 데이터 전처리
├── 📁 public/
│   ├── images/                # 교사 프로필 이미지
│   ├── fonts/                 # 서강대 폰트
│   └── reports/              # 생성된 보고서 저장
└── 📄 package.json            # 의존성 및 스크립트
```

---

## 🤝 기여하기

1. **Fork** 이 리포지토리
2. **Feature branch** 생성 (`git checkout -b feature/amazing-feature`)
3. **Commit** 변경사항 (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

---

## 📞 연락처

**딥파운틴(DeepFountain) 팀**
- 📧 **Email**: bjh3641@gmail.com
- 🌐 **Website**: [www.deepfountain.ai](https://deep-fountain.com)

---

## 📄 라이선스

이 프로젝트는 **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** 라이선스 하에 배포됩니다.

### 🚫 상업적 이용 금지
- **비상업적 목적**으로만 사용 가능합니다
- **상업적 이용, 판매, 수익 창출**은 엄격히 금지됩니다
- **교육 및 연구 목적**으로만 활용 가능합니다

### ⚖️ 라이선스 조건
- ✅ **저작자 표시**: 원 저작자(딥파운틴) 명시 필수
- ✅ **공유**: 동일한 라이선스로 공유 가능
- ❌ **상업적 이용 금지**: 상업적 목적 사용 불가
- ❌ **판매 및 수익화 금지**: 어떠한 형태의 수익 창출도 불가

상업적 이용을 원하시는 경우 딥파운틴 팀(bjh3641@gmail.com)으로 별도 문의 바랍니다.

자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

<div align="center">
  <p><strong>🚀 딥파운틴과 함께 교육의 미래를 만들어가세요!</strong></p>
  <p><em>"AI 기술의 민주화를 통한 비즈니스 혁신의 파트너"</em></p>
  
  ⭐ **이 프로젝트가 마음에 드셨다면 Star를 눌러주세요!** ⭐
</div>
