# SchoolSuppliesStore - Mobile POS & Inventory Management App
A modern, cross-platform mobile point-of-sale and inventory management application for school supplies stores — featuring barcode scanning, sales processing, stock tracking, and PDF report generation with a clean, intuitive interface.

## Features
- **Product Management**: Add, edit, and delete products with name, barcode, price, stock quantity, and category
- **Barcode Scanning**: Scan product barcodes via device camera using Expo Camera for fast lookups and sales
- **Point of Sale**: Process sales transactions with a cart-based flow and automatic stock deduction
- **Low Stock Alerts**: Badge indicator on the Products tab warns when items fall below the stock threshold
- **Sales Reports**: View sales summaries filtered by today, this week, this month, or this year
- **PDF Export**: Generate and share printable sales reports and individual receipts using Expo Print and Expo Sharing
- **Charts & Analytics**: Visualize top-selling products and revenue trends with interactive charts
- **Local SQLite Database**: All data stored on-device with `expo-sqlite` — no internet connection required
- **Responsive UI**: Built with React Native Paper and safe-area-aware layouts for Android and iOS

## Tech Stack
- **Framework**: React Native 0.85.3 with Expo SDK 56
- **Language**: JavaScript
- **Navigation**: React Navigation 7 (Bottom Tabs)
- **Database**: Expo SQLite (local on-device storage)
- **Camera / Barcode**: Expo Camera
- **PDF & Sharing**: Expo Print, Expo Sharing
- **Charts**: React Native Gifted Charts
- **UI Components**: React Native Paper 5, React Native Vector Icons, `@expo/vector-icons`
- **Styling**: React Native StyleSheet with React Native Linear Gradient
- **Code Formatting**: Prettier

## Installation

Clone the repository:
```bash
git clone https://github.com/Kleinnnn1/SchoolSuppliesApplication.git
cd SchoolSuppliesApplication
```

Install dependencies:
```bash
npm install
```

> **Note:** This project uses Expo. Make sure you have the [Expo CLI](https://docs.expo.dev/get-started/installation/) and the **Expo Go** app installed on your device, or an Android/iOS emulator set up.

## Development

Start the Expo development server:
```bash
npm start
```

Run on a specific platform:
```bash
# Android
npm run android

# iOS
npm run ios

# Web (limited support)
npm run web
```

Scan the QR code with the **Expo Go** app on your phone, or press `a` / `i` in the terminal to open on an emulator.

## Build for Production

To create a standalone APK or IPA using EAS Build:

```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

Refer to the [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/) for full setup instructions.

## Permissions

The following device permissions are required:

| Permission | Purpose |
|---|---|
| `CAMERA` | Barcode scanning for product lookup |
| `READ_EXTERNAL_STORAGE` | Accessing files for PDF sharing |
| `WRITE_EXTERNAL_STORAGE` | Saving exported PDF reports |

## Project Structure

```
SchoolSuppliesApplication/
├── assets/                  # App icons and static images
├── src/
│   ├── database/
│   │   └── db.js            # SQLite schema, initialization, and query helpers
│   ├── navigation/
│   │   └── AppNavigator.js  # Bottom tab navigator with low-stock badge
│   ├── screens/
│   │   ├── ProductsScreen.js   # Product list, add, edit, delete, barcode scan
│   │   ├── SaleScreen.js       # POS cart and checkout flow
│   │   └── ReportsScreen.js    # Sales reports, charts, receipt viewer
│   └── utils/
│       └── pdfExport.js     # PDF generation logic for reports and receipts
├── App.js                   # Entry point — initializes DB and renders navigator
├── app.json                 # Expo configuration (name, icons, permissions, EAS)
├── package.json
└── index.js
```

## Database Schema

The app uses a local SQLite database (`school_supplies.db`) with three tables:

- **`products`** — id, name, barcode, price, stock, category, created_at
- **`sales`** — id, total_amount, created_at
- **`sale_items`** — id, sale_id, product_id, quantity, price_at_sale

## Author

**Kenneth Jhun N. Balino**

Full Stack Developer

Built with React Native, Expo, and SQLite.
