import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
  Navigation,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import StatusBadge from "../components/StatusBadge";

export default function JobDetailScreen({ route, navigation }: any) {
  const { job } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.topCard}>
          <View style={styles.titleRow}>
            <Text style={styles.service}>{job.service}</Text>
            <StatusBadge status={job.status} />
          </View>
          <Text style={styles.customer}>{job.customer}</Text>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.detailText}>{job.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.detailText}>{job.date} · {job.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <DollarSign size={16} color="#2563eb" />
              <Text style={[styles.detailText, { color: "#2563eb", fontWeight: "700" }]}>
                KES {job.amount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerCard}>
            <View style={styles.avatar}>
              <User size={20} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{job.customer}</Text>
              <Text style={styles.contactLabel}>+254 712 345 678</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Phone size={18} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Instructions</Text>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsText}>
              • Use the service entrance at the back{"\n"}
              • Parking available behind the building{"\n"}
              • Ask for Sarah at reception{"\n"}
              • Ensure all surfaces are disinfected
            </Text>
          </View>
        </View>

        {job.status === "accepted" && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.startBtn]}>
              <Navigation size={18} color="#ffffff" />
              <Text style={styles.actionBtnText}>Start Job</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]}>
              <XCircle size={18} color="#dc2626" />
              <Text style={[styles.actionBtnText, { color: "#dc2626" }]}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {job.status === "in_progress" && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]}>
              <CheckCircle size={18} color="#ffffff" />
              <Text style={styles.actionBtnText}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  service: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  customer: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#475569",
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  contactLabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  callBtn: {
    padding: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
  },
  instructionsCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  instructionsText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 40,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startBtn: {
    backgroundColor: "#2563eb",
  },
  declineBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  completeBtn: {
    backgroundColor: "#16a34a",
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
});
