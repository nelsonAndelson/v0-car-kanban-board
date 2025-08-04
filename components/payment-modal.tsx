"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  supabase,
  type RepairJob,
  type Payment,
  type PaymentMethod,
} from "@/lib/supabase";

interface PaymentModalProps {
  job: RepairJob;
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
}

export default function PaymentModal({
  job,
  isOpen,
  onClose,
  onPaymentAdded,
}: PaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: "cash" as PaymentMethod,
    transaction_id: "",
    notes: "",
  });

  const outstandingBalance = (job.customer_price || 0) - (job.total_paid || 0);
  const isFullyPaid = outstandingBalance <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: payment, error } = await supabase
        .from("payments")
        .insert([
          {
            repair_job_id: job.id,
            amount: paymentData.amount,
            payment_method: paymentData.payment_method,
            transaction_id: paymentData.transaction_id || null,
            notes: paymentData.notes || null,
            status: "completed",
          },
        ])
        .select();

      if (error) throw error;

      // Update the repair job with new payment totals
      const newTotalPaid = (job.total_paid || 0) + paymentData.amount;
      const newOutstandingBalance = Math.max(
        0,
        (job.customer_price || 0) - newTotalPaid
      );

      let newPaymentStatus: "pending" | "partial" | "paid" | "overdue" =
        "pending";
      if (newOutstandingBalance === 0) {
        newPaymentStatus = "paid";
      } else if (newTotalPaid > 0) {
        newPaymentStatus = "partial";
      }

      const { error: updateError } = await supabase
        .from("repair_jobs")
        .update({
          total_paid: newTotalPaid,
          outstanding_balance: newOutstandingBalance,
          payment_status: newPaymentStatus,
        })
        .eq("id", job.id);

      if (updateError) throw updateError;

      // Reset form
      setPaymentData({
        amount: 0,
        payment_method: "cash",
        transaction_id: "",
        notes: "",
      });

      onPaymentAdded();
      onClose();
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Failed to add payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Record Payment
          </CardTitle>
          <CardDescription>
            {job.car_info.year} {job.car_info.make} {job.car_info.model}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Payment Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Total Price:</span>
              <span className="font-semibold">
                ${job.customer_price?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Total Paid:</span>
              <span className="font-semibold text-green-600">
                ${job.total_paid?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Outstanding:</span>
              <Badge
                variant="outline"
                className={
                  outstandingBalance > 0
                    ? "text-red-600 border-red-600 bg-red-50"
                    : "text-green-600 border-green-600 bg-green-50"
                }
              >
                ${outstandingBalance.toFixed(2)}
              </Badge>
            </div>
          </div>

          {isFullyPaid ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-600 font-medium">Job is fully paid!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <Input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                  min="0.01"
                  max={outstandingBalance}
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500">
                  Maximum: ${outstandingBalance.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(value: PaymentMethod) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      payment_method: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="financing">Financing</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Transaction ID / Reference</Label>
                <Input
                  value={paymentData.transaction_id}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      transaction_id: e.target.value,
                    }))
                  }
                  placeholder="Check #, transaction ID, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Additional payment notes..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    isSubmitting ||
                    paymentData.amount <= 0 ||
                    paymentData.amount > outstandingBalance
                  }
                >
                  {isSubmitting ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
