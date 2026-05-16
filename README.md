# QuickBill - Premium POS System

QuickBill is a modern, full-stack Point-of-Sale (POS) system built specifically for retail businesses like **Meera Stationary & Electronics**. It provides a beautiful, highly responsive interface for managing sales, inventory, staff, and generating detailed business reports, all powered by an integrated AI assistant.

## ✨ Features

- **Role-Based Access Control (RBAC)**: Secure authentication system with `owner` and `staff` roles. Owners have full administrative control, while staff can only process sales and view basic inventory.
- **Point of Sale (POS)**: A lightning-fast, grid-based checkout interface. Easily add items to the cart, calculate totals, and process orders.
- **Inventory Management**: Full CRUD operations for products. Track SKUs, categories, prices, and stock levels in real-time.
- **Order History & Invoicing**: View past orders and instantly generate perfectly formatted, print-ready PDF invoices.
- **Staff Management**: Owners can add, edit, or remove staff accounts and manage credentials securely.
- **Analytics & Reporting**: View total sales and low-stock alerts. Export detailed Sales and Inventory data directly to Excel (CSV) files.
- **AI Business Assistant**: Integrated with **Google Gemini 2.5 Flash**. The AI is securely connected to your live database, allowing you to ask real-time questions about your stock, request promotional emails, or get general business advice.

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, Lucide Icons, SweetAlert2
- **Backend**: Next.js API Routes (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with secure HTTP-only cookies and bcryptjs password hashing
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`)

## 🚀 Overview

QuickBill is ready-to-use software. It is deployed as a secure, cloud-based platform or a local network application. The system requires no technical installation from the end-user—simply log in through your web browser using your provided credentials to begin managing your store.

## 🖨️ Printing Invoices

The system uses advanced `@media print` CSS rules. When you click **"Print Invoice"** on an order, the application will automatically strip away the dashboard UI, remove background colors, and perfectly format the receipt to fit standard printer margins (1cm).

## 🤖 AI Assistant Guardrails

The QuickBill AI Assistant is strictly programmed for business use. It has been hard-coded to **only** answer questions regarding:
- The store's inventory and stock levels
- Retail strategy, sales, and marketing
- The POS system features
- Mathematical calculations

If asked off-topic questions, it will politely decline to answer, ensuring it remains a focused business tool.

---
*Built with ❤️ for modern retail management.*
