import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import {
  getAppointmentsByStatus,
  getAllAppointments,
  updateAppointmentStatus,
  getAppointmentById,
} from './db';

/**
 * 後台管理路由
 * 提供預約管理功能
 */
export const adminRouter = router({
  /**
   * 取得所有預約 (按狀態篩選)
   */
  getAppointments: protectedProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
        limit: z.number().min(1).max(100).default(50).optional(),
        offset: z.number().min(0).default(0).optional(),
      })
    )
    .query(async ({ input }) => {
      if (input.status) {
        return await getAppointmentsByStatus(input.status, input.limit, input.offset);
      }
      return await getAllAppointments(input.limit, input.offset);
    }),

  /**
   * 取得單一預約詳情
   */
  getAppointment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getAppointmentById(input.id);
    }),

  /**
   * 確認預約 (pending → confirmed)
   * 確認後會自動發送 LINE 通知給客戶
   */
  confirmAppointment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // 更新預約狀態
      await updateAppointmentStatus(input.id, 'confirmed');
      
      // 取得預約詳情
      const appointment = await getAppointmentById(input.id);
      if (!appointment) {
        throw new Error('預約不存在');
      }
      
      // 發送 LINE 通知給客戶
      try {
        const { Client } = await import('@line/bot-sdk');
        const { createAppointmentConfirmedMessage } = await import('./linebot-utils');
        const { getClinicById } = await import('./db');
        
        const client = new Client({
          channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
        });
        
        // 取得診所資訊
        const clinic = await getClinicById(appointment.clinicId);
        const clinicName = clinic?.name || '診所';
        const clinicAddress = '台北市大安區大安路一段73號5樓';
        
        // 建立確認通知訊息
        const confirmMessage = createAppointmentConfirmedMessage(
          appointment.name,
          appointment.service,
          appointment.date,
          appointment.time,
          clinicName,
          clinicAddress
        );
        
        // 發送通知
        if (appointment.lineUserId) {
          await client.pushMessage(appointment.lineUserId, confirmMessage);
        }
        console.log(`[confirmAppointment] Sent confirmation notification to user ${appointment.lineUserId}`);
      } catch (error) {
        console.error('[confirmAppointment] Failed to send LINE notification:', error);
        // 不拋出錯誤，預約已確認，只是通知失敗
      }
      
      return { success: true };
    }),

  /**
   * 完成預約 (confirmed → completed)
   */
  completeAppointment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateAppointmentStatus(input.id, 'completed');
      return { success: true };
    }),

  /**
   * 取消預約
   */
  cancelAppointment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateAppointmentStatus(input.id, 'cancelled');
      return { success: true };
    }),

  /**
   * 取得預約統計
   */
  getAppointmentStats: protectedProcedure.query(async () => {
    const [pending, confirmed, completed, cancelled] = await Promise.all([
      getAppointmentsByStatus('pending'),
      getAppointmentsByStatus('confirmed'),
      getAppointmentsByStatus('completed'),
      getAppointmentsByStatus('cancelled'),
    ]);

    return {
      pending: pending.length,
      confirmed: confirmed.length,
      completed: completed.length,
      cancelled: cancelled.length,
      total: pending.length + confirmed.length + completed.length + cancelled.length,
    };
  }),

  /**
   * 生成授權碼
   */
  generateAuthCode: protectedProcedure
    .input(
      z.object({
        clinicId: z.number(),
        expiresAt: z.string().optional(), // ISO 8601 格式
      })
    )
    .mutation(async ({ input }) => {
      const { createAuthorizationCode } = await import('./db');
      
      // 生成隨機授權碼（格式：AUTH-XXXXXX）
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `AUTH-${randomCode}`;
      
      await createAuthorizationCode({
        code,
        clinicId: input.clinicId,
        status: 'active',
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      });
      
      return { code };
    }),

  /**
   * 取得所有已授權的群組
   */
  getAuthorizedGroups: protectedProcedure.query(async () => {
    const { getAllAuthorizedGroups } = await import('./db');
    return await getAllAuthorizedGroups();
  }),

  /**
   * 取得所有授權碼
   */
  getAllAuthCodes: protectedProcedure.query(async () => {
    const { getAllAuthorizationCodes } = await import('./db');
    return await getAllAuthorizationCodes();
  }),

  /**
   * 延長授權碼有效期限（增加天數）
   */
  extendAuthCode: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        days: z.number().min(1).max(3650), // 最多延長 10 年
      })
    )
    .mutation(async ({ input }) => {
      const { extendAuthorizationCode } = await import('./db');
      await extendAuthorizationCode(input.code, input.days);
      return { success: true };
    }),

  /**
   * 修改授權碼到期日期
   */
  updateAuthCodeExpiry: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        expiresAt: z.string().nullable(), // ISO 8601 格式或 null
      })
    )
    .mutation(async ({ input }) => {
      const { updateAuthorizationCodeExpiry } = await import('./db');
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      await updateAuthorizationCodeExpiry(input.code, expiresAt);
      return { success: true };
    }),

  /**
   * 重新啟用授權碼
   */
  reactivateAuthCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const { reactivateAuthorizationCode } = await import('./db');
      await reactivateAuthorizationCode(input.code);
      return { success: true };
    }),

  /**
   * 停用群組授權
   */
  deactivateGroup: protectedProcedure
    .input(z.object({ lineGroupId: z.string() }))
    .mutation(async ({ input }) => {
      const { deactivateGroupAuthorization } = await import('./db');
      await deactivateGroupAuthorization(input.lineGroupId);
      return { success: true };
    }),
});
