import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, Modal, StyleSheet, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAllProducts, addProduct, deleteProduct, updateProduct, restockProduct } from '../database/db';

export default function ProductsScreen() {
  const [products, setProducts]     = useState([]);
  const [search, setSearch]         = useState('');
  const [modalVisible, setModal]    = useState(false);
  const [form, setForm]             = useState({
    name: '', barcode: '', price: '', stock: '', category: ''
  });

  const [editModal, setEditModal]   = useState(false);
  const [editForm, setEditForm]     = useState({ id: '', name: '', price: '', category: '' });
  const [restockModal, setRestock]  = useState(false);
  const [restockForm, setRestockForm] = useState({ id: '', name: '', qty: '' });

  const loadProducts = () => {
    const data = getAllProducts();
    setProducts(data);
  };

  useFocusEffect(useCallback(() => { loadProducts(); }, []));

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  );

  const handleAdd = () => {
    const { name, barcode, price, stock, category } = form;
    if (!name || !barcode || !price || !stock) {
      Alert.alert('Missing fields', 'Name, barcode, price and stock are required.');
      return;
    }
    try {
      addProduct(name, barcode, parseFloat(price), parseInt(stock), category);
      setModal(false);
      setForm({ name: '', barcode: '', price: '', stock: '', category: '' });
      loadProducts();
    } catch (e) {
      Alert.alert('Error', 'Barcode already exists.');
    }
  };

    const handleEdit = () => {
    const { id, name, price, category } = editForm;
    if (!name || !price) {
        Alert.alert('Missing fields', 'Name and price are required.');
        return;
    }
    updateProduct(id, name, parseFloat(price), category);
    setEditModal(false);
    loadProducts();
    };

    const handleRestock = () => {
    const { id, qty } = restockForm;
    if (!qty || parseInt(qty) <= 0) {
        Alert.alert('Invalid', 'Enter a valid quantity.');
        return;
    }
    restockProduct(id, parseInt(qty));
    setRestock(false);
    loadProducts();
    };

    const openEdit = (item) => {
    setEditForm({
        id:       item.id,
        name:     item.name,
        price:    item.price.toString(),
        category: item.category || '',
    });
    setEditModal(true);
    };

    const openRestock = (item) => {
    setRestockForm({ id: item.id, name: item.name, qty: '' });
    setRestock(true);
    };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          deleteProduct(id);
          loadProducts();
        }
      },
    ]);
  };

  return (
    <View style={styles.container}>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or barcode..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products yet</Text>
          </View>
        }
        renderItem={({ item }) => (
            <View style={styles.card}>
                <View style={styles.cardLeft}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSub}>Barcode: {item.barcode}</Text>
                {item.category ? <Text style={styles.productSub}>Category: {item.category}</Text> : null}
                <View style={styles.row}>
                    <Text style={styles.price}>₱{parseFloat(item.price).toFixed(2)}</Text>
                    <Text style={[styles.stock, item.stock < 5 && styles.lowStock]}>
                    Stock: {item.stock}
                    </Text>
                </View>
                <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                    <Ionicons name="pencil-outline" size={14} color="#2563EB" />
                    <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.restockBtn} onPress={() => openRestock(item)}>
                    <Ionicons name="add-circle-outline" size={14} color="#16A34A" />
                    <Text style={styles.restockBtnText}>Restock</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
                </View>
            </View>
            )}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Product Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Product</Text>
            <ScrollView>
              {[
                { key: 'name',     label: 'Product Name *',  keyboard: 'default' },
                { key: 'barcode',  label: 'Barcode *',        keyboard: 'default' },
                { key: 'price',    label: 'Price *',          keyboard: 'decimal-pad' },
                { key: 'stock',    label: 'Stock *',          keyboard: 'numeric' },
                { key: 'category', label: 'Category',         keyboard: 'default' },
              ].map(field => (
                <View key={field.key} style={styles.fieldGroup}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType={field.keyboard}
                    value={form[field.key]}
                    onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModal(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleAdd}>
                <Text style={styles.btnSaveText}>Save Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Product Modal */}
<Modal visible={editModal} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Edit Product</Text>
      {[
        { key: 'name',     label: 'Product Name *', keyboard: 'default' },
        { key: 'price',    label: 'Price *',         keyboard: 'decimal-pad' },
        { key: 'category', label: 'Category',        keyboard: 'default' },
      ].map(field => (
        <View key={field.key} style={styles.fieldGroup}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            keyboardType={field.keyboard}
            value={editForm[field.key]}
            onChangeText={v => setEditForm(prev => ({ ...prev, [field.key]: v }))}
          />
        </View>
      ))}
      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.btnCancel} onPress={() => setEditModal(false)}>
          <Text style={styles.btnCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSave} onPress={handleEdit}>
          <Text style={styles.btnSaveText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    {/* Restock Modal */}
    <Modal visible={restockModal} animationType="fade" transparent>
    <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>Restock</Text>
        <Text style={styles.restockProductName}>{restockForm.name}</Text>
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>Quantity to Add *</Text>
            <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 50"
            value={restockForm.qty}
            onChangeText={v => setRestockForm(prev => ({ ...prev, qty: v }))}
            autoFocus
            />
        </View>
        <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setRestock(false)}>
            <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSave, { backgroundColor: '#16A34A' }]} onPress={handleRestock}>
            <Text style={styles.btnSaveText}>Add Stock</Text>
            </TouchableOpacity>
        </View>
        </View>
    </View>
    </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  searchRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                   borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
                   marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput:   { flex: 1, fontSize: 14 },
  card:          { backgroundColor: '#fff', borderRadius: 12, padding: 16,
                   marginBottom: 10, flexDirection: 'row', alignItems: 'center',
                   justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0' },
  cardLeft:      { flex: 1 },
  productName:   { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  productSub:    { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  row:           { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 },
  price:         { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  stock:         { fontSize: 13, color: '#64748B' },
  lowStock:      { color: '#EF4444', fontWeight: '600' },
  empty:         { alignItems: 'center', marginTop: 80 },
  emptyText:     { color: '#ccc', marginTop: 8, fontSize: 15 },
  fab:           { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2563EB',
                   width: 56, height: 56, borderRadius: 28, alignItems: 'center',
                   justifyContent: 'center', elevation: 4 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                   padding: 24, maxHeight: '85%' },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  fieldGroup:    { marginBottom: 14 },
  label:         { fontSize: 13, color: '#64748B', marginBottom: 4 },
  input:         { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
                   padding: 10, fontSize: 14, backgroundColor: '#F8FAFC' },
  modalButtons:  { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnCancel:     { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1,
                   borderColor: '#E2E8F0', alignItems: 'center' },
  btnCancelText: { color: '#64748B', fontWeight: '600' },
  btnSave:       { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#2563EB',
                   alignItems: 'center' },
  btnSaveText:   { color: '#fff', fontWeight: '600' },
  actionBtns:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
 editBtn:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF',
                     paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
 editBtnText:       { fontSize: 12, color: '#2563EB', fontWeight: '600' },
 restockBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4',
                     paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
 restockBtnText:    { fontSize: 12, color: '#16A34A', fontWeight: '600' },
 restockProductName:{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
});