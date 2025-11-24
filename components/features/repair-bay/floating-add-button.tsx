"use client";

import type React from "react";
import { useState } from "react";

import { Plus, Car, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/db";

interface FloatingAddButtonProps {
  onCarAdded: () => void
}

const popularMakes = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
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
];

const popularColors = ["White", "Black", "Silver", "Gray", "Blue", "Red", "Green", "Brown", "Gold", "Orange"];

export function FloatingAddButton({ onCarAdded }: FloatingAddButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    make: "",
    model: "",
    color: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("cars").insert([
        {
          year: Number.parseInt(formData.year),
          make: formData.make,
          model: formData.model,
          color: formData.color,
          status: "Acquired",
        },
      ]);

      if (error) {throw error;}

      // Reset form
      setFormData({
        year: new Date().getFullYear().toString(),
        make: "",
        model: "",
        color: "",
      });
      setIsFormOpen(false);
      onCarAdded();
    } catch (error) {
      console.error("Error adding car:", error);
      alert("Failed to add car. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-black text-white" // Applied black background and white text
        size="lg"
      >
        <Plus className="w-6 h-6" />
        <span className="sr-only">Add new car</span>
      </Button>

      {/* Extended FAB on hover */}
      <div className="fixed bottom-6 right-6 z-20 group">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-16 group-hover:translate-x-0 bg-black text-white hover:bg-gray-800" // Applied black background and white text
          size="lg"
        >
          <Car className="w-5 h-5 mr-2" />
          Add Car
        </Button>
      </div>

      {/* Floating Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-primary/20 shadow-2xl bg-slate-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Add New Car
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="make">Make *</Label>
                    <Select value={formData.make} onValueChange={(value) => setFormData({ ...formData, make: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                      <SelectContent>
                        {popularMakes.map((make) => (
                          <SelectItem key={make} value={make}>
                            {make}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.make === "other" && (
                      <Input
                        className="mt-2"
                        placeholder="Enter make"
                        value={formData.make}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                      placeholder="e.g., Camry, Civic, F-150"
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Color *</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) => setFormData({ ...formData, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {popularColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.color === "other" && (
                      <Input
                        className="mt-2"
                        placeholder="Enter color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-black text-white">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Adding Car...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Inventory
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
