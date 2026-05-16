'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  LogOut,
  ShoppingBag,
  Users,
  Loader2,
  BarChart,
  Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['owner'] },
  { icon: ShoppingCart, label: 'Point of Sale', href: '/pos', roles: ['owner', 'staff'] },
  { icon: Package, label: 'Products', href: '/products', roles: ['owner', 'staff'] },
  { icon: History, label: 'Orders', href: '/orders', roles: ['owner', 'staff'] },
  { icon: BarChart, label: 'Reports', href: '/reports', roles: ['owner'] },
  { icon: Sparkles, label: 'AI Assistant', href: '/ai', roles: ['owner'] },
  { icon: Users, label: 'Staff', href: '/staff', roles: ['owner'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.error) setUser(null);
        else setUser(data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: 'var(--sidebar)',
      color: 'var(--sidebar-text)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      padding: '1.5rem 1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem 2rem' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          backgroundColor: 'var(--primary)', 
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShoppingBag size={20} color="white" />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.5px' }}>QuickBill</h1>
      </div>

      <nav style={{ flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin" color="rgba(255,255,255,0.2)" />
          </div>
        ) : (
          filteredItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: 'white',
                  fontWeight: isActive ? '600' : '400',
                  opacity: isActive ? 1 : 0.7
                }}
                onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'var(--sidebar-active)')}
                onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })
        )}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
        {!loading && user && (
          <div style={{ 
            padding: '0 1rem 1rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Logged in as <br/>
              <span style={{ fontWeight: '600', color: 'white', fontSize: '1rem' }}>{user.username}</span>
              <div style={{ textTransform: 'capitalize', fontSize: '0.75rem', opacity: 0.6 }}>({user.role})</div>
            </div>
            <button 
              onClick={async () => {
                const { value: formValues } = await Swal.fire({
                  title: 'Edit Your Profile',
                  html: `
                    <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                      <div>
                        <label style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; display: block;">Username</label>
                        <input id="swal-profile-username" class="swal2-input" style="margin: 0; width: 100%;" value="${user.username}">
                      </div>
                      <div>
                        <label style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; display: block;">New Password (leave blank to keep current)</label>
                        <input id="swal-profile-password" type="password" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Enter new password">
                      </div>
                    </div>
                  `,
                  focusConfirm: false,
                  showCancelButton: true,
                  confirmButtonColor: '#2563eb',
                  confirmButtonText: 'Save Changes',
                  preConfirm: () => {
                    const newUsername = (document.getElementById('swal-profile-username') as HTMLInputElement).value;
                    const newPassword = (document.getElementById('swal-profile-password') as HTMLInputElement).value;
                    if (!newUsername) {
                      Swal.showValidationMessage('Username is required');
                    }
                    return { username: newUsername, password: newPassword };
                  }
                });

                if (formValues) {
                  try {
                    const res = await fetch('/api/auth/me/update', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formValues)
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      setUser({ ...user, username: formValues.username });
                      Swal.fire('Updated!', 'Your profile has been updated.', 'success');
                    } else {
                      Swal.fire('Error', data.error || 'Failed to update profile', 'error');
                    }
                  } catch (err) {
                    Swal.fire('Error', 'An error occurred while updating', 'error');
                  }
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '0.4rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              title="Edit Profile"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
          </div>
        )}
        <button 
          onClick={async () => {
             try {
               await fetch('/api/auth/logout', { method: 'POST' });
               window.location.href = '/login';
             } catch (err) {
               console.error('Logout failed');
               // Fallback
               document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
               window.location.href = '/login';
             }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            width: '100%',
            color: '#f87171',
            borderRadius: '0.5rem',
            transition: 'all 0.2s',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
