/**
 * 考勤功能的 LINE Flex Message 工具函數
 */

import type { FlexMessage, FlexBubble } from '@line/bot-sdk';

/**
 * 建立員工綁定成功訊息
 */
export function createStaffBindSuccessMessage(staffName: string, employeeId: string): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✅ 員工綁定成功',
          weight: 'bold',
          size: 'xl',
          color: '#ffffff',
        },
      ],
      backgroundColor: '#10B981',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `歡迎 ${staffName}！`,
          weight: 'bold',
          size: 'lg',
          margin: 'md',
        },
        {
          type: 'text',
          text: `員工編號：${employeeId}`,
          size: 'sm',
          color: '#999999',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'xl',
        },
        {
          type: 'text',
          text: '您現在可以使用以下功能：',
          size: 'sm',
          margin: 'xl',
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '• 上班/下班打卡',
              size: 'sm',
              color: '#555555',
            },
            {
              type: 'text',
              text: '• 請假申請',
              size: 'sm',
              color: '#555555',
            },
            {
              type: 'text',
              text: '• 查詢出勤記錄',
              size: 'sm',
              color: '#555555',
            },
          ],
          margin: 'md',
          spacing: 'sm',
        },
        {
          type: 'separator',
          margin: 'xl',
        },
        {
          type: 'text',
          text: '💡 提示：請點擊下方選單開始使用考勤功能',
          size: 'xs',
          color: '#999999',
          margin: 'xl',
          wrap: true,
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `✅ 員工綁定成功！歡迎 ${staffName}`,
    contents: bubble,
  };
}

/**
 * 建立打卡成功訊息
 */
export function createClockSuccessMessage(data: {
  type: 'clock_in' | 'clock_out';
  staffName: string;
  time: string;
  location?: string;
  status?: string;
}): FlexMessage {
  const isClockIn = data.type === 'clock_in';
  const title = isClockIn ? '上班打卡成功' : '下班打卡成功';
  const icon = isClockIn ? '☀️' : '🌙';
  const color = isClockIn ? '#3B82F6' : '#8B5CF6';

  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${icon} ${title}`,
          weight: 'bold',
          size: 'xl',
          color: '#ffffff',
        },
      ],
      backgroundColor: color,
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              text: '姓名',
              size: 'sm',
              color: '#999999',
              flex: 2,
            },
            {
              type: 'text',
              text: data.staffName,
              size: 'sm',
              color: '#555555',
              flex: 5,
              wrap: true,
            },
          ],
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              text: '時間',
              size: 'sm',
              color: '#999999',
              flex: 2,
            },
            {
              type: 'text',
              text: data.time,
              size: 'sm',
              color: '#555555',
              flex: 5,
              wrap: true,
            },
          ],
          margin: 'md',
        },
      ],
    },
  };

  // 如果有位置資訊,加入位置欄位
  if (data.location && bubble.body?.contents) {
    bubble.body.contents.push({
      type: 'box',
      layout: 'baseline',
      contents: [
        {
          type: 'text',
          text: '地點',
          size: 'sm',
          color: '#999999',
          flex: 2,
        },
        {
          type: 'text',
          text: data.location,
          size: 'sm',
          color: '#555555',
          flex: 5,
          wrap: true,
        },
      ],
      margin: 'md',
    });
  }

  // 如果有狀態資訊(遲到/早退),加入狀態欄位
  if (data.status && bubble.body?.contents) {
    const statusText = data.status === 'late' ? '⚠️ 遲到' : data.status === 'early' ? '⚠️ 早退' : '✅ 正常';
    const statusColor = data.status === 'late' || data.status === 'early' ? '#EF4444' : '#10B981';
    
    bubble.body.contents.push({
      type: 'separator',
      margin: 'xl',
    });
    
    bubble.body.contents.push({
      type: 'box',
      layout: 'baseline',
      contents: [
        {
          type: 'text',
          text: '狀態',
          size: 'sm',
          color: '#999999',
          flex: 2,
        },
        {
          type: 'text',
          text: statusText,
          size: 'sm',
          color: statusColor,
          flex: 5,
          weight: 'bold',
        },
      ],
      margin: 'md',
    });
  }

  return {
    type: 'flex',
    altText: `${icon} ${title} - ${data.time}`,
    contents: bubble,
  };
}

/**
 * 建立請求位置分享的訊息
 */
export function createLocationRequestMessage(type: 'clock_in' | 'clock_out'): any {
  const text = type === 'clock_in' ? '請分享您的位置以完成上班打卡' : '請分享您的位置以完成下班打卡';
  
  return {
    type: 'text',
    text,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'location',
            label: '分享位置',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '略過位置',
            data: `action=clock&type=${type}&skip_location=true`,
            displayText: '略過位置分享',
          },
        },
      ],
    },
  };
}

/**
 * 建立員工未綁定提示訊息
 */
export function createStaffNotBoundMessage(): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '⚠️ 尚未綁定員工身份',
          weight: 'bold',
          size: 'xl',
          color: '#ffffff',
        },
      ],
      backgroundColor: '#F59E0B',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '您尚未綁定員工身份，無法使用考勤功能。',
          size: 'sm',
          wrap: true,
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'xl',
        },
        {
          type: 'text',
          text: '如何綁定員工身份？',
          weight: 'bold',
          size: 'sm',
          margin: 'xl',
        },
        {
          type: 'text',
          text: '請在群組中輸入以下指令：',
          size: 'xs',
          color: '#999999',
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '員工綁定 您的授權碼',
              size: 'sm',
              color: '#3B82F6',
              weight: 'bold',
            },
          ],
          backgroundColor: '#F3F4F6',
          paddingAll: '12px',
          margin: 'md',
          cornerRadius: '8px',
        },
        {
          type: 'text',
          text: '例如：員工綁定 STAFF-ABC123',
          size: 'xs',
          color: '#999999',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'xl',
        },
        {
          type: 'text',
          text: '💡 請向管理員索取您的專屬授權碼',
          size: 'xs',
          color: '#999999',
          margin: 'xl',
          wrap: true,
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: '⚠️ 尚未綁定員工身份',
    contents: bubble,
  };
}
