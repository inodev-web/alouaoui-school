import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Play, Pause, Loader2 } from "lucide-react";
import { sessionService } from "@/services/api/session.service";

export function TodaysSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    fetchTodaysSessions();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchTodaysSessions = async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      const response = await sessionService.getTodaysSessions();
      if (isMountedRef.current) {
        setSessions(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching today's sessions:", err);
      if (isMountedRef.current) {
        setError("فشل في تحميل جلسات اليوم");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "جارية":
        return "default";
      case "قادمة":
        return "secondary";
      case "مكتملة":
        return "outline";
      default:
        return "outline";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "اشتراك":
        return "default";
      case "مدفوعة":
        return "secondary";
      case "مجانية":
        return "outline";
      case "معفي":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Clock className="h-5 w-5" />
            جلسات اليوم
          </CardTitle>
          <CardDescription className="text-right">
            وصول سريع للجلسات المجدولة لليوم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-2">جاري التحميل...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Clock className="h-5 w-5" />
            جلسات اليوم
          </CardTitle>
          <CardDescription className="text-right">
            وصول سريع للجلسات المجدولة لليوم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button onClick={fetchTodaysSessions} className="mt-4">
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Clock className="h-5 w-5" />
          جلسات اليوم
        </CardTitle>
        <CardDescription className="text-right">
          وصول سريع للجلسات المجدولة لليوم
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>لا توجد جلسات مجدولة لليوم</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {sessions.map((session) => (
              <Card key={session.id} className="border-2" dir="rtl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-right">
                      {session.teacher}
                    </CardTitle>
                    <Badge variant={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-right">
                    {session.module}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الوقت:</span>
                    <span className="font-medium">{session.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">القاعة:</span>
                    <span className="font-medium">{session.room}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الطلاب:</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="font-medium">{session.students}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={getTypeColor(session.type)}>
                      {session.type}
                    </Badge>
                    <Button size="sm" variant="outline">
                      {session.status === "جارية" ? (
                        <>
                          <Pause className="h-3 w-3 ml-1" />
                          إدارة
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 ml-1" />
                          بدء
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
