# Slack to Notion Task

Slack 워크플로우에서 Notion 데이터베이스로 작업을 자동 전송하는 Next.js 서버입니다.

## ✨ 주요 기능

- 🔄 Slack 워크플로우 자동 트리거
- 📝 다양한 데이터 형식 지원 (워크플로우, 이벤트, 수동 입력)
- 🏷️ 워크플로우 이름 및 트리거 타입 추적
- 📊 Notion 데이터베이스에 구조화된 데이터 저장
- 🧪 웹 기반 테스트 인터페이스 제공

## 🚀 빠른 시작

### 1. 환경 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경변수를 설정하세요:

```bash
# Notion API 설정
NOTION_API_KEY=your_notion_integration_token_here
NOTION_DATABASE_ID=your_notion_database_id_here

# Slack Webhook 설정 (선택사항)
SLACK_WEBHOOK_SECRET=your_slack_webhook_secret_here
```

### 2. Notion 데이터베이스 설정

다음 필드들을 가진 데이터베이스를 생성하세요:

- **Name** (제목) - Title 타입
- **작성자** - Rich Text 타입  
- **채널** - Rich Text 타입
- **워크플로우** - Rich Text 타입
- **트리거타입** - Select 타입 (manual, workflow, event, scheduled)
- **상태** - Select 타입 (할 일, 진행중, 완료)
- **생성일** - Date 타입

### 3. 실행

```bash
npm run dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

## 📖 상세 가이드

- **[Slack 워크플로우 설정 가이드](./SLACK_WORKFLOW_GUIDE.md)** - Slack 워크플로우 설정 방법
- **[테스트 페이지](http://localhost:3000/test)** - 웹 기반 테스트 인터페이스

## 🔗 API 엔드포인트

- `POST /api/slack-webhook` - Slack 워크플로우에서 전송된 데이터를 Notion으로 전달
- `GET /api/slack-webhook` - API 상태 확인

## 📊 지원하는 데이터 형식

### Slack 워크플로우 페이로드
```json
{
  "payload": {
    "task_description": "작업 내용",
    "user_name": "사용자명",
    "channel_name": "채널명",
    "workflow_name": "워크플로우명",
    "trigger_type": "workflow"
  }
}
```

### 직접 전송 형식
```json
{
  "text": "작업 내용",
  "user_name": "사용자명",
  "channel_name": "채널명",
  "workflow_name": "워크플로우명",
  "trigger_type": "manual"
}
```

## 🛠️ 기술 스택

- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Notion API** - 데이터베이스 연동
- **Tailwind CSS** - 스타일링
- **Vercel** - 배포 플랫폼 (권장)