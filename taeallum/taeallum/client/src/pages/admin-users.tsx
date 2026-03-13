import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, UserCircle, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminUsers() {
    const [query, setQuery] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin-users", query],
        queryFn: async () => {
            const res = await fetch(`/api/admin-panel/users?q=${query}`);
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
    });

    return (
        <AdminLayout>
            <div className="space-y-6" dir="rtl">
                <div>
                    <h1 className="text-3xl font-bold">إدارة الطلاب</h1>
                    <p className="text-muted-foreground">عرض قائمة جميع الطلاب المسجلين بالمنصة.</p>
                </div>

                {/* Filter Bar */}
                <div className="relative max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="البحث بالاسم..."
                        className="pr-10 h-11"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-right">الطالب</TableHead>
                                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                                <TableHead className="text-right">تاريخ الانضمام</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : users?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        لا يوجد طلاب حالياً.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users?.map((user: any) => (
                                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <UserCircle className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold">{user.fullName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="w-4 h-4" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(user.createdAt), "PPP", { locale: ar })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                                                نشط
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
