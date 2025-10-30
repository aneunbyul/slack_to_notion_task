import { NextRequest, NextResponse } from 'next/server'
import { addTaskToNotion } from '@/lib/notion'

export const dynamic = 'force-dynamic'

async function parseRequestBodyFlexibly(request: NextRequest): Promise<any> {
  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      const json = await request.json()
      // Slack 일부 엔드포인트는 payload 필드에 JSON 문자열을 중첩해서 보냄
      if (json && typeof json.payload === 'string') {
        try {
          return { ...json, payload: JSON.parse(json.payload) }
        } catch {}
      }
      return json
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      const obj: Record<string, any> = {}
      for (const [key, value] of form.entries()) {
        obj[key] = value
      }
      if (typeof obj.payload === 'string') {
        try {
          obj.payload = JSON.parse(obj.payload)
        } catch {}
      }
      return obj
    }
    // 기타 케이스: 텍스트로 수신 후 JSON 파싱 시도
    const text = await request.text()
    try {
      return JSON.parse(text)
    } catch {}
    return { raw: text }
  } catch (e) {
    return { _parseError: String(e) }
  }
}

function looksLikeChannelId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string' && /^[CG][A-Z0-9]+$/.test(value)) return value
  if (typeof value === 'object') {
    const obj = value as any
    if (typeof obj.id === 'string' && /^[CG][A-Z0-9]+$/.test(obj.id)) return obj.id
    if (typeof obj.channel === 'string' && /^[CG][A-Z0-9]+$/.test(obj.channel)) return obj.channel
  }
  return null
}

function resolveChannelId(inputs: Record<string, any>, body: any, payload: any, inputParameters?: Record<string, any>): string | undefined {
  // input_parameters 우선 확인
  if (inputParameters) {
    for (const [key, val] of Object.entries(inputParameters)) {
      const id = looksLikeChannelId(val)
      if (id) {
        console.log(`✅ input_parameters.${key}에서 channel_id 찾음:`, id)
        return id
      }
    }
  }
  
  // 우선 알려진 키 우선
  const directCandidates = [
    inputs?.channel_id?.value,
    inputs?.channel?.value,
    inputs?.conversation?.value,
    inputs?.conversation_id?.value,
    inputs?.selected_channel?.value,
    body?.channel_id,
    body?.channel,
    body?.conversation,
    payload?.channel_id,
    payload?.channel,
    payload?.conversation,
  ]
  for (const c of directCandidates) {
    const id = looksLikeChannelId(c)
    if (id) return id
  }

  // inputs 내 임의 키 스캔
  if (inputs && typeof inputs === 'object') {
    for (const [key, val] of Object.entries(inputs)) {
      const v = (val as any)?.value ?? val
      const id = looksLikeChannelId(v)
      if (id) {
        console.log(`✅ inputs.${key}에서 channel_id 찾음:`, id)
        return id
      }
      // 객체 형태로 전달된 경우 (예: { value: { id, name } })
      if (v && typeof v === 'object') {
        const nestedId = looksLikeChannelId((v as any)?.id)
        if (nestedId) {
          console.log(`✅ inputs.${key}.id에서 channel_id 찾음:`, nestedId)
          return nestedId
        }
      }
    }
  }
  return undefined
}

