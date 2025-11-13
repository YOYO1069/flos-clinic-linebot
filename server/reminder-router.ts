import { publicProcedure, router } from "./_core/trpc";
import { runDailyReminders, triggerManualReminder } from "./reminder-service";

/**
 * 提醒服務路由
 * 提供手動觸發和定時執行提醒的 API
 */
export const reminderRouter = router({
  /**
   * 手動觸發提醒任務 (用於測試)
   */
  triggerManual: publicProcedure.mutation(async () => {
    const result = await triggerManualReminder();
    return result;
  }),

  /**
   * 定時任務端點 (由外部 cron 服務呼叫)
   * 每天執行一次，發送明天的預約提醒
   */
  runDaily: publicProcedure.mutation(async () => {
    const result = await runDailyReminders();
    return result;
  }),
});
