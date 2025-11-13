import { Router } from 'express';
import { middleware, WebhookEvent, MessageEvent, PostbackEvent, Client } from '@line/bot-sdk';
import {
  getClinicByChannelId,
  getPendingAppointmentsByGroup,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  upsertGroupState,
  getGroupState,
  createAppointment,
  getClinicById,
} from './db';
import {
  createBookingModeMessage,
  createServiceSelectionMessage,
  createDateQuickReply,
  createTimeQuickReply,
  createDateSelectionMessage,
  createTimeSelectionMessage,
  createNameInputMessage,
  createNoteSelectionMessage,
  createBookingConfirmationMessage,
  createPendingAppointmentsMessage,
  createMultipleBookingCompleteMessage,
  SERVICES,
} from './linebot-utils';

const router = Router();

/**
 * 道玄機器貓 Webhook
 */
router.post('/webhook/daoxuan-bot', async (req, res) => {
  try {
    const channelId = '2008067196';
    const clinic = await getClinicByChannelId(channelId);

    if (!clinic) {
      console.error('[Webhook] Clinic not found for channel:', channelId);
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const config = {
      channelSecret: clinic.lineChannelSecret,
      channelAccessToken: clinic.lineChannelAccessToken,
    };

    const client = new Client(config);
    
    // LINE 發送的事件可能為空,這是正常的
    const events: WebhookEvent[] = req.body.events || [];
    
    // 即使沒有事件也要返回 200
    if (events.length === 0) {
      return res.json({ success: true });
    }

    await Promise.all(
      events.map(async (event) => {
        try {
          await handleEvent(event, client, clinic.id);
        } catch (err) {
          console.error('[Webhook] Error handling event:', err);
        }
      })
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    console.error('[Webhook] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    // 即使發生錯誤也要返回 200,避免 LINE 重試
    res.json({ success: true, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * 處理 LINE Webhook 事件
 */
async function handleEvent(event: WebhookEvent, client: Client, clinicId: number) {
  // 只處理群組訊息
  if (event.source.type !== 'group') {
    return;
  }

  const groupId = event.source.groupId;

  // 處理文字訊息
  if (event.type === 'message' && event.message.type === 'text') {
    await handleTextMessage(event as MessageEvent, client, clinicId, groupId);
  }

  // 處理位置訊息 (用於打卡)
  if (event.type === 'message' && event.message.type === 'location') {
    await handleLocationMessage(event as MessageEvent, client);
  }

  // 處理 Postback 事件
  if (event.type === 'postback') {
    await handlePostback(event as PostbackEvent, client, clinicId, groupId);
  }
}

/**
 * 處理文字訊息
 */
async function handleTextMessage(
  event: MessageEvent,
  client: Client,
  clinicId: number,
  groupId: string
) {
  const text = (event.message as any).text;

  // 檢測「授權」關鍵字 - 群組授權流程
  if (text.startsWith('授權 ')) {
    await handleAuthorization(event, client, groupId, text);
    return;
  }

  // 檢查群組是否已授權
  const { isGroupAuthorized } = await import('./db');
  const authorized = await isGroupAuthorized(groupId);
  if (!authorized) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '⚠️ 此群組尚未授權使用機器人功能。\n\n請輸入：「授權 您的授權碼」來啟用功能。\n例如：授權 AUTH-ABC123',
    });
    return;
  }

  // 檢測「員工綁定」關鍵字 - 員工綁定流程
  if (text.startsWith('員工綁定 ')) {
    await handleStaffBind(event, client, text);
    return;
  }

  // 檢測「預約」關鍵字 - 開始新的預約流程
  if (text.includes('預約')) {
    const message = createBookingModeMessage();
    await client.replyMessage(event.replyToken, message);
    return;
  }

  // 檢測「查詢預約」或「我的預約」關鍵字
  if (text.includes('查詢預約') || text.includes('我的預約')) {
    await handleQueryAppointments(event, client, clinicId, groupId);
    return;
  }

  // 檢查是否在等待姓名或備註輸入
  const groupState = await getGroupState(groupId, clinicId);
  if (groupState && groupState.conversationState === 'waiting_name') {
    await handleNameInput(event, client, clinicId, groupId, text);
  } else if (groupState && groupState.conversationState === 'waiting_note_input') {
    await handleNoteInput(event, client, clinicId, groupId, text);
  }
}

/**
 * 處理 Postback 事件
 */
async function handlePostback(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string
) {
  const data = new URLSearchParams(event.postback.data);
  const action = data.get('action');

  switch (action) {
    case 'clock':
      await handleClock(event, client, data);
      break;
    case 'select_mode':
      await handleModeSelection(event, client, clinicId, groupId, data);
      break;
    case 'select_service':
      await handleServiceSelection(event, client, clinicId, groupId, data);
      break;
    case 'select_date':
      await handleDateSelection(event, client, clinicId, groupId, data);
      break;
    case 'select_time':
      await handleTimeSelection(event, client, clinicId, groupId, data);
      break;
    case 'note_selection':
      await handleNoteSelection(event, client, clinicId, groupId, data);
      break;
    case 'confirm':
      await handleConfirm(event, client, clinicId, groupId, data);
      break;
    case 'cancel':
      await handleCancel(event, client, clinicId, groupId, data);
      break;
    case 'delete_appointment':
      await handleDeleteAppointment(event, client, clinicId, groupId, data);
      break;
    case 'show_list':
      await handleShowList(event, client, clinicId, groupId);
      break;
    case 'continue_booking':
      await handleContinueBooking(event, client, clinicId, groupId);
      break;
    case 'cancel_customer':
      await handleCustomerCancel(event, client, clinicId, groupId, data);
      break;
    case 'modify_customer':
      await handleModifyCustomer(event, client, clinicId, groupId, data);
      break;
    case 'modify_date':
      await handleModifyDate(event, client, clinicId, groupId, data);
      break;
    case 'modify_time':
      await handleModifyTime(event, client, clinicId, groupId, data);
      break;
    case 'modify_service':
      await handleModifyService(event, client, clinicId, groupId, data);
      break;
    case 'confirm_modify_date':
      await handleConfirmModifyDate(event, client, clinicId, groupId, data);
      break;
    case 'confirm_modify_time':
      await handleConfirmModifyTime(event, client, clinicId, groupId, data);
      break;
    case 'confirm_modify_service':
      await handleConfirmModifyService(event, client, clinicId, groupId, data);
      break;
  }
}

/**
 * 處理模式選擇 (單人/多人)
 */
async function handleModeSelection(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const mode = data.get('mode');
  
  // 更新群組狀態
  await upsertGroupState(groupId, clinicId, {
    bookingMode: mode || 'single',
    conversationState: 'selecting_service',
    tempData: JSON.stringify({}),
  });

  // 顯示療程選擇
  const baseUrl = 'https://3000-iul4y4kdermqtggn8o4wi-572da304.manus-asia.computer';
  const message = createServiceSelectionMessage(baseUrl);
  await client.replyMessage(event.replyToken, message);
}

/**
 * 處理療程選擇
 */
async function handleServiceSelection(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const service = data.get('service');
  
  // 更新群組狀態,儲存已選擇的療程
  await upsertGroupState(groupId, clinicId, {
    conversationState: 'selecting_date',
    tempData: JSON.stringify({ service }),
  });

  // 顯示日期選擇 (使用 Flex Message)
  const dateMessage = createDateSelectionMessage('select_date');
  await client.replyMessage(event.replyToken, dateMessage);
}

/**
 * 處理日期選擇
 */
async function handleDateSelection(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  try {
    const date = data.get('date');
    console.log('[handleDateSelection] Selected date:', date);
    
    // 取得目前狀態
    const groupState = await getGroupState(groupId, clinicId);
    console.log('[handleDateSelection] Current group state:', groupState);
    const tempData = groupState?.tempData ? JSON.parse(groupState.tempData) : {};
    console.log('[handleDateSelection] Current temp data:', tempData);
    
    // 更新狀態,儲存日期
    await upsertGroupState(groupId, clinicId, {
      conversationState: 'selecting_time',
      tempData: JSON.stringify({ ...tempData, date }),
    });
    console.log('[handleDateSelection] State updated successfully');

    // 顯示時間選擇 (使用 Flex Message，傳遞選擇的日期)
    const timeMessage = createTimeSelectionMessage(date || '', 'select_time');
    console.log('[handleDateSelection] Time selection message created');
    await client.replyMessage(event.replyToken, timeMessage);
    console.log('[handleDateSelection] Reply sent successfully');
  } catch (error) {
    console.error('[handleDateSelection] Error:', error);
    console.error('[handleDateSelection] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '選擇日期時發生錯誤，請稍後再試。',
    });
  }
}

/**
 * 處理時間選擇
 */
async function handleTimeSelection(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const time = data.get('time');
  
  // 取得目前狀態
  const groupState = await getGroupState(groupId, clinicId);
  const tempData = groupState?.tempData ? JSON.parse(groupState.tempData) : {};
  
  // 更新狀態,儲存時間
  await upsertGroupState(groupId, clinicId, {
    conversationState: 'waiting_name',
    tempData: JSON.stringify({ ...tempData, time }),
  });

  // 顯示姓名輸入提示 (使用 Flex Message)
  const nameInputMessage = createNameInputMessage(tempData.service, tempData.date, time || '');
  await client.replyMessage(event.replyToken, nameInputMessage);
}

/**
 * 處理姓名輸入
 */
async function handleNameInput(
  event: MessageEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  name: string
) {
  // 取得目前狀態
  const groupState = await getGroupState(groupId, clinicId);
  if (!groupState || !groupState.tempData) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 預約資料遺失,請重新輸入「預約」開始',
    });
    return;
  }

  const tempData = JSON.parse(groupState.tempData);
  const { service, date, time } = tempData;

  // 更新狀態為等待備註，儲存姓名
  await upsertGroupState(groupId, clinicId, {
    conversationState: 'waiting_note',
    tempData: JSON.stringify({ ...tempData, name: name.trim() }),
  });

  // 顯示備註選擇訊息
  const noteSelectionMessage = createNoteSelectionMessage('note_selection');
  await client.replyMessage(event.replyToken, noteSelectionMessage);
}

/**
 * 處理備註選擇
 */
async function handleNoteSelection(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const skip = data.get('skip') === 'true';
  
  // 取得目前狀態
  const groupState = await getGroupState(groupId, clinicId);
  if (!groupState || !groupState.tempData) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 預約資料遺失,請重新輸入「預約」開始',
    });
    return;
  }

  const tempData = JSON.parse(groupState.tempData);
  const { service, date, time, name } = tempData;

  if (skip) {
    // 不需要備註，直接建立預約
    const appointmentId = await createAppointment({
      clinicId,
      lineGroupId: groupId,
      lineUserId: event.source.type === 'user' ? event.source.userId : event.source.userId,
      name: name,
      date,
      time,
      service,
      status: 'pending',
      notes: null,
    });

    // 重置群組狀態
    await upsertGroupState(groupId, clinicId, {
      conversationState: 'idle',
      tempData: JSON.stringify({}),
    });

    // 取得診所資訊
    const clinic = await getClinicById(clinicId);
    const clinicName = clinic?.name || '診所';
    const clinicAddress = '台北市大安區大安路一段73號5樓';

    // 發送預約確認訊息
    const confirmationMessage = createBookingConfirmationMessage(
      name,
      service,
      date,
      time,
      clinicName,
      clinicAddress,
      null
    );
    await client.replyMessage(event.replyToken, confirmationMessage);

    // 根據模式決定是否發送額外訊息
    if (groupState.bookingMode === 'single') {
      // 單人模式:顯示待確認清單
      const pendingAppointments = await getPendingAppointmentsByGroup(groupId);
      const listMessage = createPendingAppointmentsMessage(pendingAppointments);
      await client.pushMessage(groupId, listMessage);
    } else {
      // 多人模式:檢查預約數量
      const pendingAppointments = await getPendingAppointmentsByGroup(groupId);
      if (pendingAppointments.length >= 5) {
        // 超過 5 筆預約，顯示提示
        await client.pushMessage(groupId, {
          type: 'text',
          text: '⚠️ 您已新增 5 筆以上的預約，建議先查看清單或聯絡診所確認。',
        });
      }
      // 顯示繼續新增或查看清單
      const continueMessage = createMultipleBookingCompleteMessage();
      await client.pushMessage(groupId, continueMessage);
    }
  } else {
    // 需要備註，更新狀態為等待備註輸入
    await upsertGroupState(groupId, clinicId, {
      conversationState: 'waiting_note_input',
      tempData: JSON.stringify(tempData),
    });

    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '📝 請輸入備註內容（例如：希望調整時間長度、特殊過敏史等）',
    });
  }
}

