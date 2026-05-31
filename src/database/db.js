import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('school_supplies.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      barcode TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_sale REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
};


export const addProduct = (name, barcode, price, stock, category) => {
  return db.runSync(
    `INSERT INTO products (name, barcode, price, stock, category)
     VALUES (?, ?, ?, ?, ?)`,
    [name, barcode, price, stock, category]
  );
};

export const getAllProducts = () => {
  return db.getAllSync(`SELECT * FROM products ORDER BY name ASC`);
};

export const getProductByBarcode = (barcode) => {
  return db.getFirstSync(
    `SELECT * FROM products WHERE barcode = ?`,
    [barcode]
  );
};

export const updateProductStock = (productId, newStock) => {
  return db.runSync(
    `UPDATE products SET stock = ? WHERE id = ?`,
    [newStock, productId]
  );
};

export const deleteProduct = (productId) => {
  return db.runSync(
    `DELETE FROM products WHERE id = ?`,
    [productId]
  );
};


export const createSale = (items) => {
  // items = [{ product_id, quantity, price_at_sale }, ...]
  const total = items.reduce((sum, i) => sum + i.price_at_sale * i.quantity, 0);

  const sale = db.runSync(
    `INSERT INTO sales (total_amount) VALUES (?)`,
    [total]
  );

  const saleId = sale.lastInsertRowId;

  for (const item of items) {
    db.runSync(
      `INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale)
       VALUES (?, ?, ?, ?)`,
      [saleId, item.product_id, item.quantity, item.price_at_sale]
    );

    // deduct stock
    const product = db.getFirstSync(
      `SELECT stock FROM products WHERE id = ?`,
      [item.product_id]
    );
    db.runSync(
      `UPDATE products SET stock = ? WHERE id = ?`,
      [product.stock - item.quantity, item.product_id]
    );
  }

  return saleId;
};

export const getSalesByFilter = (filter) => {
  const filters = {
    today: `date(s.created_at) = date('now')`,
    week:  `s.created_at >= datetime('now', '-7 days')`,
    month: `s.created_at >= datetime('now', '-30 days')`,
    year:  `s.created_at >= datetime('now', '-365 days')`,
  };

  const where = filters[filter] || filters.today;

  return db.getAllSync(`
    SELECT
      s.id,
      s.total_amount,
      s.created_at,
      COUNT(si.id) as item_count
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE ${where}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);
};

export const getProductSalesStats = (filter) => {
  const filters = {
    today: `date(s.created_at) = date('now')`,
    week:  `s.created_at >= datetime('now', '-7 days')`,
    month: `s.created_at >= datetime('now', '-30 days')`,
    year:  `s.created_at >= datetime('now', '-365 days')`,
  };

  const where = filters[filter] || filters.today;

  return db.getAllSync(`
    SELECT
      p.id,
      p.name,
      p.barcode,
      p.price,
      SUM(si.quantity)                  as total_qty_sold,
      SUM(si.quantity * si.price_at_sale) as total_revenue
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.product_id
    LEFT JOIN sales s ON si.sale_id = s.id AND ${where}
    GROUP BY p.id
    ORDER BY total_revenue DESC
  `);
};

export const updateProduct = (id, name, price, category) => {
  return db.runSync(
    `UPDATE products SET name = ?, price = ?, category = ? WHERE id = ?`,
    [name, price, category, id]
  );
};

export const restockProduct = (id, addQty) => {
  return db.runSync(
    `UPDATE products SET stock = stock + ? WHERE id = ?`,
    [addQty, id]
  );
};

export const getCategories = () => {
  return db.getAllSync(
    `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`
  );
};

export const getSaleItems = (saleId) => {
  return db.getAllSync(`
    SELECT
      si.quantity,
      si.price_at_sale,
      si.quantity * si.price_at_sale as subtotal,
      p.name,
      p.barcode
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `, [saleId]);
};

export default db;