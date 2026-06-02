import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, Modal, StyleSheet, Alert, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAllProducts, addProduct, deleteProduct, updateProduct, restockProduct, getCategories } from '../database/db';
import { generateBarcode } from '../utils/barcodeGenerator';
import { generateBarcodePDF } from '../utils/pdfExport';

const LOW_STOCK_THRESHOLD = 5;

export default function ProductsScreen() {
  const [products, setProducts]           = useState([]);
  const [search, setSearch]               = useState('');
  const [modalVisible, setModal]          = useState(false);
  const [form, setForm]                   = useState({
    name: '', barcode: '', price: '', stock: '', category: ''
  });
  const [selectedCategory, setCategory]   = useState('All');
  const [categories, setCategories]       = useState([]);
  const [editModal, setEditModal]         = useState(false);
  const [editForm, setEditForm]           = useState({ id: '', name: '', price: '', category: '' });
  const [restockModal, setRestock]        = useState(false);
  const [restockForm, setRestockForm]     = useState({ id: '', name: '', qty: '' });
  const [selectMode, setSelectMode]       = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const loadProducts = () => {
    const data = getAllProducts();
    setProducts(data);
    const cats = getCategories();
    setCategories([{ category: 'All' }, ...cats]);
  };

  useFocusEffect(useCallback(() => { loadProducts(); }, []));

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.barcode.includes(search);
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const openAddModal = () => {
    setForm({
      name:     '',
      barcode:  generateBarcode(),
      price:    '',
      stock:    '',
      category: '',
    });
    setModal(true);
  };

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

  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedItems([]);
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

const handlePrintBarcodes = async () => {
  const toPrint = selectMode && selectedItems.length > 0
    ? products.filter(p => selectedItems.includes(p.id))
    : products;

  if (toPrint.length === 0) {
    Alert.alert('No products', 'Add products first.');
    return;
  }

  try {
    await generateBarcodePDF(toPrint);
  } catch (e) {
    console.log('Barcode PDF error:', e.message);
    Alert.alert('Error', e.message);
  }
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

      {/* Category Filter */}
      {categories.length > 1 && (
        <View style={{ height: 44, marginBottom: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 }}
          >
            {categories.map(c => (
              <TouchableOpacity
                key={c.category}
                style={[styles.catChip, selectedCategory === c.category && styles.catChipActive]}
                onPress={() => setCategory(c.category)}
              >
                <Text style={[styles.catChipText, selectedCategory === c.category && styles.catChipTextActive]}>
                  {c.category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Low Stock Banner */}
      {products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length > 0 && (
        <View style={styles.lowStockBanner}>
          <Ionicons name="warning-outline" size={18} color="#92400E" />
          <Text style={styles.lowStockBannerText}>
            {products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length} product(s) are low on stock
          </Text>
        </View>
      )}

      {/* Print Toolbar */}
      <View style={styles.printToolbar}>
        <TouchableOpacity
          style={[styles.printToolBtn, selectMode && styles.printToolBtnActive]}
          onPress={toggleSelectMode}
        >
          <Ionicons name="checkbox-outline" size={18} color={selectMode ? '#fff' : '#2563EB'} />
          <Text style={[styles.printToolText, selectMode && styles.printToolTextActive]}>
            {selectMode ? `Selected (${selectedItems.length})` : 'Select'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} onPress={handlePrintBarcodes}>
          <Ionicons name="print-outline" size={18} color="#fff" />
          <Text style={styles.printBtnText}>
            {selectMode && selectedItems.length > 0 ? 'Print Selected' : 'Print All'}
          </Text>
        </TouchableOpacity>
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
          <TouchableOpacity
            style={[styles.card, selectMode && selectedItems.includes(item.id) && styles.cardSelected]}
            onPress={() => selectMode && toggleSelectItem(item.id)}
            activeOpacity={selectMode ? 0.7 : 1}
          >
            <View style={styles.cardLeft}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.productName}>{item.name}</Text>
                {selectMode && (
                  <Ionicons
                    name={selectedItems.includes(item.id) ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={selectedItems.includes(item.id) ? '#2563EB' : '#CBD5E1'}
                  />
                )}
              </View>
              <Text style={styles.productSub}>Barcode: {item.barcode}</Text>
              {item.category ? <Text style={styles.productSub}>Category: {item.category}</Text> : null}
              <View style={styles.row}>
                <Text style={styles.price}>₱{parseFloat(item.price).toFixed(2)}</Text>
                <Text style={[styles.stock, item.stock < 5 && styles.lowStock]}>
                  Stock: {item.stock}
                </Text>
              </View>
              {!selectMode && (
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
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Product Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <ScrollView keyboardShouldPersistTaps="handled">
                {[
                  { key: 'name',     label: 'Product Name *', keyboard: 'default' },
                  { key: 'price',    label: 'Price *',         keyboard: 'decimal-pad' },
                  { key: 'stock',    label: 'Stock *',         keyboard: 'numeric' },
                  { key: 'category', label: 'Category',        keyboard: 'default' },
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

                {/* Barcode Field with Regenerate */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Barcode *</Text>
                  <View style={styles.barcodeRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      keyboardType="default"
                      value={form.barcode}
                      onChangeText={v => setForm(prev => ({ ...prev, barcode: v }))}
                    />
                    <TouchableOpacity
                      style={styles.regenBtn}
                      onPress={() => setForm(prev => ({ ...prev, barcode: generateBarcode() }))}
                    >
                      <Ionicons name="refresh-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.barcodeHint}>
                    Auto-generated. Tap refresh to regenerate or edit manually.
                  </Text>
                </View>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Product Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Restock Modal */}
      <Modal visible={restockModal} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
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
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  searchRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
                        marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput:        { flex: 1, fontSize: 14 },
  card:               { backgroundColor: '#fff', borderRadius: 12, padding: 16,
                        marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardLeft:           { flex: 1 },
  cardTitleRow:       { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 2 },
  cardSelected:       { borderColor: '#2563EB', borderWidth: 2, backgroundColor: '#EFF6FF' },
  productName:        { fontSize: 16, fontWeight: '600', color: '#1E293B', flex: 1 },
  productSub:         { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  row:                { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 },
  price:              { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  stock:              { fontSize: 13, color: '#64748B' },
  lowStock:           { color: '#EF4444', fontWeight: '600' },
  empty:              { alignItems: 'center', marginTop: 80 },
  emptyText:          { color: '#ccc', marginTop: 8, fontSize: 15 },
  fab:                { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2563EB',
                        width: 56, height: 56, borderRadius: 28, alignItems: 'center',
                        justifyContent: 'center', elevation: 4 },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:           { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        padding: 24, maxHeight: '85%' },
  modalTitle:         { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  fieldGroup:         { marginBottom: 14 },
  label:              { fontSize: 13, color: '#64748B', marginBottom: 4 },
  input:              { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
                        padding: 10, fontSize: 14, backgroundColor: '#F8FAFC' },
  modalButtons:       { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnCancel:          { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1,
                        borderColor: '#E2E8F0', alignItems: 'center' },
  btnCancelText:      { color: '#64748B', fontWeight: '600' },
  btnSave:            { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#2563EB',
                        alignItems: 'center' },
  btnSaveText:        { color: '#fff', fontWeight: '600' },
  actionBtns:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  editBtn:            { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF',
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  editBtnText:        { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  restockBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4',
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  restockBtnText:     { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  restockProductName: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  lowStockBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8,
                        backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12,
                        marginBottom: 12, borderWidth: 1, borderColor: '#FCD34D' },
  lowStockBannerText: { fontSize: 13, color: '#92400E', fontWeight: '600', flex: 1 },
  catChip:            { paddingHorizontal: 16, height: 34, borderRadius: 8, backgroundColor: '#fff',
                        borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
                        justifyContent: 'center' },
  catChipActive:      { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  catChipText:        { fontSize: 13, color: '#64748B', fontWeight: '500' },
  catChipTextActive:  { color: '#fff', fontWeight: '600' },
  barcodeRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regenBtn:           { backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8,
                        borderWidth: 1, borderColor: '#BFDBFE' },
  barcodeHint:        { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  printToolbar:       { flexDirection: 'row', gap: 10, marginBottom: 12 },
  printToolBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                        borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  printToolBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  printToolText:      { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  printToolTextActive:{ color: '#fff' },
  printBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 6, backgroundColor: '#2563EB', paddingVertical: 8, borderRadius: 8 },
  printBtnText:       { fontSize: 13, color: '#fff', fontWeight: '600' },
});