/**
 * 處理備註輸入
 */
async function handleNoteInput(
  event: MessageEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  note: string
) {
  // 取得目前狀態
  const groupState = await getGroupState(groupId, clinicId);
  if (!groupState || !groupState.tempData) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 預約資料遺失,請重新輸入「預約」開始',
    });
    return;
  }

  const tempData = JSON.parse(groupState.tempData);
  const { service, date, time, name } = tempData;

  // 建立預約
  const appointmentId = await createAppointment({
    clinicId,
    lineGroupId: groupId,
    lineUserId: event.source.type === 'user' ? event.source.userId : event.source.userId,
    name: name,
    date,
    time,
    service,
    status: 'pending',
    notes: note.trim(),
  });

  // 重置群組狀態
  await upsertGroupState(groupId, clinicId, {
    conversationState: 'idle',
    tempData: JSON.stringify({}),
  });

  // 取得診所資訊
  const clinic = await getClinicById(clinicId);
  const clinicName = clinic?.name || '診所';
  const clinicAddress = '台北市大安區大安路一段73號5樓';

  // 發送預約確認訊息
  const confirmationMessage = createBookingConfirmationMessage(
    name,
    service,
    date,
    time,
    clinicName,
    clinicAddress,
    note.trim()
  );
  await client.replyMessage(event.replyToken, confirmationMessage);

  // 根據模式決定是否發送額外訊息
  if (groupState.bookingMode === 'single') {
    // 單人模式:顯示待確認清單
    const pendingAppointments = await getPendingAppointmentsByGroup(groupId);
    const listMessage = createPendingAppointmentsMessage(pendingAppointments);
    await client.pushMessage(groupId, listMessage);
  } else {
    // 多人模式:檢查預約數量
    const pendingAppointments = await getPendingAppointmentsByGroup(groupId);
    if (pendingAppointments.length >= 5) {
      // 超過 5 筆預約，顯示提示
      await client.pushMessage(groupId, {
        type: 'text',
        text: '⚠️ 您已新增 5 筆以上的預約，建議先查看清單或聯絡診所確認。',
      });
    }
    // 顯示繼續新增或查看清單
    const continueMessage = createMultipleBookingCompleteMessage();
    await client.pushMessage(groupId, continueMessage);
  }
}

