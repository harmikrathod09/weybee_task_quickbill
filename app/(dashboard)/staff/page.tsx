'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Shield, Users, Key, AlertCircle, CheckCircle2, Loader2, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

interface Staff {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function StaffPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/auth/register-staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error('Failed to fetch staff');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/register-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add staff');
      }

      Swal.fire({
        title: 'Staff Added!',
        text: `${username} has been registered as staff.`,
        icon: 'success',
        confirmButtonColor: '#2563eb'
      });

      setSuccess('Staff member added successfully!');
      setUsername('');
      setPassword('');
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
      Swal.fire({
        title: 'Registration Failed',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaff = async (staff: Staff) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Staff Account',
      html: `
        <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
          <div>
            <label style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; display: block;">Username</label>
            <input id="swal-input-username" class="swal2-input" style="margin: 0; width: 100%;" value="${staff.username}">
          </div>
          <div>
            <label style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; display: block;">New Password (leave blank to keep current)</label>
            <input id="swal-input-password" type="password" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Enter new password">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Save Changes',
      preConfirm: () => {
        const newUsername = (document.getElementById('swal-input-username') as HTMLInputElement).value;
        const newPassword = (document.getElementById('swal-input-password') as HTMLInputElement).value;
        if (!newUsername) {
          Swal.showValidationMessage('Username is required');
        }
        return { username: newUsername, password: newPassword };
      }
    });

    if (formValues) {
      try {
        const res = await fetch(`/api/staff/${staff._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues)
        });
        
        const data = await res.json();
        if (res.ok) {
          Swal.fire('Updated!', 'Staff details have been updated.', 'success');
          fetchStaff();
        } else {
          Swal.fire('Error', data.error || 'Failed to update staff', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'An error occurred while updating', 'error');
      }
    }
  };

  const handleDeleteStaff = async (id: string, username: string) => {
    const result = await Swal.fire({
      title: 'Remove Staff Member?',
      text: `Are you sure you want to remove ${username}? They will lose access immediately.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove them!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire('Removed!', `${username} has been removed.`, 'success');
          fetchStaff();
        } else {
          const data = await res.json();
          Swal.fire('Error', data.error || 'Failed to remove staff', 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'An error occurred while removing', 'error');
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--foreground)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={36} className="text-primary" /> Staff Management
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>
          Manage your team and control access levels.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
        {/* Add Staff Form */}
        <section style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '1.5rem', 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
          border: '1px solid var(--border)',
          height: 'fit-content'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={24} /> Add New Staff
          </h2>

          <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <Users size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter staff username"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border)',
                    outline: 'none',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set initial password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 2.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border)',
                    outline: 'none',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} /> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '0.875rem',
                borderRadius: '0.75rem',
                fontWeight: '600',
                fontSize: '1rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Staff Account'}
            </button>
          </form>
        </section>

        {/* Staff List */}
        <section style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '1.5rem', 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
          border: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} /> Staff Members
          </h2>

          {fetching ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : staffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-foreground)' }}>
              <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <p>No staff members found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>Username</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>Joined</th>
                    <th style={{ textAlign: 'right', padding: '1rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff._id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '1.25rem 1rem', fontWeight: '500' }}>{staff.username}</td>
                      <td style={{ padding: '1.25rem 1rem' }}>
                        <span style={{ 
                          backgroundColor: '#eff6ff', 
                          color: '#2563eb', 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {staff.role}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleEditStaff(staff)}
                            style={{ 
                              color: '#2563eb', 
                              padding: '0.5rem', 
                              borderRadius: '0.5rem', 
                              border: 'none', 
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Edit Staff"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteStaff(staff._id, staff.username)}
                            style={{ 
                              color: '#ef4444', 
                              padding: '0.5rem', 
                              borderRadius: '0.5rem', 
                              border: 'none', 
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Remove Staff"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
