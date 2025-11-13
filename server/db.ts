import { and, desc, eq, gte, ne, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  clinics, 
  appointments, 
  lineGroupStates,
  type Clinic,
  type Appointment,
  type InsertAppointment,
  type LineGroupState,
  type InsertLineGroupState,
  type InsertClinic
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Clinic Functions =====

export async function getClinicByChannelId(channelId: string): Promise<Clinic | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clinics).where(eq(clinics.lineChannelId, channelId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClinic(clinic: InsertClinic): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clinics).values(clinic);
  return result[0].insertId;
}

export async function getAllClinics(): Promise<Clinic[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(clinics).where(eq(clinics.isActive, true));
}

// ===== Appointment Functions =====

export async function createAppointment(appointment: InsertAppointment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(appointments).values(appointment);
  return result[0].insertId;
}

export async function getPendingAppointmentsByGroup(lineGroupId: string): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.lineGroupId, lineGroupId),
        eq(appointments.status, "pending")
      )
    )
    .orderBy(desc(appointments.createdAt));
}

export async function updateAppointmentStatus(
  appointmentId: number,
  status: "pending" | "confirmed" | "cancelled" | "completed"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(appointments)
    .set({ status, updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
}

export async function deleteAppointment(appointmentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(appointments).where(eq(appointments.id, appointmentId));
}

export async function getAppointmentById(appointmentId: number): Promise<Appointment | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Line Group State Functions =====

export async function getGroupState(lineGroupId: string, clinicId: number): Promise<LineGroupState | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(lineGroupStates)
    .where(
      and(
        eq(lineGroupStates.lineGroupId, lineGroupId),
        eq(lineGroupStates.clinicId, clinicId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertGroupState(
  lineGroupId: string,
  clinicId: number,
  updates: Partial<InsertLineGroupState>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const state: InsertLineGroupState = {
    lineGroupId,
    clinicId,
    bookingMode: updates.bookingMode,
    conversationState: updates.conversationState,
    tempData: updates.tempData,
  };

  await db
    .insert(lineGroupStates)
    .values(state)
    .onDuplicateKeyUpdate({
      set: {
        ...updates,
        updatedAt: new Date(),
      },
    });
}

/**
 * 取得所有預約 (支援分頁)
 */
export async function getAllAppointments(limit: number = 50, offset: number = 0): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get appointments: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(appointments)
      .orderBy(appointments.createdAt)
      .limit(limit)
      .offset(offset);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get appointments:", error);
    return [];
  }
}

/**
 * 根據狀態取得預約 (支援分頁)
 */
export async function getAppointmentsByStatus(
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  limit: number = 50,
  offset: number = 0
): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get appointments by status: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(appointments)
      .where(eq(appointments.status, status))
      .orderBy(appointments.createdAt)
      .limit(limit)
      .offset(offset);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get appointments by status:", error);
    return [];
  }
}

/**
 * 取得明天的已確認預約 (用於發送提醒)
 */
export async function getTomorrowConfirmedAppointments(): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get tomorrow appointments: database not available");
    return [];
  }

  try {
    // 計算明天的日期 (格式: YYYY-MM-DD)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const result = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.status, 'confirmed'),
          eq(appointments.date, tomorrowStr)
        )
      )
      .orderBy(appointments.time);
    
    return result;
  } catch (error) {
    console.error("[Database] Failed to get tomorrow appointments:", error);
    return [];
  }
}

/**
 * 根據 ID 取得診所資訊
 */
export async function getClinicById(id: number): Promise<Clinic | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get clinic: database not available");
    return undefined;
  }

  const result = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 根據 LINE User ID 取得客戶的未來預約
 * 只返回待確認和已確認的預約
 */
export async function getCustomerUpcomingAppointments(lineUserId: string): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get customer appointments: database not available");
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const result = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.lineUserId, lineUserId),
        gte(appointments.date, todayStr),
        or(
          eq(appointments.status, 'pending'),
          eq(appointments.status, 'confirmed')
        )
      )
    )
    .orderBy(appointments.date, appointments.time);

  return result;
}

/**
 * 客戶取消自己的預約
 */
export async function cancelAppointmentByCustomer(appointmentId: number, lineUserId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot cancel appointment: database not available");
    return false;
  }

  // 先確認這個預約屬於這個客戶
  const appointment = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.lineUserId, lineUserId)
      )
    )
    .limit(1);

  if (appointment.length === 0) {
    console.warn(`[Database] Appointment ${appointmentId} not found or does not belong to user ${lineUserId}`);
    return false;
  }

  // 更新狀態為已取消
  await db
    .update(appointments)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));

  return true;
}

/**
 * 客戶更新預約資訊
 */
