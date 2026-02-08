import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package, MapPin, Calendar, MessageSquare, User, Phone, Mail,
  ChevronDown, ChevronUp, ClipboardList, Save, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useOrders, ORDER_STATUSES } from "@/hooks/useOrders";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface OrdersTabProps {
  shopId: string;
}

const OrdersTab = ({ shopId }: OrdersTabProps) => {
  const { orders, loading, updateOrderStatus, updateOrderNotes } = useOrders(shopId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSaveNotes = async (orderId: string) => {
    if (editNotes[orderId] !== undefined) {
      await updateOrderNotes(orderId, editNotes[orderId]);
      setEditNotes((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const s = ORDER_STATUSES.find((st) => st.value === status);
    return s?.color || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">הזמנות</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {orders.length} הזמנות סה"כ
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors font-body ${statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            הכל ({orders.length})
          </button>
          {ORDER_STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s.value).length;
            if (count === 0) return null;
            return (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors font-body ${statusFilter === s.value ? "bg-primary text-primary-foreground" : `${s.color} hover:opacity-80`}`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground font-body">טוען הזמנות...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
          <p className="font-display text-xl font-semibold text-muted-foreground">אין הזמנות</p>
          <p className="text-sm mt-2 text-muted-foreground font-body">
            {statusFilter !== "all" ? "אין הזמנות בסטטוס הזה" : "עדיין לא התקבלו הזמנות"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-soft transition-shadow"
            >
              {/* Order Header */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="w-full p-5 flex items-center justify-between text-right"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-foreground">{order.recipient_name}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {order.delivery_date
                          ? format(new Date(order.delivery_date), "dd/MM/yyyy", { locale: he })
                          : "—"}
                      </span>
                      <span>₪{order.total_price}</span>
                    </div>
                  </div>
                </div>
                {expandedId === order.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Details */}
              {expandedId === order.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  className="border-t border-border/50"
                >
                  <div className="p-5 space-y-5">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-display font-semibold text-sm text-foreground">פרטי מזמין</h4>
                        <div className="space-y-1.5 text-sm text-muted-foreground font-body">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            {order.customer_name}
                          </div>
                          {order.customer_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5" />
                              {order.customer_email}
                            </div>
                          )}
                          {order.customer_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5" />
                              {order.customer_phone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-display font-semibold text-sm text-foreground">פרטי משלוח</h4>
                        <div className="space-y-1.5 text-sm text-muted-foreground font-body">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            {order.recipient_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            {order.delivery_address}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {order.delivery_date
                              ? format(new Date(order.delivery_date), "EEEE, dd MMMM yyyy", { locale: he })
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Greeting */}
                    {order.greeting && (
                      <div className="space-y-2">
                        <h4 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary/60" />
                          ברכה
                        </h4>
                        <p className="text-sm text-muted-foreground font-body bg-muted/50 rounded-xl p-4 leading-relaxed">
                          {order.greeting}
                        </p>
                      </div>
                    )}

                    {/* Status Update */}
                    <div className="space-y-2">
                      <h4 className="font-display font-semibold text-sm text-foreground">עדכון סטטוס</h4>
                      <div className="flex flex-wrap gap-2">
                        {ORDER_STATUSES.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => updateOrderStatus(order.id, s.value)}
                            className={`text-xs px-4 py-2 rounded-xl font-medium transition-all font-body ${order.status === s.value ? "ring-2 ring-primary scale-105" : "hover:scale-105"} ${s.color}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cancel Order Button */}
                    {order.status !== "בוטלה" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            ביטול הזמנה
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-display">ביטול הזמנה</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              האם את/ה בטוח/ה שברצונך לבטל את ההזמנה של {order.recipient_name}?
                              <br />פעולה זו תעדכן את סטטוס ההזמנה ל"בוטלה".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogCancel className="font-body">חזרה</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                              onClick={() => updateOrderStatus(order.id, "בוטלה")}
                            >
                              כן, בטל הזמנה
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                      <h4 className="font-display font-semibold text-sm text-foreground">הערות פנימיות</h4>
                      <textarea
                        value={editNotes[order.id] ?? order.notes ?? ""}
                        onChange={(e) => setEditNotes((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        placeholder="הוסיפי הערות..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none min-h-[80px]"
                      />
                      {editNotes[order.id] !== undefined && editNotes[order.id] !== (order.notes ?? "") && (
                        <div className="flex justify-end">
                          <Button
                            variant="hero-outline"
                            size="sm"
                            className="rounded-xl gap-2"
                            onClick={() => handleSaveNotes(order.id)}
                          >
                            <Save className="w-3.5 h-3.5" />
                            שמור הערות
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground font-body pt-2 border-t border-border/50">
                      הזמנה התקבלה: {order.created_at ? format(new Date(order.created_at), "dd/MM/yyyy HH:mm") : "—"}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