/**
 * 處理確認預約
 */
async function handleConfirm(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = data.get('appointmentId');
  if (!appointmentId) return;

  const appointment = await getAppointmentById(parseInt(appointmentId));
  if (!appointment) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 預約不存在',
    });
    return;
  }

  // 更新狀態為已確認
  await updateAppointmentStatus(parseInt(appointmentId), 'confirmed');

  // 發送確認訊息給群組
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: `✅ 已確認預約\n\n姓名:${appointment.name}\n日期:${appointment.date}\n時間:${appointment.time}\n療程:${appointment.service}`,
  });

  // 更新待確認清單
  const pendingAppointments = await getPendingAppointmentsByGroup(groupId);
  if (pendingAppointments.length > 0) {
    const message = createPendingAppointmentsMessage(pendingAppointments);
    await client.pushMessage(groupId, message);
  }
}

/**
 * 處理取消預約
 */
async function handleCancel(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = data.get('appointmentId');
  if (!appointmentId) return;

  const appointment = await getAppointmentById(parseInt(appointmentId));
  if (!appointment) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 預約不存在',
    });
    return;
  }

  // 更新狀態為已取消
  await updateAppointmentStatus(parseInt(appointmentId), 'cancelled');

  // 發送取消訊息
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: `❌ 已取消預約\n\n姓名:${appointment.name}\n日期:${appointment.date}\n時間:${appointment.time}`,
  });

  // 更新待確認清單
  const pendingAppointments = await getPendingAppointmentsByGroup(groupId);
  if (pendingAppointments.length > 0) {
    const message = createPendingAppointmentsMessage(pendingAppointments);
    await client.pushMessage(groupId, message);
  }
}

