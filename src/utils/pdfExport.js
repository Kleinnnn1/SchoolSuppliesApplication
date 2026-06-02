import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

const sharePDF = async (uri) => {
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share PDF',
    UTI: 'com.adobe.pdf',
  });
};

// ─── Pure-JS CODE128 SVG Generator ────────────────────────────────────────────
// Generates a complete <svg>...</svg> string without needing any external library.

const CODE128_PATTERNS = {
  ' ':  '11011001100', '!': '11001101100', '"': '11001100110',
  '#':  '10010011000', '$': '10010001100', '%': '10001001100',
  '&':  '10011001000', "'": '10011000100', '(':  '10001100100',
  ')':  '11001001000', '*': '11001000100', '+': '11000100100',
  ',':  '10110011100', '-': '10011011100', '.': '10011001110',
  '/':  '10111001100', '0': '10011101100', '1': '11001110010',
  '2':  '11001011100', '3': '11001001110', '4': '11011100100',
  '5':  '11001110100', '6': '11101101110', '7': '11101001100',
  '8':  '11100101100', '9': '11100100110', ':': '11101100100',
  ';':  '11100110100', '<': '11100110010', '=': '11011011000',
  '>':  '11011000110', '?': '11000110110', '@': '10100011000',
  'A':  '10001011000', 'B': '10001000110', 'C': '10110001000',
  'D':  '10001101000', 'E': '10001100010', 'F': '11010001000',
  'G':  '11000101000', 'H': '11000100010', 'I': '10110111000',
  'J':  '10110001110', 'K': '10001101110', 'L': '10111011000',
  'M':  '10111000110', 'N': '10001110110', 'O': '11101110110',
  'P':  '11010001110', 'Q': '11000101110', 'R': '11011101000',
  'S':  '11011100010', 'T': '11011101110', 'U': '11101011000',
  'V':  '11101000110', 'W': '11100010110', 'X': '11101101000',
  'Y':  '11101100010', 'Z': '11100011010', '[': '11101111010',
  '\\': '11001000010', ']': '11110001010', '^': '10100110000',
  '_':  '10100001100', '`': '10010110000', 'a': '10010000110',
  'b':  '10000101100', 'c': '10000100110', 'd': '10110010000',
  'e':  '10110000100', 'f': '10011010000', 'g': '10011000010',
  'h':  '10000110100', 'i': '10000110010', 'j': '11000010010',
  'k':  '11001010000', 'l': '11110111010', 'm': '11000010100',
  'n':  '10001111010', 'o': '10100111100', 'p': '10010111100',
  'q':  '10010011110', 'r': '10111100100', 's': '10011110100',
  't':  '10011110010', 'u': '11110100100', 'v': '11110010100',
  'w':  '11110010010', 'x': '11011011110', 'y': '11011110110',
  'z':  '11110110110', '{': '10101111000', '|': '10100011110',
  '}':  '10001011110',
  START_B: '11010010000',
  STOP:    '1100011101011',
};

// Value→pattern for CODE128B (values 0–95 map to space–DEL then special)
const CODE128B_VALUES = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