export async function POST(request: NextRequest) {
  console.log('🚀🚀🚀 [WORKFLOW STEP] POST 요청 시작!', new Date().toISOString())
  console.log('🚀 [WORKFLOW STEP] URL:', request.url)
  
  try {
    const body = await parseRequestBodyFlexibly(request)
    
    // 헤더와 바디 상세 로깅
    const headers = Object.fromEntries(request.headers.entries())
    console.log('💛 [헤더] Content-Type:', headers['content-type'])
    console.log('💛 [헤더] User-Agent:', headers['user-agent'])
    console.log('💛 [헤더] 전체 헤더:', headers)
    
    console.log('💛 [바디] 전체 요청 바디:', JSON.stringify(body, null, 2))
    console.log('💛 [바디] 타입:', typeof body)
    console.log('💛 [바디] 키 목록:', Object.keys(body || {}))

    const { workflow_step, event, payload } = body || {}

    if (!workflow_step) {
      console.error('❌ workflow_step이 없습니다. 바디 전체 구조:', JSON.stringify(body, null, 2))
      
      const candidate = payload?.workflow_step
      if (candidate) {
        console.log('✅ payload 안에서 workflow_step 찾음')
        ;(body as any).workflow_step = candidate
      } else {
        console.log('⚠️ workflow_step이 없음 - 단순 웹훅 모드로 처리')
        // 단순 웹훅일 경우 그냥 성공 응답
        return NextResponse.json({ 
          ok: true, 
          message: 'Received simple webhook call (no workflow_step)',
          received_data: body 
        })
      }
    }

    const actualWorkflowStep = (body as any).workflow_step || {}
    
    // inputs와 input_parameters 모두 확인
    const inputs = actualWorkflowStep.inputs || {}
    const inputParameters = actualWorkflowStep.input_parameters || {}
    
    console.log('📦 actualWorkflowStep 전체:', JSON.stringify(actualWorkflowStep, null, 2))
    console.log('📦 inputs:', inputs)
    console.log('📦 input_parameters:', inputParameters)
    console.log('📦 actualWorkflowStep의 모든 키:', Object.keys(actualWorkflowStep))
    
    // input_parameters와 inputs 모두에서 값 찾기
    const webhookUrl = inputParameters.webhook_url || inputs.webhook_url?.value || (body.webhook_url as string) || payload?.webhook_url
    let messageText = inputParameters.message_text || inputs.message_text?.value || (body.message_text as string) || payload?.message_text || body.text

    // input_parameters에서도 channel_id 찾기
    const channelId = resolveChannelId(inputs, body, payload, inputParameters)
    const messageTs = inputParameters.message_ts || inputs.message_ts?.value || (body.message_ts as string) || payload?.message_ts

    console.log('💛 [파싱 결과]', {
      workflow_step: actualWorkflowStep,
      event,
      webhookUrl,
      messageTs,
      messageText,
      channelId,
      inputKeys: Object.keys(inputs || {}),
      inputParameterKeys: Object.keys(inputParameters || {}),
      input_parameters: inputParameters,
    });

    try {
      // 원본 메시지 내용 조회 (선택)
      if ((!messageText || messageText.length === 0) && channelId && messageTs && process.env.SLACK_BOT_TOKEN) {
        try {
          // 먼저 replies로 시도 (스레드 메시지 대응)
          const replies = await fetch('https://slack.com/api/conversations.replies', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
            body: new URLSearchParams({ channel: channelId, ts: String(messageTs), inclusive: 'true', limit: '1' }),
          }).then(r => r.json())
          if (replies?.ok && replies?.messages?.length) {
            messageText = replies.messages[0].text || messageText
          } else {
            const hist = await fetch('https://slack.com/api/conversations.history', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
              },
              body: new URLSearchParams({ channel: channelId, latest: String(messageTs), inclusive: 'true', limit: '1' }),
            }).then(r => r.json())
            if (hist?.ok && hist?.messages?.length) {
              messageText = hist.messages[0].text || messageText
            }
          }
        } catch (_) {}
      }

      // 웹훅 전송
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      })

      console.log('💛 Webhook 전송 완료:', webhookResponse.status)

      // Notion에 작업 추가
      let notionResult = null
      try {
        notionResult = await addTaskToNotion({
          text: messageText+': '+channelId,
          priority: '보통',
          stage: '미완료',
          workProgress: '시작 전',
          backend: '해당없음',
        })
        console.log('💛 Notion 작업 추가 완료:', notionResult.id)
      } catch (notionError) {
        console.error('❌ Notion 작업 추가 실패:', notionError)
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
          workflow_step_execute_id: actualWorkflowStep.workflow_step_execute_id,
          outputs: { 
            success: true, 
            response_message: 'Webhook 전송 및 Notion 작업 추가 완료',
            notion_page_id: notionResult?.id || null,
            channel_id: channelId || null,
            message_ts: messageTs || null,
            used_message_text: messageText || null
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
      console.error('❌ Webhook 전송 실패:', err)
      
      await fetch('https://slack.com/api/workflows.stepFailed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_step_execute_id: (body as any)?.workflow_step?.workflow_step_execute_id,
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
    console.error('❌❌❌ [WORKFLOW STEP] 최상위 Handler error:', error)
    console.error('❌ [WORKFLOW STEP] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
