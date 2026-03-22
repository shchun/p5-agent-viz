# AI Agent + p5.js 시각화 엔진 (Visualizer)

사용자의 글(프롬프트)이나 데이터를 받아 LLM(Gemini)이 JSON 형식의 명세서로 변환하고, 이를 범용 p5.js 엔진이 아름답게 렌더링하는 확장 가능하고 동적인 시각화 도구입니다.

## 시스템 구조 (Architecture)
- **백엔드 (Backend)**: Express + `@google/genai` SDK. 구조화된 출력(Structured Outputs) 기능을 사용하여 정확한 JSON 포맷을 보장합니다.
- **프론트엔드 (Frontend)**: Vite + 순수 HTML/CSS/JS + p5.js. 세련된 형태의 다크 모드 글래스모피즘 UI를 지원합니다.
- **공유 (Shared)**: Zod 스키마를 이용해 프론트엔드와 백엔드 간의 데이터 규격을 정의합니다.

## 시작하기 (Getting Started)

### 1. 백엔드 설정 (Backend Setup)
```bash
cd backend
npm install
copy .env.example .env
# .env 파일을 열고 발급받은 GEMINI_API_KEY를 입력하세요.
npm run dev
```

### 2. 프론트엔드 설정 (Frontend Setup)
```bash
cd frontend
npm install
npm run dev
```

브라우저에서 Vite가 제공하는 로컬 서버 주소(`http://localhost:5173`)로 접속한 뒤, 아래와 같이 텍스트를 입력해 보세요:
*"맥박처럼 통통 튀는 빨간색 노드와 파란색 동그라미를 그리고 선으로 연결해줘. 선 위에는 초록색 입자들이 흘러가게 해줘"*
