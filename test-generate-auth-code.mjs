import { drizzle } from 'drizzle-orm/mysql2';
import { authorizationCodes } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

// 生成測試授權碼
const authCode = {
  code: 'AUTH-TEST01',
  clinicId: 1, // 假設診所 ID 為 1
  status: 'active',
  expiresAt: null, // 永久有效
  createdAt: new Date(),
};

try {
  await db.insert(authorizationCodes).values(authCode);
  console.log('✅ 授權碼生成成功！');
  console.log('授權碼：AUTH-TEST01');
  console.log('診所 ID：1');
  console.log('狀態：active');
  console.log('有效期限：永久有效');
  console.log('\n請在 LINE 群組中輸入：授權 AUTH-TEST01');
} catch (error) {
  console.error('❌ 生成授權碼失敗：', error);
}

process.exit(0);
