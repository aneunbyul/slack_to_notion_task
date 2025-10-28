import { Client } from '@notionhq/client';

// Notion 클라이언트 인스턴스
let notionClient: Client | null = null;

export function getNotionClient(): Client {
  if (!notionClient) {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    
    notionClient = new Client({
      auth: process.env.NOTION_API_KEY,
    });
  }
  
  return notionClient;
}

// Notion 데이터베이스 스키마 타입 정의
export interface NotionTaskProperties {
  '작업 이름': {
    title: Array<{
      text: {
        content: string;
      };
    }>;
  };
  '우선순위'?: {
    select: {
      name: string;
    };
  };
  '메뉴이름'?: {
    select: {
      name: string;
    };
  };
  '단계'?: {
    status: {
      name: string;
    };
  };
  '작업 유형'?: {
    select: {
      name: string;
    };
  };
  '마감일'?: {
    date: {
      start: string;
    };
  };
  '업무진행'?: {
    status: {
      name: string;
    };
  };
  '백엔드'?: {
    status: {
      name: string;
    };
  };
  '개발 담당자'?: {
    people: Array<{
      id: string;
    }>;
  };
}

// 작업을 Notion에 추가하는 함수
export async function addTaskToNotion(taskData: {
  text: string;
  priority?: string;
  menuName?: string;
  stage?: string;
  taskType?: string;
  dueDate?: string;
  workProgress?: string;
  backend?: string;
  developer?: string;
}) {
  const notion = getNotionClient();
  
  if (!process.env.NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다.');
  }

  console.log('Adding task to Notion:', taskData);
  
  const properties: NotionTaskProperties = {
    '작업 이름': {
      title: [
        {
          text: {
            content: taskData.text || '새 작업',
          },
        },
      ],
    },
  };

  // 선택적 속성들 추가
  if (taskData.priority) {
    properties['우선순위'] = {
      select: {
        name: taskData.priority,
      },
    };
  }

  if (taskData.menuName) {
    properties['메뉴이름'] = {
      select: {
        name: taskData.menuName,
      },
    };
  }

  if (taskData.stage) {
    properties['단계'] = {
      status: {
        name: taskData.stage,
      },
    };
  }

  if (taskData.taskType) {
    properties['작업 유형'] = {
      select: {
        name: taskData.taskType,
      },
    };
  }

  if (taskData.dueDate) {
    properties['마감일'] = {
      date: {
        start: taskData.dueDate,
      },
    };
  }

  if (taskData.workProgress) {
    properties['업무진행'] = {
      status: {
        name: taskData.workProgress,
      },
    };
  }

  if (taskData.backend) {
    properties['백엔드'] = {
      status: {
        name: taskData.backend,
      },
    };
  }

  return await notion.pages.create({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID,
    },
    properties: properties as Record<string, any>,
  });
}

// 데이터베이스 스키마 확인 함수
export async function checkDatabaseSchema() {
  const notion = getNotionClient();
  
  if (!process.env.NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다.');
  }

  try {
    const database = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID,
    });
    
    return database;
  } catch (error) {
    console.error('데이터베이스 스키마 확인 중 오류:', error);
    throw error;
  }
}
