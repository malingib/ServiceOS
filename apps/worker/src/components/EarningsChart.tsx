import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface EarningsData {
  day: string;
  amount: number;
}

interface EarningsChartProps {
  data: EarningsData[];
  total: string;
  trend: string;
  positive: boolean;
}

export default function EarningsChart({ data, total, trend, positive }: EarningsChartProps) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalAmount}>{total}</Text>
        </View>
        <Text style={[styles.trend, { color: positive ? "#16a34a" : "#dc2626" }]}>
          {positive ? "+" : ""}{trend}
        </Text>
      </View>

      <View style={styles.chart}>
        {data.map((item) => (
          <View key={item.day} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max((item.amount / maxAmount) * 100, 8)}%` as any,
                    backgroundColor: positive ? "#2563eb" : "#dc2626",
                  },
                ]}
              />
            </View>
            <Text style={styles.dayLabel}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  trend: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barWrapper: {
    flex: 1,
    width: "60%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 8,
  },
  dayLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 8,
  },
});
