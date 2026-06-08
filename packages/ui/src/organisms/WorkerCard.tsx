"use client";

import { cn } from "../lib";
import { Badge } from "../atoms/Badge";
import { Avatar } from "../atoms/Avatar";
import { Star, Phone, Mail, Shield } from "lucide-react";

export interface WorkerCardProps {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  rating: number;
  completedJobs: number;
  phone?: string;
  email?: string;
  kycStatus: "verified" | "pending" | "rejected";
  reliabilityScore: number;
  onClick?: () => void;
  className?: string;
}

const kycMap = {
  verified: { label: "KYC Verified", variant: "success" as const },
  pending: { label: "KYC Pending", variant: "warning" as const },
  rejected: { label: "KYC Rejected", variant: "danger" as const },
};

function WorkerCard({ name, avatar, role, rating, completedJobs, phone, email, kycStatus, reliabilityScore, onClick, className }: WorkerCardProps) {
  const kyc = kycMap[kycStatus];

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-surface-200 bg-white p-5 transition-all hover:shadow-md cursor-pointer",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar name={name} src={avatar} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-surface-900">{name}</h3>
              <p className="text-sm text-surface-500">{role}</p>
            </div>
            <Badge variant={kyc.variant}>{kyc.label}</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-surface-600">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              {rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-500" />
              {reliabilityScore}% reliable
            </span>
            <span className="text-surface-400">{completedJobs} jobs</span>
          </div>

          {(phone || email) && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-surface-500">
              {phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {phone}
                </span>
              )}
              {email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {email}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { WorkerCard };
