'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2,
  Printer,
  Download,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

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

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [taxRate, setTaxRate] = useState(18); // Default 18% GST
  const [discount, setDiscount] = useState(0); // Flat discount amount
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Swal.fire({
            title: 'Out of Stock',
            text: `Only ${product.stock} units available in stock.`,
            icon: 'warning',
            confirmButtonColor: '#2563eb'
          });
          return prev;
        }
        return prev.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.stock) {
          Swal.fire({
            title: 'Stock Limit',
            text: `Only ${item.stock} units available.`,
            icon: 'info',
            confirmButtonColor: '#2563eb'
          });
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const result = await Swal.fire({
      title: 'Confirm Order',
      html: `
        <div style="text-align: left; padding: 0.5rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>Subtotal:</span> <b>₹${subtotal.toFixed(2)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #dc2626;">
            <span>Discount (${discount}%):</span> <b>-₹${discountAmount.toFixed(2)}</b>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>GST (${taxRate}%):</span> <b>+₹${taxAmount.toFixed(2)}</b>
          </div>
          <hr style="margin: 1rem 0; border: none; border-top: 1px solid #eee;" />
          <div style="display: flex; justify-content: space-between; font-size: 1.25rem; color: #2563eb;">
            <span>Total Amount:</span> <b>₹${total.toFixed(2)}</b>
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.75rem; text-align: right; color: #666; font-style: italic;">
            ${numberToWords(total)}
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirm & Generate Invoice'
    });

    if (!result.isConfirmed) return;

    setProcessing(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount: total
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(data);
        setCart([]);
        setDiscount(0);
        // Refresh product stock levels
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        setProducts(prodData);
      } else {
        Swal.fire({
          title: 'Checkout Error',
          text: data.error || 'Checkout failed',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'System Error',
        text: 'An error occurred during checkout',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadInvoice = async () => {
    if (!invoiceRef.current) return;
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
      pdf.save(`Invoice-${orderSuccess.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 4rem)', display: 'flex', gap: '1.5rem' }}>
      {/* Left: Product Selection */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={18} 
              color="var(--secondary)" 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gridAutoRows: 'max-content',
          alignContent: 'start',
          gap: '0.875rem', 
          padding: '0.25rem' 
        }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem' }}>
              <Loader2 className="animate-spin" size={40} color="var(--primary)" />
            </div>
          ) : filteredProducts.map(product => (
            <div 
              key={product._id} 
              className="card" 
              title={product.name}
              style={{ 
                padding: '0.875rem', 
                cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                opacity: product.stock > 0 ? 1 : 0.6,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid var(--border)',
                minHeight: '115px',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
              onClick={() => addToCart(product)}
              onMouseEnter={(e) => product.stock > 0 && (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <h4 style={{ 
                  fontWeight: '700', 
                  marginBottom: '0.2rem',
                  fontSize: '0.9rem',
                  color: 'var(--sidebar)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.3'
                }}>
                  {product.name}
                </h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', margin: 0 }}>SKU: {product.sku}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1rem' }}>₹{product.price}</span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: '600', 
                  padding: '0.2rem 0.4rem', 
                  borderRadius: '1rem', 
                  background: product.stock < 10 ? '#fee2e2' : '#f1f5f9', 
                  color: product.stock < 10 ? '#991b1b' : 'var(--secondary)',
                  whiteSpace: 'nowrap'
                }}>
                  {product.stock} left
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart and Checkout */}
      <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShoppingCart size={24} color="var(--primary)" />
          <h3 style={{ fontWeight: '800' }}>Current Order</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--secondary)', marginTop: '4rem' }}>
              <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>₹{item.price} x {item.quantity}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input)', borderRadius: '0.5rem', padding: '0.25rem' }}>
                      <button onClick={() => updateQuantity(item._id, -1)} style={{ padding: '0.25rem' }}><Minus size={14} /></button>
                      <span style={{ width: '24px', textAlign: 'center', fontSize: '0.875rem', fontWeight: '700' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, 1)} style={{ padding: '0.25rem' }}><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item._id)} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '0.25rem', display: 'block' }}>Tax Rate (GST %)</label>
              <input 
                type="number" 
                value={taxRate} 
                onChange={(e) => setTaxRate(Number(e.target.value))}
                style={{ padding: '0.5rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--secondary)', marginBottom: '0.25rem', display: 'block' }}>Discount (%)</label>
              <input 
                type="number" 
                value={discount} 
                onChange={(e) => setDiscount(Number(e.target.value))}
                style={{ padding: '0.5rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--secondary)', fontSize: '0.875rem' }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
            <span>Discount ({discount}%)</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--secondary)', fontSize: '0.875rem' }}>
            <span>Tax ({taxRate}%)</span>
            <span>+₹{taxAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '800' }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>₹{total.toFixed(2)}</span>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            disabled={cart.length === 0 || processing}
            onClick={handleCheckout}
          >
            {processing ? <Loader2 className="animate-spin" /> : 'Confirm Order (Invoice)'}
          </button>
        </div>
      </div>

      {/* Success Modal / Invoice View */}
      {orderSuccess && (
        <div id="pos-print-modal-wrapper" 
          onClick={() => setOrderSuccess(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem 1rem',
            overflowY: 'auto',
            overscrollBehavior: 'contain'
          }}
        >
          <div 
            id="pos-print-modal-content" 
            className="card animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '600px', padding: '0', marginBottom: '2rem' }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                <CheckCircle2 size={24} />
                <h2 style={{ fontWeight: '800' }}>Order Confirmed!</h2>
              </div>
              <button onClick={() => setOrderSuccess(null)}><X size={24} /></button>
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
                    <p style={{ fontSize: '0.75rem' }}>#{orderSuccess.invoiceNumber}</p>
                    <p style={{ fontSize: '0.75rem' }}>{new Date().toLocaleDateString()}</p>
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
                    {orderSuccess.items.map((item: any, idx: number) => (
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
                      <span>₹{orderSuccess.subtotal?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem', color: '#dc2626' }}>
                      <span>Discount ({(orderSuccess.subtotal > 0 && orderSuccess.discountAmount > 0) ? ((orderSuccess.discountAmount / orderSuccess.subtotal) * 100).toFixed(0) : 0}%):</span>
                      <span>-₹{(orderSuccess.discountAmount || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                      <span>GST:</span>
                      <span>+₹{orderSuccess.taxAmount?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.5rem', borderTop: '2px solid #2563eb', paddingTop: '0.5rem' }}>
                      <span>Total:</span>
                      <span>₹{orderSuccess.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', textAlign: 'right', fontStyle: 'italic', color: '#666' }}>
                      {numberToWords(orderSuccess.totalAmount)}
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
          
          #pos-print-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            background: white !important;
          }
          
          #pos-print-modal-content {
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
