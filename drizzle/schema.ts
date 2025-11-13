import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 診所資料表
 * 支援多診所配置
 */
export const clinics = mysqlTable("clinics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  // LINE Bot 設定
  lineChannelId: varchar("lineChannelId", { length: 100 }).notNull().unique(),
  lineChannelSecret: varchar("lineChannelSecret", { length: 100 }).notNull(),
  lineChannelAccessToken: text("lineChannelAccessToken").notNull(),
  // 診所設定
  webhookUrl: text("webhookUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = typeof clinics.$inferInsert;

/**
 * 預約資料表
 * 儲存所有預約資料
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  // 診所關聯
  clinicId: int("clinicId").notNull(),
  // LINE 群組資訊
  lineGroupId: varchar("lineGroupId", { length: 100 }).notNull(),
  lineUserId: varchar("lineUserId", { length: 100 }),
  // 預約資訊
  name: varchar("name", { length: 100 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  time: varchar("time", { length: 20 }).notNull(),
  service: text("service").notNull(),
  // 狀態
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  // 備註
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * LINE 群組狀態表
 * 記錄群組的預約模式狀態
 */
export const lineGroupStates = mysqlTable("lineGroupStates", {
  id: int("id").autoincrement().primaryKey(),
  lineGroupId: varchar("lineGroupId", { length: 100 }).notNull().unique(),
  clinicId: int("clinicId").notNull(),
  // 預約模式: single(單人) 或 multiple(多人)
  bookingMode: varchar("bookingMode", { length: 20 }),
  // 對話狀態: idle, selecting_service, selecting_date, selecting_time, waiting_name
  conversationState: varchar("conversationState", { length: 50 }).default("idle"),
  // 暫存資料 (JSON 格式) - 儲存已選擇的療程、日期、時間
  tempData: text("tempData"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LineGroupState = typeof lineGroupStates.$inferSelect;
export type InsertLineGroupState = typeof lineGroupStates.$inferInsert;

/**
 * 授權碼資料表
 * 儲存診所的授權碼
 */
export const authorizationCodes = mysqlTable("authorizationCodes", {
  id: int("id").autoincrement().primaryKey(),
  // 授權碼（例如：AUTH-ABC123）
  code: varchar("code", { length: 50 }).notNull().unique(),
  // 診所 ID
  clinicId: int("clinicId").notNull(),
  // 狀態：active(可用)、used(已使用)、expired(過期)
  status: mysqlEnum("status", ["active", "used", "expired"]).default("active").notNull(),
  // 有效期限（null 表示永久有效）
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuthorizationCode = typeof authorizationCodes.$inferSelect;
export type InsertAuthorizationCode = typeof authorizationCodes.$inferInsert;

/**
 * 已授權群組資料表
 * 儲存已授權使用機器人的 LINE 群組
 */
export const authorizedGroups = mysqlTable("authorizedGroups", {
  id: int("id").autoincrement().primaryKey(),
  // LINE 群組 ID
  lineGroupId: varchar("lineGroupId", { length: 100 }).notNull().unique(),
  // 診所 ID
  clinicId: int("clinicId").notNull(),
  // 使用的授權碼
  authorizationCode: varchar("authorizationCode", { length: 50 }).notNull(),
  // 授權時間
  authorizedAt: timestamp("authorizedAt").defaultNow().notNull(),
  // 是否啟用
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuthorizedGroup = typeof authorizedGroups.$inferSelect;
export type InsertAuthorizedGroup = typeof authorizedGroups.$inferInsert;
