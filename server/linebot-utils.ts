import { FlexMessage, FlexBubble, FlexCarousel, QuickReply, QuickReplyItem } from '@line/bot-sdk';

/**
 * 療程列表與對應圖片
 */
export const SERVICES = [
  { name: '美國音波', image: '/services/ultrasound.jpg' },
  { name: '無雙電波', image: '/services/radiofrequency.jpg' },
  { name: '渦旋音波', image: '/services/vortex-ultrasound.jpg' },
  { name: '海芙4', image: '/services/hifu4.jpg' },
  { name: '肉毒', image: '/services/botox.jpg' },
  { name: '玻尿酸', image: '/services/filler.jpg' },
  { name: 'Embody', image: '/services/body-sculpting.jpg' },
  { name: '英特波', image: '/services/body-sculpting.jpg' },
  { name: '猛健樂', image: '/services/body-sculpting.jpg' },
  { name: 'Emsculpt Neo', image: '/services/emsculpt.jpg' },
  { name: '先行諮詢', image: '/services/consultation.jpg' },
  { name: 'Inmode Lift鑽石超塑', image: '/services/inmode.jpg' },
  { name: 'Onda', image: '/services/onda.jpg' },
  { name: 'Dermashot & Microneedle', image: '/services/microneedle.jpg' },
  { name: '德瑪莎水光槍 / 微針', image: '/services/microneedle.jpg' },
  { name: '喬雅露', image: '/services/rejuran.jpg' },
  { name: '麗珠蘭', image: '/services/rejuran.jpg' },
  { name: '外泌體', image: '/services/exosome.jpg' },
  { name: 'PRP', image: '/services/prp.jpg' },
  { name: '無針水光', image: '/services/aqua-glow.jpg' },
  { name: '皮秒蜂巢', image: '/services/picosure.jpg' },
  { name: '藍雷射', image: '/services/blue-laser.jpg' },
  { name: '陰莖震波', image: '/services/shockwave.jpg' },
  { name: '海飛秀', image: '/services/hydrafacial.jpg' },
];

/**
 * 建立預約模式選擇訊息
 */
export function createBookingModeMessage(): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📅 預約系統',
          weight: 'bold',
          size: 'xl',
          color: '#ffffff',
          align: 'center',
        },
      ],
      backgroundColor: '#8B5CF6',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '請選擇預約模式',
          weight: 'bold',
          size: 'lg',
          margin: 'md',
          align: 'center',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '👤 單人預約',
                data: 'action=select_mode&mode=single',
                displayText: '單人預約',
              },
              style: 'primary',
              color: '#EC4899',
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '👥 多人預約',
                data: 'action=select_mode&mode=multiple',
                displayText: '多人預約',
              },
              style: 'primary',
              color: '#8B5CF6',
            },
          ],
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: '請選擇預約模式',
    contents: bubble,
  };
}

/**
 * 建立療程選擇訊息 (使用 Carousel 分頁顯示,帶圖片)
 */
export function createServiceSelectionMessage(baseUrl: string, appointmentId?: number): FlexMessage {
  // 將療程分組,每個 bubble 顯示 8 個療程 (縮小格子後可以顯示更多)
  const servicesPerBubble = 8;
  const bubbles: FlexBubble[] = [];

  for (let i = 0; i < SERVICES.length; i += servicesPerBubble) {
    const serviceGroup = SERVICES.slice(i, i + servicesPerBubble);
    
    // 建立服務按鈕,每個服務包含圖片和按鈕 (縮小版)
    const serviceBoxes = serviceGroup.map((service) => ({
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        {
          type: 'image' as const,
          url: `${baseUrl}${service.image}`,
          size: 'full' as const,
          aspectRatio: '1:1' as const,
          aspectMode: 'cover' as const,
        },
        {
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [
            {
              type: 'text' as const,
              text: service.name,
              size: 'xs' as const,
              color: '#ffffff',
              align: 'center' as const,
              weight: 'bold' as const,
              wrap: true,
            },
          ],
          backgroundColor: '#EC4899CC',
          paddingAll: '6px',
        },
      ],
      action: {
        type: 'postback' as const,
        label: service.name,
        data: appointmentId 
          ? `action=confirm_modify_service&id=${appointmentId}&service=${service.name}`
          : `action=select_service&service=${service.name}`,
        displayText: service.name,
      },
      cornerRadius: '8px',
      margin: 'xs' as const,
      flex: 0,
      width: '23%',
    }));

    const bubble: FlexBubble = {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `💆 療程選擇 (${Math.floor(i / servicesPerBubble) + 1}/${Math.ceil(SERVICES.length / servicesPerBubble)})`,
            weight: 'bold',
            size: 'lg',
            color: '#ffffff',
            align: 'center',
          },
        ],
        backgroundColor: '#8B5CF6',
        paddingAll: '15px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '請選擇療程項目',
            weight: 'bold',
            size: 'md',
            margin: 'md',
            align: 'center',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            spacing: 'xs',
            contents: serviceBoxes.slice(0, 4),
            flex: 0,
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'xs',
            spacing: 'xs',
            contents: serviceBoxes.slice(4, 8),
            flex: 0,
          },
        ],
      },
    };

    bubbles.push(bubble);
  }

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  };

  return {
    type: 'flex',
    altText: '請選擇療程項目',
    contents: carousel,
  };
}

