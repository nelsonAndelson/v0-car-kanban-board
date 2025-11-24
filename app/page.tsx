"use client";

import { ArrowRight, Car, CheckCircle, Clock, DollarSign, TrendingUp, Wrench } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const features = [
    {
      icon: Car,
      title: "Car Inventory Management",
      description: "Track vehicles through your sales pipeline from acquisition to ready-to-sale with an intuitive Kanban board.",
      href: "/inventory",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Wrench,
      title: "Repair Bay Tracking",
      description: "Enforce the \"If it goes up, it gets logged\" rule. Track every job, technician activity, and repair cost.",
      href: "/repair-bay",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      icon: DollarSign,
      title: "Payment Management",
      description: "Track customer payments, outstanding balances, and generate professional quotes and invoices.",
      href: "/repair-bay",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: TrendingUp,
      title: "Profit & Loss Analysis",
      description: "Real-time P&L tracking for every repair job. Know your margins before completing work.",
      href: "/repair-bay",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const stats = [
    { label: "Real-time Updates", value: "Instant", icon: Clock },
    { label: "Drag & Drop", value: "Easy", icon: CheckCircle },
    { label: "Job Tracking", value: "Complete", icon: Wrench },
    { label: "Cost Control", value: "Precise", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-primary rounded-full text-sm font-medium">
            <Car className="w-4 h-4" />
            <span>Dealership Management System</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Manage Your Dealership with{" "}
            <span className="text-primary">Confidence</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete visibility into your car inventory and repair operations. Track every vehicle from acquisition to sale, and every job from bay to payment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/inventory">
              <Button size="lg" className="w-full sm:w-auto">
                <Car className="w-5 h-5 mr-2" />
                View Inventory
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/repair-bay">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Wrench className="w-5 h-5 mr-2" />
                Repair Bay
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Run Your Dealership
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed specifically for automotive dealerships and repair shops.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
                      Learn more
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 pb-20">
        <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
          <CardContent className="py-12 px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Dealership?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Start tracking your inventory and repair operations today. Full visibility, complete control.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/inventory">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
