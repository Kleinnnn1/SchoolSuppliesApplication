import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

const sharePDF = async (uri, filename) => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share PDF',
    UTI: 'com.adobe.pdf',
  });
};

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
  await sharePDF(uri, 'receipt.pdf');
};