/**
 * 建立日期選擇 Quick Reply
 */
export function createDateQuickReply(actionPrefix: string = 'select_date'): QuickReply {
  const items: QuickReplyItem[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const isSunday = date.getDay() === 0;
    if (isSunday) continue; // 跳過週日

    const dateStr = date.toISOString().split('T')[0];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    const label = `${date.getMonth() + 1}/${date.getDate()}(${weekday})`;

    items.push({
      type: 'action',
      action: {
        type: 'postback',
        label: label,
        data: `action=${actionPrefix}&date=${dateStr}`,
        displayText: label,
      },
    });
  }

  return {
    items,
  };
}

/**
 * 建立時間選擇 Quick Reply
 * 營業時間: 10:00-20:00, 每 15 分鐘
 */
export function createTimeQuickReply(actionPrefix: string = 'select_time'): QuickReply {
  const items: QuickReplyItem[] = [];

  for (let hour = 10; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 20 && minute > 0) break; // 20:00 之後不接受預約

      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      items.push({
        type: 'action',
        action: {
          type: 'postback',
          label: timeStr,
          data: `action=${actionPrefix}&time=${timeStr}`,
          displayText: timeStr,
        },
      });
    }
  }

  return {
    items,
  };
}

/**
 * 建立待確認預約清單 Flex Message
 */
export function createPendingAppointmentsMessage(appointments: any[]): FlexMessage {
  if (appointments.length === 0) {
    const bubble: FlexBubble = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '目前沒有待確認的預約',
            align: 'center',
            color: '#999999',
          },
        ],
      },
    };

    return {
      type: 'flex',
      altText: '目前沒有待確認的預約',
      contents: bubble,
    };
  }

  const bubbles: FlexBubble[] = appointments.map((apt) => ({
    type: 'bubble',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '⏰ 待確認預約',
          weight: 'bold',
          size: 'lg',
          color: '#ffffff',
          align: 'center',
        },
      ],
      backgroundColor: '#F59E0B',
      paddingAll: '15px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: '姓名',
              color: '#999999',
              size: 'sm',
              flex: 1,
            },
            {
              type: 'text',
              text: apt.customerName,
              wrap: true,
              color: '#333333',
              size: 'sm',
              flex: 3,
              weight: 'bold',
            },
          ],
        },
        {
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '日期',
              color: '#999999',
              size: 'sm',
              flex: 1,
            },
            {
              type: 'text',
              text: apt.appointmentDate,
              wrap: true,
              color: '#333333',
              size: 'sm',
              flex: 3,
            },
          ],
        },
        {
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '時間',
              color: '#999999',
              size: 'sm',
              flex: 1,
            },
            {
              type: 'text',
              text: apt.appointmentTime,
              wrap: true,
              color: '#333333',
              size: 'sm',
              flex: 3,
            },
          ],
        },
        {
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '療程',
              color: '#999999',
              size: 'sm',
              flex: 1,
            },
            {
              type: 'text',
              text: apt.service,
              wrap: true,
              color: '#333333',
              size: 'sm',
              flex: 3,
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '✅ 確認',
                data: `action=confirm_appointment&id=${apt.id}`,
                displayText: '確認預約',
              },
              style: 'primary',
              color: '#10B981',
              flex: 1,
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '❌ 取消',
                data: `action=cancel_appointment&id=${apt.id}`,
                displayText: '取消預約',
              },
              style: 'secondary',
              flex: 1,
            },
          ],
        },
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '🗑️ 刪除預約',
            data: `action=delete_appointment&id=${apt.id}`,
            displayText: '刪除預約',
          },
          style: 'secondary',
          color: '#EF4444',
        },
      ],
    },
  }));

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  };

  return {
    type: 'flex',
    altText: `您有 ${appointments.length} 筆待確認預約`,
    contents: carousel,
  };
}

