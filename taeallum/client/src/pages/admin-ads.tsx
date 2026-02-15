
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Trash2, History, ExternalLink, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSessionHeaders } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AdminAds() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("footer_banner");
    const [newLocation, setNewLocation] = useState("");

    // Controlled form state
    const [formState, setFormState] = useState({
        isActive: false,
        type: "image",
        headline: "",
        description: "",
        primaryText: "",
        primaryLink: "",
        mediaUrl: "",
        scriptCode: "",
    });

    const { data: adConfig, isLoading: isLoadingConfig } = useQuery({
        queryKey: ["ad-config", activeTab],
        queryFn: async () => {
            const res = await fetch(`/api/ads/${activeTab}`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch ad config");
            return res.json();
        }
    });

    const { data: allAds, isLoading: isLoadingAll } = useQuery({
        queryKey: ["all-ads"],
        queryFn: async () => {
            const res = await fetch(`/api/ads/all/list`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch ads list");
            return res.json();
        }
    });

    // Sync form state when ad config loads or tab changes
    useEffect(() => {
        if (adConfig) {
            setFormState({
                isActive: Boolean(adConfig.isActive),
                type: adConfig.type || "image",
                headline: adConfig.headline || "",
                description: adConfig.description || "",
                primaryText: adConfig.primaryText || "",
                primaryLink: adConfig.primaryLink || "",
                mediaUrl: adConfig.mediaUrl || "",
                scriptCode: adConfig.scriptCode || "",
            });
        }
    }, [adConfig]);

    const updateAdMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/ads/${activeTab}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getSessionHeaders()
                } as Record<string, string>,
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to update ad");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ad-config", activeTab] });
            queryClient.invalidateQueries({ queryKey: ["all-ads"] });
            toast({ title: "تم الحفظ ✅", description: "تم تحديث إعدادات الإعلان بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ ❌", description: error.message || "فشل حفظ الإعدادات", variant: "destructive" });
        }
    });

    const deleteAdMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/ads/${id}`, {
                method: "DELETE",
                headers: getSessionHeaders() as Record<string, string>,
                credentials: "include",
            });
            if (!res.ok) throw new Error("Faled to delete ad");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-ads"] });
            toast({ title: "تم الحذف ✅", description: "تم إزالة الإعلان من السجل" });
        }
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateAdMutation.mutate(formState);
    };

    if (isLoadingConfig) return <AdminLayout><div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto space-y-8 pb-20" dir="rtl">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Activity className="w-5 h-5 text-primary" />
                            <span className="text-sm font-black uppercase tracking-widest">Ad Center</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">إدارة الإعلانات</h1>
                        <p className="text-zinc-400 mt-1">تحكم في المساحات الإعلانية وشاهد سجل الإعلانات النشطة.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Editor Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {["footer_banner", "sidebar", "header_top"].map(loc => (
                                <Button
                                    key={loc}
                                    variant={activeTab === loc ? "default" : "outline"}
                                    onClick={() => setActiveTab(loc)}
                                    className={`rounded-full px-6 transition-all duration-300 ${activeTab === loc ? 'bg-primary text-black font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-white/10 text-zinc-400 hover:text-white'}`}
                                >
                                    {loc.replace("_", " ").toUpperCase()}
                                </Button>
                            ))}
                            <div className="flex gap-2 min-w-[300px]">
                                <Input
                                    placeholder="مكان جديد (مثلاً: home_popup)"
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                    className="bg-zinc-950 border-white/10 h-10 rounded-full text-xs"
                                    dir="ltr"
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="rounded-full px-4"
                                    onClick={() => {
                                        if (newLocation.trim()) {
                                            setActiveTab(newLocation.trim());
                                            setNewLocation("");
                                        }
                                    }}
                                >
                                    إضافة مكان
                                </Button>
                            </div>
                        </div>

                        <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
                            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <div className="w-2 h-8 bg-primary rounded-full" />
                                    تعديل المساحة: {activeTab.replace("_", " ").toUpperCase()}
                                </CardTitle>
                                <CardDescription className="text-zinc-500">قم بتحديث محتوى الإعلان لهذه المساحة المحددة</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="flex items-center justify-between p-6 border border-white/5 rounded-2xl bg-zinc-950/50 group transition-all hover:border-primary/20">
                                        <div className="space-y-1">
                                            <Label className="text-lg font-bold text-white">تفعيل الإعلان</Label>
                                            <p className="text-sm text-zinc-500">عرض هذا الإعلان للمستخدمين في الموقع</p>
                                        </div>
                                        <Switch
                                            checked={formState.isActive}
                                            onCheckedChange={(checked) => setFormState(prev => ({ ...prev, isActive: checked }))}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">نوع الإعلان</Label>
                                            <Select value={formState.type} onValueChange={(val) => setFormState(prev => ({ ...prev, type: val }))}>
                                                <SelectTrigger className="bg-zinc-950 border-white/10 h-12 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                    <SelectItem value="image">صورة (Banner)</SelectItem>
                                                    <SelectItem value="video">فيديو</SelectItem>
                                                    <SelectItem value="script">كود مخصص (Google Ads)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">العنوان الرئيسي</Label>
                                            <Input
                                                value={formState.headline}
                                                onChange={(e) => setFormState(prev => ({ ...prev, headline: e.target.value }))}
                                                className="bg-zinc-950 border-white/10 h-12 rounded-xl"
                                                placeholder="عرض خاص..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">رابط التوجيه (Link)</Label>
                                            <Input
                                                value={formState.primaryLink}
                                                onChange={(e) => setFormState(prev => ({ ...prev, primaryLink: e.target.value }))}
                                                className="bg-zinc-950 border-white/10 h-12 rounded-xl"
                                                placeholder="https://..."
                                                dir="ltr"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">نص الزر (CTA)</Label>
                                            <Input
                                                value={formState.primaryText}
                                                onChange={(e) => setFormState(prev => ({ ...prev, primaryText: e.target.value }))}
                                                className="bg-zinc-950 border-white/10 h-12 rounded-xl"
                                                placeholder="اشترك الآن"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">الوصف</Label>
                                        <Textarea
                                            value={formState.description}
                                            onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                                            className="bg-zinc-950 border-white/10 rounded-xl min-h-[100px]"
                                            placeholder="تفاصيل الإعلان..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">رابط الوسائط (صورة/فيديو)</Label>
                                        <Input
                                            value={formState.mediaUrl}
                                            onChange={(e) => setFormState(prev => ({ ...prev, mediaUrl: e.target.value }))}
                                            className="bg-zinc-950 border-white/10 h-12 rounded-xl"
                                            placeholder="https://..."
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Custom Script / HTML</Label>
                                        <Textarea
                                            value={formState.scriptCode}
                                            onChange={(e) => setFormState(prev => ({ ...prev, scriptCode: e.target.value }))}
                                            className="bg-zinc-950 border-white/10 rounded-xl font-mono text-xs min-h-[120px]"
                                            placeholder="<script>...</script>"
                                            dir="ltr"
                                        />
                                    </div>

                                    <Button type="submit" disabled={updateAdMutation.isPending} className="w-full h-14 rounded-2xl bg-primary text-black font-black text-lg hover:bg-primary-foreground transition-all shadow-xl shadow-primary/20">
                                        {updateAdMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 ml-2" />}
                                        حفظ التغييرات
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Registry Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 px-2 text-white">
                            <History className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-black italic tracking-wide">سجل الإعلانات</h2>
                        </div>

                        <div className="space-y-4">
                            {isLoadingAll ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
                            ) : allAds?.length > 0 ? (
                                allAds.map((ad: any) => (
                                    <Card key={ad.id} className="bg-zinc-900/30 border-white/5 hover:border-white/10 transition-all group">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-tighter">
                                                        {ad.location}
                                                    </Badge>
                                                    <p className="text-[9px] text-zinc-600 font-mono mt-0.5 truncate max-w-[150px]">ID: {ad.id}</p>
                                                    <h3 className="text-sm font-bold text-white truncate max-w-[150px] mt-1">
                                                        {ad.headline || "بدون عنوان"}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-primary animate-pulse' : 'bg-zinc-600'}`} />
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase">{ad.isActive ? 'Active' : 'Offline'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex gap-2">
                                                    <Badge className="bg-zinc-800 text-zinc-400 border-0 text-[10px]">{ad.type}</Badge>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-zinc-500 hover:text-white"
                                                        onClick={() => setActiveTab(ad.location)}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                    <Separator orientation="vertical" className="h-4 bg-white/10" />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                                                        onClick={() => {
                                                            if (confirm("هل أنت متأكد من حذف هذا الإعلان نهائياً؟")) {
                                                                deleteAdMutation.mutate(ad.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center p-10 bg-zinc-900/20 border border-dashed border-white/5 rounded-2xl">
                                    <p className="text-zinc-600 text-sm">لا توجد سجلات حالياً</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
