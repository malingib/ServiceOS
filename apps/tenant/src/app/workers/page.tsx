"use client";

import { useRouter } from "next/navigation";
import { WorkerCard, DataTable, Badge } from "@serviceops/ui";
import type { Column } from "@serviceops/ui";

interface Worker {
  id: string;
  name: string;
  role: string;
  rating: number;
  completedJobs: number;
  phone: string;
  email: string;
  kycStatus: "verified" | "pending" | "rejected";
  reliabilityScore: number;
}

const workers: Worker[] = [
  { id: "w1", name: "Peter Kamau", role: "Cleaner", rating: 4.9, completedJobs: 156, phone: "+254 712 345 678", email: "peter@example.com", kycStatus: "verified", reliabilityScore: 96 },
  { id: "w2", name: "Grace Wanjiku", role: "Senior Cleaner", rating: 4.8, completedJobs: 203, phone: "+254 723 456 789", email: "grace@example.com", kycStatus: "verified", reliabilityScore: 98 },
  { id: "w3", name: "James Ochieng", role: "Cleaner", rating: 4.5, completedJobs: 89, phone: "+254 734 567 890", email: "james@example.com", kycStatus: "verified", reliabilityScore: 88 },
  { id: "w4", name: "Sarah Nyambura", role: "Specialist", rating: 4.7, completedJobs: 45, phone: "+254 745 678 901", email: "sarah@example.com", kycStatus: "pending", reliabilityScore: 82 },
  { id: "w5", name: "John Kiprop", role: "Cleaner", rating: 4.2, completedJobs: 23, phone: "+254 756 789 012", email: "john@example.com", kycStatus: "verified", reliabilityScore: 75 },
  { id: "w6", name: "Mary Akinyi", role: "Supervisor", rating: 4.9, completedJobs: 312, phone: "+254 767 890 123", email: "mary@example.com", kycStatus: "verified", reliabilityScore: 99 },
];

export default function WorkersPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-surface-500">{workers.length} workers · {workers.filter(w => w.kycStatus === "verified").length} KYC verified</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workers.map((w) => (
          <WorkerCard
            key={w.id}
            id={w.id}
            name={w.name}
            role={w.role}
            rating={w.rating}
            completedJobs={w.completedJobs}
            phone={w.phone}
            email={w.email}
            kycStatus={w.kycStatus}
            reliabilityScore={w.reliabilityScore}
          />
        ))}
      </div>
    </div>
  );
}