/**
 * 處理刪除預約
 */
async function handleDeleteAppointment(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = data.get('id');
  if (!appointmentId) return;

  const appointment = await getAppointmentById(parseInt(appointmentId));
  if (!appointment) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 預約不存在',
    });
    return;
  }

  // 直接從資料庫刪除
  await deleteAppointment(parseInt(appointmentId));

  // 發送刪除訊息
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: `🗑️ 已刪除預約\n\n姓名:${appointment.name}\n日期:${appointment.date}\n時間:${appointment.time}`,
  });

  // 更新待確認清單
  const pendingAppointments = await getPendingAppointmentsByGroup(groupId);
  if (pendingAppointments.length > 0) {
    const message = createPendingAppointmentsMessage(pendingAppointments);
    await client.pushMessage(groupId, message);
  } else {
    await client.pushMessage(groupId, {
      type: 'text',
      text: '✅ 目前沒有待確認的預約',
    });
  }
}

/**
 * 處理查看清單
 */
async function handleShowList(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string
) {
  const pendingAppointments = await getPendingAppointmentsByGroup(groupId);
  const message = createPendingAppointmentsMessage(pendingAppointments);
  await client.replyMessage(event.replyToken, message);
}

/**
 * 處理繼續新增預約
 */
async function handleContinueBooking(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string
) {
  // 取得目前狀態，保留 bookingMode
  const groupState = await getGroupState(groupId, clinicId);
  const bookingMode = groupState?.bookingMode || 'single';

  // 重置狀態並顯示療程選擇，但保留 bookingMode
  await upsertGroupState(groupId, clinicId, {
    conversationState: 'selecting_service',
    tempData: JSON.stringify({}),
    bookingMode: bookingMode,
  });

  const baseUrl = 'https://3000-iul4y4kdermqtggn8o4wi-572da304.manus-asia.computer';
  const message = createServiceSelectionMessage(baseUrl);
  await client.replyMessage(event.replyToken, message);
}

