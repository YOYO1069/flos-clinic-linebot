/**
 * 初始化診所資料
 * 執行方式: node --import tsx server/init-clinic.ts
 */

import { createClinic, getClinicByChannelId } from "./db";

async function initClinic() {
  console.log("開始初始化診所資料...");

  const channelId = "2008067196";
  
  // 檢查是否已存在
  const existing = await getClinicByChannelId(channelId);
  if (existing) {
    console.log("診所已存在:", existing.name);
    return;
  }

  // 建立道玄機器貓診所
  const clinicId = await createClinic({
    name: "道玄機器貓",
    lineChannelId: channelId,
    lineChannelSecret: "622fa4ad75c5f9b7da26ffeb75bfe4bd",
    lineChannelAccessToken:
      "sH/nOpOx9izKR+NUyHTcvqpkFf254r+4Npw2FJAOYYIDyWseYlVrCV5DAXEpFVTme0hsHT1wohaB9AsZVL/tVvtOMBZ4D81TCYezt1gDL8GNC3MosA1ikrWA/uNRpF3nSizUvRMp/3OuIcS+nm21ywdB04t89/1O/w1cDnyilFU=",
    webhookUrl: "https://flosbotdash-ed3bggve.manus.space/api/webhook/daoxuan-bot",
    isActive: true,
  });

  console.log("診所建立成功! ID:", clinicId);
}

initClinic()
  .then(() => {
    console.log("初始化完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("初始化失敗:", error);
    process.exit(1);
  });
