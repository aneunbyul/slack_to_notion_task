import { NextRequest, NextResponse } from 'next/server'
import { addTaskToNotion } from '@/lib/notion'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflow_step, event } = body

    if (!workflow_step) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const inputs = workflow_step.inputs
    const webhookUrl = inputs.webhook_url.value
    const messageText = inputs.message_text.value

    console.log('Received Slack workflow step data:', {
      workflow_step,
      event,
      webhookUrl,
      messageText,
    });

    try {
      // 웹훅 전송
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      })

      console.log('Webhook 전송 완료:', webhookResponse.status)

      // Notion에 작업 추가
      let notionResult = null
      try {
        notionResult = await addTaskToNotion({
          text: messageText,
          priority: '보통',
          stage: '미완료',
          workProgress: '시작 전',
          backend: '해당없음',
        })
        console.log('Notion 작업 추가 완료:', notionResult.id)
      } catch (notionError) {
        console.error('Notion 작업 추가 실패:', notionError)
        // Notion 실패해도 웹훅은 성공으로 처리
      }

      // 성공 결과 Slack에 응답
      const slackResponse = await fetch('https://slack.com/api/workflows.stepCompleted', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_step_execute_id: workflow_step.workflow_step_execute_id,
          outputs: { 
            success: true, 
            response_message: 'Webhook 전송 및 Notion 작업 추가 완료',
            notion_page_id: notionResult?.id || null
          },
        }),
      })

      return NextResponse.json({ 
        ok: true, 
        webhook_sent: true,
        notion_added: !!notionResult,
        notion_page_id: notionResult?.id || null
      })
    } catch (err) {
      console.error('Webhook 전송 실패:', err)
      
      await fetch('https://slack.com/api/workflows.stepFailed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_step_execute_id: workflow_step.workflow_step_execute_id,
          error: { message: 'Webhook 전송 실패' },
        }),
      })
      
      return NextResponse.json({ 
        ok: false, 
        error: 'Webhook 전송 실패',
        webhook_sent: false,
        notion_added: false
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
