'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app with Help tab active
    router.replace('/?tab=help');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#070a08',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(82, 183, 136, 0.2)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📘</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
          DigiM Help &amp; Setup Guide
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
          Taking you to the in-app Help Center...
        </p>
        <a
          href="/?tab=help"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: '#2d6a4f',
            color: '#fff',
            textDecoration: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          Open Help Center
        </a>
      </div>
    </div>
  );
}
