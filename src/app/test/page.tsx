'use client';

import { useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('보통');
  const [menuName, setMenuName] = useState('');
  const [taskType, setTaskType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [result, setResult] = useState('');
  
  // Workflow Step 테스트용 상태
  const [workflowWebhookUrl, setWorkflowWebhookUrl] = useState('https://httpbin.org/post');
  const [workflowMessage, setWorkflowMessage] = useState('테스트 메시지입니다');
  const [workflowResult, setWorkflowResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/slack-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          priority: priority,
          menu_name: menuName,
          task_type: taskType,
          due_date: dueDate,
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`오류: ${error}`);
    }
  };

  const testWorkflowStep = async () => {
    try {
      const response = await fetch('/api/slack-workflow-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_step: {
            workflow_step_execute_id: `test-execute-id-${Date.now()}`,
            inputs: {
              webhook_url: { value: workflowWebhookUrl },
              message_text: { value: workflowMessage }
            }
          },
          event: {
            type: 'workflow_step_execute'
          }
        }),
      });

      const data = await response.json();
      setWorkflowResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setWorkflowResult(`오류: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Slack to Notion 테스트
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              작업 이름
            </label>
            <input
              type="text"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="작업 이름을 입력하세요"
              required
            />
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              우선순위
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="높음">높음</option>
              <option value="보통">보통</option>
              <option value="낮음">낮음</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="menuName" className="block text-sm font-medium text-gray-700">
              메뉴이름
            </label>
            <input
              type="text"
              id="menuName"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="메뉴이름 (예: CX, 공통, AS 등)"
            />
          </div>
          
          <div>
            <label htmlFor="taskType" className="block text-sm font-medium text-gray-700">
              작업 유형
            </label>
            <input
              type="text"
              id="taskType"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="작업 유형 (예: 개선, fe, figma반영 등)"
            />
          </div>
          
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              마감일
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Notion에 작업 추가
          </button>
        </form>
        
        {result && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-800 mb-2">결과:</h2>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
              {result}
            </pre>
          </div>
        )}
        
        {/* Workflow Step 테스트 섹션 */}
        <div className="mt-8 border-t pt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Slack Workflow Step 테스트
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="workflowWebhookUrl" className="block text-sm font-medium text-gray-700">
                Webhook URL
              </label>
              <input
                type="url"
                id="workflowWebhookUrl"
                value={workflowWebhookUrl}
                onChange={(e) => setWorkflowWebhookUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="https://httpbin.org/post"
              />
            </div>
            
            <div>
              <label htmlFor="workflowMessage" className="block text-sm font-medium text-gray-700">
                메시지 텍스트
              </label>
              <input
                type="text"
                id="workflowMessage"
                value={workflowMessage}
                onChange={(e) => setWorkflowMessage(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="테스트 메시지입니다"
              />
            </div>
            
            <button
              type="button"
              onClick={testWorkflowStep}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Workflow Step 테스트
            </button>
          </div>
          
          {workflowResult && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Workflow Step 결과:</h3>
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
                {workflowResult}
              </pre>
            </div>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">사용 방법:</h3>
          <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>프로젝트 루트에 <code className="bg-blue-100 px-1 rounded">.env.local</code> 파일 생성</li>
            <li>Notion API Key와 Database ID 설정</li>
            <li>Slack Bot Token 설정 (Workflow Step 테스트용)</li>
            <li>위 폼을 사용하여 테스트</li>
            <li>Slack 워크플로우에서 <code className="bg-blue-100 px-1 rounded">/api/slack-webhook</code> 엔드포인트로 POST 요청</li>
            <li>Slack Workflow Step에서 <code className="bg-blue-100 px-1 rounded">/api/slack-workflow-step</code> 엔드포인트 사용</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
