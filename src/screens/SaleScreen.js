import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, Modal, StyleSheet, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getProductByBarcode, createSale } from '../database/db';

export default function SaleScreen() {
  const [cart, setCart]                 = useState([]);
  const [scannerVisible, setScanner]    = useState(false);
  const [manualBarcode, setManual]      = useState('');
  const [manualVisible, setManualModal] = useState(false);
  const [scanned, setScanned]           = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useFocusEffect(useCallback(() => {
    setCart([]);
  }, []));

  const addToCart = (barcode) => {
    const product = getProductByBarcode(barcode);
    if (!product) {
      Alert.alert('Not Found', 'No product with that barcode.');
      return;
    }
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is out of stock.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Alert.alert('Not enough stock', `Only ${product.stock} available.`);
          return prev;
        }
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        product_id:    product.id,
        name:          product.name,
        price_at_sale: product.price,
        quantity:      1,
        max_stock:     product.stock,
      }];
    });
  };

  const handleScan = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setScanner(false);
    addToCart(data);
    setTimeout(() => setScanned(false), 1000);
  };

  const handleManualAdd = () => {
    if (!manualBarcode.trim()) return;
    addToCart(manualBarcode.trim());
    setManual('');
    setManualModal(false);
  };

  const updateQty = (product_id, delta) => {
    setCart(prev => prev
      .map(i => i.product_id === product_id
        ? { ...i, quantity: Math.min(i.quantity + delta, i.max_stock) }
        : i
      )
      .filter(i => i.quantity > 0)
    );
  };

  const total = cart.reduce((sum, i) => sum + i.price_at_sale * i.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add products before checking out.');
      return;
    }
    Alert.alert(
      'Confirm Sale',
      `Total: ₱${total.toFixed(2)}\nItems: ${cart.length}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => {
            createSale(cart);
            setCart([]);
            Alert.alert('Sale Complete', `₱${total.toFixed(2)} recorded.`);
          }
        },
      ]
    );
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to scan barcodes.');
        return;
      }
    }
    setScanner(true);
  };

  return (
    <View style={styles.container}>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
          <Ionicons name="barcode-outline" size={20} color="#fff" />
          <Text style={styles.scanBtnText}>Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.manualBtn} onPress={() => setManualModal(true)}>
          <Ionicons name="keypad-outline" size={20} color="#2563EB" />
          <Text style={styles.manualBtnText}>Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Cart List */}
      <FlatList
        data={cart}
        keyExtractor={item => item.product_id.toString()}
        contentContainerStyle={{ paddingBottom: 180 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Cart is empty</Text>
            <Text style={styles.emptyHint}>Scan or enter a barcode to add products</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.cartLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₱{item.price_at_sale.toFixed(2)} each</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product_id, -1)}>
                <Ionicons name="remove" size={16} color="#2563EB" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product_id, 1)}>
                <Ionicons name="add" size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>
              ₱{(item.price_at_sale * item.quantity).toFixed(2)}
            </Text>
          </View>
        )}
      />

      {/* Checkout Bar */}
      {cart.length > 0 && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₱{total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

        <Modal visible={scannerVisible} animationType="slide">
        <View style={{ flex: 1 }}>
            <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleScan}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a'] }}
            />
            <TouchableOpacity
            onPress={() => setScanner(false)}
            style={{ position: 'absolute', top: 50, right: 20 }}>
            <Ionicons name="close-circle" size={44} color="#fff" />
            </TouchableOpacity>
            <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'
            }}>
            <View style={{
                width: 260, height: 160, borderWidth: 2,
                borderColor: '#2563EB', borderRadius: 12
            }} />
            <Text style={{ color: '#fff', marginTop: 16, fontSize: 14 }}>
                Point camera at barcode
            </Text>
            </View>
        </View>
        </Modal>

      {/* Manual Barcode Modal */}
      <Modal visible={manualVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter Barcode</Text>
            <TextInput
              style={styles.input}
              placeholder="Type barcode number..."
              value={manualBarcode}
              onChangeText={setManual}
              keyboardType="default"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setManualModal(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleManualAdd}>
                <Text style={styles.btnSaveText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  actionRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  scanBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#2563EB', padding: 14, borderRadius: 12, gap: 8 },
  scanBtnText:    { color: '#fff', fontWeight: '600', fontSize: 15 },
  manualBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, gap: 8,
                    borderWidth: 1, borderColor: '#BFDBFE' },
  manualBtnText:  { color: '#2563EB', fontWeight: '600', fontSize: 15 },
  cartItem:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
                    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  cartLeft:       { flex: 1 },
  itemName:       { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  itemPrice:      { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12 },
  qtyBtn:         { backgroundColor: '#EFF6FF', borderRadius: 6, padding: 4 },
  qtyText:        { fontSize: 16, fontWeight: '600', color: '#1E293B', minWidth: 20, textAlign: 'center' },
  itemTotal:      { fontSize: 15, fontWeight: '700', color: '#2563EB', minWidth: 70, textAlign: 'right' },
  empty:          { alignItems: 'center', marginTop: 80 },
  emptyText:      { color: '#ccc', marginTop: 8, fontSize: 16, fontWeight: '600' },
  emptyHint:      { color: '#ddd', marginTop: 4, fontSize: 13 },
  checkoutBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
                    padding: 20, flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'center', borderTopWidth: 1, borderColor: '#E2E8F0', elevation: 8 },
  totalLabel:     { fontSize: 13, color: '#94A3B8' },
  totalAmount:    { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  checkoutBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB',
                    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, gap: 8 },
  checkoutText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  scannerContainer: { flex: 1 },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  scannerFrame:   { width: 250, height: 180, borderWidth: 2, borderColor: '#2563EB', borderRadius: 12 },
  scannerHint:    { color: '#fff', marginTop: 16, fontSize: 14 },
  closeScannerBtn:{ position: 'absolute', top: 50, right: 20 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center',
                    paddingHorizontal: 24 },
  modalBox:       { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  input:          { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12,
                    fontSize: 14, backgroundColor: '#F8FAFC', marginBottom: 8 },
  modalButtons:   { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel:      { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1,
                    borderColor: '#E2E8F0', alignItems: 'center' },
  btnCancelText:  { color: '#64748B', fontWeight: '600' },
  btnSave:        { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center' },
  btnSaveText:    { color: '#fff', fontWeight: '600' },
});