/**
 * 建立多人預約完成訊息
 */
export function createMultipleBookingCompleteMessage(): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✅ 預約已送出',
          weight: 'bold',
          size: 'lg',
          align: 'center',
          color: '#10B981',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'text',
          text: '請選擇下一步操作',
          align: 'center',
          margin: 'lg',
          size: 'sm',
          color: '#666666',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '➕ 繼續新增預約',
            data: 'action=continue_booking',
            displayText: '繼續新增預約',
          },
          style: 'primary',
          color: '#EC4899',
        },
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '📋 查看待確認清單',
            data: 'action=view_list',
            displayText: '查看待確認清單',
          },
          style: 'primary',
          color: '#8B5CF6',
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: '預約已送出',
    contents: bubble,
  };
}

/**
 * 建立客戶預約清單 Flex Message
 */
export function createCustomerAppointmentsMessage(appointments: any[]): FlexMessage {
  const bubbles: FlexBubble[] = appointments.map((apt) => ({
    type: 'bubble',
    size: 'micro',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: getStatusText(apt.status),
          color: '#ffffff',
          weight: 'bold',
          size: 'sm',
        },
      ],
      backgroundColor: getStatusColor(apt.status),
      paddingAll: '12px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: apt.service,
          weight: 'bold',
          size: 'lg',
          wrap: true,
          color: '#1a1a1a',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '👤',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: apt.name,
                  color: '#666666',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '📅',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: `${apt.date} ${apt.time}`,
                  color: '#666666',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
          ],
        },
      ],
      paddingAll: '16px',
    },
    footer: {
      type: 'box',
      layout: 'horizontal',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '修改預約',
            data: `action=modify_customer&id=${apt.id}`,
          },
          style: 'link',
          height: 'sm',
          color: '#8B5CF6',
        },
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '取消預約',
            data: `action=cancel_customer&id=${apt.id}`,
          },
          style: 'link',
          height: 'sm',
          color: '#dc2626',
        },
      ],
      paddingAll: '12px',
    },
  }));

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  };

  return {
    type: 'flex',
    altText: '您的預約清單',
    contents: carousel,
  };
}

/**
 * 取得狀態文字
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待確認',
    confirmed: '已確認',
    cancelled: '已取消',
    completed: '已完成',
  };
  return statusMap[status] || status;
}

/**
 * 取得狀態顏色
 */
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    cancelled: '#dc2626',
    completed: '#6b7280',
  };
  return colorMap[status] || '#6b7280';
}

/**
 * 建立修改選項選擇訊息
 */
export function createModifyOptionsMessage(appointmentId: number, appointment: any): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✏️ 修改預約',
          weight: 'bold',
          size: 'lg',
          color: '#ffffff',
          align: 'center',
        },
      ],
      backgroundColor: '#8B5CF6',
      paddingAll: '15px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '目前預約資訊',
          weight: 'bold',
          size: 'md',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '療程',
                  color: '#999999',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: appointment.service,
                  wrap: true,
                  color: '#333333',
                  size: 'sm',
                  flex: 3,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '日期',
                  color: '#999999',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: appointment.date,
                  wrap: true,
                  color: '#333333',
                  size: 'sm',
                  flex: 3,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '時間',
                  color: '#999999',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: appointment.time,
                  wrap: true,
                  color: '#333333',
                  size: 'sm',
                  flex: 3,
                },
              ],
            },
          ],
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'text',
          text: '請選擇要修改的項目',
          weight: 'bold',
          size: 'md',
          margin: 'lg',
          align: 'center',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '📅 修改日期',
            data: `action=modify_date&id=${appointmentId}`,
          },
          style: 'primary',
          color: '#EC4899',
        },
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '🕐 修改時間',
            data: `action=modify_time&id=${appointmentId}`,
          },
          style: 'primary',
          color: '#8B5CF6',
        },
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '💆 修改療程',
            data: `action=modify_service&id=${appointmentId}`,
          },
          style: 'primary',
          color: '#10B981',
        },
      ],
      paddingAll: '12px',
    },
  };

  return {
    type: 'flex',
    altText: '修改預約',
    contents: bubble,
  };
}

