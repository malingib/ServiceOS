"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, FormField, Badge, EmptyState } from "@serviceops/ui";
import { ArrowLeft, CreditCard, CheckCircle } from "lucide-react";

const services = [
  { id: "svc-1", name: "Office Cleaning", price: "KES 8,500" },
  { id: "svc-2", name: "Deep Cleaning", price: "KES 12,000" },
  { id: "svc-3", name: "Carpet Shampooing", price: "KES 15,000" },
  { id: "svc-4", name: "Window Cleaning", price: "KES 5,000" },
  { id: "svc-5", name: "Floor Polishing", price: "KES 10,000" },
  { id: "svc-6", name: "Sanitization", price: "KES 7,500" },
];

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center py-20">
        <EmptyState
          icon={CheckCircle}
          title="Booking Created!"
          description="Your booking has been submitted successfully. A worker will be assigned shortly."
          action={{ label: "View Booking", onClick: () => router.push("/bookings") }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-surface-900">New Booking</h2>
          <p className="text-sm text-surface-500">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${
              s <= step ? "bg-brand-500" : "bg-surface-200"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 && (
          <div className="rounded-xl border border-surface-200 bg-white p-6 space-y-6">
            <h3 className="font-semibold text-surface-900">Select Service</h3>
            <div className="grid gap-3">
              {services.map((svc) => (
                <label
                  key={svc.id}
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedService === svc.id
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                      : "border-surface-200 hover:border-surface-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="service"
                      value={svc.id}
                      checked={selectedService === svc.id}
                      onChange={() => setSelectedService(svc.id)}
                      className="h-4 w-4 text-brand-500"
                    />
                    <span className="text-sm font-medium text-surface-700">{svc.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">{svc.price}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)} disabled={!selectedService}>
                Next — Customer Details
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-surface-200 bg-white p-6 space-y-4">
            <h3 className="font-semibold text-surface-900">Customer & Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Customer Name" required>
                <input className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Sarah M." />
              </FormField>
              <FormField label="Phone Number" required>
                <input className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="+254 7XX XXX XXX" />
              </FormField>
            </div>
            <FormField label="Service Address" required>
              <textarea className="flex w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" rows={3} placeholder="Enter full address..." />
            </FormField>
            <FormField label="Special Instructions">
              <textarea className="flex w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" rows={2} placeholder="Gate code, parking info, etc." />
            </FormField>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" onClick={() => setStep(3)}>Next — Schedule</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-xl border border-surface-200 bg-white p-6 space-y-4">
            <h3 className="font-semibold text-surface-900">Schedule & Payment</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date" required>
                <input type="date" className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </FormField>
              <FormField label="Time" required>
                <input type="time" className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </FormField>
            </div>

            <div className="rounded-lg bg-surface-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Service</span>
                <span className="font-medium text-surface-700">{services.find(s => s.id === selectedService)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Price</span>
                <span className="font-medium text-surface-700">{services.find(s => s.id === selectedService)?.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Booking Fee</span>
                <span className="font-medium text-surface-700">KES 0</span>
              </div>
              <div className="flex justify-between border-t border-surface-200 pt-2">
                <span className="text-sm font-semibold text-surface-900">Total</span>
                <span className="text-sm font-bold text-surface-900">{services.find(s => s.id === selectedService)?.price}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-700">Payment will be collected via M-Pesa STK Push after confirmation.</p>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit" loading={submitting}>
                <CheckCircle className="h-4 w-4" />
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
