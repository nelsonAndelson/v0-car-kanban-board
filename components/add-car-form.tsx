"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { Plus, Car, X } from "lucide-react"

interface AddCarFormProps {
  onCarAdded: () => void
  isFloating?: boolean
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
]

const popularColors = ["White", "Black", "Silver", "Gray", "Blue", "Red", "Green", "Brown", "Gold", "Orange"]

export function AddCarForm({ onCarAdded, isFloating = false }: AddCarFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    make: "",
    model: "",
    color: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("cars").insert([
        {
          year: Number.parseInt(formData.year),
          make: formData.make,
          model: formData.model,
          color: formData.color,
          status: "Acquired",
        },
      ])

      if (error) throw error

      // Reset form
      setFormData({
        year: new Date().getFullYear().toString(),
        make: "",
        model: "",
        color: "",
      })
      setIsOpen(false)
      onCarAdded()
    } catch (error) {
      console.error("Error adding car:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    if (isFloating) {
      return null // Don't render anything when floating and closed
    }

    return (
      <Button onClick={() => setIsOpen(true)} className="mb-6" size="lg">
        <Car className="w-5 h-5 mr-2" />
        Add New Car to Inventory
      </Button>
    )
  }

  return (
    <Card
      className={`mb-6 border-2 border-primary/20 ${isFloating ? "fixed inset-4 z-50 max-w-2xl mx-auto shadow-2xl" : ""}`}
    >
      {isFloating && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Add New Car
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
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
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
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
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Car...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Inventory
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