/**
 * 處理查詢預約
 */
async function handleQueryAppointments(
  event: MessageEvent,
  client: Client,
  clinicId: number,
  groupId: string
) {
  // 取得用戶 ID
  const userId = event.source.userId;
  if (!userId) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '無法識別您的身份，請稍後再試。',
    });
    return;
  }

  // 查詢該用戶的未來預約
  const { getCustomerUpcomingAppointments } = await import('./db');
  const appointments = await getCustomerUpcomingAppointments(userId);

  if (appointments.length === 0) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '📅 您目前沒有任何預約記錄。',
    });
    return;
  }

  // 生成預約清單 Flex Message
  const { createCustomerAppointmentsMessage } = await import('./linebot-utils');
  const message = createCustomerAppointmentsMessage(appointments);
  await client.replyMessage(event.replyToken, message);
}

/**
 * 處理客戶取消預約
 */
async function handleCustomerCancel(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = parseInt(data.get('id') || '0');
  const userId = event.source.userId;

  if (!userId) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '無法識別您的身份，請稍後再試。',
    });
    return;
  }

  // 取消預約
  const { cancelAppointmentByCustomer, getAppointmentById } = await import('./db');
  
  // 先取得預約資訊
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '找不到預約記錄。',
    });
    return;
  }

  const success = await cancelAppointmentByCustomer(appointmentId, userId);

  if (success) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ 預約已取消\n\n療程: ${appointment.service}\n日期: ${appointment.date}\n時間: ${appointment.time}`,
    });
  } else {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '取消預約失敗，請稍後再試或聯繫診所。',
    });
  }
}

/**
 * 處理修改預約 - 顯示修改選項
 */
async function handleModifyCustomer(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = parseInt(data.get('id') || '0');
  const { getAppointmentById } = await import('./db');
  
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '找不到預約記錄。',
    });
    return;
  }

  const { createModifyOptionsMessage } = await import('./linebot-utils');
  const message = createModifyOptionsMessage(appointmentId, appointment);
  await client.replyMessage(event.replyToken, message);
}

/**
 * 處理修改日期 - 顯示日期選擇
 */
async function handleModifyDate(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = parseInt(data.get('id') || '0');
  const { createDateQuickReply } = await import('./linebot-utils');
  
  const quickReply = createDateQuickReply(`confirm_modify_date&id=${appointmentId}`);
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: '📅 請選擇新的預約日期：',
    quickReply,
  });
}

/**
 * 處理修改時間 - 顯示時間選擇
 */
async function handleModifyTime(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = parseInt(data.get('id') || '0');
  
  // 取得預約資訊以取得日期
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 預約不存在',
    });
    return;
  }
  
  // 使用 Flex Message 顯示時間選擇
  const timeMessage = createTimeSelectionMessage(appointment.date, `confirm_modify_time&id=${appointmentId}`);
  await client.replyMessage(event.replyToken, timeMessage);
}

/**
 * 處理修改療程 - 顯示療程選單
 */
async function handleModifyService(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = parseInt(data.get('id') || '0');
  const baseUrl = `https://3000-iul4y4kdermqtggn8o4wi-572da304.manus-asia.computer`;
  const { createServiceSelectionMessage } = await import('./linebot-utils');
  
  // 修改 createServiceSelectionMessage 以支援修改模式
  const message = createServiceSelectionMessage(baseUrl, appointmentId);
  await client.replyMessage(event.replyToken, message);
}

