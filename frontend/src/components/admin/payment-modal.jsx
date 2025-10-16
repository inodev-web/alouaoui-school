import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, Calendar, CheckCircle } from "lucide-react";

export function PaymentModal({ teacher, paymentType, open, onOpenChange }) {
  const amount =
    paymentType === "monthly" ? teacher.monthlyPrice : teacher.sessionPrice;
  const description =
    paymentType === "monthly" ? "Monthly Subscription" : "Per Session Payment";

  const handlePayment = () => {
    // In a real app, this would process the payment
    console.log("Processing payment:", {
      teacher: teacher.id,
      type: paymentType,
      amount,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Processing
          </DialogTitle>
          <DialogDescription>
            Complete payment for {teacher.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{teacher.name}</CardTitle>
              <CardDescription>{teacher.module}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Payment Type:
                </span>
                <Badge variant="outline">{description}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-lg font-bold">${amount}</span>
              </div>
              {paymentType === "monthly" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Next Due:
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-sm">{teacher.nextDue}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Cash Payment</p>
                  <p className="text-sm text-muted-foreground">
                    In-person payment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
