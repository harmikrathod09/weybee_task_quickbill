'use client';

import { useState, useEffect } from 'react';
import { BarChart, Download, FileSpreadsheet, PackageSearch, Loader2, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ReportsPage() {
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setFetching(true);
    try {
      const [salesRes, invRes] = await Promise.all([
        fetch('/api/reports?type=sales'),
        fetch('/api/reports?type=inventory')
      ]);

      const salesJson = await salesRes.json();
      const invJson = await invRes.json();

      if (salesRes.ok) setSalesData(salesJson.orders || []);
      if (invRes.ok) setInventoryData(invJson.products || []);
    } catch (err) {
      console.error('Failed to fetch reports');
    } finally {
      setFetching(false);
    }
  };

  const exportToCSV = (data: any[], filename: string, type: 'sales' | 'inventory') => {
    if (data.length === 0) {
      Swal.fire('No Data', 'There is no data to export.', 'info');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    if (type === 'sales') {
      csvContent += "Invoice No,Date,Subtotal,Discount,Tax,Total Amount,Items Count,Status\n";
      data.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString();
        const row = `${order.invoiceNumber},${date},${order.subtotal || order.totalAmount},${order.discountAmount || 0},${order.taxAmount || 0},${order.totalAmount},${order.items.length},${order.status}`;
        csvContent += row + "\n";
      });
    } else {
      csvContent += "Product Name,SKU,Price,Stock Level,Category\n";
      data.forEach(product => {
        const name = `"${product.name.replace(/"/g, '""')}"`;
        const row = `${name},${product.sku},${product.price},${product.stock},${product.category}`;
        csvContent += row + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--sidebar)' }}>
          Reports & Analytics
        </h1>
        <p style={{ color: 'var(--secondary)' }}>
          Generate and export your business reports to Excel (CSV).
        </p>
      </header>

      {fetching ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Sales Report Card */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '1rem' }}>
                <Calendar size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Sales Report</h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', margin: 0 }}>All confirmed orders</p>
              </div>
            </div>
            
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--secondary)' }}>Orders:</span>
                <span style={{ fontWeight: '700' }}>{salesData.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--secondary)' }}>Gross Revenue:</span>
                <span style={{ fontWeight: '700' }}>
                  ₹{salesData.reduce((sum: number, o: any) => sum + (o.subtotal || o.totalAmount), 0).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--secondary)' }}>Tax Collected:</span>
                <span style={{ fontWeight: '700', color: '#f59e0b' }}>
                  ₹{salesData.reduce((sum: number, o: any) => sum + (o.taxAmount || 0), 0).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--secondary)' }}>Discounts:</span>
                <span style={{ fontWeight: '700', color: '#ef4444' }}>
                  -₹{salesData.reduce((sum: number, o: any) => sum + (o.discountAmount || 0), 0).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                <span style={{ fontWeight: '600' }}>Net Earnings:</span>
                <span style={{ fontWeight: '800', color: '#10b981', fontSize: '1.1rem' }}>
                  ₹{salesData.reduce((sum: number, o: any) => sum + o.totalAmount, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%' }}
              onClick={() => exportToCSV(salesData, 'Sales_Report', 'sales')}
            >
              <FileSpreadsheet size={20} /> Export to Excel
            </button>
          </div>

          {/* Inventory Report Card */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '1rem' }}>
                <PackageSearch size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Inventory Report</h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', margin: 0 }}>Current stock levels</p>
              </div>
            </div>
            
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--secondary)' }}>Total Products:</span>
                <span style={{ fontWeight: '700' }}>{inventoryData.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--secondary)' }}>Low Stock Items:</span>
                <span style={{ fontWeight: '800', color: '#ef4444' }}>
                  {inventoryData.filter((p: any) => p.stock < 10).length}
                </span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', backgroundColor: '#ef4444' }}
              onClick={() => exportToCSV(inventoryData, 'Inventory_Report', 'inventory')}
            >
              <FileSpreadsheet size={20} /> Export to Excel
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
