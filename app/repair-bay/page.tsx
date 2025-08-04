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
import { Badge } from "@/components/ui/badge";
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
  Wrench,
  Clock,
  DollarSign,
  User,
  Car,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Edit3,
} from "lucide-react";
import {
  supabase,
  type RepairJob,
  type JobType,
  type JobStatus,
  type Payment,
} from "@/lib/supabase";
import PaymentModal from "@/components/payment-modal";
import JobEditModal from "@/components/job-edit-modal";

export default function RepairBayTracker() {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<RepairJob | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] =
    useState<RepairJob | null>(null);
  const [showJobEditModal, setShowJobEditModal] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] =
    useState<RepairJob | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    job_type: "customer" as JobType,
    status: "pending" as JobStatus,
    car_info: {
      make: "",
      model: "",
      year: "",
      stock_number: "",
      license_plate: "",
    },
    customer_info: {
      name: "",
      contact: "",
    },
    job_description: "",
    technician: "Alex Baguma",
    estimated_hours: 0,
    estimated_cost: 0, // Cost to us (parts + labor)
    customer_price: 0, // Price charged to customer
    parts_ordered: false,
    parts_notes: "",
  });

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedJobType, setSelectedJobType] = useState<"common" | "other">(
    "common"
  );
  const [customJobDescription, setCustomJobDescription] = useState("");

  // Common job descriptions for quick selection
  const commonJobs = [
    "Oil Change",
    "Brake Replacement",
    "Tire Rotation",
    "AC Recharge",
    "Battery Replacement",
    "Tune Up",
    "Transmission Service",
    "Suspension Work",
    "Electrical Repair",
    "Engine Diagnostic",
    "Front & Rear Struts Replacement",
    "Front Struts",
    "Front & Rear Brakes and Rotor",
    "Leak, ABS",
    "Front Brakes",
    "Front Struts, Front Brakes and Rotors, Sway Bar Link",
    "Rear Wheel Bearing Replacement",
    "Front & Rear Brakes & Rotor",
    "Evap System and Transmission Repair",
    "Tire Rod, Lower Control Arm, Sway Bar Links",
    "Flex Pipe and Catalytic Converter Repair",
    "Rear Driver Suspension Replacement",
    "Battery, Starter, Alternator, Door, Paint work",
    "AC Compressor Problem",
    "Body Work",
    "Rear Brakes and Rotors",
    "Rear Shock",
    "Front & Rear Brake",
    "Spark plugs & Ignition Coil replacement",
    "Spark Plugs & Coils replacement, Power Steering",
    "Lower Control Arm",
    "Front Brakes & Rotors, Control Arm",
    "Driver Side Strut Replacement",
    "Rear Brakes",
    "Front Brakes & Rotors",
    "Sway Bar Links",
    "Catalytic Converter",
    "Power Steering",
    "Starter Replacement",
    "Alternator Replacement",
    "Door Repair",
    "Paint Work",
    "Wheel Alignment",
    "Exhaust Repair",
    "Fuel System Repair",
    "Cooling System Repair",
    "Timing Belt Replacement",
    "Water Pump Replacement",
    "Radiator Repair",
    "Thermostat Replacement",
    "Fuel Pump Replacement",
    "Ignition System Repair",
    "Clutch Replacement",
    "CV Axle Replacement",
    "Ball Joint Replacement",
    "Tie Rod Replacement",
    "Control Arm Replacement",
    "Shock Absorber Replacement",
    "Spring Replacement",
    "Wheel Bearing Replacement",
    "Brake Caliper Replacement",
    "Brake Line Repair",
    "ABS Module Repair",
    "Air Bag System Repair",
    "Horn Repair",
    "Wiper Motor Replacement",
    "Window Motor Replacement",
    "Lock Actuator Replacement",
    "Mirror Replacement",
    "Headlight Replacement",
    "Taillight Replacement",
    "Fog Light Installation",
    "Radio Installation",
    "Speaker Installation",
    "Alarm Installation",
    "Remote Start Installation",
    "Tint Installation",
    "Windshield Replacement",
    "Side Window Replacement",
    "Sunroof Repair",
    "Convertible Top Repair",
    "Seat Repair",
    "Dashboard Repair",
    "Carpet Replacement",
    "Floor Mat Installation",
    "Cargo Liner Installation",
    "Tonneau Cover Installation",
    "Bed Liner Installation",
    "Running Board Installation",
    "Step Bar Installation",
    "Grill Guard Installation",
    "Brush Guard Installation",
    "Winch Installation",
    "Lift Kit Installation",
    "Lowering Kit Installation",
    "Wheel Spacer Installation",
    "Lug Nut Replacement",
    "Valve Stem Replacement",
    "TPMS Sensor Replacement",
    "Tire Pressure Monitor Repair",
    "Spare Tire Installation",
    "Jack Installation",
    "Tool Kit Installation",
    "First Aid Kit Installation",
    "Fire Extinguisher Installation",
    "Emergency Kit Installation",
    "Roadside Kit Installation",
    "Towing Package Installation",
    "Trailer Hitch Installation",
    "Trailer Brake Controller Installation",
    "Trailer Wiring Installation",
    "Trailer Light Installation",
    "Trailer Tire Installation",
    "Trailer Wheel Installation",
    "Trailer Brake Installation",
    "Trailer Axle Installation",
    "Trailer Suspension Installation",
    "Trailer Frame Repair",
    "Trailer Body Repair",
    "Trailer Paint Work",
    "Trailer Interior Work",
    "Trailer Electrical Work",
    "Trailer Plumbing Work",
    "Trailer HVAC Work",
    "Trailer Appliance Installation",
    "Trailer Furniture Installation",
    "Trailer Storage Installation",
    "Trailer Security Installation",
    "Trailer Entertainment Installation",
    "Trailer Communication Installation",
    "Trailer Navigation Installation",
    "Trailer Monitoring Installation",
    "Trailer Control Installation",
    "Trailer Automation Installation",
    "Trailer Smart Home Installation",
    "Trailer IoT Installation",
    "Trailer AI Installation",
    "Trailer Robotics Installation",
    "Trailer Automation Installation",
    "Trailer Smart Home Installation",
    "Trailer IoT Installation",
    "Trailer AI Installation",
    "Trailer Robotics Installation",
  ];

  // Available technicians
  const technicians = ["Alex Baguma", "Kayenga Baguma", "Both"];

  // Popular car makes
  const popularMakes = [
    "Toyota",
    "Honda",
    "Ford",
    "Chevrolet",
    "Nissan",
    "Dodge",
    "Jeep",
    "BMW",
    "Mercedes-Benz",
    "Audi",
    "Volkswagen",
    "Hyundai",
    "Kia",
    "Mazda",
    "Subaru",
    "Lexus",
    "Acura",
    "Infiniti",
    "Buick",
    "Cadillac",
    "Chrysler",
    "Pontiac",
    "Saturn",
    "Oldsmobile",
    "Plymouth",
    "Eagle",
    "Geo",
    "Suzuki",
    "Mitsubishi",
    "Isuzu",
    "Daihatsu",
    "Alfa Romeo",
    "Fiat",
    "Lancia",
    "Peugeot",
    "Renault",
    "Citroën",
    "Opel",
    "Vauxhall",
    "Skoda",
    "Seat",
    "Volvo",
    "Saab",
    "Jaguar",
    "Land Rover",
    "Mini",
    "Smart",
    "Ferrari",
    "Lamborghini",
    "Porsche",
    "Aston Martin",
    "Bentley",
    "Rolls-Royce",
    "McLaren",
    "Bugatti",
    "Koenigsegg",
    "Pagani",
    "Rimac",
    "Lucid",
    "Rivian",
    "Tesla",
    "Polestar",
    "Genesis",
    "Other",
  ];

  // Years (current year back to 1990)
  const years = Array.from({ length: 35 }, (_, i) => (2025 - i).toString());

  // Selected jobs for multiple selection
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [filteredJobs, setFilteredJobs] = useState<RepairJob[]>([]);

  // Time tracking
  const [activeTimers, setActiveTimers] = useState<{ [key: string]: number }>(
    {}
  );

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch repair jobs from Supabase
  const fetchRepairJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("repair_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message.includes("does not exist")) {
          console.warn(
            "Repair jobs table not found. Please run the SQL script to create it."
          );
          setJobs([]);
        } else {
          throw error;
        }
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error("Error fetching repair jobs:", error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairJobs();

    // Subscribe to repair jobs changes
    const subscription = supabase
      .channel("repair-jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "repair_jobs",
        },
        () => {
          fetchRepairJobs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter jobs based on search term
  useEffect(() => {
    let currentJobs = jobs;

    if (statusFilter !== "all") {
      currentJobs = currentJobs.filter((job) => job.status === statusFilter);
    }

    if (jobTypeFilter !== "all") {
      currentJobs = currentJobs.filter((job) => job.job_type === jobTypeFilter);
    }

    if (!searchTerm.trim()) {
      setFilteredJobs(currentJobs);
    } else {
      const searchLower = searchTerm.toLowerCase();
      setFilteredJobs(
        currentJobs.filter((job) => {
          return (
            (job.car_info.make?.toLowerCase() || "").includes(searchLower) ||
            (job.car_info.model?.toLowerCase() || "").includes(searchLower) ||
            (job.car_info.year || "").includes(searchLower) ||
            (job.car_info.license_plate?.toLowerCase() || "").includes(
              searchLower
            ) ||
            (job.car_info.stock_number?.toLowerCase() || "").includes(
              searchLower
            ) ||
            (job.customer_info?.name?.toLowerCase() || "").includes(
              searchLower
            ) ||
            (job.job_description?.toLowerCase() || "").includes(searchLower) ||
            (job.technician?.toLowerCase() || "").includes(searchLower)
          );
        })
      );
    }
  }, [jobs, searchTerm, statusFilter, jobTypeFilter]);

  // Timer effect for active jobs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        const newTimers = { ...prev };
        Object.keys(newTimers).forEach((jobId) => {
          newTimers[jobId] += 1;
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use custom job description if selected, or combine multiple selected jobs
      let finalJobDescription = "";
      if (selectedJobType === "other") {
        finalJobDescription = customJobDescription;
      } else if (selectedJobs.length > 0) {
        finalJobDescription = selectedJobs.join(", ");
      } else {
        finalJobDescription = formData.job_description;
      }

      const jobData = {
        ...formData,
        status: "in_progress", // Start the job immediately
        job_description: finalJobDescription,
        time_started: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("repair_jobs")
        .insert([jobData])
        .select();

      if (error) throw error;

      // Start timer for the new job immediately
      if (data && data[0]) {
        setActiveTimers((prev) => ({ ...prev, [data[0].id]: 0 }));
        // Immediately add the new job to local state to avoid refresh issue
        setJobs((prevJobs) => [data[0], ...prevJobs]);
      }

      // Reset form
      setFormData({
        job_type: "customer",
        status: "pending",
        car_info: {
          make: "",
          model: "",
          year: "",
          stock_number: "",
          license_plate: "",
        },
        customer_info: {
          name: "",
          contact: "",
        },
        job_description: "",
        technician: "Alex Baguma",
        estimated_hours: 0,
        estimated_cost: 0,
        customer_price: 0,
        parts_ordered: false,
        parts_notes: "",
      });

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Reset multi-step form state
      setCurrentStep(1);
      setSelectedJobType("common");
      setCustomJobDescription("");
      setSelectedJobs([]);
      setShowNewJobForm(false);
    } catch (error) {
      console.error("Error creating repair job:", error);
      // TODO: Add proper error handling UI
      alert("Failed to create repair job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateJobStatus = async (jobId: string, status: JobStatus) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "in_progress") {
        // Start timer when job goes in progress
        setActiveTimers((prev) => ({ ...prev, [jobId]: 0 }));
      } else if (status === "done") {
        // Stop timer and record actual completion time
        updateData.actual_completion = new Date().toISOString();
        setActiveTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[jobId];
          return newTimers;
        });
      } else {
        // Pause timer for other statuses
        setActiveTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[jobId];
          return newTimers;
        });
      }

      const { error } = await supabase
        .from("repair_jobs")
        .update(updateData)
        .eq("id", jobId);

      if (error) throw error;

      // Update local state immediately to avoid refresh issues
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, ...updateData } : job
        )
      );
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const handlePaymentModalOpen = (job: RepairJob) => {
    setSelectedJobForPayment(job);
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedJobForPayment(null);
  };

  const handlePaymentAdded = () => {
    // Refresh jobs to get updated payment data
    fetchRepairJobs();
  };

  const handleJobEditModalOpen = (job: RepairJob) => {
    setSelectedJobForEdit(job);
    setShowJobEditModal(true);
  };

  const handleJobEditModalClose = () => {
    setShowJobEditModal(false);
    setSelectedJobForEdit(null);
  };

  const handleJobUpdated = () => {
    fetchRepairJobs();
  };

  const handleJobDeleted = () => {
    fetchRepairJobs();
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "in_progress":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "paused":
        return <Pause className="w-4 h-4 text-orange-500" />;
      case "awaiting_payment":
        return <DollarSign className="w-4 h-4 text-purple-500" />;
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "paused":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "awaiting_payment":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "done":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-red-100 text-red-800 border-red-200";
    }
  };

  // Helper function to format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to calculate profit/loss
  const calculateProfitLoss = (job: RepairJob) => {
    const cost = job.estimated_cost || 0;
    const price = job.customer_price || 0;
    const profit = price - cost;
    return {
      profit,
      isProfit: profit > 0,
      isLoss: profit < 0,
      isBreakEven: profit === 0,
    };
  };

  // Calculate statistics
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.status === "in_progress").length;
  const pendingJobs = jobs.filter((job) => job.status === "pending").length;
  const completedJobs = jobs.filter((job) => job.status === "done").length;
  const customerJobs = jobs.filter((job) => job.job_type === "customer").length;
  const dealerJobs = jobs.filter((job) => job.job_type === "dealer").length;

  // Calculate total profit/loss
  const totalProfitLoss = jobs.reduce((total, job) => {
    const { profit } = calculateProfitLoss(job);
    return total + profit;
  }, 0);

  // Calculate top 5 key metrics for auto repair business
  const customerJobsOnly = jobs.filter((job) => job.job_type === "customer");
  const completedCustomerJobs = customerJobsOnly.filter(
    (job) => job.status === "done"
  );

  // 1. Labor Efficiency (Average hours per job)
  const totalActualHours = completedCustomerJobs.reduce(
    (sum, job) => sum + (job.actual_hours || 0),
    0
  );
  const averageHoursPerJob =
    completedCustomerJobs.length > 0
      ? totalActualHours / completedCustomerJobs.length
      : 0;

  // 2. Parts Markup Percentage (Average markup on parts)
  const jobsWithParts = completedCustomerJobs.filter(
    (job) => job.estimated_cost > 0
  );
  const averagePartsMarkup =
    jobsWithParts.length > 0
      ? jobsWithParts.reduce((sum, job) => {
          const markup =
            (((job.customer_price || 0) - job.estimated_cost) /
              job.estimated_cost) *
            100;
          return sum + markup;
        }, 0) / jobsWithParts.length
      : 0;

  // 3. Customer Retention Rate (Returning customers)
  const uniqueCustomers = new Set(
    customerJobsOnly.map((job) => job.customer_info?.name).filter(Boolean)
  );
  const totalCustomerJobs = customerJobsOnly.length;
  const customerRetentionRate =
    uniqueCustomers.size > 0 ? totalCustomerJobs / uniqueCustomers.size : 0;

  // 4. Bay Utilization Rate (Jobs per day)
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const jobsToday = jobs.filter(
    (job) => new Date(job.created_at) >= startOfDay
  ).length;
  const bayUtilizationRate = jobsToday; // Assuming 1 bay, can be scaled by number of bays

  // 5. Outstanding Receivables (Total unpaid amounts)
  const totalOutstandingReceivables = customerJobsOnly.reduce(
    (sum, job) => sum + (job.outstanding_balance || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading repair bay...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm sm:text-base">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Repair job started successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 flex items-center justify-center gap-2 sm:gap-3">
          <Wrench className="w-6 h-6 sm:w-8 sm:h-8" />
          Repair Bay Activity Tracker
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground px-4">
          Track every car that goes into a bay - "If it goes up, it gets logged"
        </p>
      </div>

      {/* Basic Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">{totalJobs}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total Jobs
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {activeJobs}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Active
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {pendingJobs}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Pending
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {completedJobs}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Completed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {customerJobs}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Customer
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {dealerJobs}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Dealer
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <DollarSign
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"
                }`}
              />
              <div>
                <div
                  className={`text-lg sm:text-2xl font-bold ${
                    totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {totalProfitLoss >= 0 ? "+" : ""}${totalProfitLoss.toFixed(2)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total P&L
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Key Metrics for Auto Repair Business */}
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          Key Business Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  {averageHoursPerJob.toFixed(1)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Avg Hours/Job
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {averagePartsMarkup.toFixed(1)}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Avg Parts Markup
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">
                  {customerRetentionRate.toFixed(1)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Jobs per Customer
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">
                  {bayUtilizationRate}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Jobs Today
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-red-600">
                  ${totalOutstandingReceivables.toFixed(2)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Outstanding
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by car make, model, customer name, or job description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="done">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="dealer">Dealer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowNewJobForm(true)}
            className="w-full sm:w-auto"
          >
            <Wrench className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Log New Job</span>
            <span className="sm:hidden">New Job</span>
          </Button>
        </div>
      </div>

      {/* New Job Form Modal */}
      {showNewJobForm && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Log New Repair Job
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Every car that goes into a bay must be logged
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <button
                        onClick={() => {
                          // Only allow going back to completed steps
                          if (step <= currentStep) {
                            setCurrentStep(step);
                          }
                        }}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                          currentStep >= step
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                            : "bg-gray-200 text-gray-600 cursor-not-allowed"
                        }`}
                        disabled={step > currentStep}
                      >
                        {step}
                      </button>
                      {step < 3 && (
                        <div
                          className={`w-8 sm:w-12 h-1 mx-1 sm:mx-2 ${
                            currentStep > step ? "bg-primary" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Job Type & Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base sm:text-lg font-semibold">
                      Whose car is this?
                    </Label>
                    <Select
                      value={formData.job_type}
                      onValueChange={(value: JobType) =>
                        setFormData((prev) => ({ ...prev, job_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer Job</SelectItem>
                        <SelectItem value="dealer">
                          Dealer Inventory (Recon)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.job_type === "customer" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label>Customer Name</Label>
                        <Input
                          value={formData.customer_info.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              customer_info: {
                                ...prev.customer_info,
                                name: e.target.value,
                              },
                            }))
                          }
                          placeholder="Customer name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact (Phone)</Label>
                        <Input
                          value={formData.customer_info.contact}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              customer_info: {
                                ...prev.customer_info,
                                contact: e.target.value,
                              },
                            }))
                          }
                          placeholder="Phone number"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label>Stock Number / Internal ID</Label>
                        <Input
                          value={formData.car_info.stock_number}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              car_info: {
                                ...prev.car_info,
                                stock_number: e.target.value,
                              },
                            }))
                          }
                          placeholder="Internal stock number"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>License Plate (Optional)</Label>
                        <Input
                          value={formData.car_info.license_plate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              car_info: {
                                ...prev.car_info,
                                license_plate: e.target.value,
                              },
                            }))
                          }
                          placeholder="License plate"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Make</Label>
                      <Select
                        value={formData.car_info.make}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            car_info: {
                              ...prev.car_info,
                              make: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select make" />
                        </SelectTrigger>
                        <SelectContent>
                          {popularMakes.map((make) => (
                            <SelectItem key={make} value={make}>
                              {make}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        value={formData.car_info.model}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            car_info: {
                              ...prev.car_info,
                              model: e.target.value,
                            },
                          }))
                        }
                        placeholder="Vehicle model"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select
                        value={formData.car_info.year}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            car_info: {
                              ...prev.car_info,
                              year: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1"
                      disabled={
                        !formData.car_info.make ||
                        !formData.car_info.model ||
                        !formData.car_info.year ||
                        (formData.job_type === "customer" &&
                          (!formData.customer_info.name ||
                            !formData.customer_info.contact)) ||
                        (formData.job_type === "dealer" &&
                          !formData.car_info.stock_number)
                      }
                    >
                      Next
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewJobForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Job Description */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">
                      What work needs to be done?
                    </Label>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="common"
                          name="jobType"
                          value="common"
                          checked={selectedJobType === "common"}
                          onChange={(e) =>
                            setSelectedJobType(
                              e.target.value as "common" | "other"
                            )
                          }
                          className="w-4 h-4"
                        />
                        <Label htmlFor="common" className="text-sm font-medium">
                          Select from common jobs
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="other"
                          name="jobType"
                          value="other"
                          checked={selectedJobType === "other"}
                          onChange={(e) =>
                            setSelectedJobType(
                              e.target.value as "common" | "other"
                            )
                          }
                          className="w-4 h-4"
                        />
                        <Label htmlFor="other" className="text-sm font-medium">
                          Other (specify)
                        </Label>
                      </div>
                    </div>

                    {selectedJobType === "common" ? (
                      <div className="mt-4">
                        <div className="max-h-64 overflow-y-auto border rounded-md p-4">
                          <div className="grid grid-cols-1 gap-2">
                            {commonJobs.map((job) => (
                              <div
                                key={job}
                                className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                                  selectedJobs.includes(job)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-white hover:bg-gray-50 border-gray-200"
                                }`}
                                onClick={() => {
                                  setSelectedJobs((prev) =>
                                    prev.includes(job)
                                      ? prev.filter((j) => j !== job)
                                      : [...prev, job]
                                  );
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedJobs.includes(job)}
                                  onChange={() => {}} // Handled by onClick
                                  className="mr-3"
                                />
                                <span className="text-sm">{job}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {selectedJobs.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm font-medium mb-2">
                              Selected Jobs:
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedJobs.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4">
                        <Textarea
                          value={customJobDescription}
                          onChange={(e) =>
                            setCustomJobDescription(e.target.value)
                          }
                          placeholder="Briefly describe the work needed"
                          className="min-h-[100px]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="flex-1"
                      disabled={
                        selectedJobType === "common"
                          ? selectedJobs.length === 0
                          : !customJobDescription
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Final Details */}
              {currentStep === 3 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold">
                      Final Details
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Technician</Label>
                      <Select
                        value={formData.technician}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            technician: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {technicians.map((tech) => (
                            <SelectItem key={tech} value={tech}>
                              {tech}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Parts Ordered</Label>
                      <Select
                        value={formData.parts_ordered ? "yes" : "no"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            parts_ordered: value === "yes",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cost to Us (Parts + Labor)</Label>
                      <Input
                        type="number"
                        value={formData.estimated_cost}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            estimated_cost: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500">
                        Total cost of parts and labor
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Price for Customer</Label>
                      <Input
                        type="number"
                        value={formData.customer_price}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customer_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500">
                        Amount charged to customer
                      </p>
                    </div>
                  </div>

                  {formData.parts_ordered && (
                    <div className="space-y-2">
                      <Label>Parts Notes</Label>
                      <Textarea
                        value={formData.parts_notes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            parts_notes: e.target.value,
                          }))
                        }
                        placeholder="Parts supplier, tracking info, etc."
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={
                        isSubmitting ||
                        !formData.technician ||
                        formData.estimated_cost < 0 ||
                        formData.customer_price < 0
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Starting...
                        </>
                      ) : (
                        "Start Job"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold">
          {searchTerm
            ? `Search Results (${filteredJobs.length})`
            : "Active Jobs"}
        </h2>
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs logged yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by logging the first car that goes into a bay
              </p>
              <Button onClick={() => setShowNewJobForm(true)}>
                Log First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(job.status)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg leading-tight">
                          {job.car_info.year} {job.car_info.make}{" "}
                          {job.car_info.model}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.job_type === "customer"
                            ? `Customer: ${job.customer_info?.name}`
                            : `Stock #: ${job.car_info.stock_number}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusColor(
                        job.status
                      )} whitespace-nowrap`}
                    >
                      {job.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  {/* Job Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Job Description
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 break-words">
                        {job.job_description}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Technician
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {job.technician}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Time Started
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(job.time_started).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {job.status === "in_progress"
                          ? "Time Elapsed"
                          : "Time Started"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {job.status === "in_progress" &&
                        activeTimers[job.id] !== undefined
                          ? formatTime(activeTimers[job.id])
                          : new Date(job.time_started).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Financial Badges - Mobile Stacked */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-sm">
                      Cost: ${job.estimated_cost}
                    </Badge>
                    <Badge variant="outline" className="text-sm text-green-600">
                      Price: ${job.customer_price || 0}
                    </Badge>
                    {(() => {
                      const { profit, isProfit, isLoss, isBreakEven } =
                        calculateProfitLoss(job);
                      return (
                        <Badge
                          variant="outline"
                          className={`text-sm ${
                            isProfit
                              ? "text-green-600 border-green-600 bg-green-50"
                              : isLoss
                              ? "text-red-600 border-red-600 bg-red-50"
                              : "text-gray-600 border-gray-600 bg-gray-50"
                          }`}
                        >
                          {isProfit ? "+" : ""}${profit.toFixed(2)}{" "}
                          {isProfit ? "Profit" : isLoss ? "Loss" : "Break Even"}
                        </Badge>
                      );
                    })()}
                    {job.parts_ordered && (
                      <Badge
                        variant="outline"
                        className="text-sm text-blue-600"
                      >
                        Parts Ordered
                      </Badge>
                    )}
                    {/* Payment Status Badge */}
                    {job.job_type === "customer" && (
                      <Badge
                        variant="outline"
                        className={`text-sm ${
                          job.payment_status === "paid"
                            ? "text-green-600 border-green-600 bg-green-50"
                            : job.payment_status === "partial"
                            ? "text-yellow-600 border-yellow-600 bg-yellow-50"
                            : job.payment_status === "overdue"
                            ? "text-red-600 border-red-600 bg-red-50"
                            : "text-gray-600 border-gray-600 bg-gray-50"
                        }`}
                      >
                        {job.payment_status === "paid"
                          ? "Paid"
                          : job.payment_status === "partial"
                          ? "Partial"
                          : job.payment_status === "overdue"
                          ? "Overdue"
                          : "Pending"}
                        {job.total_paid &&
                          job.total_paid > 0 &&
                          ` ($${job.total_paid.toFixed(2)})`}
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Status Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {job.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => updateJobStatus(job.id, "in_progress")}
                          className="flex-1 sm:flex-none"
                        >
                          Start
                        </Button>
                      )}
                      {job.status === "in_progress" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateJobStatus(job.id, "paused")}
                            className="flex-1 sm:flex-none"
                          >
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateJobStatus(job.id, "done")}
                            className="flex-1 sm:flex-none"
                          >
                            Complete
                          </Button>
                        </>
                      )}
                      {job.status === "paused" && (
                        <Button
                          size="sm"
                          onClick={() => updateJobStatus(job.id, "in_progress")}
                          className="flex-1 sm:flex-none"
                        >
                          Resume
                        </Button>
                      )}
                      {job.status === "done" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateJobStatus(job.id, "in_progress")}
                          className="flex-1 sm:flex-none text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          Undo Complete
                        </Button>
                      )}
                    </div>

                    {/* Utility Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJobEditModalOpen(job)}
                        className="flex-1 sm:flex-none text-gray-600 border-gray-600 hover:bg-gray-50"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>

                      {/* Payment Button for Customer Jobs */}
                      {job.job_type === "customer" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePaymentModalOpen(job)}
                          className="flex-1 sm:flex-none text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Payment</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedJobForPayment && (
        <PaymentModal
          job={selectedJobForPayment}
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          onPaymentAdded={handlePaymentAdded}
        />
      )}

      {/* Job Edit Modal */}
      {selectedJobForEdit && (
        <JobEditModal
          job={selectedJobForEdit}
          isOpen={showJobEditModal}
          onClose={handleJobEditModalClose}
          onJobUpdated={handleJobUpdated}
          onJobDeleted={handleJobDeleted}
        />
      )}
    </div>
  );
}
