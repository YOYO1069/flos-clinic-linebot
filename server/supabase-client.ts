/**
 * Supabase Client for Attendance System
 * 用於 LINE Bot 考勤功能的 Supabase 連線
 */

// Supabase 連線資訊
const SUPABASE_URL = 'https://clzjdlykhjwrlksyjlfz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsempkbHlraGp3cmxrc3lqbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5MzE2MzYsImV4cCI6MjAzODUwNzYzNn0.Kp5gvBcZdVKVr3FY8Qc8hYYqJl5Zl5Zl5Zl5Zl5Zl5Z';

/**
 * 使用 fetch API 直接呼叫 Supabase REST API
 * 避免依賴 @supabase/supabase-js 套件
 */

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * 執行 Supabase 查詢
 */
async function supabaseQuery<T>(
  table: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  options: {
    select?: string;
    filter?: Record<string, any>;
    body?: any;
    single?: boolean;
  } = {}
): Promise<SupabaseResponse<T>> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    
    // 建立查詢參數
    const params = new URLSearchParams();
    if (options.select) {
      params.append('select', options.select);
    }
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });
    }
    if (options.single) {
      params.append('limit', '1');
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const headers: Record<string, string> = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    };

    if (method === 'POST' || method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
      headers['Prefer'] = 'return=representation';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      data: options.single && Array.isArray(data) ? data[0] : data,
      error: null,
    };
  } catch (error) {
    console.error('[Supabase] Query error:', error);
    return {
      data: null,
      error: error as Error,
    };
  }
}

/**
 * 員工相關資料結構
 */
export interface Staff {
  id: number;
  line_user_id: string | null;
  employee_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffAuthCode {
  id: number;
  code: string;
  employee_id: string;
  status: 'active' | 'used' | 'expired';
  expires_at: string | null;
  used_at: string | null;
  used_by_line_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  clock_in_location: string | null;
  clock_out_location: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  work_hours: number | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 驗證員工授權碼
 */
export async function verifyStaffAuthCode(code: string): Promise<SupabaseResponse<StaffAuthCode>> {
  return supabaseQuery<StaffAuthCode>('staff_auth_codes', 'GET', {
    select: '*',
    filter: { code, status: 'active' },
    single: true,
  });
}

/**
 * 標記授權碼為已使用
 */
export async function markAuthCodeAsUsed(code: string, lineUserId: string): Promise<SupabaseResponse<StaffAuthCode>> {
  return supabaseQuery<StaffAuthCode>('staff_auth_codes', 'PATCH', {
    filter: { code },
    body: {
      status: 'used',
      used_at: new Date().toISOString(),
      used_by_line_user_id: lineUserId,
    },
  });
}

/**
 * 根據員工編號取得員工資料
 */
export async function getStaffByEmployeeId(employeeId: string): Promise<SupabaseResponse<Staff>> {
  return supabaseQuery<Staff>('staff', 'GET', {
    select: '*',
    filter: { employee_id: employeeId },
    single: true,
  });
}

/**
 * 根據 LINE User ID 取得員工資料
 */
export async function getStaffByLineUserId(lineUserId: string): Promise<SupabaseResponse<Staff>> {
  return supabaseQuery<Staff>('staff', 'GET', {
    select: '*',
    filter: { line_user_id: lineUserId },
    single: true,
  });
}

/**
 * 綁定員工與 LINE User ID
 */
export async function bindStaffToLineUser(employeeId: string, lineUserId: string): Promise<SupabaseResponse<Staff>> {
  return supabaseQuery<Staff>('staff', 'PATCH', {
    filter: { employee_id: employeeId },
    body: {
      line_user_id: lineUserId,
      updated_at: new Date().toISOString(),
    },
  });
}

/**
 * 建立打卡記錄
 */
export async function createAttendanceRecord(data: {
  employeeId: string;
  type: 'clock_in' | 'clock_out';
  latitude?: number;
  longitude?: number;
  location?: string;
}): Promise<SupabaseResponse<AttendanceRecord>> {
  const now = new Date().toISOString();
  
  const body: any = {
    employee_id: data.employeeId,
    created_at: now,
    updated_at: now,
  };

  if (data.type === 'clock_in') {
    body.clock_in_time = now;
    body.clock_in_latitude = data.latitude;
    body.clock_in_longitude = data.longitude;
    body.clock_in_location = data.location;
  } else {
    body.clock_out_time = now;
    body.clock_out_latitude = data.latitude;
    body.clock_out_longitude = data.longitude;
    body.clock_out_location = data.location;
  }

  return supabaseQuery<AttendanceRecord>('attendance_records', 'POST', {
    body,
  });
}

/**
 * 取得員工今日打卡記錄
 */
export async function getTodayAttendance(employeeId: string): Promise<SupabaseResponse<AttendanceRecord[]>> {
  const today = new Date().toISOString().split('T')[0];
  
  // 使用 gte (greater than or equal) 和 lt (less than) 篩選今天的記錄
  const url = `${SUPABASE_URL}/rest/v1/attendance_records?employee_id=eq.${employeeId}&clock_in_time=gte.${today}T00:00:00&clock_in_time=lt.${today}T23:59:59&order=created_at.desc`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