/**
 * 建立日期選擇 Flex Message (取代 Quick Reply)
 */
export function createDateSelectionMessage(actionPrefix: string = 'select_date'): FlexMessage {
  const today = new Date();
  const dates: { dateStr: string; label: string }[] = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const isSunday = date.getDay() === 0;
    if (isSunday) continue; // 跳過週日

    const dateStr = date.toISOString().split('T')[0];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    const label = `${date.getMonth() + 1}/${date.getDate()}(${weekday})`;
    
    dates.push({ dateStr, label });
  }

  // 將日期分成兩個 bubble (每個顯示 6 個日期)
  const bubbles: FlexBubble[] = [];
  const datesPerBubble = 6;

  for (let i = 0; i < dates.length; i += datesPerBubble) {
    const dateGroup = dates.slice(i, i + datesPerBubble);
    
    // 建立日期按鈕 (3行×2列)
    const dateBoxes = dateGroup.map((date) => ({
      type: 'button' as const,
      action: {
        type: 'postback' as const,
        label: date.label,
        data: `action=${actionPrefix}&date=${date.dateStr}`,
        displayText: date.label,
      },
      style: 'primary' as const,
      color: '#EC4899',
      margin: 'xs' as const,
      flex: 1,
    }));

    // 分成 3 行,每行 2 個按鈕
    const rows = [];
    for (let j = 0; j < dateBoxes.length; j += 2) {
      rows.push({
        type: 'box' as const,
        layout: 'horizontal' as const,
        spacing: 'sm' as const,
        contents: dateBoxes.slice(j, j + 2),
      });
    }

    const bubble: FlexBubble = {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `📅 選擇日期 (${Math.floor(i / datesPerBubble) + 1}/${Math.ceil(dates.length / datesPerBubble)})`,
            weight: 'bold',
            size: 'lg',
            color: '#ffffff',
            align: 'center',
          },
        ],
        backgroundColor: '#8B5CF6',
        paddingAll: '15px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '請選擇預約日期 (週日休診)',
            weight: 'bold',
            size: 'md',
            margin: 'md',
            align: 'center',
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: rows,
          },
        ],
      },
    };

    bubbles.push(bubble);
  }

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  };

  return {
    type: 'flex',
    altText: '請選擇預約日期',
    contents: carousel,
  };
}

/**
 * 建立時間選擇 Flex Message (每 30 分鐘一個時段)
 * 營業時間：週一～週五 12:00–20:30，週六 10:30–19:00，週日休診
 */