export async function updateAppointmentByCustomer(
  appointmentId: number,
  lineUserId: string,
  updates: { date?: string; time?: string; service?: string }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // 驗證預約屬於該用戶
    const appointment = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.lineUserId, lineUserId)))
      .limit(1);

    if (appointment.length === 0) {
      return false;
    }

    // 更新預約
    const updateData: any = {};
    if (updates.date) updateData.date = updates.date;
    if (updates.time) updateData.time = updates.time;
    if (updates.service) updateData.service = updates.service;

    await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId));

    return true;
  } catch (error) {
    console.error('[DB] Failed to update appointment by customer:', error);
    return false;
  }
}

/**
 * 檢查預約時段是否衝突
 * @param date 預約日期
 * @param time 預約時間
 * @param clinicId 診所 ID
 * @param excludeAppointmentId 排除的預約 ID (用於修改預約時排除自己)
 * @returns 如果有衝突返回衝突的預約,否則返回 null
 */
export async function checkAppointmentConflict(
  date: string,
  time: string,
  clinicId: number,
  excludeAppointmentId?: number
): Promise<{ id: number; name: string; service: string } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const whereConditions = [
      eq(appointments.clinicId, clinicId),
      eq(appointments.date, date),
      eq(appointments.time, time),
      or(
        eq(appointments.status, 'pending'),
        eq(appointments.status, 'confirmed')
      ),
    ];

    // 如果是修改預約,排除自己
    if (excludeAppointmentId) {
      whereConditions.push(ne(appointments.id, excludeAppointmentId));
    }

    const conflicts = await db
      .select({
        id: appointments.id,
        name: appointments.name,
        service: appointments.service,
      })
      .from(appointments)
      .where(and(...whereConditions))
      .limit(1);

    return conflicts.length > 0 ? conflicts[0] : null;
  } catch (error) {
    console.error('[DB] Failed to check appointment conflict:', error);
    return null;
  }
}

/**
 * ==========================================
 * 授權管理相關函數
 * ==========================================
 */

import {
  authorizationCodes,
  authorizedGroups,
  InsertAuthorizationCode,
  InsertAuthorizedGroup,
  AuthorizationCode,
  AuthorizedGroup,
} from '../drizzle/schema';

/**
 * 建立授權碼
 */
export async function createAuthorizationCode(data: InsertAuthorizationCode) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(authorizationCodes).values(data);
}

/**
 * 根據授權碼取得授權資訊
 */
export async function getAuthorizationCodeByCode(code: string): Promise<AuthorizationCode | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(authorizationCodes).where(eq(authorizationCodes.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 更新授權碼狀態
 */
export async function updateAuthorizationCodeStatus(code: string, status: 'active' | 'used' | 'expired') {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(authorizationCodes)
    .set({ status, updatedAt: new Date() })
    .where(eq(authorizationCodes.code, code));
}

/**
 * 授權群組
 */
export async function authorizeGroup(data: InsertAuthorizedGroup) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(authorizedGroups).values(data);
}

/**
 * 檢查群組是否已授權
 */
export async function isGroupAuthorized(lineGroupId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select()
    .from(authorizedGroups)
    .where(eq(authorizedGroups.lineGroupId, lineGroupId))
    .limit(1);
  
  return result.length > 0 && result[0].isActive;
}

/**
 * 根據群組 ID 取得授權資訊
 */
export async function getAuthorizedGroup(lineGroupId: string): Promise<AuthorizedGroup | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(authorizedGroups)
    .where(eq(authorizedGroups.lineGroupId, lineGroupId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 取得所有已授權的群組
 */
export async function getAllAuthorizedGroups(): Promise<AuthorizedGroup[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(authorizedGroups);
}

/**
 * 停用群組授權
 */
export async function deactivateGroupAuthorization(lineGroupId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(authorizedGroups)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(authorizedGroups.lineGroupId, lineGroupId));
}

/**
 * 取得所有授權碼
 */
export async function getAllAuthorizationCodes(): Promise<AuthorizationCode[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(authorizationCodes);
}

/**
 * 延長授權碼有效期限（增加天數）
 */
export async function extendAuthorizationCode(code: string, days: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const authCode = await getAuthorizationCodeByCode(code);
  if (!authCode) throw new Error('Authorization code not found');
  
  // 計算新的到期日期
  const currentExpiry = authCode.expiresAt ? new Date(authCode.expiresAt) : new Date();
  const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
  
  await db.update(authorizationCodes)
    .set({ expiresAt: newExpiry, updatedAt: new Date() })
    .where(eq(authorizationCodes.code, code));
}

/**
 * 更新授權碼到期日期
 */
export async function updateAuthorizationCodeExpiry(code: string, expiresAt: Date | null) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(authorizationCodes)
    .set({ expiresAt, updatedAt: new Date() })
    .where(eq(authorizationCodes.code, code));
}

/**
 * 重新啟用授權碼
 */
export async function reactivateAuthorizationCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(authorizationCodes)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(authorizationCodes.code, code));
}
