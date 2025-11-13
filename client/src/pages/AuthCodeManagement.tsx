import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, RefreshCw } from "lucide-react";

export default function AuthCodeManagement() {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [isUpdateExpiryDialogOpen, setIsUpdateExpiryDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [clinicId, setClinicId] = useState<string>("1");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [extendDays, setExtendDays] = useState<string>("30");
  const [newExpiryDate, setNewExpiryDate] = useState<string>("");

  const { data: authCodes, isLoading, refetch } = trpc.admin.getAllAuthCodes.useQuery();
  const { data: authorizedGroups } = trpc.admin.getAuthorizedGroups.useQuery();

  const generateMutation = trpc.admin.generateAuthCode.useMutation({
    onSuccess: (data) => {
      toast.success(`授權碼已生成：${data.code}`);
      setIsGenerateDialogOpen(false);
      refetch();
    },
    onError: () => {
      toast.error("生成授權碼失敗");
    },
  });

  const extendMutation = trpc.admin.extendAuthCode.useMutation({
    onSuccess: () => {
      toast.success("授權碼有效期限已延長");
      setIsExtendDialogOpen(false);
      refetch();
    },
    onError: () => {
      toast.error("延長期限失敗");
    },
  });

  const updateExpiryMutation = trpc.admin.updateAuthCodeExpiry.useMutation({
    onSuccess: () => {
      toast.success("授權碼到期日期已更新");
      setIsUpdateExpiryDialogOpen(false);
      refetch();
    },
    onError: () => {
      toast.error("更新到期日期失敗");
    },
  });

  const reactivateMutation = trpc.admin.reactivateAuthCode.useMutation({
    onSuccess: () => {
      toast.success("授權碼已重新啟用");
      refetch();
    },
    onError: () => {
      toast.error("重新啟用失敗");
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      clinicId: parseInt(clinicId),
      expiresAt: expiryDate || undefined,
    });
  };

  const handleExtend = () => {
    extendMutation.mutate({
      code: selectedCode,
      days: parseInt(extendDays),
    });
  };

  const handleUpdateExpiry = () => {
    updateExpiryMutation.mutate({
      code: selectedCode,
      expiresAt: newExpiryDate || null,
    });
  };

  const handleReactivate = (code: string) => {
    if (confirm(`確定要重新啟用授權碼 ${code} 嗎？`)) {
      reactivateMutation.mutate({ code });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">可用</Badge>;
      case "used":
        return <Badge variant="secondary">已使用</Badge>;
      case "expired":
        return <Badge variant="destructive">已過期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUsedGroup = (code: string) => {
    const group = authorizedGroups?.find((g) => g.authorizationCode === code);
    return group ? group.lineGroupId : "-";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>授權碼管理</CardTitle>
              <CardDescription>
                管理所有授權碼，包含生成、延長期限、修改到期日期等功能
              </CardDescription>
            </div>
            <Button onClick={() => setIsGenerateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              生成授權碼
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>授權碼</TableHead>
                <TableHead>診所 ID</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>到期日期</TableHead>
                <TableHead>使用群組</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authCodes?.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono">{code.code}</TableCell>
                  <TableCell>{code.clinicId}</TableCell>
                  <TableCell>{getStatusBadge(code.status)}</TableCell>
                  <TableCell>
                    {code.expiresAt
                      ? new Date(code.expiresAt).toLocaleDateString("zh-TW")
                      : "永久有效"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {getUsedGroup(code.code)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCode(code.code);
                          setIsExtendDialogOpen(true);
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        延長
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCode(code.code);
                          setNewExpiryDate(
                            code.expiresAt
                              ? new Date(code.expiresAt).toISOString().split("T")[0]
                              : ""
                          );
                          setIsUpdateExpiryDialogOpen(true);
                        }}
                      >
                        修改日期
                      </Button>
                      {code.status !== "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReactivate(code.code)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          重新啟用
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 生成授權碼對話框 */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>生成新授權碼</DialogTitle>
            <DialogDescription>
              為診所生成一個新的授權碼，可選擇設定有效期限
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clinicId">診所 ID</Label>
              <Input
                id="clinicId"
                type="number"
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">到期日期（選填，留空表示永久有效）</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 延長期限對話框 */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>延長授權碼有效期限</DialogTitle>
            <DialogDescription>
              授權碼：{selectedCode}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="extendDays">延長天數</Label>
            <Input
              id="extendDays"
              type="number"
              min="1"
              max="3650"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExtendDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleExtend} disabled={extendMutation.isPending}>
              {extendMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              確認延長
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改到期日期對話框 */}
      <Dialog
        open={isUpdateExpiryDialogOpen}
        onOpenChange={setIsUpdateExpiryDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改授權碼到期日期</DialogTitle>
            <DialogDescription>
              授權碼：{selectedCode}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="newExpiryDate">新的到期日期（留空表示永久有效）</Label>
            <Input
              id="newExpiryDate"
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateExpiryDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateExpiry}
              disabled={updateExpiryMutation.isPending}
            >
              {updateExpiryMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              確認修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