/**
 * 確認修改日期
 */
async function handleConfirmModifyDate(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = parseInt(data.get('id') || '0');
  const newDate = data.get('date') || '';
  const userId = event.source.userId;

  if (!userId) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '無法識別您的身份，請稍後再試。',
    });
    return;
  }

  const { updateAppointmentByCustomer, getAppointmentById, checkAppointmentConflict } = await import('./db');
  
  // 先取得當前預約資訊
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '找不到預約資訊，請稍後再試。',
    });
    return;
  }

  // 檢查新日期是否有衝突
  const conflict = await checkAppointmentConflict(
    newDate,
    appointment.time,
    clinicId,
    appointmentId
  );

  if (conflict) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `❌ 該時段已有預約\n\n日期: ${newDate}\n時間: ${appointment.time}\n\n請選擇其他日期或時間。`,
    });
    return;
  }

  const success = await updateAppointmentByCustomer(appointmentId, userId, { date: newDate });

  if (success) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ 預約日期已修改\n\n療程: ${appointment.service}\n新日期: ${newDate}\n時間: ${appointment.time}`,
    });
  } else {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '修改預約失敗，請稍後再試或聯繫診所。',
    });
  }
}

/**
 * 確認修改時間
 */
async function handleConfirmModifyTime(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = parseInt(data.get('id') || '0');
  const newTime = data.get('time') || '';
  const userId = event.source.userId;

  if (!userId) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '無法識別您的身份，請稍後再試。',
    });
    return;
  }

  const { updateAppointmentByCustomer, getAppointmentById, checkAppointmentConflict } = await import('./db');
  
  // 先取得當前預約資訊
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '找不到預約資訊，請稍後再試。',
    });
    return;
  }

  // 檢查新時間是否有衝突
  const conflict = await checkAppointmentConflict(
    appointment.date,
    newTime,
    clinicId,
    appointmentId
  );

  if (conflict) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `❌ 該時段已有預約\n\n日期: ${appointment.date}\n時間: ${newTime}\n\n請選擇其他時間。`,
    });
    return;
  }

  const success = await updateAppointmentByCustomer(appointmentId, userId, { time: newTime });

  if (success) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ 預約時間已修改\n\n療程: ${appointment.service}\n日期: ${appointment.date}\n新時間: ${newTime}`,
    });
  } else {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '修改預約失敗，請稍後再試或聯繫診所。',
    });
  }
}

/**
 * 確認修改療程
 */
