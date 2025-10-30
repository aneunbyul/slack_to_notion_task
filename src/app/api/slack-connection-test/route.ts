import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== Slack 연결 테스트 시작 ===')
    console.log('받은 요청 데이터:', JSON.stringify(body, null, 2))
    
    // 요청 헤더 확인
    const headers = Object.fromEntries(request.headers.entries())
    console.log('요청 헤더:', headers)
    
    // Slack 워크플로우 스텝 형식 확인
    let isWorkflowStep = false
    let hasValidInputs = false
    let webhookUrl = ''
    let messageText = ''
    
    if (body.workflow_step) {
      isWorkflowStep = true
      console.log('✅ Slack 워크플로우 스텝 형식 감지됨')
      
      if (body.workflow_step.inputs) {
        hasValidInputs = true
        webhookUrl = body.workflow_step.inputs.webhook_url?.value || ''
        messageText = body.workflow_step.inputs.message_text?.value || ''
        console.log('✅ 입력 값이 올바르게 설정됨')
        console.log('Webhook URL:', webhookUrl)
        console.log('Message Text:', messageText)
      } else {
        console.log('❌ 입력 값이 없거나 형식이 잘못됨')
      }
    } else {
      console.log('❌ Slack 워크플로우 스텝 형식이 아님')
    }
    
    // 환경 변수 확인
    const envCheck = {
      notionApiKey: !!process.env.NOTION_API_KEY,
      notionDatabaseId: !!process.env.NOTION_DATABASE_ID,
      slackBotToken: !!process.env.SLACK_BOT_TOKEN
    }
    
    console.log('환경 변수 상태:', envCheck)
    
    // 간단한 웹훅 테스트 (선택사항)
    let webhookTestResult = null
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        console.log('웹훅 테스트 시작:', webhookUrl)
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            test: true, 
            message: 'Slack 연결 테스트',
            timestamp: new Date().toISOString()
          }),
        })
        
        webhookTestResult = {
          success: webhookResponse.ok,
          status: webhookResponse.status,
          statusText: webhookResponse.statusText
        }
        
        console.log('웹훅 테스트 결과:', webhookTestResult)
      } catch (error) {
        webhookTestResult = {
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }
        console.log('웹훅 테스트 실패:', webhookTestResult)
      }
    }
    
    const testResult = {
      success: true,
      timestamp: new Date().toISOString(),
      connection_status: {
        is_workflow_step: isWorkflowStep,
        has_valid_inputs: hasValidInputs,
        webhook_url: webhookUrl,
        message_text: messageText
      },
      environment_variables: envCheck,
      webhook_test: webhookTestResult,
      received_data: body,
      headers: {
        content_type: headers['content-type'],
        user_agent: headers['user-agent'],
        authorization: headers['authorization'] ? '설정됨' : '없음'
      }
    }
    
    console.log('=== Slack 연결 테스트 완료 ===')
    console.log('테스트 결과:', JSON.stringify(testResult, null, 2))
    
    return NextResponse.json(testResult)
    
  } catch (error) {
    console.error('Slack 연결 테스트 오류:', error)
    
    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    }
    
    return NextResponse.json(errorResult, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Slack 연결 테스트 엔드포인트',
    usage: 'POST 요청으로 Slack 워크플로우 데이터를 전송하세요',
    endpoints: {
      test: '/api/slack-connection-test',
      workflow_step: '/api/slack-workflow-step',
      webhook: '/api/slack-webhook'
    },
    timestamp: new Date().toISOString()
  })
}