export function createTimeSelectionMessage(selectedDate: string, actionPrefix: string = 'select_time'): FlexMessage {
  const times: string[] = [];
  
  // 解析日期取得星期幾
  const date = new Date(selectedDate);
  const dayOfWeek = date.getDay(); // 0=週日, 1=週一, ..., 6=週六
  
  let startHour = 12;
  let startMinute = 0;
  let endHour = 20;
  let endMinute = 30;
  let businessHoursText = '週一～週五 12:00–20:30';
  
  if (dayOfWeek === 6) {
    // 週六：10:30–19:00
    startHour = 10;
    startMinute = 30;
    endHour = 19;
    endMinute = 0;
    businessHoursText = '週六 10:30–19:00';
  } else if (dayOfWeek === 0) {
    // 週日休診，不應該出現這個情況（日期選擇已過濾）
    businessHoursText = '週日休診';
  }
  
  // 生成時間選項（改為 1 小時為一個時段）
  for (let hour = startHour; hour < endHour; hour++) {
    const nextHour = hour + 1;
    const timeStr = `${hour.toString().padStart(2, '0')}:00-${nextHour.toString().padStart(2, '0')}:00`;
    times.push(timeStr);
  }
  
  // 處理最後一個時段（如果結束時間不是整點）
  if (endMinute > 0) {
    const timeStr = `${endHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    times.push(timeStr);
  }

  // 將時間分成多個 bubble，每個顯示 9 個時段 (3行×3列)
  const bubbles: FlexBubble[] = [];
  const timesPerBubble = 9;

  for (let i = 0; i < times.length; i += timesPerBubble) {
    const timeGroup = times.slice(i, i + timesPerBubble);
    
    // 建立時間按鈕 (3行×3列的編排)
    const timeBoxes = timeGroup.map((time) => ({
      type: 'button' as const,
      action: {
        type: 'postback' as const,
        label: time,
        data: `action=${actionPrefix}&time=${time}`,
        displayText: time,
      },
      style: 'primary' as const,
      color: '#EC4899',
      margin: 'xs' as const,
      height: 'sm' as const,
      flex: 1,
    }));
    
    // 分成 3 行，每行 3 個按鈕
    const rows = [];
    for (let j = 0; j < timeBoxes.length; j += 3) {
      rows.push({
        type: 'box' as const,
        layout: 'horizontal' as const,
        spacing: 'sm' as const,
        contents: timeBoxes.slice(j, j + 3),
      });
    }

    const bubble: FlexBubble = {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `⏰ 選擇時間 (${Math.floor(i / timesPerBubble) + 1}/${Math.ceil(times.length / timesPerBubble)})`,
            weight: 'bold',
            size: 'lg',
            color: '#ffffff',
            align: 'center',
          },
        ],
        backgroundColor: '#8B5CF6',
        paddingAll: '15px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `請選擇預約時間 (${businessHoursText})`,
            weight: 'bold',
            size: 'sm',
            margin: 'md',
            align: 'center',
            wrap: true,
          },
          {
            type: 'text',
            text: '每個時段為 1 小時，如需指定時間請在備註填寫',
            size: 'xs',
            color: '#999999',
            margin: 'sm',
            align: 'center',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: rows,
          },
        ],
      },
    };

    bubbles.push(bubble);
  }

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  };

  return {
    type: 'flex',
    altText: '請選擇預約時間',
    contents: carousel,
  };
}

/**
 * 建立姓名輸入提示 Flex Message
 */
export function createNameInputMessage(service: string, date: string, time: string): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✒️ 請輸入您的姓名',
          weight: 'bold',
          size: 'lg',
          color: '#ffffff',
          align: 'center',
        },
      ],
      backgroundColor: '#8B5CF6',
      paddingAll: '15px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '預約資訊確認',
          weight: 'bold',
          size: 'md',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '療程',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: service,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '日期',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: date,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '時間',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: time,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                },
              ],
            },
          ],
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: '請在下方輸入您的姓名',
              size: 'sm',
              color: '#EC4899',
              weight: 'bold',
              align: 'center',
            },
            {
              type: 'text',
              text: '例如：王小明',
              size: 'xs',
              color: '#999999',
              align: 'center',
              margin: 'sm',
            },
          ],
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: '請輸入您的姓名',
    contents: bubble,
  };
}

/**
 * 建立備註選擇 Flex Message
 */
export function createNoteSelectionMessage(actionPrefix: string = 'note_selection'): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📝 是否需要備註？',
          weight: 'bold',
          size: 'lg',
          color: '#ffffff',
          align: 'center',
        },
      ],
      backgroundColor: '#8B5CF6',
      paddingAll: '15px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '您可以在備註中說明特殊需求',
          size: 'sm',
          color: '#999999',
          margin: 'md',
          align: 'center',
          wrap: true,
        },
        {
          type: 'text',
          text: '例如：希望調整時間長度、特殊過敏史、其他注意事項等',
          size: 'xs',
          color: '#AAAAAA',
          margin: 'sm',
          align: 'center',
          wrap: true,
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'md',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '✅ 不需要備註，直接完成預約',
                data: `action=${actionPrefix}&skip=true`,
                displayText: '不需要備註',
              },
              style: 'primary',
              color: '#10B981',
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '📝 我要輸入備註',
                data: `action=${actionPrefix}&skip=false`,
                displayText: '我要輸入備註',
              },
              style: 'primary',
              color: '#EC4899',
            },
          ],
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: '是否需要備註？',
    contents: bubble,
  };
}

/**
 * 建立預約確認訊息 Flex Message
 */
export function createBookingConfirmationMessage(
  name: string,
  service: string,
  date: string,
  time: string,
  clinicName: string,
  clinicAddress: string,
  note?: string | null
): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '📤 預約送出',
          weight: 'bold',
          size: 'xl',
          color: '#ffffff',
          align: 'center',
        },
        {
          type: 'text',
          text: '您的預約已送出，靜待我們回覆所選時段仍有醫生能安排療程',
          size: 'sm',
          color: '#ffffff',
          align: 'center',
          margin: 'md',
          wrap: true,
        },
      ],
      backgroundColor: '#3B82F6',
      paddingAll: '20px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '預約資訊',
          weight: 'bold',
          size: 'lg',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '👤 姓名',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                  margin: 'none',
                },
                {
                  type: 'text',
                  text: name,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '💆 療程',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: service,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '📅 日期',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: date,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '⏰ 時間',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: time,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '📍 地點',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: clinicName,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                  wrap: true,
                },
              ],
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: clinicAddress,
                  size: 'xs',
                  color: '#666666',
                  align: 'end',
                  wrap: true,
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        ...(note
          ? [
              {
                type: 'box' as const,
                layout: 'vertical' as const,
                contents: [
                  {
                    type: 'text' as const,
                    text: '📝 備註',
                    size: 'sm' as const,
                    color: '#999999',
                    margin: 'none' as const,
                  },
                  {
                    type: 'text' as const,
                    text: note,
                    size: 'sm' as const,
                    color: '#111111',
                    wrap: true,
                    margin: 'sm' as const,
                  },
                ],
                backgroundColor: '#F3F4F6',
                paddingAll: '12px',
                cornerRadius: '8px',
                margin: 'md' as const,
              },
              {
                type: 'separator' as const,
                margin: 'lg' as const,
              },
            ]
          : []),
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📌 溫馨提醒',
              size: 'sm',
              color: '#F59E0B',
              weight: 'bold',
              margin: 'md',
            },
            {
              type: 'text',
              text: '• 我們會盡快確認您的預約並回覆\n• 確認後請提前 10 分鐘到達診所\n• 如需取消或修改，請輸入「查詢預約」',
              size: 'xs',
              color: '#666666',
              wrap: true,
              margin: 'sm',
            },
          ],
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `📤 預約送出！${service} - ${date} ${time}`,
    contents: bubble,
  };
}

/**
 * 建立預約確認通知 Flex Message（診所確認後發送給客戶）
 */
export function createAppointmentConfirmedMessage(
  name: string,
  service: string,
  date: string,
  time: string,
  clinicName: string,
  clinicAddress: string
): FlexMessage {
  const bubble: FlexBubble = {
    type: 'bubble',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✅ 預約已確認',
          weight: 'bold',
          size: 'xl',
          color: '#ffffff',
          align: 'center',
        },
        {
          type: 'text',
          text: '您的預約已經診所確認，請準時到診',
          size: 'sm',
          color: '#ffffff',
          align: 'center',
          margin: 'md',
          wrap: true,
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
          text: '預約資訊',
          weight: 'bold',
          size: 'lg',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '👤 姓名',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                  margin: 'none',
                },
                {
                  type: 'text',
                  text: name,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '💆 療程',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: service,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '📅 日期',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: date,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '⏰ 時間',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: time,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'separator',
              margin: 'md',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '📍 地點',
                  color: '#999999',
                  size: 'sm',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: clinicName,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold',
                  wrap: true,
                },
              ],
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: clinicAddress,
                  size: 'xs',
                  color: '#666666',
                  align: 'end',
                  wrap: true,
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '⏰ 到診提醒',
              size: 'sm',
              color: '#10B981',
              weight: 'bold',
              margin: 'md',
            },
            {
              type: 'text',
              text: '• 請提前 10 分鐘到達診所\n• 如需取消或修改，請盡早聯繫我們\n• 期待您的光臨！',
              size: 'xs',
              color: '#666666',
              wrap: true,
              margin: 'sm',
            },
          ],
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `✅ 預約已確認！${service} - ${date} ${time}`,
    contents: bubble,
  };
}
