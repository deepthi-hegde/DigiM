"use client";

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "436151523456-testclientid.apps.googleusercontent.com";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
    showNotification?: (message: string, type: 'success' | 'error') => void;
  }
}

const notifySuccess = (message: string) => {
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification(message, 'success');
  } else {
    console.log("Success:", message);
  }
};

const notifyError = (message: string) => {
  if (typeof window !== 'undefined' && window.showNotification) {
    window.showNotification(message, 'error');
  } else {
    console.error("Error:", message);
  }
};

function Stepper({ currentStep }: { currentStep: number }) {
  const steps = ["Account", "Profile", "Platforms", "Campaign"];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '8px' }} className="fade-in-up">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              style={{
                width: '32px', height: '32px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'var(--primary-color)' : isCompleted ? 'var(--secondary-color)' : 'white',
                border: (!isActive && !isCompleted) ? '2px solid #e2e8f0' : 'none',
                color: (isActive || isCompleted) ? 'white' : '#94a3b8',
                fontWeight: 600, fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 0 4px var(--primary-glow)' : 'none'
              }}
            >
              {isCompleted ? '✓' : stepNum}
            </div>
            <span style={{ 
              marginLeft: '8px', fontSize: '14px', fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-color)' : '#94a3b8'
            }}>
              {label}
            </span>
            {index < steps.length - 1 && (
              <div style={{ width: '40px', height: '2px', background: isCompleted ? 'var(--secondary-color)' : '#e2e8f0', margin: '0 12px', transition: 'all 0.3s ease' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Login({ onNext }: { onNext: () => void }) {
  return (
    <div className="fade-in-up glass-panel" style={{ padding: '48px', textAlign: 'center', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          MarketFlow AI
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: '16px' }}>Grow your local business on autopilot.</p>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Welcome Back</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
        <input className="input-field" placeholder="Email Address" type="email" />
        <input className="input-field" placeholder="Password" type="password" />
        <button className="btn-primary" onClick={onNext} style={{ marginTop: '8px' }}>Sign In manually</button>
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>Or continue seamlessly with</p>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
           <GoogleLogin
              onSuccess={async credentialResponse => {
                console.log("Login Success:", credentialResponse);
                try {
                  const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${credentialResponse.credential}`
                    }
                  });
                  if (res.ok) {
                    const data = await res.json();
                    console.log("Backend registered tenant successfully!", data);
                    // Move to the next step
                    onNext();
                  } else {
                    const errText = await res.text();
                    console.error("Backend auth failed:", errText);
                    notifyError("Failed to authenticate with backend: " + errText);
                  }
                } catch (err) {
                  console.error("Network error connecting to backend", err);
                  // For testing UI without backend running, we can still proceed
                  onNext();
                }
              }}
              onError={() => {
                console.log('Login Failed. Check your Client ID configuration.');
              }}
              shape="pill"
              size="large"
              width="300"
            />
            {/* Demo bypass button for testing on live environments without a valid Google Client ID */}
            <button 
              onClick={onNext} 
              style={{ 
                background: 'transparent', 
                border: '1px dashed #cbd5e1', 
                color: '#64748b', 
                padding: '8px 16px', 
                borderRadius: '20px', 
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Demo Mode (Bypass Google SSO) 
            </button>
        </div>
      </div>
    </div>
  );
}

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", 
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", 
  "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", 
  "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", 
  "Howrah", "Ranchi", "Gwalior", "Jabalpur", "Coimbatore", "Vijayawada", "Jodhpur", "Madurai", "Raipur", 
  "Kota", "Chandigarh", "Guwahati", "Solapur", "Hubli-Dharwad", "Mysore", "Tiruchirappalli", "Bareilly", 
  "Aligarh", "Tiruppur", "Gurgaon", "Moradabad", "Jalandhar", "Bhubaneswar", "Salem", "Warangal", "Guntur",
  "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack",
  "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela", "Nanded",
  "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar",
  "Jammu", "Sangli-Miraj & Kupwad", "Mangalore", "Erode", "Belgaum", "Ambattur", "Tirunelveli", "Malegaon",
  "Gaya", "Jalgaon", "Udaipur", "Maheshtala", "Shimoga", "Shivamogga", "Davanagere", "Bellary", "Bijapur",
  "Tumkur", "Raichur", "Bidar", "Hospet", "Gadag", "Hassan", "Udupi", "Bhadravati", "Chitradurga", "Kolar",
  "Mandya", "Chikmagalur", "Gangavati", "Bagalkot", "Ranebennur", "Kochi", "Kozhikode", "Thrissur", "Malappuram",
  "Kannur", "Kollam", "Palakkad", "Kottayam", "Alappuzha", "Manipal", "Mangaluru", "Hubballi", "Mysuru",
  "Trivandrum", "Thiruvananthapuram", "Pondicherry", "Puducherry", "Madikeri", "Gokarna", "Karwar", "Bhatkal"
];

function Onboarding({ onBack, onNext, isSettings = false }: { onBack?: () => void, onNext?: () => void, isSettings?: boolean }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Business profile state
  const [businessName, setBusinessName] = useState("MarketFlow Silks");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [industry, setIndustry] = useState("Clothing & Apparel");
  const [category, setCategory] = useState("Textile Readymade");

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    }
  };

  useEffect(() => {
    fetchAssets();
    // Load saved business profile
    const saved = localStorage.getItem('businessProfile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.industry) setIndustry(parsed.industry);
        if (parsed.category) setCategory(parsed.category);
      } catch (e) {
        console.error("Failed to parse business profile", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('businessProfile', JSON.stringify({
      businessName,
      phoneNumber,
      industry,
      category
    }));
    notifySuccess("Business profile saved successfully!");
    if (onNext) onNext();
  };

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          notifyError(`Upload failed for ${file.name}`);
        }
      } catch (error) {
        console.error("Upload error", error);
        notifyError(`Error uploading ${file.name}`);
      }
    }
    await fetchAssets();
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Business Profile Setup</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
        Tell us about your business. The AI will use this to generate targeted copy.
      </p>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>1. Business Details</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Business Name *</span>
            <input className="input-field" placeholder="e.g., MarketFlow Silks" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phone Number (Optional)</span>
            <input className="input-field" placeholder="+91 98765 43210" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>2. Industry Context</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Industry Line</span>
            <select className="input-field" style={{ cursor: 'pointer' }} value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option>Clothing & Apparel</option>
              <option>FMCG</option>
              <option>Automobile</option>
            </select>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Category</span>
            <select className="input-field" style={{ cursor: 'pointer' }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Textile Readymade</option>
              <option>Raw Fabric</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>3. Media Library</label>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          accept="image/*,video/*" 
        />
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{ 
            border: `2px dashed ${dragActive ? 'var(--primary-color)' : '#cbd5e1'}`, 
            borderRadius: '16px', 
            padding: '32px', 
            textAlign: 'center', 
            background: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.5)', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: dragActive ? 'scale(1.01)' : 'scale(1)'
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
          <p style={{ fontWeight: 500, color: 'var(--text-color)', marginBottom: '4px' }}>
            {isUploading ? 'Uploading assets...' : 'Upload your products & assets'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>
            Drag and drop images or videos here, or click to browse.
          </p>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: '8px 16px', fontSize: '14px' }}
            disabled={isUploading}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </button>
        </div>

        {/* Display Uploaded Previews if any exist */}
        {assets.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Uploaded Assets ({assets.length})
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
              {assets.map((asset, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  {asset.type === 'video' ? (
                    <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <img src={asset.url} alt={asset.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isSettings ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          {onBack && <button className="btn-secondary" onClick={onBack}>← Back</button>}
          {onNext && <button className="btn-primary" onClick={handleSave}>Continue to Platforms →</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <button className="btn-primary" onClick={handleSave}>Save Profile</button>
        </div>
      )}
    </div>
  );
}

export function Platforms({ onBack, onNext, isSettings = false }: { onBack?: () => void, onNext?: () => void, isSettings?: boolean }) {
  const [isFbConnected, setIsFbConnected] = useState(false);
  const [fbPageName, setFbPageName] = useState("");
  const [isIgConnected, setIsIgConnected] = useState(false);
  const [isConnectingFb, setIsConnectingFb] = useState(false);
  const [isConnectingIg, setIsConnectingIg] = useState(false);

  // New state for Page Selection
  const [fbPages, setFbPages] = useState<any[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState("");

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    console.log("Next.js injected App ID:", appId);
    
    if (appId) {
      // Setup the initialization callback
      (window as any).fbAsyncInit = function() {
        console.log("FB SDK executing fbAsyncInit");
        (window as any).FB.init({
          appId      : appId,
          cookie     : true,
          xfbml      : true,
          version    : 'v19.0'
        });
      };
      
      // In case the script loaded BEFORE this component mounted
      if ((window as any).FB && !(window as any).FB._initialized) {
         console.log("FB already loaded, calling init manually");
         (window as any).FB.init({
          appId      : appId,
          cookie     : true,
          xfbml      : true,
          version    : 'v19.0'
        });
      }
    } else {
      console.warn("Facebook SDK Initialization Skipped: NEXT_PUBLIC_META_APP_ID is missing from .env.local");
      // Define a dummy fbAsyncInit so the FB script doesn't crash when it runs
      (window as any).fbAsyncInit = function() {}; 
    }

    // Load SDK asynchronously
    (function (d, s, id) {
      let js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      if (fjs && fjs.parentNode) fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/meta/status?tenant_id=1');
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setIsFbConnected(true);
            setFbPageName(data.page_name);
          }
        }
      } catch (e) {
        console.error("Failed to check meta status", e);
      }
    };
    checkConnection();
  }, []);

  const connectFacebook = () => {
    if (!window.FB) {
      notifyError("Facebook SDK is still loading. Please try again in a moment.");
      return;
    }

    if (!process.env.NEXT_PUBLIC_META_APP_ID) {
      notifyError("Configuration Error: Missing Facebook App ID. If you are in production, ensure this was passed as a build argument to Docker.");
      return;
    }

    setIsConnectingFb(true);

    const loginOptions: any = {
      scope: "public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
      auth_type: 'rerequest'
    };
    
    if (process.env.NEXT_PUBLIC_META_CONFIG_ID) {
      loginOptions.config_id = process.env.NEXT_PUBLIC_META_CONFIG_ID;
    }

    try {
      window.FB.login(
        (response: any) => {
          const handleLoginResponse = async (response: any) => {
            if (response.authResponse) {
              console.log("OAuth Success! Access Token:", response.authResponse.accessToken);
              try {
                const pagesRes = await fetch(`/api/meta/pages?user_access_token=${response.authResponse.accessToken}`);
                if (!pagesRes.ok) throw new Error("Failed to fetch pages");
                
                const pagesData = await pagesRes.json();
                
                if (pagesData.data && pagesData.data.length > 0) {
                  setFbPages(pagesData.data);
                  setSelectedPageId(pagesData.data[0].id);
                  setShowPageSelector(true);
                } else {
                  notifyError("No Facebook Pages found. Please create a Facebook Page first.");
                }
              } catch (error) {
                console.error("Error fetching pages:", error);
                notifyError("Failed to retrieve Facebook Pages.");
              } finally {
                setIsConnectingFb(false);
              }
            } else {
              console.log("User cancelled login or did not fully authorize.");
              setIsConnectingFb(false);
            }
          };

          handleLoginResponse(response);
        },
        loginOptions
      );
    } catch (e: any) {
      console.error("Facebook login error:", e);
      notifyError("Error initializing Facebook login popup: " + (e?.message || e));
      setIsConnectingFb(false);
    }
  };

  const handleConfirmPage = async () => {
    const selectedPage = fbPages.find(p => p.id === selectedPageId);
    if (!selectedPage) return;

    try {
      // Send selected page and its specific page access token to the backend
      const connectRes = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: 1, 
          page_id: selectedPage.id,
          page_name: selectedPage.name,
          access_token: selectedPage.access_token
        })
      });

      if (connectRes.ok) {
        setIsFbConnected(true);
        setFbPageName(selectedPage.name);
        setShowPageSelector(false);
      } else {
        notifyError("Failed to connect page in backend");
      }
    } catch (error) {
      console.error("Error saving page:", error);
      notifyError("Error saving page connection");
    }
  };

  const connectInstagram = async () => {
    setIsConnectingIg(true);
    // Simulate fetching Instagram accounts connected to the FB page
    setTimeout(() => {
      setIsIgConnected(true);
      setIsConnectingIg(false);
    }, 1000);
  };

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Connect Platforms</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>Link your social accounts to publish AI campaigns directly.</p>
      
      {showPageSelector && (
        <div style={{ marginBottom: '40px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Select Facebook Page</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '16px', fontSize: '14px' }}>Choose which Facebook Page you want to connect to MarketFlow.</p>
          <select 
            className="input-field" 
            value={selectedPageId} 
            onChange={(e) => setSelectedPageId(e.target.value)}
            style={{ marginBottom: '16px' }}
          >
            {fbPages.map(page => (
              <option key={page.id} value={page.id}>{page.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={handleConfirmPage}>Confirm & Connect</button>
            <button className="btn-secondary" onClick={() => setShowPageSelector(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        {/* Facebook Page Connection */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '24px', 
          borderRadius: '16px',
          transition: 'all 0.3s',
          ...(isFbConnected 
            ? { background: 'rgba(16, 185, 129, 0.05)', border: '2px solid #10b981' }
            : { background: 'white', border: '1px solid #e2e8f0' })
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: '#1877F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>
              f
            </div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '16px', color: isFbConnected ? '#065f46' : 'var(--text-color)' }}>
                Facebook Page
              </h4>
              <p style={{ fontSize: '13px', color: isFbConnected ? '#059669' : 'var(--text-light)' }}>
                {isFbConnected ? `Connected as ${fbPageName}` : 'Ready to connect'}
              </p>
            </div>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => {
              setIsFbConnected(false); // Reset to allow re-selection
              connectFacebook();
            }}
            disabled={isConnectingFb}
            style={isFbConnected ? { padding: '10px 20px', fontSize: '14px', color: '#059669', borderColor: '#34d399', background: '#ecfdf5' } : { padding: '10px 20px', fontSize: '14px' }}
          >
            {isConnectingFb ? 'Connecting...' : (isFbConnected ? '✓ Change Page' : 'Connect')}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: isIgConnected ? 'rgba(16, 185, 129, 0.05)' : 'white', border: isIgConnected ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: '16px', transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>in</div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '16px', color: isIgConnected ? '#065f46' : 'var(--text-color)' }}>Instagram Business</h4>
              <p style={{ fontSize: '13px', color: isIgConnected ? '#059669' : 'var(--text-light)' }}>
                {isIgConnected ? 'Connected via Facebook' : (isFbConnected ? 'Ready to connect' : 'Connect via Facebook first')}
              </p>
            </div>
          </div>
          <button 
            className="btn-secondary" 
            style={{ 
              padding: '10px 20px', fontSize: '14px', 
              opacity: (isFbConnected || isIgConnected) ? 1 : 0.5,
              background: isIgConnected ? '#ecfdf5' : 'white',
              color: isIgConnected ? '#059669' : 'var(--text-color)',
              borderColor: isIgConnected ? '#34d399' : '#e2e8f0',
              cursor: (isFbConnected || isIgConnected) ? 'pointer' : 'not-allowed'
            }} 
            disabled={!isFbConnected || isIgConnected || isConnectingIg}
            onClick={connectInstagram}
          >
            {isConnectingIg ? 'Connecting...' : (isIgConnected ? '✓ Connected' : 'Connect')}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '12px' }}>
          💡 Meta Integration Guide (Things to Know)
        </h4>
        <div style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <strong>1. Standalone Accounts:</strong> Meta does not support direct posting to standalone Instagram-only accounts. All API-based publishing must be linked to a Facebook Page.
          </div>
          <div>
            <strong>2. Requirement Checklist:</strong> To post to Instagram, ensure:
            <ul style={{ margin: '4px 0 0 16px', paddingLeft: '10px', listStyleType: 'disc' }}>
              <li>Your Instagram account is a <strong>Business or Creator</strong> profile (Personal accounts are not supported by Meta API).</li>
              <li>The Instagram profile is linked to the <strong>Facebook Page</strong> connected above.</li>
            </ul>
          </div>
          <div>
            <strong>3. Facebook-Only Posting:</strong> If you only have a Facebook Page (and no Instagram Business account), you can still publish campaigns successfully to Facebook alone.
          </div>
        </div>
      </div>

      {!isSettings && (
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          {onBack && <button className="btn-secondary" onClick={onBack}>← Back</button>}
          {onNext && <button className="btn-primary" onClick={onNext}>{(isFbConnected || isIgConnected) ? 'Continue →' : 'Skip & Continue →'}</button>}
        </div>
      )}
    </div>
  );
}

export function CampaignDashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [aiManaged, setAiManaged] = useState(true);
  
  const [freq, setFreq] = useState('3 times a week');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Product Showcase');
  const [gender, setGender] = useState('All');
  const [generatedText, setGeneratedText] = useState('');
  const [visualSuggestion, setVisualSuggestion] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [isDraggingOverAssetZone, setIsDraggingOverAssetZone] = useState(false);

  const fetchLibraryAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setLibraryAssets(data);
      }
    } catch (error) {
      console.error("Failed to fetch library assets", error);
    }
  };

  useEffect(() => {
    fetchLibraryAssets();
  }, []);

  useEffect(() => {
    if (showAssetPicker) {
      fetchLibraryAssets();
    }
  }, [showAssetPicker]);

  const dashboardFileInputRef = useRef<HTMLInputElement>(null);

  const handleDashboardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedAssetUrl(data.url);
        fetchLibraryAssets();
      }
    } catch (error) {
      console.error("Upload error", error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      notifyError("Please enter a campaign goal/prompt");
      return;
    }
    setIsGenerating(true);
    setGenerated(false);

    let bizName = "MarketFlow Silks";
    let phone = "";
    let ind = "Clothing & Apparel";
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('businessProfile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.businessName) bizName = parsed.businessName;
          if (parsed.phoneNumber) phone = parsed.phoneNumber;
          if (parsed.industry) ind = parsed.industry;
        } catch(e) {}
      }
    }

    try {
      const response = await fetch('/api/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          minAge,
          maxAge,
          gender,
          freq,
          category,
          businessName: bizName,
          phoneNumber: phone,
          industry: ind
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setGeneratedText(data.generated_text);
        setVisualSuggestion(data.visual_suggestion);
        setShowPromptEditor(false);  // collapse editor on fresh generation
        setGenerated(true);
      } else {
        notifyError("Generation failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to generate", error);
      notifyError("Error generating campaign content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAiImage = async () => {
    if (!visualSuggestion) return;
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/campaign/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: visualSuggestion })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSelectedAssetUrl(data.url);
      } else {
        notifyError("Image generation failed");
      }
    } catch (error) {
      console.error("Image gen error", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedAssetUrl) return;
    try {
      const response = await fetch(selectedAssetUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = selectedAssetUrl.endsWith('.mp4') ? '.mp4' : '.jpg';
      link.download = `campaign_asset_${Date.now()}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file", error);
      window.open(selectedAssetUrl, '_blank');
    }
  };

  const [metaStatus, setMetaStatus] = useState({ connected: false, page_name: '', has_instagram: false });
  const [publishToIg, setPublishToIg] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/meta/status');
        const data = await res.json();
        setMetaStatus(data);
      } catch (err) {
        console.error("Failed to fetch meta status", err);
      }
    };
    fetchStatus();
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch('/api/campaign/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: generatedText, 
          image_url: selectedAssetUrl || null,
          publish_to_instagram: publishToIg,
          tenant_id: 1
        })
      });
      const data = await response.json();
      if (response.ok) {
        notifySuccess("Published successfully! " + (data.message || ""));
      } else {
        const errorMsg = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || "Unknown error");
        notifyError("Failed to publish: " + errorMsg);
      }
    } catch (error) {
      console.error("Failed to publish", error);
      notifyError("Error publishing campaign");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Campaign Setup</h2>
          <p style={{ color: 'var(--text-light)' }}>Create and publish your next promotion</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Left Column: Controls */}
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Campaign Goal & Prompt</label>
            <textarea className="input-field" placeholder="e.g., Promote our new summer silk collection..." rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}></textarea>
            
            {/* Quick Templates */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', width: '100%', fontWeight: 500 }}>
                Or select a preset campaign prompt template:
              </span>
              {[
                { label: "🌅 Summer Sale", text: "Announce our major summer clearance sale with up to 30% off all designer wear this weekend." },
                { label: "🆕 New Collection", text: "Introduce our premium, hand-woven luxury line featuring new designs and premium breathable linen." },
                { label: "⭐ Customer Spotlight", text: "Share a heartwarming testimonial from a loyal customer talking about comfort, durability, and style." },
                { label: "🎁 Weekend Promo", text: "Promote a special limited-time buy-one-get-one-free offer on all casual outfits for this Saturday and Sunday." }
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(template.text)}
                  style={{
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.color = 'var(--primary-color)';
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.02)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Visual Asset</label>
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOverAssetZone(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOverAssetZone(false);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOverAssetZone(false);
                
                const draggedUrl = e.dataTransfer.getData('text/plain');
                if (draggedUrl && draggedUrl.startsWith('/api/assets/')) {
                  setSelectedAssetUrl(draggedUrl);
                  notifySuccess("Asset selected!");
                  return;
                }
                
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const file = e.dataTransfer.files[0];
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const response = await fetch('/api/assets/upload', {
                      method: 'POST',
                      body: formData,
                    });
                    if (response.ok) {
                      const data = await response.json();
                      setSelectedAssetUrl(data.url);
                      fetchLibraryAssets();
                      notifySuccess("File uploaded and selected!");
                    } else {
                      notifyError("Upload failed");
                    }
                  } catch (error) {
                    console.error("Upload error", error);
                    notifyError("Error uploading file");
                  }
                }
              }}
              style={{ 
                padding: '16px', 
                border: isDraggingOverAssetZone ? '2px dashed var(--primary-color)' : '1px dashed #cbd5e1', 
                borderRadius: '12px', 
                background: isDraggingOverAssetZone ? 'rgba(99, 102, 241, 0.05)' : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
                transform: isDraggingOverAssetZone ? 'scale(1.01)' : 'scale(1)',
                minHeight: '80px',
                justifyContent: 'center'
              }}
            >
              {selectedAssetUrl ? (
                <>
                  <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
                    {selectedAssetUrl.endsWith('.mp4') ? (
                      <video src={selectedAssetUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={selectedAssetUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 600 }}>Asset Selected</div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <button 
                        onClick={handleDownload}
                        style={{ fontSize: '12px', color: 'var(--primary-color)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Download
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowAssetPicker(true)}
                        style={{ fontSize: '12px', color: 'var(--primary-color)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Change
                      </button>
                      <button 
                        onClick={() => setSelectedAssetUrl(null)}
                        style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', padding: '8px 0' }}>
                  <div 
                    onClick={() => dashboardFileInputRef.current?.click()}
                    style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-light)', fontWeight: 500 }}
                  >
                    📸 Upload Image or Video
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', userSelect: 'none' }}>or</div>
                  <button
                    type="button"
                    onClick={() => setShowAssetPicker(true)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    📁 Select from Media Library
                  </button>
                </div>
              )}
            </div>
            <input type="file" ref={dashboardFileInputRef} onChange={handleDashboardFileUpload} style={{ display: 'none' }} accept="image/*,video/*" />
            
            {/* Quick Assets Tray */}
            {libraryAssets.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Drag and drop existing assets here, or click to select:
                </span>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin' }}>
                  {libraryAssets.map((asset) => (
                    <div 
                      key={asset.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', asset.url);
                      }}
                      onClick={() => setSelectedAssetUrl(asset.url)}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: selectedAssetUrl === asset.url ? '2.5px solid var(--primary-color)' : '1px solid #e2e8f0', 
                        cursor: 'grab', 
                        flexShrink: 0,
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      title="Drag to selection box above or click to select"
                    >
                      {asset.name.toLowerCase().endsWith('.mp4') ? (
                        <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      ) : (
                        <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={aiManaged} onChange={(e) => setAiManaged(e.target.checked)} /> 
              Fully AI-Managed Posting
            </label>
          </div>

          {aiManaged && (
            <div className="fade-in-up" style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Frequency</span>
                  <select className="input-field" value={freq} onChange={(e) => setFreq(e.target.value)}>
                    <option>3 times a week</option>
                    <option>Everyday</option>
                    <option>Once a week</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Category</span>
                  <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Product Showcase</option>
                    <option>Behind the Scenes</option>
                    <option>Promotions</option>
                    <option>Knowledge Info</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Target Audience</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                 <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Gender</span>
                 <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
                   <option>All</option>
                   <option>Female</option>
                   <option>Male</option>
                 </select>
              </div>
              <div>
                 <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Age Range</span>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <input 
                     type="number" 
                     className="input-field" 
                     style={{ padding: '8px', width: '70px' }}
                     value={minAge} 
                     onChange={(e) => setMinAge(Math.max(13, parseInt(e.target.value) || 13))}
                   />
                   <span style={{ color: '#94a3b8', fontSize: '14px' }}>to</span>
                   <input 
                     type="number" 
                     className="input-field" 
                     style={{ padding: '8px', width: '70px' }}
                     value={maxAge} 
                     onChange={(e) => setMaxAge(Math.min(100, parseInt(e.target.value) || 100))}
                   />
                   <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>years</span>
                 </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, padding: '16px', fontSize: '16px', opacity: isGenerating ? 0.7 : 1 }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? '✨ AI is designing...' : '✨ Generate AI Content'}
            </button>
          </div>
        </div>

        {/* Right Column: AI Preview */}
        <div style={{ flex: '1 1 400px', background: 'rgba(255,255,255,0.5)', borderRadius: '24px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', minHeight: '400px', overflow: 'hidden' }}>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeInUp 0.5s ease-out' }}>

            {/* Image Preview */}
            <div style={{ background: '#f1f5f9', borderRadius: '16px', height: '240px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.05)', overflow: 'hidden', position: 'relative' }}>
                {selectedAssetUrl ? (
                  <>
                    {selectedAssetUrl.endsWith('.mp4') ? (
                      <video src={selectedAssetUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted />
                    ) : (
                      <img src={selectedAssetUrl} alt="Campaign Asset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {/* Overlay: Regenerate + Download */}
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
                      <button
                        onClick={handleGenerateAiImage}
                        disabled={isGeneratingImage}
                        title="Regenerate with current prompt"
                        style={{
                          background: 'rgba(99, 102, 241, 0.85)',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backdropFilter: 'blur(4px)',
                          cursor: isGeneratingImage ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        🔄 Regenerate
                      </button>
                      <button 
                        onClick={handleDownload}
                        style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backdropFilter: 'blur(4px)',
                          cursor: 'pointer',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🖼️</div>
                    <div style={{ color: '#64748b', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>No image yet</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Edit the prompt below and click Generate</div>
                  </div>
                )}
                {isGeneratingImage && (
                   <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: '10px' }}>
                     <div style={{ fontSize: '28px' }}>🎨</div>
                     <div style={{ fontWeight: 700, color: '#6366f1', fontSize: '14px' }}>AI is creating your visual...</div>
                   </div>
                )}
              </div>

              {/* Image Actions: Generate / Regenerate + optional prompt editor */}
              <div style={{ marginBottom: '12px' }}>
                {/* Primary action row */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <button
                    onClick={handleGenerateAiImage}
                    disabled={isGeneratingImage || !visualSuggestion}
                    title={!visualSuggestion ? 'Generate campaign content first to get an image prompt' : selectedAssetUrl ? 'Regenerate image using AI prompt' : 'Generate image using AI prompt'}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isGeneratingImage || !visualSuggestion
                        ? '#e2e8f0'
                        : selectedAssetUrl
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: isGeneratingImage || !visualSuggestion ? '#94a3b8' : 'white',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: isGeneratingImage || !visualSuggestion ? 'not-allowed' : 'pointer',
                      boxShadow: isGeneratingImage || !visualSuggestion ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isGeneratingImage ? '🎨 Generating...' : selectedAssetUrl ? '🔄 Regenerate Image' : '✨ Generate Image'}
                  </button>
                  {visualSuggestion && (
                    <button
                      onClick={() => setShowPromptEditor(prev => !prev)}
                      title="Customize the image prompt"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        background: showPromptEditor ? '#f0f0ff' : 'white',
                        color: showPromptEditor ? '#6366f1' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ✏️ Customize
                    </button>
                  )}
                </div>
                {/* Collapsible prompt editor */}
                {showPromptEditor && visualSuggestion && (
                  <div style={{ animation: 'fadeInUp 0.2s ease-out' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Image Prompt (editable)</label>
                    <textarea
                      value={visualSuggestion}
                      onChange={(e) => setVisualSuggestion(e.target.value)}
                      rows={3}
                      placeholder="Describe the image you want..."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #6366f1',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        color: '#334155',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        outline: 'none',
                        background: 'white',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', flexGrow: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', minHeight: '300px' }}>
                <textarea 
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  style={{ width: '100%', flexGrow: 1, border: 'none', resize: 'none', outline: 'none', fontSize: '16px', lineHeight: '1.6', color: 'var(--text-color)', fontFamily: 'inherit' }}
                  placeholder="Edit your post content here..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button 
                  className="btn-primary" 
                  style={{ flexGrow: 1, background: 'linear-gradient(135deg, var(--secondary-color) 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', opacity: isPublishing ? 0.7 : 1 }}
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? 'Publishing...' : (publishToIg ? 'Publish to FB & IG' : 'Publish to Facebook')}
                </button>

                {metaStatus.connected && (
                  <button 
                    onClick={() => {
                      if (!metaStatus.has_instagram) {
                        notifyError("To post to Instagram, make sure an Instagram Business Account is linked to your Facebook Page.");
                        return;
                      }
                      setPublishToIg(!publishToIg);
                    }}
                    style={{ 
                      padding: '0 20px', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      background: !metaStatus.has_instagram 
                        ? '#f1f5f9' 
                        : publishToIg 
                          ? 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' 
                          : 'white',
                      color: !metaStatus.has_instagram 
                        ? '#94a3b8' 
                        : publishToIg 
                          ? 'white' 
                          : '#64748b',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: !metaStatus.has_instagram ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: publishToIg && metaStatus.has_instagram ? '0 4px 12px rgba(220, 39, 67, 0.3)' : 'none'
                    }}
                    title={!metaStatus.has_instagram ? "No Instagram Business account linked to this Facebook Page" : "Toggle Instagram posting"}
                  >
                    IG: {!metaStatus.has_instagram ? 'Not Linked' : publishToIg ? 'ON' : 'OFF'}
                  </button>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '650px',
            maxHeight: '80vh',
            padding: '32px',
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Select from Media Library</h3>
              <button 
                onClick={() => setShowAssetPicker(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}
              >
                ×
              </button>
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '24px' }}>Choose an existing image or video asset for your campaign.</p>

            <div style={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              paddingRight: '4px',
              minHeight: '200px',
            }}>
              {libraryAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <p style={{ fontWeight: 500, margin: 0 }}>No assets in library</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Upload assets in the "Asset Library" tab first.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                  {libraryAssets.map((asset) => (
                    <div 
                      key={asset.id} 
                      onClick={() => {
                        setSelectedAssetUrl(asset.url);
                        setShowAssetPicker(false);
                      }}
                      style={{ 
                        cursor: 'pointer',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: selectedAssetUrl === asset.url ? '3px solid var(--primary-color)' : '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'transform 0.2s, border-color 0.2s',
                        background: '#f8fafc',
                        position: 'relative'
                      }}
                    >
                      <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#e2e8f0' }}>
                        {asset.name.toLowerCase().endsWith('.mp4') ? (
                          <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        ) : (
                          <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div style={{ padding: '8px', fontSize: '11px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', color: 'var(--text-color)' }}>
                        {asset.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetsLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        await fetchAssets();
      } else {
        notifyError("Upload failed");
      }
    } catch (error) {
      console.error("Upload error", error);
      notifyError("Error uploading file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '40px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700 }}>Asset Library</h2>
        <button 
          className="btn-primary" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{ padding: '10px 20px' }}
        >
          {isUploading ? 'Uploading...' : '+ Upload Asset'}
        </button>
      </div>
      <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
        Manage your product images, videos, and brand assets for the AI to use.
      </p>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        accept="image/*,video/*"
      />

      {assets.length === 0 ? (
        <div 
          style={{ border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '48px', textAlign: 'center', background: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ color: '#64748b', marginBottom: '16px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px', fontSize: '16px' }}>Drag & drop new assets here</p>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '24px' }}>PNG, JPG, MP4 up to 50MB</p>
          <button className="btn-secondary" style={{ padding: '10px 24px' }}>Browse Files</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {assets.map((asset) => (
            <div key={asset.id} className="asset-card" style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ height: '150px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {asset.name.toLowerCase().endsWith('.mp4') ? (
                  <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                ) : (
                  <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ padding: '12px', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {asset.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  return (
    <div className="fade-in-up glass-panel" style={{ padding: '40px', width: '100%' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Admin Dashboard & Know-How</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
        System architecture, prompt patterns, and local configuration guides.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)', marginBottom: '24px' }}>
            🧠 System Know-How Reference
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-color)' }}>
                1. AI Prompt Generation Pipeline
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                The backend utilizes <strong>Gemini 2.5 Flash</strong> (via the Google GenAI SDK) for generating the marketing copy, and <strong>Imagen 3</strong> for custom visual generation. 
                The prompt construction merges the user's campaign goal with local business profile metadata (Business Name, Phone Number, Industry) stored in the browser's <code>localStorage</code>.
              </p>
            </div>

            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-color)' }}>
                2. Strict Copywriting Rules (Concise Posts & No Placeholders)
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                The prompt instructs the AI model with strict criteria to guarantee production-ready copies:
              </p>
              <ul style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6', marginLeft: '20px', marginTop: '6px', listStyleType: 'disc' }}>
                <li><strong>No Placeholders:</strong> Omit bracketed placeholder tags (e.g., <code>[Business Name]</code>, <code>[Link]</code>, <code>[Phone]</code>). Real details are resolved from the business profile or omitted entirely.</li>
                <li><strong>Short & Punchy:</strong> Kept under 80 words (2-3 sentences max + 2-3 hashtags) to optimize for rapid scrolling on social feeds.</li>
              </ul>
            </div>

            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-color)' }}>
                3. Drag-and-Drop / Asset Selection Mechanism
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                The campaign dashboard includes a <strong>Quick Assets Tray</strong>. Drag-and-drop is implemented natively using HTML5 Drag and Drop APIs:
              </p>
              <ul style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6', marginLeft: '20px', marginTop: '6px', listStyleType: 'disc' }}>
                <li><strong>Dragging Tray Items:</strong> Sets the MIME type data transfer payload to <code>text/plain</code> containing the asset URL.</li>
                <li><strong>File System Drop:</strong> Intercepts dropped files from outside the browser and initiates a multi-part form upload to <code>/api/assets/upload</code>.</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-color)' }}>
                4. Secure Local HTTPS & SSL Setup
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                The Next.js development server runs using <code>next dev --experimental-https</code> with self-signed SSL certificates inside <code>frontend/certificates</code>. 
                If you encounter a browser security warning:
              </p>
              <div style={{ background: '#f8fafc', borderLeft: '4px solid #6366f1', padding: '12px', borderRadius: '6px', fontSize: '13px', marginTop: '8px', color: 'var(--text-color)' }}>
                Click <strong>Advanced</strong> &rarr; <strong>Proceed to localhost (unsafe)</strong>. This is normal for local HTTPS servers using self-signed certs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainDashboard() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div className="fade-in-up" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '250px', padding: '24px', position: 'sticky', top: '40px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '32px', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MarketFlow AI</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('campaigns')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'campaigns' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'campaigns' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'campaigns' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'assets' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'assets' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'assets' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Asset Library
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'profile' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'profile' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'settings' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'settings' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Integrations
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: activeTab === 'admin' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'admin' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Admin Panel
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {showWelcome && (
          <div className="fade-in-up" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #10b981', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)' }}>
            <div>
              <h4 style={{ color: '#065f46', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>🎉 You are all set for now!</h4>
              <p style={{ color: '#047857', fontSize: '14px', lineHeight: 1.5 }}>
                Your business profile is ready. You can always add more images and videos later in the <strong>Assets</strong> menu. Now, let's create your first AI campaign!
              </p>
            </div>
            <button onClick={() => setShowWelcome(false)} style={{ background: 'transparent', border: 'none', color: '#047857', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}>×</button>
          </div>
        )}
        {activeTab === 'campaigns' && <CampaignDashboard />}
        {activeTab === 'assets' && <AssetsLibrary />}
        {activeTab === 'profile' && <Onboarding isSettings={true} />}
        {activeTab === 'settings' && <Platforms isSettings={true} />}
        {activeTab === 'admin' && <AdminPanel />}
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    window.showNotification = (message: string, type: 'success' | 'error') => {
      setNotification({ message, type });
    };
    return () => {
      delete window.showNotification;
    };
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      {/* Inject the official Facebook JS SDK */}
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="lazyOnload" crossOrigin="anonymous" />
      
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        {step > 1 && step < 4 && <Stepper currentStep={step} />}
        {step === 1 && <Login onNext={() => setStep(2)} />}
        {step === 2 && <Onboarding onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <Platforms onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <MainDashboard />}
      </div>

      {notification && (
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: notification.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '500px',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <span style={{ fontSize: '20px' }}>
            {notification.type === 'success' ? '✅' : '❌'}
          </span>
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
              {notification.type === 'success' ? 'Success' : 'Error'}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>{notification.message}</div>
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', opacity: 0.7 }}
          >
            ×
          </button>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}
