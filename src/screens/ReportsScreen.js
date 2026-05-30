import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getSalesByFilter, getProductSalesStats } from '../database/db';

const FILTERS = ['today', 'week', 'month', 'year'];

export default function ReportsScreen() {
  const [filter, setFilter]   = useState('today');
  const [sales, setSales]     = useState([]);
  const [stats, setStats]     = useState([]);
  const [tab, setTab]         = useState('summary');

  const loadData = () => {
    setSales(getSalesByFilter(filter));
    setStats(getProductSalesStats(filter));
  };

  useFocusEffect(useCallback(() => { loadData(); }, [filter]));

  const totalRevenue  = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalOrders   = sales.length;
  const totalItems    = sales.reduce((sum, s) => sum + s.item_count, 0);

  return (
    <View style={styles.container}>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.cardRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Revenue</Text>
          <Text style={styles.metricValue}>₱{totalRevenue.toFixed(2)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Orders</Text>
          <Text style={styles.metricValue}>{totalOrders}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Items Sold</Text>
          <Text style={styles.metricValue}>{totalItems}</Text>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'summary' && styles.toggleActive]}
          onPress={() => setTab('summary')}
        >
          <Ionicons name="receipt-outline" size={16}
            color={tab === 'summary' ? '#2563EB' : '#94A3B8'} />
          <Text style={[styles.toggleText, tab === 'summary' && styles.toggleTextActive]}>
            Sales
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'products' && styles.toggleActive]}
          onPress={() => setTab('products')}
        >
          <Ionicons name="cube-outline" size={16}
            color={tab === 'products' ? '#2563EB' : '#94A3B8'} />
          <Text style={[styles.toggleText, tab === 'products' && styles.toggleTextActive]}>
            Products
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sales List */}
      {tab === 'summary' && (
        <FlatList
          data={sales}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No sales for this period</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.saleCard}>
              <View style={styles.saleLeft}>
                <Text style={styles.saleId}>Sale #{item.id}</Text>
                <Text style={styles.saleDate}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
                <Text style={styles.saleItems}>{item.item_count} item(s)</Text>
              </View>
              <Text style={styles.saleAmount}>₱{item.total_amount.toFixed(2)}</Text>
            </View>
          )}
        />
      )}

      {/* Product Stats List */}
      {tab === 'products' && (
        <FlatList
          data={stats.filter(p => p.total_qty_sold > 0)}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No product sales for this period</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.productCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSub}>Barcode: {item.barcode}</Text>
                <Text style={styles.productSub}>
                  {item.total_qty_sold} units sold
                </Text>
              </View>
              <Text style={styles.productRevenue}>
                ₱{item.total_revenue.toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  filterRow:          { flexDirection: 'row', backgroundColor: '#F1F5F9',
                        borderRadius: 10, padding: 4, marginBottom: 16 },
  filterBtn:          { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterActive:       { backgroundColor: '#fff', elevation: 2 },
  filterText:         { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  filterTextActive:   { color: '#2563EB', fontWeight: '700' },
  cardRow:            { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard:         { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12,
                        alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  metricLabel:        { fontSize: 11, color: '#94A3B8', marginBottom: 4, fontWeight: '500' },
  metricValue:        { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  toggleRow:          { flexDirection: 'row', gap: 10, marginBottom: 14 },
  toggleBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'center', gap: 6, paddingVertical: 10,
                        borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
                        backgroundColor: '#fff' },
  toggleActive:       { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  toggleText:         { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  toggleTextActive:   { color: '#2563EB', fontWeight: '600' },
  saleCard:           { backgroundColor: '#fff', borderRadius: 12, padding: 14,
                        marginBottom: 10, flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0' },
  saleLeft:           { flex: 1 },
  saleId:             { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  saleDate:           { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  saleItems:          { fontSize: 12, color: '#64748B', marginTop: 2 },
  saleAmount:         { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  productCard:        { backgroundColor: '#fff', borderRadius: 12, padding: 14,
                        marginBottom: 10, flexDirection: 'row', alignItems: 'center',
                        borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  rankBadge:          { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF',
                        alignItems: 'center', justifyContent: 'center' },
  rankText:           { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  productInfo:        { flex: 1 },
  productName:        { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  productSub:         { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  productRevenue:     { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  empty:              { alignItems: 'center', marginTop: 60 },
  emptyText:          { color: '#ccc', marginTop: 8, fontSize: 15 },
});