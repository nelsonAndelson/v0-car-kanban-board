"use client";

import { useState, useEffect } from "react";
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
import {
  DollarSign,
  Wrench,
  Plus,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
} from "lucide-react";
import { supabase, type RepairJob, type PaymentMethod } from "@/lib/supabase";

interface JobEditModalProps {
  job: RepairJob;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdated: () => void;
  onJobDeleted: () => void;
}

interface AdditionalCost {
  id: string;
  amount: number;
  description: string;
  date: string;
  supplier?: string;
}

interface JobModification {
  id: string;
  description: string;
  estimated_cost: number;
  customer_price: number;
  added_at: string;
}

export default function JobEditModal({
  job,
  isOpen,
  onClose,
  onJobUpdated,
  onJobDeleted,
}: JobEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Job editing state
  const [jobData, setJobData] = useState({
    customer_price: job.customer_price || 0,
    estimated_cost: job.estimated_cost || 0,
    job_description: job.job_description,
    notes: job.notes || "",
  });

  // Customer info editing (for customer jobs)
  const [customerData, setCustomerData] = useState({
    name: job.customer_info?.name || "",
    contact: job.customer_info?.contact || "",
  });

  // Payment state
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: "cash" as PaymentMethod,
    transaction_id: "",
    notes: "",
  });

  // Additional costs state
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  const [newCost, setNewCost] = useState({
    amount: 0,
    description: "",
    supplier: "",
  });

  // Job modifications state
  const [jobModifications, setJobModifications] = useState<JobModification[]>(
    []
  );
  const [newModification, setNewModification] = useState({
    description: "",
    estimated_cost: 0,
    customer_price: 0,
  });

  // Tab state
  type TabId = "details" | "payments" | "costs" | "modifications";
  const [activeTab, setActiveTab] = useState<TabId>("details");

  const outstandingBalance = jobData.customer_price - (job.total_paid || 0);
  const totalAdditionalCosts = additionalCosts.reduce(
    (sum, cost) => sum + cost.amount,
    0
  );
  const totalModificationsCost = jobModifications.reduce(
    (sum, mod) => sum + mod.estimated_cost,
    0
  );
  const totalModificationsPrice = jobModifications.reduce(
    (sum, mod) => sum + mod.customer_price,
    0
  );

  // Calculate updated totals
  const updatedEstimatedCost =
    jobData.estimated_cost + totalAdditionalCosts + totalModificationsCost;
  const updatedCustomerPrice = jobData.customer_price + totalModificationsPrice;

  useEffect(() => {
    if (isOpen) {
      setJobData({
        customer_price: job.customer_price || 0,
        estimated_cost: job.estimated_cost || 0,
        job_description: job.job_description,
        notes: job.notes || "",
      });
      setCustomerData({
        name: job.customer_info?.name || "",
        contact: job.customer_info?.contact || "",
      });
    }
  }, [job, isOpen]);

  const handleSaveJob = async () => {
    setIsSubmitting(true);
    try {
      // Save additional costs to database
      if (additionalCosts.length > 0) {
        const costsToSave = additionalCosts.map((cost) => ({
          repair_job_id: job.id,
          amount: cost.amount,
          description: cost.description,
          supplier: cost.supplier || null,
        }));

        const { error: costsError } = await supabase
          .from("additional_costs")
          .insert(costsToSave);

        if (costsError) throw costsError;
      }

      // Save job modifications to database
      if (jobModifications.length > 0) {
        const modsToSave = jobModifications.map((mod) => ({
          repair_job_id: job.id,
          description: mod.description,
          estimated_cost: mod.estimated_cost,
          customer_price: mod.customer_price,
        }));

        const { error: modsError } = await supabase
          .from("job_modifications")
          .insert(modsToSave);

        if (modsError) throw modsError;
      }

      // Update the main job record
      const { error } = await supabase
        .from("repair_jobs")
        .update({
          customer_price: updatedCustomerPrice,
          estimated_cost: updatedEstimatedCost,
          job_description: jobData.job_description,
          notes: jobData.notes,
          customer_info:
            job.job_type === "customer"
              ? { name: customerData.name, contact: customerData.contact }
              : job.customer_info,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) throw error;
      onJobUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating job:", error);
      alert("Failed to update job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async () => {
    if (paymentData.amount <= 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("payments").insert([
        {
          repair_job_id: job.id,
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          transaction_id: paymentData.transaction_id || null,
          notes: paymentData.notes || null,
          status: "completed",
        },
      ]);

      if (error) throw error;

      // Update job payment totals
      const newTotalPaid = (job.total_paid || 0) + paymentData.amount;
      const newOutstandingBalance = Math.max(
        0,
        updatedCustomerPrice - newTotalPaid
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

      setPaymentData({
        amount: 0,
        payment_method: "cash",
        transaction_id: "",
        notes: "",
      });
      onJobUpdated();
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Failed to add payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCost = () => {
    if (newCost.amount <= 0 || !newCost.description) return;

    const cost: AdditionalCost = {
      id: Date.now().toString(),
      amount: newCost.amount,
      description: newCost.description,
      supplier: newCost.supplier,
      date: new Date().toISOString(),
    };

    setAdditionalCosts([...additionalCosts, cost]);
    setNewCost({ amount: 0, description: "", supplier: "" });
  };

  const handleRemoveCost = (costId: string) => {
    setAdditionalCosts(additionalCosts.filter((cost) => cost.id !== costId));
  };

  const handleAddModification = () => {
    if (!newModification.description) return;

    const modification: JobModification = {
      id: Date.now().toString(),
      description: newModification.description,
      estimated_cost: newModification.estimated_cost,
      customer_price: newModification.customer_price,
      added_at: new Date().toISOString(),
    };

    setJobModifications([...jobModifications, modification]);
    setNewModification({
      description: "",
      estimated_cost: 0,
      customer_price: 0,
    });
  };

  const handleRemoveModification = (modId: string) => {
    setJobModifications(jobModifications.filter((mod) => mod.id !== modId));
  };

  const handleDeleteJob = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("repair_jobs")
        .delete()
        .eq("id", job.id);

      if (error) throw error;
      onJobDeleted();
      onClose();
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Edit Job
              </CardTitle>
              <CardDescription>
                {job.car_info.year} {job.car_info.make} {job.car_info.model} -{" "}
                {job.customer_info?.name}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b">
            {[
              { id: "details" as const, label: "Job Details", icon: Wrench },
              { id: "payments" as const, label: "Payments", icon: DollarSign },
              { id: "costs" as const, label: "Additional Costs", icon: Plus },
              { id: "modifications" as const, label: "Add Work", icon: Edit3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Job Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              {job.job_type === "customer" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input
                      value={customerData.name}
                      onChange={(e) =>
                        setCustomerData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Contact</Label>
                    <Input
                      value={customerData.contact}
                      onChange={(e) =>
                        setCustomerData((prev) => ({
                          ...prev,
                          contact: e.target.value,
                        }))
                      }
                      placeholder="Phone, email, etc."
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Price</Label>
                  <Input
                    type="number"
                    value={updatedCustomerPrice}
                    onChange={(e) =>
                      setJobData((prev) => ({
                        ...prev,
                        customer_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Cost (Base)</Label>
                  <Input
                    type="number"
                    value={jobData.estimated_cost}
                    onChange={(e) =>
                      setJobData((prev) => ({
                        ...prev,
                        estimated_cost: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea
                  value={jobData.job_description}
                  onChange={(e) =>
                    setJobData((prev) => ({
                      ...prev,
                      job_description: e.target.value,
                    }))
                  }
                  placeholder="Describe the work being done..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={jobData.notes}
                  onChange={(e) =>
                    setJobData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Cost Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Base Cost: ${jobData.estimated_cost.toFixed(2)}</div>
                  <div>
                    Additional Costs: ${totalAdditionalCosts.toFixed(2)}
                  </div>
                  <div>
                    Modifications Cost: ${totalModificationsCost.toFixed(2)}
                  </div>
                  <div className="font-medium">
                    Total Cost: ${updatedEstimatedCost.toFixed(2)}
                  </div>
                  <div className="col-span-2 font-semibold">
                    Profit / Loss: $
                    {(updatedCustomerPrice - updatedEstimatedCost).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Payment Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Total Price: ${updatedCustomerPrice.toFixed(2)}</div>
                  <div>Total Paid: ${(job.total_paid || 0).toFixed(2)}</div>
                  <div className="font-medium">
                    Outstanding: ${outstandingBalance.toFixed(2)}
                  </div>
                </div>
              </div>

              {outstandingBalance > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Add Payment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
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
                      />
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
                          <SelectItem value="credit_card">
                            Credit Card
                          </SelectItem>
                          <SelectItem value="debit_card">Debit Card</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="financing">Financing</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Input
                        value={paymentData.notes}
                        onChange={(e) =>
                          setPaymentData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Payment notes..."
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddPayment}
                    disabled={
                      paymentData.amount <= 0 ||
                      paymentData.amount > outstandingBalance
                    }
                    className="w-full"
                  >
                    Add Payment
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Additional Costs Tab */}
          {activeTab === "costs" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Cost Summary</h4>
                <div className="text-sm">
                  Total Additional Costs: ${totalAdditionalCosts.toFixed(2)}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Add Additional Cost</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newCost.amount}
                      onChange={(e) =>
                        setNewCost((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newCost.description}
                      onChange={(e) =>
                        setNewCost((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="e.g., Brake pads from AutoZone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier (Optional)</Label>
                    <Input
                      value={newCost.supplier}
                      onChange={(e) =>
                        setNewCost((prev) => ({
                          ...prev,
                          supplier: e.target.value,
                        }))
                      }
                      placeholder="e.g., AutoZone, NAPA"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddCost}
                  disabled={newCost.amount <= 0 || !newCost.description}
                  className="w-full"
                >
                  Add Cost
                </Button>
              </div>

              {/* List of additional costs */}
              {additionalCosts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Additional Costs</h4>
                  {additionalCosts.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          ${cost.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {cost.description}
                        </div>
                        {cost.supplier && (
                          <div className="text-xs text-muted-foreground">
                            Supplier: {cost.supplier}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCost(cost.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Job Modifications Tab */}
          {activeTab === "modifications" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Modifications Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    Total Added Cost: ${totalModificationsCost.toFixed(2)}
                  </div>
                  <div>
                    Total Added Price: ${totalModificationsPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Add Work Item</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newModification.description}
                      onChange={(e) =>
                        setNewModification((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="e.g., Front struts replacement"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cost to Us</Label>
                      <Input
                        type="number"
                        value={newModification.estimated_cost}
                        onChange={(e) =>
                          setNewModification((prev) => ({
                            ...prev,
                            estimated_cost: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price for Customer</Label>
                      <Input
                        type="number"
                        value={newModification.customer_price}
                        onChange={(e) =>
                          setNewModification((prev) => ({
                            ...prev,
                            customer_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddModification}
                    disabled={!newModification.description}
                    className="w-full"
                  >
                    Add Work Item
                  </Button>
                </div>
              </div>

              {/* List of modifications */}
              {jobModifications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Work Items</h4>
                  {jobModifications.map((mod) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{mod.description}</div>
                        <div className="text-sm text-muted-foreground">
                          Cost: ${mod.estimated_cost.toFixed(2)} | Price: $
                          {mod.customer_price.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveModification(mod.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSaveJob}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Job
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Are you sure you want to delete this job? This action cannot be
                undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteJob}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete Job"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
