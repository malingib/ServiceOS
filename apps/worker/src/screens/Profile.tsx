import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Star,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Award,
  Briefcase,
} from "lucide-react-native";

export default function ProfileScreen() {
  const menuItems = [
    { icon: User, label: "Personal Information", color: "#2563eb" },
    { icon: Briefcase, label: "Work Preferences", color: "#16a34a" },
    { icon: Shield, label: "KYC & Documents", color: "#f59e0b" },
    { icon: Settings, label: "App Settings", color: "#64748b" },
    { icon: HelpCircle, label: "Help & Support", color: "#8b5cf6" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <User size={32} color="#2563eb" />
          </View>
          <Text style={styles.name}>Peter Kamau</Text>
          <Text style={styles.role}>Senior Cleaner</Text>

          <View style={styles.badges}>
            <View style={styles.badge}>
              <Award size={14} color="#f59e0b" />
              <Text style={styles.badgeText}>Top Rated</Text>
            </View>
            <View style={styles.badge}>
              <Star size={14} color="#f59e0b" />
              <Text style={styles.badgeText}>4.9 ★</Text>
            </View>
            <View style={styles.badge}>
              <Shield size={14} color="#16a34a" />
              <Text style={styles.badgeText}>KYC Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>312</Text>
            <Text style={styles.statDesc}>Total Jobs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statDesc}>Completion</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>KES 187K</Text>
            <Text style={styles.statDesc}>This Month</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + "15" }]}>
                  <item.icon size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <LogOut size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ServiceOS Worker v1.0.0</Text>
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
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#dbeafe",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  role: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  statDesc: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#dc2626",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 24,
    marginBottom: 40,
  },
});
