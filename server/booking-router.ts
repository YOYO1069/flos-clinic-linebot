import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { createAppointment, getPendingAppointmentsByGroup, getClinicByChannelId } from "./db";
import { Client } from "@line/bot-sdk";
import { createPendingAppointmentsMessage, createMultipleBookingCompleteMessage } from "./linebot-utils";

export const bookingRouter = router({
  /**
   * 建立新預約
   */
  create: publicProcedure
    .input(
      z.object({
        clinicId: z.number(),
        lineGroupId: z.string(),
        lineUserId: z.string().optional(),
        name: z.string().min(1, "請輸入姓名"),
        date: z.string().min(1, "請選擇日期"),
        time: z.string().min(1, "請選擇時間"),
        service: z.string().min(1, "請輸入療程"),
        notes: z.string().optional(),
        mode: z.enum(["single", "multiple"]),
      })
    )
    .mutation(async ({ input }) => {
      // 建立預約
      const appointmentId = await createAppointment({
        clinicId: input.clinicId,
        lineGroupId: input.lineGroupId,
        lineUserId: input.lineUserId,
        name: input.name,
        date: input.date,
        time: input.time,
        service: input.service,
        notes: input.notes,
        status: "pending",
      });

      // 取得診所設定
      const clinic = await getClinicByChannelId("2008067196"); // TODO: 根據 clinicId 動態取得
      if (!clinic) {
        throw new Error("Clinic not found");
      }

      const client = new Client({
        channelAccessToken: clinic.lineChannelAccessToken,
      });

      const baseUrl = 'https://3000-iul4y4kdermqtggn8o4wi-572da304.manus-asia.computer';

      // 根據模式發送不同訊息
      if (input.mode === "single") {
        // 單人模式: 自動顯示待確認清單
        const appointments = await getPendingAppointmentsByGroup(input.lineGroupId);
        const message = createPendingAppointmentsMessage(appointments);
        await client.pushMessage(input.lineGroupId, message);
      } else {
        // 多人模式: 顯示繼續新增或查看清單的選項
        const message = createMultipleBookingCompleteMessage();
        const messageStr = JSON.stringify(message);
        const updatedMessage = JSON.parse(
          messageStr
            .replace(/https:\/\/placeholder\.com/g, baseUrl)
            .replace(/{groupId}/g, input.lineGroupId)
        );
        await client.pushMessage(input.lineGroupId, updatedMessage);
      }

      return {
        success: true,
        appointmentId,
      };
    }),

  /**
   * 取得群組的待確認預約清單
   */
  getPendingList: publicProcedure
    .input(
      z.object({
        lineGroupId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const appointments = await getPendingAppointmentsByGroup(input.lineGroupId);
      return appointments;
    }),
});
