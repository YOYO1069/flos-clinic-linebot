import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function BookingForm() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    service: "",
    notes: "",
  });
  const [mode, setMode] = useState<"single" | "multiple">("single");
  const [groupId, setGroupId] = useState("");
  const [clinicId] = useState(1); // TODO: 從 URL 參數或 context 取得

  // 從 URL 參數取得 mode 和 groupId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    const groupIdParam = params.get("groupId");

    if (modeParam === "single" || modeParam === "multiple") {
      setMode(modeParam);
    }
    if (groupIdParam) {
      setGroupId(groupIdParam);
    }
  }, []);

  const createMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      toast.success("預約已送出！");
      
      if (mode === "single") {
        // 單人模式: 顯示成功訊息後關閉視窗
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            toast.info("請返回 LINE 查看預約清單");
          }
        }, 1500);
      } else {
        // 多人模式: 清空表單繼續新增
        setFormData({
          name: "",
          date: "",
          time: "",
          service: "",
          notes: "",
        });
        toast.info("可繼續新增下一筆預約");
      }
    },
    onError: (error) => {
      toast.error(`預約失敗: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupId) {
      toast.error("缺少群組資訊");
      return;
    }

    createMutation.mutate({
      clinicId,
      lineGroupId: groupId,
      name: formData.name,
      date: formData.date,
      time: formData.time,
      service: formData.service,
      notes: formData.notes,
      mode,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 生成未來 14 天的日期選項
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
      const weekday = weekdays[date.getDay()];
      const isSunday = date.getDay() === 0;
      dates.push({
        value: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()} (週${weekday})`,
        disabled: isSunday,
      });
    }
    return dates;
  };

  // 生成時間選項 (09:00 - 18:00, 每 15 分鐘)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 18 && minute > 0) break;
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        times.push(timeStr);
      }
    }
    return times;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle className="text-2xl">
            {mode === "single" ? "📝 單人預約" : "👥 多人預約"}
          </CardTitle>
          <CardDescription className="text-pink-50">
            {mode === "single"
              ? "填寫完成後將自動顯示預約清單"
              : "可連續新增多筆預約"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="請輸入姓名"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">預約日期 *</Label>
              <select
                id="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">請選擇日期</option>
                {generateDateOptions().map((date) => (
                  <option key={date.value} value={date.value} disabled={date.disabled}>
                    {date.label} {date.disabled ? "(休診)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">預約時間 *</Label>
              <select
                id="time"
                value={formData.time}
                onChange={(e) => handleChange("time", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              >
                <option value="">請選擇時間</option>
                {generateTimeOptions().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">療程項目 *</Label>
              <Input
                id="service"
                value={formData.service}
                onChange={(e) => handleChange("service", e.target.value)}
                placeholder="請輸入療程項目"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="其他需要備註的事項"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送出中...
                </>
              ) : (
                "送出預約"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
