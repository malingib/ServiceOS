"use client";

import { useState } from "react";
import { Button, FormField, Badge } from "@serviceops/ui";
import { Save, Building2, Palette, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "profile", label: "Business Profile", icon: Building2 },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900">Settings</h2>
          <p className="text-sm text-surface-500">Manage your business profile and preferences</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          {saved ? "Saved!" : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="flex gap-2 border-b border-surface-200 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-surface-500 hover:text-surface-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-surface-200 bg-white p-6 space-y-6">
        {activeTab === "profile" && (
          <>
            <h3 className="font-semibold text-surface-900">Business Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Business Name" required>
                <input className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" defaultValue="SparkleClean Ltd" />
              </FormField>
              <FormField label="Business Email" required>
                <input className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" defaultValue="info@sparkleclean.co.ke" />
              </FormField>
              <FormField label="Phone Number" required>
                <input className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" defaultValue="+254 712 345 678" />
              </FormField>
              <FormField label="Business Address">
                <input className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" defaultValue="Mombasa Road, Nairobi" />
              </FormField>
              <FormField label="KRA PIN">
                <input className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" defaultValue="P051234567Z" />
              </FormField>
              <FormField label="Currency">
                <select className="flex h-10 w-full rounded-lg border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" defaultValue="KES">
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                  <option value="TZS">TZS - Tanzanian Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </FormField>
            </div>
          </>
        )}

        {activeTab === "branding" && (
          <>
            <h3 className="font-semibold text-surface-900">Brand Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Primary Color">
                <input type="color" className="h-10 w-full rounded-lg border border-surface-300 cursor-pointer" defaultValue="#2563eb" />
              </FormField>
              <FormField label="Logo">
                <div className="flex h-10 w-full items-center rounded-lg border border-surface-300 px-3 text-sm text-surface-400 cursor-pointer hover:border-surface-400">
                  Upload logo...
                </div>
              </FormField>
            </div>
          </>
        )}

        {activeTab === "notifications" && (
          <>
            <h3 className="font-semibold text-surface-900">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { label: "New Booking", desc: "When a new booking is created" },
                { label: "Payment Received", desc: "When a payment is confirmed" },
                { label: "Worker Check-in", desc: "When a worker starts a job" },
                { label: "Daily Summary", desc: "End-of-day booking summary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-700">{item.label}</p>
                    <p className="text-xs text-surface-400">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="h-6 w-11 rounded-full bg-surface-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "security" && (
          <>
            <h3 className="font-semibold text-surface-900">Security Settings</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-surface-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-700">Two-Factor Authentication</p>
                    <p className="text-xs text-surface-400">Add extra security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
              </div>
              <div className="rounded-lg border border-surface-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-700">Active Sessions</p>
                    <p className="text-xs text-surface-400">2 active sessions</p>
                  </div>
                  <Button variant="ghost" size="sm">Manage</Button>
                </div>
              </div>
              <div className="rounded-lg border border-surface-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-700">API Keys</p>
                    <p className="text-xs text-surface-400">Manage integration tokens</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
