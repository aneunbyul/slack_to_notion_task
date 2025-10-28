import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseSchema } from '@/lib/notion';

export async function GET() {
  try {
    const database = await checkDatabaseSchema();
    
    // 데이터베이스의 속성들을 추출
    return NextResponse.json(database);
  } catch (error) {
    console.error('Database schema check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '데이터베이스 스키마 확인 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
