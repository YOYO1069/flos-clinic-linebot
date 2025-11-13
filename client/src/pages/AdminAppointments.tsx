import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, User, Package, CheckCircle, XCircle, Loader2, Bell } from "lucide-react";

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export default function AdminAppointments() {
  const [activeTab, setActiveTab] = useState<AppointmentStatus>("pending");
  
  // 查詢預約列表
  const { data: appointments, isLoading, refetch } = trpc.admin.getAppointments.useQuery({
    status: activeTab,
  });

  // 查詢統計數據
  const { data: stats } = trpc.admin.getAppointmentStats.useQuery();

  // Mutations
  const confirmMutation = trpc.admin.confirmAppointment.useMutation({
    onSuccess: () => {
      toast.success("預約已確認");
      refetch();
    },
    onError: (error) => {
      toast.error(`確認失敗: ${error.message}`);
    },
  });

  const completeMutation = trpc.admin.completeAppointment.useMutation({
    onSuccess: () => {
      toast.success("預約已完成");
      refetch();
    },
    onError: (error) => {
      toast.error(`完成失敗: ${error.message}`);
    },
  });

  const cancelMutation = trpc.admin.cancelAppointment.useMutation({
    onSuccess: () => {
      toast.success("預約已取消");
      refetch();
    },
    onError: (error) => {
      toast.error(`取消失敗: ${error.message}`);
    },
  });

  // 手動觸發提醒
  const reminderMutation = trpc.reminder.triggerManual.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`提醒已發送: ${result.sent} 筆成功, ${result.failed} 筆失敗`);
      } else {
        toast.error("提醒發送失敗");
      }
    },
    onError: (error) => {
      toast.error(`提醒失敗: ${error.message}`);
    },
  });

  const handleConfirm = (id: number) => {
    confirmMutation.mutate({ id });
  };

  const handleComplete = (id: number) => {
    completeMutation.mutate({ id });
  };

  const handleCancel = (id: number) => {
    if (confirm("確定要取消這筆預約嗎？")) {
      cancelMutation.mutate({ id });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "default", label: "待確認" },
      confirmed: { variant: "secondary", label: "已確認" },
      completed: { variant: "outline", label: "已完成" },
      cancelled: { variant: "destructive", label: "已取消" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">預約管理</h1>
          <p className="text-muted-foreground mt-2">查看和管理所有預約記錄</p>
        </div>
        <Button
          onClick={() => reminderMutation.mutate()}
          disabled={reminderMutation.isPending}
          variant="outline"
          className="gap-2"
        >
          {reminderMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          測試提醒功能
        </Button>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">總預約數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">待確認</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已確認</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已完成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已取消</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 預約列表 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AppointmentStatus)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">待確認</TabsTrigger>
          <TabsTrigger value="confirmed">已確認</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
          <TabsTrigger value="cancelled">已取消</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{appointment.name}</CardTitle>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <Calendar className="h-4 w-4" />
                      {appointment.date}
                      <Clock className="h-4 w-4 ml-2" />
                      {appointment.time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">療程項目</p>
                          <p className="text-sm text-muted-foreground">{appointment.service}</p>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">備註</p>
                            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        建立時間: {new Date(appointment.createdAt).toLocaleString("zh-TW")}
                      </div>

                      {/* 操作按鈕 */}
                      <div className="flex gap-2 pt-2">
                        {appointment.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(appointment.id)}
                              disabled={confirmMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              確認
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(appointment.id)}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              取消
                            </Button>
                          </>
                        )}
                        {appointment.status === "confirmed" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleComplete(appointment.id)}
                              disabled={completeMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              完成
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(appointment.id)}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              取消
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">目前沒有{activeTab === "pending" ? "待確認" : activeTab === "confirmed" ? "已確認" : activeTab === "completed" ? "已完成" : "已取消"}的預約</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
