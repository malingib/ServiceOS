import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell } from "lucide-react-native";
import JobCard from "../components/JobCard";
import type { Job } from "../components/JobCard";

const mockJobs: Job[] = [
  { id: "1", service: "Office Cleaning", customer: "KenGen HQ", address: "Kampala Road, Nairobi", date: "Today", time: "09:00 AM", amount: 12500, status: "accepted", distance: "2.3 km" },
  { id: "2", service: "Deep Cleaning", customer: "Sarah M.", address: "Westlands, Nairobi", date: "Today", time: "02:00 PM", amount: 8500, status: "in_progress", distance: "4.1 km" },
  { id: "3", service: "Carpet Shampooing", customer: "Tech Park Ltd", address: "Upper Hill, Nairobi", date: "Tomorrow", time: "10:00 AM", amount: 18000, status: "pending", distance: "1.5 km" },
  { id: "4", service: "Window Cleaning", customer: "Mall & More", address: "Two Rivers Mall", date: "Tomorrow", time: "01:00 PM", amount: 6500, status: "pending", distance: "5.8 km" },
  { id: "5", service: "Floor Polishing", customer: "Delta Hotel", address: "CBD, Nairobi", date: "Jun 10", time: "08:00 AM", amount: 22000, status: "accepted", distance: "3.2 km" },
];

type FilterTab = "all" | "today" | "upcoming";

export default function JobsListScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = mockJobs.filter((j) => {
    if (activeTab === "today") return j.date === "Today";
    if (activeTab === "upcoming") return j.date !== "Today";
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const handleJobPress = (job: Job) => {
    navigation.navigate("JobDetail", { job });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>Peter Kamau</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Bell size={22} color="#475569" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(["all", "today", "upcoming"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>KES 12.5K</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} onPress={handleJobPress} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No jobs found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: "#64748b",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  notifBtn: {
    position: "relative",
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  activeTab: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#ffffff",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  list: {
    paddingBottom: 100,
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#94a3b8",
  },
});