function generateCode128SVG(text, { barWidth = 1.5, barHeight = 60, width = 160, height = 80 } = {}) {
  // Build pattern string
  let pattern = CODE128_PATTERNS['START_B'];
  let checksum = 104; // START_B value

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const val = CODE128B_VALUES.indexOf(ch);
    if (val === -1) continue;
    checksum += (i + 1) * val;
    pattern += CODE128_PATTERNS[ch] || '00000000000';
  }

  // Checksum character
  const checksumVal = checksum % 103;
  const checksumChar = CODE128B_VALUES[checksumVal];
  pattern += CODE128_PATTERNS[checksumChar] || '00000000000';
  pattern += CODE128_PATTERNS['STOP'];

  // Calculate total width
  const totalBars = pattern.length;
  const totalWidth = totalBars * barWidth;
  const offsetX = (width - totalWidth) / 2;

  // Build SVG rects
  let rects = '';
  let x = offsetX;
  for (let i = 0; i < pattern.length; i++) {
    const isBar = pattern[i] === '1';
    if (isBar) {
      rects += `<rect x="${x.toFixed(1)}" y="0" width="${barWidth}" height="${barHeight}" fill="#000"/>`;
    }
    x += barWidth;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="white"/>
    ${rects}
    <text x="${width / 2}" y="${height - 4}" text-anchor="middle" font-family="monospace" font-size="9" fill="#333">${text}</text>
  </svg>`;
}
// ──────────────────────────────────────────────────────────────────────────────

const htmlStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 32px; color: #1E293B; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #2563EB; padding-bottom: 16px; }
    .header h1 { font-size: 24px; color: #2563EB; }
    .header p { font-size: 13px; color: #64748B; margin-top: 4px; }
    .summary { display: flex; gap: 12px; margin-bottom: 24px; }
    .summary-card { flex: 1; background: #F8FAFC; border-radius: 8px; padding: 12px;
                    border: 1px solid #E2E8F0; text-align: center; }
    .summary-card .label { font-size: 11px; color: #94A3B8; margin-bottom: 4px; }
    .summary-card .value { font-size: 18px; font-weight: bold; color: #1E293B; }
    .section-title { font-size: 15px; font-weight: bold; color: #1E293B;
                     margin-bottom: 10px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #2563EB; color: #fff; padding: 10px 12px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; }
    tr:nth-child(even) td { background: #F8FAFC; }
    .total-row td { font-weight: bold; background: #EFF6FF; color: #2563EB; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94A3B8; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px;
             background: #DCFCE7; color: #16A34A; font-size: 11px; font-weight: bold; }
  </style>
`;

export const generateReportPDF = async (sales, stats, filter, totals) => {
  const salesRows = sales.map(s => `
    <tr>
      <td>#${s.id}</td>
      <td>${formatDate(s.created_at)}</td>
      <td>${s.item_count} item(s)</td>
      <td>₱${s.total_amount.toFixed(2)}</td>
    </tr>
  `).join('');

  const productRows = stats.filter(p => p.total_qty_sold > 0).map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.barcode}</td>
      <td>${p.total_qty_sold} units</td>
      <td>₱${p.total_revenue.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${htmlStyles}</head>
    <body>
      <div class="header">
        <h1>School Supplies Store</h1>
        <p>Sales Report — ${filter.charAt(0).toUpperCase() + filter.slice(1)}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <div class="label">Revenue</div>
          <div class="value">₱${totals.revenue.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Orders</div>
          <div class="value">${totals.orders}</div>
        </div>
        <div class="summary-card">
          <div class="label">Items Sold</div>
          <div class="value">${totals.items}</div>
        </div>
      </div>

      <div class="section-title">Sales Transactions</div>
      <table>
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Date & Time</th>
            <th>Items</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${salesRows.length ? salesRows : '<tr><td colspan="4" style="text-align:center; color:#94A3B8;">No sales for this period</td></tr>'}
          <tr class="total-row">
            <td colspan="3">Total Revenue</td>
            <td>₱${totals.revenue.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      ${productRows ? `
      <div class="section-title">Top Products</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Barcode</th>
            <th>Units Sold</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>` : ''}

      <div class="footer">
        School Supplies Store — ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await sharePDF(uri, 'sales-report.pdf');
};

export const generateReceiptPDF = async (sale, items) => {
  const itemRows = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">₱${item.price_at_sale.toFixed(2)}</td>
      <td style="text-align:right;">₱${item.subtotal.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${htmlStyles}</head>
    <body>
      <div class="header">
        <h1>School Supplies Store</h1>
        <p>Official Receipt</p>
      </div>

      <table style="margin-bottom: 16px; font-size: 13px;">
        <tr>
          <td style="color:#94A3B8; width:120px;">Receipt No.</td>
          <td><strong>#${sale.id}</strong></td>
        </tr>
        <tr>
          <td style="color:#94A3B8;">Date</td>
          <td>${formatDate(sale.created_at)}</td>
        </tr>
        <tr>
          <td style="color:#94A3B8;">Items</td>
          <td>${sale.item_count} item(s)</td>
        </tr>
      </table>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td style="text-align:right;">₱${sale.total_amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        Thank you for your purchase!<br/>
        School Supplies Store — ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await sharePDF(uri);
};

export const generateBarcodePDF = async (products) => {
  // Generate SVGs in JS before building HTML — no JS execution needed in the PDF renderer
  const barcodeItems = products.map(p => {
    const svg = generateCode128SVG(p.barcode, { barWidth: 1.5, barHeight: 55, width: 160, height: 70 });
    return `
      <div class="barcode-item">
        ${svg}
        <p class="product-name">${p.name}</p>
        <p class="product-price">₱${parseFloat(p.price).toFixed(2)}</p>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 16px; }
        h1 { font-size: 16px; color: #2563EB; margin-bottom: 16px; text-align: center; }
        .grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start; }
        .barcode-item {
          width: 180px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          page-break-inside: avoid;
        }
        .barcode-item svg { display: block; margin: 0 auto; }
        .product-name {
          font-size: 11px;
          font-weight: bold;
          color: #1E293B;
          margin-top: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-price { font-size: 12px; color: #2563EB; font-weight: bold; margin-top: 2px; }
      </style>
    </head>
    <body>
      <h1>Product Barcodes — School Supplies Store</h1>
      <div class="grid">
        ${barcodeItems}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await sharePDF(uri);
};