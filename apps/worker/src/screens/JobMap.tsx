import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function JobMapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Jobs</Text>
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.mapPlaceholder}>
        <MapPin size={40} color="#2563eb" />
        <Text style={styles.mapText}>Map View</Text>
        <Text style={styles.mapSubtext}>
          Real-time job locations and navigation
        </Text>

        <View style={styles.mockMap}>
          <View style={styles.mockGrid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} style={styles.gridCell} />
            ))}
          </View>
          <View style={[styles.mockPin, { top: "30%", left: "40%" }]}>
            <MapPin size={24} color="#2563eb" />
          </View>
          <View style={[styles.mockPin, { top: "55%", left: "60%" }]}>
            <MapPin size={20} color="#f59e0b" />
          </View>
          <View style={[styles.mockPin, { top: "70%", left: "25%" }]}>
            <MapPin size={20} color="#16a34a" />
          </View>
          <View style={[styles.currentLocation, { top: "45%", left: "50%" }]}>
            <View style={styles.currentDot} />
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <MapPin size={16} color="#2563eb" />
          <Text style={styles.legendText}>Assigned to you</Text>
        </View>
        <View style={styles.legendItem}>
          <MapPin size={16} color="#f59e0b" />
          <Text style={styles.legendText}>Available</Text>
        </View>
      </View>
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },
  mapPlaceholder: {
    flex: 1,
    margin: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  mapText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
  },
  mapSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  mockMap: {
    width: width - 72,
    height: (width - 72) * 0.6,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    marginTop: 20,
    position: "relative",
    overflow: "hidden",
  },
  mockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    opacity: 0.3,
  },
  gridCell: {
    width: "33.33%",
    height: "33.33%",
    borderWidth: 0.5,
    borderColor: "#94a3b8",
  },
  mockPin: {
    position: "absolute",
  },
  currentLocation: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  currentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    fontSize: 13,
    color: "#64748b",
  },
});
