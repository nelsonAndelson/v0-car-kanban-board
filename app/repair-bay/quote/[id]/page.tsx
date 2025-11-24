"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import logo from "@/app/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase, type RepairJob } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

type ModRow = {
  id: string;
  description: string;
  estimated_cost: number;
  customer_price: number;
  quantity?: number;
};

export default function CustomerQuotePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || "";
  const [job, setJob] = useState<RepairJob | null>(null);
  const [mods, setMods] = useState<ModRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [
        { data: jobData, error: jobErr },
        { data: modsData, error: modsErr },
      ] = await Promise.all([
        supabase.from("repair_jobs").select("*").eq("id", jobId).maybeSingle(),
        supabase
          .from("job_modifications")
          .select("id, description, estimated_cost, customer_price, quantity")
          .eq("repair_job_id", jobId),
      ]);
      if (jobErr) {throw jobErr;}
      if (modsErr) {throw modsErr;}
      setJob((jobData as RepairJob) ?? null);
      setMods((modsData as ModRow[]) || []);
    } catch (err) {
      console.error("Failed to load quote", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {fetchData();}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const isLaborItem = (desc: string) => /labor/i.test((desc || "").trim());
  const taxableSubtotal = mods
    .filter((m) => !isLaborItem(m.description))
    .reduce((sum, m) => sum + (Number(m.customer_price) || 0), 0);
  const laborSubtotal = mods
    .filter((m) => isLaborItem(m.description))
    .reduce((sum, m) => sum + (Number(m.customer_price) || 0), 0);
  const taxRate = Number(job?.tax_rate || 0);
  const tax = Number((taxableSubtotal * taxRate).toFixed(2));
  const total = Number((taxableSubtotal + laborSubtotal + tax).toFixed(2));

  const handleApprove = async () => {
    if (!job) {return;}
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("repair_jobs")
        .update({
          status: "in_progress",
          quote_approved_at: new Date().toISOString(),
          customer_price: total,
          time_started: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      if (error) {throw error;}
      router.push("/repair-bay");
    } catch (err) {
      console.error("Approve failed", err);
      alert("Failed to approve quote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    router.push("/repair-bay");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Quote not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-0">
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4 print:mb-2">
          <div className="flex-1">
            <Image src={logo} alt="Kars Auto" className="h-8 sm:h-10 w-auto" />
          </div>
          <div className="text-right text-[11px] sm:text-xs leading-5">
            <div>
              <span className="font-semibold">Alex Baguma</span> - Mechanic
            </div>
            <div>216-372-0661</div>
            <div>
              <span className="font-semibold">Kayenga Baguma</span> - Lead
              Mechanic
            </div>
            <div>216-777-0024</div>
            <div>karsllcauto@gmail.com</div>
            <div>karsautollc.com</div>
          </div>
        </div>

        {/* WHY US */}
        <div className="rounded-md overflow-hidden mb-4">
          <div className="bg-green-700 text-white font-bold text-center py-2">
            WHY US?
          </div>
          <div className="bg-green-700/5 p-3 text-sm sm:text-base">
            <div className="space-y-1.5">
              <div>
                ✔ &quot;Fixed Right or It&apos;s Free&quot; 30-Day Guarantee
              </div>
              <div>✔ FREE 15-Minute Diagnosis + $20 Off Repair</div>
              <div>✔ First-Time VIP: $50 Off Repairs Over $200</div>
            </div>
          </div>
        </div>

        <Card className="shadow-sm border print:border-0">
          <CardContent className="p-3 sm:p-4">
            {/* Customer/Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div className="text-sm sm:text-base">
                <div className="font-semibold">Customer</div>
                <div className="text-base font-medium">
                  {job.customer_info?.name}
                </div>
                <div>{job.customer_info?.contact}</div>
              </div>
              <div className="text-sm sm:text-base">
                <div className="font-semibold">Vehicle</div>
                <div className="text-base font-medium">
                  {job.car_info.year || ""} {job.car_info.make || ""}{" "}
                  {job.car_info.model || ""}
                </div>
                {job.car_info.license_plate && (
                  <div>Plate: {job.car_info.license_plate}</div>
                )}
              </div>
            </div>

            {/* Work Description */}
            <div className="mb-3 sm:mb-4">
              <div className="text-sm font-semibold">Invoice for</div>
              <div className="text-base sm:text-lg">{job.job_description}</div>
            </div>

            {/* Items Table */}
            <div className="mt-2">
              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-12 text-xs text-gray-600 bg-green-700/10 border-t border-b py-2 font-semibold">
                <div className="col-span-8 pl-2">Product/Service</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right pr-2">Total Line</div>
              </div>
              {/* Rows */}
              {mods.map((m, idx) => (
                <div key={m.id} className="border-b py-2">
                  <div className="grid grid-cols-12 items-center text-sm">
                    <div className="col-span-12 sm:col-span-8 pl-2 break-words">
                      <span className="text-gray-500 sm:hidden mr-1">
                        {idx + 1}.
                      </span>
                      {m.description}{" "}
                      {m.quantity && m.quantity > 1 ? `x${m.quantity}` : ""}
                    </div>
                    <div className="col-span-6 sm:col-span-2 text-left sm:text-right pl-2 sm:pl-0 mt-1 sm:mt-0">
                      <span className="sm:hidden text-xs text-gray-500 mr-1">
                        Price:
                      </span>
                      {formatCurrency(Number(m.customer_price || 0))}
                    </div>
                    <div className="col-span-6 sm:col-span-2 text-right pr-2 mt-1 sm:mt-0">
                      <span className="sm:hidden text-xs text-gray-500 mr-1">
                        Total:
                      </span>
                      {formatCurrency(
                        Number(m.customer_price || 0) * (m.quantity || 1)
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-2">
                <div className="grid grid-cols-12 gap-y-1 text-sm">
                  <div className="col-span-6 sm:col-span-9 text-left">
                    SubTotal
                  </div>
                  <div className="col-span-6 sm:col-span-3 text-right">
                    {formatCurrency(taxableSubtotal)}
                  </div>
                  <div className="col-span-6 sm:col-span-9 text-left">
                    Labor
                  </div>
                  <div className="col-span-6 sm:col-span-3 text-right">
                    {formatCurrency(laborSubtotal)}
                  </div>
                  <div className="col-span-6 sm:col-span-9 text-left">
                    Tax ({(taxRate * 100).toFixed(2)}%)
                  </div>
                  <div className="col-span-6 sm:col-span-3 text-right">
                    {formatCurrency(tax)}
                  </div>
                  <div className="col-span-6 sm:col-span-9 text-left font-semibold text-base">
                    Grand Total
                  </div>
                  <div className="col-span-6 sm:col-span-3 text-right font-semibold text-base">
                    {formatCurrency(total)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer notes & offers */}
            <div className="mt-6 text-xs sm:text-sm text-gray-700 space-y-3">
              <div>
                By approving, you authorize the work listed above. Tax excludes
                labor.
              </div>
              <div className="space-y-1.5">
                <div>
                  🚗 Current Offers: We proudly stand by our &quot;Fixed Right
                  or It&apos;s Free&quot; guarantee — if a repair we perform
                  fails within 30 days, we&apos;ll fix it again at no cost.
                </div>
                <div>
                  Not sure what&apos;s wrong? First-time visitors get a FREE
                  15-minute diagnostic, and if you go ahead with a qualifying
                  repair (over $150), we&apos;ll take $20 off your service.
                </div>
                <div>
                  New here? You may also be eligible for $50 off your first
                  repair over $200.
                </div>
                <div>
                  📞 Call or text us anytime at 216-304-1233 or visit
                  karsautollc.com to learn more.
                </div>
              </div>
            </div>

            {/* Controls (hidden on print) */}
            <div className="flex gap-2 mt-4 print:hidden">
              <Button variant="outline" onClick={() => window.print()}>
                Print
              </Button>
              <Button variant="outline" onClick={handleDecline}>
                Decline
              </Button>
              <Button onClick={handleApprove} disabled={submitting}>
                {submitting ? "Approving..." : "Approve"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
    </div>
  );
}
