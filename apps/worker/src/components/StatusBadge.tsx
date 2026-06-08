import React from "react";
import { View, Text, StyleSheet } from "react-native";

type JobStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

const statusConfig: Record<JobStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "#fef3c7", text: "#92400e" },
  accepted: { label: "Accepted", bg: "#dbeafe", text: "#1e40af" },
  in_progress: { label: "In Progress", bg: "#e0f2fe", text: "#075985" },
  completed: { label: "Completed", bg: "#dcfce7", text: "#166534" },
  cancelled: { label: "Cancelled", bg: "#fee2e2", text: "#991b1b" },
};

interface StatusBadgeProps {
  status: JobStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
