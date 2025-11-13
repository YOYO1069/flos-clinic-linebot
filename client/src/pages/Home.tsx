import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageSquare, Calendar, Users, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📅 LINE 預約機器人系統
          </h1>
          <p className="text-lg text-gray-600">
            專為診所設計的群組預約收集系統
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="border-pink-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-pink-500" />
                <CardTitle>群組內啟動</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                在 LINE 群組內輸入「預約」即可啟動預約流程,機器人會自動回覆預約選項卡片。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-500" />
                <CardTitle>網頁表單填寫</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                點擊按鈕開啟專業網頁表單,避免群組訊息干擾,提供更好的填寫體驗。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <CardTitle>單人/多人模式</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                支援單次預約或連續新增多筆預約,靈活滿足不同場景需求。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <CardTitle>即時確認管理</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                診所人員可直接在 LINE 內確認或取消預約,自動更新待確認清單。
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Usage Flow */}
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            <CardTitle className="text-2xl">使用流程</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-800">在 LINE 群組輸入「預約」</p>
                  <p className="text-sm text-gray-600">機器人會自動回覆預約模式選擇卡片</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-800">選擇單人或多人預約模式</p>
                  <p className="text-sm text-gray-600">點擊按鈕開啟網頁表單</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-800">填寫預約資料</p>
                  <p className="text-sm text-gray-600">姓名、日期、時間、療程項目</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <p className="font-semibold text-gray-800">自動顯示待確認清單</p>
                  <p className="text-sm text-gray-600">診所人員點擊確認或取消按鈕</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Admin Buttons */}
        <div className="flex justify-center gap-4 mt-12">
          <Button
            size="lg"
            onClick={() => setLocation("/admin/appointments")}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
          >
            <Settings className="mr-2 h-5 w-5" />
            預約管理
          </Button>
          <Button
            size="lg"
            onClick={() => setLocation("/auth-codes")}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
          >
            <Settings className="mr-2 h-5 w-5" />
            授權碼管理
          </Button>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            目前已配置診所: <span className="font-semibold text-pink-600">道玄機器貓</span>
          </p>
          <p className="text-xs mt-2">
            Bot ID: @920lykdu
          </p>
        </div>
      </div>
    </div>
  );
}
