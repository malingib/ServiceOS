import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DollarSign, TrendingUp, Award } from "lucide-react-native";
import EarningsChart from "../components/EarningsChart";

const weeklyEarnings = [
  { day: "Mon", amount: 4500 },
  { day: "Tue", amount: 8500 },
  { day: "Wed", amount: 6200 },
  { day: "Thu", amount: 12500 },
  { day: "Fri", amount: 4800 },
  { day: "Sat", amount: 9200 },
  { day: "Sun", amount: 3000 },
];

const recentTransactions = [
  { id: "1", customer: "KenGen HQ", amount: "KES 12,500", date: "Today, 09:00 AM", status: "completed" },
  { id: "2", customer: "Sarah M.", amount: "KES 8,500", date: "Yesterday, 02:00 PM", status: "completed" },
  { id: "3", customer: "Tech Park Ltd", amount: "KES 6,200", date: "Jun 6, 11:00 AM", status: "completed" },
  { id: "4", customer: "Mall & More", amount: "KES 4,500", date: "Jun 5, 10:00 AM", status: "completed" },
];

export default function EarningsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSub}>This Week</Text>
        </View>

        <EarningsChart
          data={weeklyEarnings}
          total="KES 48,700"
          trend="12.5%"
          positive
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <DollarSign size={20} color="#2563eb" />
            <Text style={styles.statValue}>KES 187K</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={20} color="#16a34a" />
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={20} color="#f59e0b" />
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.txLeft}>
                <View style={styles.txAvatar}>
                  <Text style={styles.txInitials}>
                    {tx.customer.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.txName}>{tx.customer}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
              </View>
              <Text style={styles.txAmount}>{tx.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  txAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  txInitials: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
  },
  txName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  txDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
  },
});
