import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SLACK TEST API 호출됨 ===')
    console.log('요청 URL:', request.url)
    console.log('요청 메서드:', request.method)
    console.log('요청 헤더:', Object.fromEntries(request.headers.entries()))
    
    const body = await request.json()
    
    console.log('Slack 테스트 요청 받음:', JSON.stringify(body, null, 2))
    
    // 환경변수 확인
    const envCheck = {
      NOTION_API_KEY: !!process.env.NOTION_API_KEY,
      NOTION_DATABASE_ID: !!process.env.NOTION_DATABASE_ID,
      SLACK_BOT_TOKEN: !!process.env.SLACK_BOT_TOKEN,
    }
    
    console.log('환경변수 상태:', envCheck)
    
    // 간단한 응답 반환
    return NextResponse.json({
      ok: true,
      message: 'Slack 워크플로우 테스트 성공',
      received_data: body,
      environment_check: envCheck,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Slack 테스트 오류:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Slack 테스트 엔드포인트가 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString()
  })
}
