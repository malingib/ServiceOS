import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MapPin, Clock, DollarSign } from "lucide-react-native";
import StatusBadge from "./StatusBadge";

export interface Job {
  id: string;
  service: string;
  customer: string;
  address: string;
  date: string;
  time: string;
  amount: number;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  distance?: string;
}

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(job)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.service}>{job.service}</Text>
          <StatusBadge status={job.status} />
        </View>
        <Text style={styles.customer}>{job.customer}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.detailText} numberOfLines={1}>{job.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={14} color="#64748b" />
          <Text style={styles.detailText}>{job.date} · {job.time}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.amountRow}>
          <DollarSign size={14} color="#2563eb" />
          <Text style={styles.amount}>KES {job.amount.toLocaleString()}</Text>
        </View>
        {job.distance && (
          <Text style={styles.distance}>{job.distance} away</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  service: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  customer: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  details: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },
  distance: {
    fontSize: 12,
    color: "#94a3b8",
  },
});
