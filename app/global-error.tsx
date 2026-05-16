'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        fontFamily: 'sans-serif',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem', color: '#ef4444' }}>
            Something went wrong!
          </h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            A global application error occurred. We have been notified and are working on it.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
