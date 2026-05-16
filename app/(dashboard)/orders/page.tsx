'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { 
  History, 
  Search, 
  XCircle, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';
import Swal from 'sweetalert2';

const numberToWords = (amount: number): string => {
  const sglDigit = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const dblDigit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensPlace = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const handle_tens = (dgt: number, prevDgt: number): string => {
    if (dgt === 0) return prevDgt !== 0 ? sglDigit[prevDgt] : '';
    if (dgt === 1) return dblDigit[prevDgt];
    return tensPlace[dgt] + (prevDgt !== 0 ? ' ' + sglDigit[prevDgt] : '');
  };
  const handle_utlc = (dgt: number, nxtDgt: number, denom: string): string => {
    return (dgt !== 0 || nxtDgt !== 0 ? handle_tens(dgt, nxtDgt) + ' ' + denom + ' ' : '');
  };

  let str = '';
  const num = Math.floor(amount);
  const paise = Math.round((amount - num) * 100);

  if (num === 0) str = 'Zero';
  else {
    const crores = Math.floor(num / 10000000);
    const lakhs = Math.floor((num % 10000000) / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    const hundreds = Math.floor((num % 1000) / 100);
    const tens = Math.floor((num % 100) / 10);
    const units = num % 10;

    str += handle_utlc(Math.floor(crores / 10), crores % 10, 'Crore');
    str += handle_utlc(Math.floor(lakhs / 10), lakhs % 10, 'Lakh');
    str += handle_utlc(Math.floor(thousands / 10), thousands % 10, 'Thousand');
    str += handle_utlc(0, hundreds, 'Hundred');
    str += (num % 100 !== 0 && num > 100 ? 'and ' : '') + handle_tens(tens, units);
  }

  str += ' Rupees';
  if (paise > 0) {
    str += ' and ' + handle_tens(Math.floor(paise / 10), paise % 10) + ' Paise';
  }
  return str + ' Only';
};

interface Order {
  _id: string;
  invoiceNumber: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'confirmed' | 'cancelled';
  items: any[];
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to cancel this order? This will reverse the stock impact.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, cancel it!'
    });

    if (!result.isConfirmed) return;

    setCancelling(id);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: 'Cancelled!',
          text: 'The order has been cancelled successfully.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
        fetchOrders();
      } else {
        Swal.fire({
          title: 'Error',
          text: data.error || 'Cancellation failed',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'An error occurred while cancelling the order.',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setCancelling(null);
    }
  };

  const downloadInvoice = async () => {
    if (!invoiceRef.current || !selectedOrder) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${selectedOrder.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const filteredOrders = orders.filter(o => 
    o.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--sidebar)' }}>Order History</h1>
        <p style={{ color: 'var(--secondary)' }}>Track sales and manage cancellations.</p>
      </header>

      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search 
              size={18} 
              color="var(--secondary)" 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input 
              type="text" 
              placeholder="Search by invoice number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Invoice</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" color="var(--primary)" />
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                <Fragment key={order._id}>
                  <tr>
                    <td>
                      <button 
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)' }}
                      >
                        {expandedOrder === order._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                    <td style={{ fontWeight: '600' }}>{order.invoiceNumber}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.items.length} items</td>
                    <td style={{ fontWeight: '700' }}>₹{order.totalAmount.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${order.status === 'confirmed' ? 'badge-success' : 'badge-danger'}`}>
                        {order.status === 'confirmed' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> Confirmed</span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={12} /> Cancelled</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {order.status === 'confirmed' && (
                          <>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.4rem', color: 'var(--danger)', borderColor: '#fee2e2' }}
                              onClick={() => handleCancel(order._id)}
                              disabled={cancelling === order._id}
                              title="Cancel Order"
                            >
                              {cancelling === order._id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />}
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.4rem', color: 'var(--primary)' }}
                              onClick={() => setSelectedOrder(order)}
                              title="View/Print Bill"
                            >
                              <Printer size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedOrder === order._id && (
                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan={7} style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} style={{ background: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                              <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.name}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                                <span>{item.quantity} x ₹{item.price}</span>
                                <span style={{ fontWeight: '700' }}>₹{(item.quantity * item.price).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Preview Modal */}
      {selectedOrder && (
        <div id="print-modal-wrapper" 
          onClick={() => setSelectedOrder(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem'
          }}
        >
          <div id="print-modal-content" className="card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: '800' }}>Order Invoice</h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div ref={invoiceRef} style={{ background: 'white', padding: '2rem', color: 'black', border: '1px solid #eee' }} id="printable-invoice">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ color: '#2563eb', fontWeight: '800', margin: 0 }}>QUICKBILL</h2>
                    <p style={{ fontSize: '0.75rem' }}>Meera Stationary & Electronics</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '700', margin: 0 }}>INVOICE</p>
                    <p style={{ fontSize: '0.75rem' }}>#{selectedOrder.invoiceNumber}</p>
                    <p style={{ fontSize: '0.75rem' }}>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <table style={{ width: '100%', marginBottom: '2rem' }}>
                  <thead style={{ borderBottom: '2px solid #2563eb' }}>
                    <tr>
                      <th style={{ background: 'none', color: 'black', textAlign: 'left', padding: '0.5rem 0' }}>Item</th>
                      <th style={{ background: 'none', color: 'black', textAlign: 'center', padding: '0.5rem 0' }}>Qty</th>
                      <th style={{ background: 'none', color: 'black', textAlign: 'right', padding: '0.5rem 0' }}>Price</th>
                      <th style={{ background: 'none', color: 'black', textAlign: 'right', padding: '0.5rem 0' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '0.75rem 0' }}>{item.name}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>₹{item.price}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem' }}>
                      <span>Subtotal:</span>
                      <span>₹{(selectedOrder.subtotal || selectedOrder.totalAmount).toFixed(2)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#dc2626' }}>
                        <span>Discount ({((selectedOrder.discountAmount / selectedOrder.subtotal) * 100).toFixed(0)}%):</span>
                        <span>-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.taxAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                        <span>GST:</span>
                        <span>+₹{selectedOrder.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.5rem', borderTop: '2px solid #2563eb', paddingTop: '0.5rem' }}>
                      <span>Total:</span>
                      <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', textAlign: 'right', fontStyle: 'italic', color: '#666' }}>
                      {numberToWords(selectedOrder.totalAmount)}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.75rem', color: '#666' }}>
                  <p>Thank you for your business!</p>
                  <p>Software by QuickBill</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={printInvoice}>
                  <Printer size={18} /> Print
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={downloadInvoice}>
                  <Download size={18} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page { margin: 1cm; }
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          
          #print-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            background: white !important;
          }
          
          #print-modal-content {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          #printable-invoice { 
            position: relative !important;
            width: 100% !important; 
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
