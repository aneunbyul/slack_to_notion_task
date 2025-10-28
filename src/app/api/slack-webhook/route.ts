import { NextRequest, NextResponse } from 'next/server';
import { addTaskToNotion } from '@/lib/notion';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    
    console.log('Received Slack webhook data:', JSON.stringify(body, null, 2));
    
    // Slack 워크플로우에서 전송되는 다양한 데이터 형식 처리
    let taskData = {
      text: '',
      priority: '보통', // 기본값
      stage: '미완료', // 기본값
      workProgress: '시작 전', // 기본값
      backend: '해당없음', // 기본값
    };

    // Slack 워크플로우 데이터 형식에 따른 처리
    if (body.payload) {
      // Slack 워크플로우에서 전송되는 형식
      const payload = typeof body.payload === 'string' ? JSON.parse(body.payload) : body.payload;
      taskData = {
        text: payload.task_description || payload.text || payload.message || '워크플로우가 시작되었습니다',
        priority: payload.priority || '보통',
        stage: payload.stage || '미완료',
        workProgress: payload.work_progress || '시작 전',
        backend: payload.backend || '해당없음',
      };
    } else if (body.event) {
      // Slack 이벤트 형식
      taskData = {
        text: body.event.text || '이벤트가 발생했습니다',
        priority: '보통',
        stage: '미완료',
        workProgress: '시작 전',
        backend: '해당없음',
      };
    } else {
      // 직접 전송된 형식
      taskData = {
        text: body.text || body.message || body.task_description || '새 작업',
        priority: body.priority || '보통',
        stage: body.stage || '미완료',
        workProgress: body.work_progress || '시작 전',
        backend: body.backend || '해당없음',
      };
    }
    
    // Notion 데이터베이스에 새 페이지 추가
    const response = await addTaskToNotion(taskData);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Notion에 작업이 성공적으로 추가되었습니다.',
        notionPageId: response.id 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '작업 추가 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// GET 요청 처리 (테스트용)
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Slack to Notion Webhook API가 정상적으로 작동 중입니다.',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
