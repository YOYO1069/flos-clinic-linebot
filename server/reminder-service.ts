import { Client } from '@line/bot-sdk';
import { getTomorrowConfirmedAppointments, getClinicById } from './db';

/**
 * LINE 推播提醒服務
 * 用於發送預約提醒訊息給客戶
 */

/**
 * 發送預約提醒訊息給單一客戶
 */
async function sendReminderToCustomer(
  client: Client,
  lineUserId: string,
  appointmentData: {
    name: string;
    date: string;
    time: string;
    service: string;
  }
) {
  try {
    const message = {
      type: 'text' as const,
      text: `🔔 預約提醒通知\n\n親愛的 ${appointmentData.name} 您好！\n\n您的預約即將到來：\n📅 日期：${appointmentData.date}\n⏰ 時間：${appointmentData.time}\n💆 療程：${appointmentData.service}\n\n請準時前來，期待為您服務！\n如需取消或變更，請儘早聯繫我們。`,
    };

    await client.pushMessage(lineUserId, message);
    console.log(`[Reminder] Sent reminder to user ${lineUserId} for appointment on ${appointmentData.date} ${appointmentData.time}`);
    return true;
  } catch (error) {
    console.error(`[Reminder] Failed to send reminder to user ${lineUserId}:`, error);
    return false;
  }
}

/**
 * 執行每日提醒任務
 * 查詢明天的已確認預約並發送提醒
 */
export async function runDailyReminders() {
  console.log('[Reminder] Starting daily reminder task...');
  
  try {
    // 取得明天的已確認預約
    const appointments = await getTomorrowConfirmedAppointments();
    
    if (appointments.length === 0) {
      console.log('[Reminder] No appointments to remind for tomorrow');
      return { success: true, sent: 0, failed: 0 };
    }

    console.log(`[Reminder] Found ${appointments.length} appointments to remind`);

    let sent = 0;
    let failed = 0;

    // 為每個預約發送提醒
    for (const appointment of appointments) {
      // 如果沒有 LINE User ID，跳過
      if (!appointment.lineUserId) {
        console.warn(`[Reminder] Appointment ${appointment.id} has no LINE User ID, skipping`);
        failed++;
        continue;
      }

      // 取得診所資訊以獲取 LINE Bot Client
      const clinic = await getClinicById(appointment.clinicId);
      if (!clinic) {
        console.error(`[Reminder] Clinic ${appointment.clinicId} not found for appointment ${appointment.id}`);
        failed++;
        continue;
      }

      // 建立 LINE Bot Client
      const client = new Client({
        channelAccessToken: clinic.lineChannelAccessToken,
      });

      // 發送提醒
      const success = await sendReminderToCustomer(client, appointment.lineUserId, {
        name: appointment.name,
        date: appointment.date,
        time: appointment.time,
        service: appointment.service,
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }

      // 避免發送過快，稍微延遲
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[Reminder] Daily reminder task completed: ${sent} sent, ${failed} failed`);
    return { success: true, sent, failed };
  } catch (error) {
    console.error('[Reminder] Daily reminder task failed:', error);
    return { success: false, sent: 0, failed: 0, error };
  }
}

/**
 * 手動觸發提醒任務 (用於測試)
 */
export async function triggerManualReminder() {
  console.log('[Reminder] Manual reminder triggered');
  return await runDailyReminders();
}