async function handleConfirmModifyService(
  event: PostbackEvent,
  client: Client,
  clinicId: number,
  groupId: string,
  data: URLSearchParams
) {
  const appointmentId = parseInt(data.get('id') || '0');
  const newService = data.get('service') || '';
  const userId = event.source.userId;

  if (!userId) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '無法識別您的身份，請稍後再試。',
    });
    return;
  }

  const { updateAppointmentByCustomer, getAppointmentById } = await import('./db');
  const success = await updateAppointmentByCustomer(appointmentId, userId, { service: newService });

  if (success) {
    const appointment = await getAppointmentById(appointmentId);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ 預約療程已修改\n\n新療程: ${newService}\n日期: ${appointment?.date}\n時間: ${appointment?.time}`,
    });
  } else {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '修改預約失敗，請稍後再試或聯繫診所。',
    });
  }
}

export default router;


/**
 * 處理群組授權
 */
async function handleAuthorization(
  event: MessageEvent,
  client: Client,
  groupId: string,
  text: string
) {
  // 提取授權碼（格式：授權 AUTH-CODE）
  const authCode = text.replace('授權 ', '').trim();
  
  if (!authCode) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 請提供授權碼。\n\n正確格式：授權 AUTH-ABC123',
    });
    return;
  }
  
  try {
    const {
      getAuthorizationCodeByCode,
      updateAuthorizationCodeStatus,
      authorizeGroup,
      isGroupAuthorized,
    } = await import('./db');
    
    // 檢查群組是否已授權
    const alreadyAuthorized = await isGroupAuthorized(groupId);
    if (alreadyAuthorized) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '✅ 此群組已經授權，可以直接使用機器人功能！\n\n輸入「預約」開始預約流程。',
      });
      return;
    }
    
    // 驗證授權碼
    const authCodeData = await getAuthorizationCodeByCode(authCode);
    
    if (!authCodeData) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 授權碼不存在，請檢查是否輸入正確。',
      });
      return;
    }
    
    if (authCodeData.status !== 'active') {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 此授權碼已失效或已被使用。',
      });
      return;
    }
    
    // 檢查有效期限
    if (authCodeData.expiresAt && new Date(authCodeData.expiresAt) < new Date()) {
      await updateAuthorizationCodeStatus(authCode, 'expired');
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 此授權碼已過期。',
      });
      return;
    }
    
    // 授權群組
    await authorizeGroup({
      lineGroupId: groupId,
      clinicId: authCodeData.clinicId,
      authorizationCode: authCode,
      isActive: true,
    });
    
    // 更新授權碼狀態為已使用
    await updateAuthorizationCodeStatus(authCode, 'used');
    
    // 發送成功訊息
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '🎉 授權成功！\n\n此群組已啟用機器人功能，現在可以開始使用了！\n\n📝 可用功能：\n• 輸入「預約」開始預約流程\n• 輸入「查詢預約」或「我的預約」查看預約清單',
    });
    
    console.log(`[handleAuthorization] Group ${groupId} authorized with code ${authCode}`);
  } catch (error) {
    console.error('[handleAuthorization] Error:', error);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 授權過程發生錯誤，請稍後再試。',
    });
  }
}

/**
 * 處理員工綁定
 */
async function handleStaffBind(
  event: MessageEvent,
  client: Client,
  text: string
) {
  try {
    // 解析授權碼
    const authCode = text.replace('員工綁定 ', '').trim();
    const lineUserId = event.source.userId;
    
    if (!lineUserId) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 無法取得您的 LINE 使用者 ID，請稍後再試。',
      });
      return;
    }
    
    console.log(`[handleStaffBind] User ${lineUserId} attempting to bind with code ${authCode}`);
    
    // 匯入 Supabase 函數
    const {
      verifyStaffAuthCode,
      markAuthCodeAsUsed,
      getStaffByEmployeeId,
      bindStaffToLineUser,
      getStaffByLineUserId,
    } = await import('./supabase-client');
    
    // 檢查是否已經綁定
    const existingStaff = await getStaffByLineUserId(lineUserId);
    if (existingStaff.data) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `❌ 您已經綁定過員工身份了！\n\n員工編號：${existingStaff.data.employee_id}\n姓名：${existingStaff.data.name}`,
      });
      return;
    }
    
    // 驗證授權碼
    const authCodeResult = await verifyStaffAuthCode(authCode);
    if (authCodeResult.error || !authCodeResult.data) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 授權碼不存在或已失效，請向管理員索取有效的授權碼。',
      });
      return;
    }
    
    const authCodeData = authCodeResult.data;
    
    // 檢查授權碼是否已過期
    if (authCodeData.expires_at) {
      const expiryDate = new Date(authCodeData.expires_at);
      if (expiryDate < new Date()) {
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: '❌ 此授權碼已過期，請向管理員索取新的授權碼。',
        });
        return;
      }
    }
    
    // 取得員工資料
    const staffResult = await getStaffByEmployeeId(authCodeData.employee_id);
    if (staffResult.error || !staffResult.data) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 找不到對應的員工資料，請聯絡管理員。',
      });
      return;
    }
    
    const staff = staffResult.data;
    
    // 綁定員工與 LINE User ID
    const bindResult = await bindStaffToLineUser(staff.employee_id, lineUserId);
    if (bindResult.error) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 綁定過程發生錯誤，請稍後再試。',
      });
      return;
    }
    
    // 標記授權碼為已使用
    await markAuthCodeAsUsed(authCode, lineUserId);
    
    // 發送成功訊息
    const { createStaffBindSuccessMessage } = await import('./attendance-utils');
    const successMessage = createStaffBindSuccessMessage(staff.name, staff.employee_id);
    
    await client.replyMessage(event.replyToken, successMessage);
    
    // TODO: 切換 Rich Menu 為考勤版本
    // await client.linkRichMenuToUser(lineUserId, ATTENDANCE_RICH_MENU_ID);
    
    console.log(`[handleStaffBind] Successfully bound user ${lineUserId} to employee ${staff.employee_id}`);
  } catch (error) {
    console.error('[handleStaffBind] Error:', error);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 綁定過程發生錯誤，請稍後再試。',
    });
  }
}

/**
 * 處理打卡 (Postback)
 */
async function handleClock(
  event: PostbackEvent,
  client: Client,
  data: URLSearchParams
) {
  try {
    const type = data.get('type') as 'clock_in' | 'clock_out';
    const skipLocation = data.get('skip_location') === 'true';
    const lineUserId = event.source.userId;
    
    if (!lineUserId) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 無法取得您的 LINE 使用者 ID。',
      });
      return;
    }
    
    console.log(`[handleClock] User ${lineUserId} attempting to clock ${type}`);
    
    // 匯入 Supabase 函數
    const {
      getStaffByLineUserId,
      createAttendanceRecord,
      getTodayAttendance,
    } = await import('./supabase-client');
    
    // 檢查員工綁定狀態
    const staffResult = await getStaffByLineUserId(lineUserId);
    if (staffResult.error || !staffResult.data) {
      const { createStaffNotBoundMessage } = await import('./attendance-utils');
      const message = createStaffNotBoundMessage();
      await client.replyMessage(event.replyToken, message);
      return;
    }
    
    const staff = staffResult.data;
    
    // 如果沒有略過位置且沒有位置資訊，請求分享位置
    if (!skipLocation) {
      const { createLocationRequestMessage } = await import('./attendance-utils');
      const locationMessage = createLocationRequestMessage(type);
      await client.replyMessage(event.replyToken, locationMessage);
      return;
    }
    
    // 建立打卡記錄
    const recordResult = await createAttendanceRecord({
      employeeId: staff.employee_id,
      type,
    });
    
    if (recordResult.error) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 打卡失敗，請稍後再試。',
      });
      return;
    }
    
    // 發送打卡成功訊息
    const { createClockSuccessMessage } = await import('./attendance-utils');
    const now = new Date();
    const timeString = now.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const successMessage = createClockSuccessMessage({
      type,
      staffName: staff.name,
      time: timeString,
    });
    
    await client.replyMessage(event.replyToken, successMessage);
    
    console.log(`[handleClock] Successfully clocked ${type} for employee ${staff.employee_id}`);
  } catch (error) {
    console.error('[handleClock] Error:', error);
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '❌ 打卡過程發生錯誤，請稍後再試。',
    });
  }
}

/**
 * 處理位置訊息 (用於打卡)
 */
async function handleLocationMessage(
  event: MessageEvent,
  client: Client
) {
  try {
    const location = (event.message as any);
    const latitude = location.latitude;
    const longitude = location.longitude;
    const lineUserId = event.source.userId;
    
    if (!lineUserId) {
      return;
    }
    
    console.log(`[handleLocationMessage] Received location from ${lineUserId}: ${latitude}, ${longitude}`);
    
    // 匯入 Supabase 函數
    const {
      getStaffByLineUserId,
      createAttendanceRecord,
    } = await import('./supabase-client');
    
    // 檢查員工綁定狀態
    const staffResult = await getStaffByLineUserId(lineUserId);
    if (staffResult.error || !staffResult.data) {
      return;
    }
    
    const staff = staffResult.data;
    
    // TODO: 從某處取得打卡類型 (clock_in 或 clock_out)
    // 這裡暫時假設是上班打卡，實際應該從對話狀態或其他地方取得
    const type = 'clock_in';
    
    // 建立打卡記錄
    const recordResult = await createAttendanceRecord({
      employeeId: staff.employee_id,
      type,
      latitude,
      longitude,
      location: `${latitude}, ${longitude}`,
    });
    
    if (recordResult.error) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 打卡失敗，請稍後再試。',
      });
      return;
    }
    
    // 發送打卡成功訊息
    const { createClockSuccessMessage } = await import('./attendance-utils');
    const now = new Date();
    const timeString = now.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const successMessage = createClockSuccessMessage({
      type,
      staffName: staff.name,
      time: timeString,
      location: `${latitude}, ${longitude}`,
    });
    
    await client.replyMessage(event.replyToken, successMessage);
    
    console.log(`[handleLocationMessage] Successfully clocked ${type} for employee ${staff.employee_id}`);
  } catch (error) {
    console.error('[handleLocationMessage] Error:', error);
  }
}
