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
          DigiM
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
            border: `2px dashed ${dragActive ? 'var(--primary-color)' : 'rgba(82, 183, 136, 0.25)'}`, 
            borderRadius: '16px', 
            padding: '32px', 
            textAlign: 'center', 
            background: dragActive ? 'rgba(82, 183, 136, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
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
          <p style={{ color: 'var(--text-light)', marginBottom: '16px', fontSize: '14px' }}>Choose which Facebook Page you want to connect to DigiM app.</p>
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
          background: isFbConnected ? 'rgba(82, 183, 136, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          border: isFbConnected ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: '#1877F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>
              f
            </div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '16px', color: isFbConnected ? 'var(--primary-color)' : 'var(--text-color)' }}>
                Facebook Page
              </h4>
              <p style={{ fontSize: '13px', color: isFbConnected ? 'var(--text-color)' : 'var(--text-light)' }}>
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
            style={isFbConnected ? { padding: '10px 20px', fontSize: '14px', color: 'var(--primary-color)', borderColor: 'var(--primary-color)', background: 'rgba(82, 183, 136, 0.1)' } : { padding: '10px 20px', fontSize: '14px' }}
          >
            {isConnectingFb ? 'Connecting...' : (isFbConnected ? '✓ Change Page' : 'Connect')}
          </button>
        </div>

        {/* Instagram Connection */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '24px', 
          background: isIgConnected ? 'rgba(82, 183, 136, 0.05)' : 'rgba(255, 255, 255, 0.02)', 
          border: isIgConnected ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.15)', 
          borderRadius: '16px', 
          transition: 'all 0.3s' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>in</div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '16px', color: isIgConnected ? 'var(--primary-color)' : 'var(--text-color)' }}>Instagram Business</h4>
              <p style={{ fontSize: '13px', color: isIgConnected ? 'var(--text-color)' : 'var(--text-light)' }}>
                {isIgConnected ? 'Connected via Facebook' : (isFbConnected ? 'Ready to connect' : 'Connect via Facebook first')}
              </p>
            </div>
          </div>
          <button 
            className="btn-secondary" 
            style={{ 
              padding: '10px 20px', fontSize: '14px', 
              opacity: (isFbConnected || isIgConnected) ? 1 : 0.5,
              background: isIgConnected ? 'rgba(82, 183, 136, 0.1)' : 'transparent',
              color: isIgConnected ? 'var(--primary-color)' : 'var(--text-color)',
              borderColor: isIgConnected ? 'var(--primary-color)' : 'rgba(82, 183, 136, 0.2)',
              cursor: (isFbConnected || isIgConnected) ? 'pointer' : 'not-allowed'
            }} 
            disabled={!isFbConnected || isIgConnected || isConnectingIg}
            onClick={connectInstagram}
          >
            {isConnectingIg ? 'Connecting...' : (isIgConnected ? '✓ Connected' : 'Connect')}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(82, 183, 136, 0.03)', borderRadius: '16px', border: '1px solid rgba(82, 183, 136, 0.1)' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(82, 183, 136, 0.1)', paddingTop: '32px' }}>
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
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(82, 183, 136, 0.2)',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    color: 'var(--text-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.background = 'rgba(82, 183, 136, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(82, 183, 136, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
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
                border: isDraggingOverAssetZone ? '2px dashed var(--primary-color)' : '1px dashed rgba(82, 183, 136, 0.25)', 
                borderRadius: '12px', 
                background: isDraggingOverAssetZone ? 'rgba(82, 183, 136, 0.1)' : 'rgba(255, 255, 255, 0.03)',
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
                  <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(82, 183, 136, 0.2)', background: 'rgba(5, 8, 6, 0.8)' }}>
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
                        border: selectedAssetUrl === asset.url ? '2.5px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.15)', 
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
            <div className="fade-in-up" style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(82, 183, 136, 0.15)', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.4)' }}>
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
                   <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>to</span>
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
        <div style={{ flex: '1 1 400px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', border: '2px dashed rgba(82, 183, 136, 0.25)', display: 'flex', flexDirection: 'column', minHeight: '400px', overflow: 'hidden' }}>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeInUp 0.5s ease-out' }}>

            {/* Image Preview */}
            <div style={{ background: 'rgba(5, 8, 6, 0.6)', borderRadius: '16px', height: '240px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.4)', overflow: 'hidden', position: 'relative' }}>
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
                    <div style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>No image yet</div>
                    <div style={{ color: 'var(--text-light)', opacity: 0.6, fontSize: '12px' }}>Edit the prompt below and click Generate</div>
                  </div>
                )}
                {isGeneratingImage && (
                   <div style={{ position: 'absolute', inset: 0, background: 'rgba(12, 20, 16, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: '10px' }}>
                     <div style={{ fontSize: '28px' }}>🎨</div>
                     <div style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '14px' }}>AI is creating your visual...</div>
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
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)',
                      color: isGeneratingImage || !visualSuggestion ? 'var(--text-light)' : 'white',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: isGeneratingImage || !visualSuggestion ? 'not-allowed' : 'pointer',
                      boxShadow: isGeneratingImage || !visualSuggestion ? 'none' : '0 4px 12px var(--primary-glow)',
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
                        border: '1.5px solid rgba(82, 183, 136, 0.25)',
                        background: showPromptEditor ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: showPromptEditor ? 'var(--primary-color)' : 'var(--text-color)',
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
                        border: '1.5px solid var(--primary-color)',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        color: 'var(--text-color)',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        outline: 'none',
                        background: 'rgba(5, 8, 6, 0.8)',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(82, 183, 136, 0.15)', flexGrow: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)', minHeight: '300px' }}>
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
                      border: '1px solid rgba(82, 183, 136, 0.2)',
                      background: !metaStatus.has_instagram 
                        ? 'rgba(255, 255, 255, 0.02)' 
                        : publishToIg 
                          ? 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' 
                          : 'rgba(255, 255, 255, 0.04)',
                      color: !metaStatus.has_instagram 
                        ? 'var(--text-light)' 
                        : publishToIg 
                          ? 'white' 
                          : 'var(--text-color)',
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
            background: 'var(--glass-bg)',
            borderRadius: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
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
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <p style={{ fontWeight: 500, margin: 0 }}>No assets in library</p>
                  <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Upload assets in the "Asset Library" tab first.</p>
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
                        border: selectedAssetUrl === asset.url ? '3px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.15)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s, border-color 0.2s',
                        background: 'rgba(255, 255, 255, 0.02)',
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

function FacebookSetupGuide() {
  const [open, setOpen] = React.useState(false);

  const Step = ({ num, title, children }: { num: number; title: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
      <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', color: 'white', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{num}</div>
      <div>
        <h5 style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-color)', marginBottom: '6px' }}>{title}</h5>
        <div style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.7' }}>{children}</div>
      </div>
    </div>
  );

  const Alert = ({ type, children }: { type: 'tip' | 'warn' | 'info'; children: React.ReactNode }) => {
    const styles: Record<string, { bg: string; border: string; icon: string }> = {
      tip:  { bg: 'rgba(82, 183, 136, 0.05)', border: 'var(--primary-color)', icon: '💡' },
      warn: { bg: 'rgba(249, 115, 22, 0.08)', border: '#f97316', icon: '⚠️' },
      info: { bg: 'rgba(59, 130, 246, 0.08)', border: '#3b82f6', icon: 'ℹ️' },
    };
    const s = styles[type];
    return (
      <div style={{ background: s.bg, borderLeft: `4px solid ${s.border}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--text-color)', lineHeight: '1.6', margin: '8px 0' }}>
        {s.icon} {children}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: open ? 'rgba(82, 183, 136, 0.1)' : 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(82, 183, 136, 0.15)', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, fontSize: '16px', color: 'var(--text-color)' }}>
            <span style={{ fontSize: '22px' }}>📘</span>
            5. Facebook & Instagram Business Setup Guide
          </span>
          <span style={{ fontSize: '20px', color: 'var(--text-light)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
        </button>
        <a
          href="/facebook-setup-guide.html"
          target="_blank"
          rel="noreferrer"
          title="Open printable PDF guide"
          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', color: 'white', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 12px var(--primary-glow)', transition: 'opacity 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          ⬇ PDF Guide
        </a>
      </div>

      {open && (
        <div style={{ marginTop: '16px', padding: '24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(82, 183, 136, 0.15)', borderRadius: '16px', animation: 'fadeIn 0.2s ease' }}>
          {/* Overview */}
          <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.7', marginBottom: '20px' }}>
            Connect your Facebook Business Page (and optionally Instagram) to <strong>DigiM app</strong> to publish AI-generated campaigns directly — no copy-pasting required.
          </p>

          {/* Prerequisites */}
          <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(12, 20, 16, 0.4)', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.15)' }}>
            <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: 'var(--text-color)' }}>✅ Prerequisites Before You Begin</h5>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {[
                  ['🏢', 'Facebook Business Page', 'You must be an Admin of the Page. Personal profiles not supported.'],
                  ['👤', 'Facebook Account', 'Must have admin access to the Business Page.'],
                  ['📸', 'Instagram (optional)', 'Must be a Business or Creator account — not a Personal account.'],
                  ['🔗', 'Instagram linked to Page', 'Link Instagram to your Facebook Page via Meta Business Suite first.'],
                ].map(([icon, req, detail]) => (
                  <tr key={req} style={{ borderBottom: '1px solid rgba(82, 183, 136, 0.1)' }}>
                    <td style={{ padding: '8px 4px', width: '28px', fontSize: '16px' }}>{icon}</td>
                    <td style={{ padding: '8px', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--text-color)' }}>{req}</td>
                    <td style={{ padding: '8px', color: 'var(--text-light)' }}>{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Alert type="warn">Do not use a Personal Instagram account. Switch to a Business/Creator profile first via Instagram → Settings → Account.</Alert>
          </div>

          {/* Steps */}
          <h5 style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-color)', marginBottom: '16px' }}>📋 Step-by-Step Setup</h5>

          <Step num={1} title="Navigate to Platform Settings">
            Open <strong>DigiM app</strong> → click the <strong>Settings (gear icon)</strong> in the sidebar → select the <strong>Integrations</strong> tab.
          </Step>

          <Step num={2} title="Connect Your Facebook Page">
            <p style={{ marginBottom: '8px' }}>Locate the <strong>Facebook Page</strong> card and click <strong>Connect</strong>. A Facebook login popup will appear — log in with the account that <em>administers</em> your Business Page.</p>
            <Alert type="info">If you see "Facebook SDK is still loading", wait 2–3 seconds and try again.</Alert>
            <p style={{ marginTop: '8px', marginBottom: '4px' }}>Grant all requested permissions:</p>
            <ul style={{ margin: '4px 0 0 16px', paddingLeft: '10px', listStyleType: 'disc' }}>
              {['pages_show_list — See your managed Pages', 'pages_manage_posts — Publish on your behalf', 'instagram_basic — Read linked Instagram account', 'instagram_content_publish — Post photos to Instagram'].map(p => <li key={p}><code style={{ fontSize: '12px', background: 'rgba(82, 183, 136, 0.1)', padding: '1px 4px', borderRadius: '4px' }}>{p.split(' — ')[0]}</code> — {p.split(' — ')[1]}</li>)}
            </ul>
            <Alert type="warn">Grant <strong>all</strong> permissions. Skipping any will cause publishing to fail.</Alert>
          </Step>

          <Step num={3} title="Select Your Business Page">
            After granting permissions, a <strong>Select Facebook Page</strong> dropdown appears. Choose your Page and click <strong>Confirm</strong>.
            <Alert type="tip">DigiM app automatically upgrades your short-lived login token to a <strong>non-expiring Page token</strong> — you won't need to reconnect.</Alert>
          </Step>

          <Step num={4} title="Connect Instagram (Optional)">
            Once Facebook is connected, the <strong>Instagram Business</strong> card becomes active. Click <strong>Connect</strong> — no second login needed. DigiM app automatically finds the Instagram account linked to your Facebook Page.
            <Alert type="info">No extra login required. Instagram is detected automatically via the Facebook Page link.</Alert>
          </Step>

          <Step num={5} title="Publish Your First Campaign">
            Go to <strong>Campaigns</strong> → generate or write your post → click <strong>Publish to Facebook</strong>. If Instagram is connected, a toggle appears to publish to both simultaneously.
            <Alert type="tip">Instagram posts require an image — text-only posts are not supported by the Instagram API.</Alert>
          </Step>

          {/* Troubleshooting */}
          <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(12, 20, 16, 0.4)', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.15)' }}>
            <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: 'var(--text-color)' }}>🔧 Common Issues</h5>
            {[
              { err: '❌ "No Facebook Pages found"', fix: 'Your account has no Pages. Create one at facebook.com/pages/create, or ask your admin to add you as Admin (not just Editor).' },
              { err: '❌ Instagram "Connect" grayed out', fix: 'Link your Instagram Business account to the Facebook Page first via Meta Business Suite → Settings → Instagram Accounts.' },
              { err: '❌ Instagram publish fails with "media container" error', fix: 'The image URL must be publicly accessible. Localhost or private URLs will fail. Use a CDN or cloud storage link.' },
              { err: '❌ Post published but not visible on Page', fix: "Check your Page's Publishing Tools → Scheduled Posts. The post may be pending or scheduled." },
            ].map(({ err, fix }) => (
              <div key={err} style={{ marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{err}</span>
                <p style={{ color: 'var(--text-light)', marginTop: '2px', lineHeight: '1.6' }}>{fix}</p>
              </div>
            ))}
          </div>

          {/* Quick Checklist */}
          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(82, 183, 136, 0.05)', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.2)' }}>
            <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: 'var(--text-color)' }}>📎 Quick Checklist</h5>
            <ul style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '2', listStyleType: 'none', padding: 0 }}>
              {[
                'I have a Facebook Business Page and I am an Admin of it',
                'I opened DigiM app → Integrations and clicked Connect on the Facebook card',
                'I granted all permissions in the Facebook popup',
                'I selected my Business Page from the dropdown',
                '(Optional) My Instagram is a Business/Creator account linked to my Facebook Page',
                '(Optional) Instagram card shows ✅ Connected',
                'I published a test campaign and it appeared on my Page',
              ].map(item => <li key={item}>☐ {item}</li>)}
            </ul>
          </div>

          {/* Helpful Links */}
          <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-light)' }}>
            <strong style={{ color: 'var(--text-color)' }}>📚 Helpful Links: </strong>
            <a href="https://www.facebook.com/pages/create" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', marginRight: '12px' }}>Create a Facebook Page</a>
            <a href="https://help.instagram.com/502981923235522" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', marginRight: '12px' }}>Switch to Instagram Business</a>
            <a href="https://www.facebook.com/business/help/connect-instagram-to-page" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>Link Instagram to Facebook Page</a>
          </div>
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
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '20px', padding: '32px', border: '1px solid rgba(82, 183, 136, 0.15)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)', marginBottom: '24px' }}>
            🧠 System Know-How Reference
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ borderBottom: '1px solid rgba(82, 183, 136, 0.1)', paddingBottom: '20px' }}>
              <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-color)' }}>
                1. AI Prompt Generation Pipeline
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                The backend utilizes <strong>Gemini 2.5 Flash</strong> (via the Google GenAI SDK) for generating the marketing copy, and <strong>Imagen 3</strong> for custom visual generation. 
                The prompt construction merges the user's campaign goal with local business profile metadata (Business Name, Phone Number, Industry) stored in the browser's <code>localStorage</code>.
              </p>
            </div>

            <div style={{ borderBottom: '1px solid rgba(82, 183, 136, 0.1)', paddingBottom: '20px' }}>
              <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-color)' }}>
                2. Strict Copywriting Rules (Concise Posts & No Placeholders)
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                The prompt instructs the AI model with strict criteria to guarantee production-ready copies:
              </p>
              <ul style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6', marginLeft: '20px', marginTop: '6px', listStyleType: 'disc' }}>
                <li><strong>No Placeholders:</strong> Omit bracketed placeholder tags (e.g., <code>[Business Name]</code>, <code>[Link]</code>, <code>[Phone]</code>). Real details are resolved from the business profile or omitted entirely.</li>
                <li><strong>Short & Punchy:</strong> Kept under 80 words (2-3 sentences max + 2-3 hashtags) to optimize for social scrolling.</li>
              </ul>
            </div>

            <div style={{ borderBottom: '1px solid rgba(82, 183, 136, 0.1)', paddingBottom: '20px' }}>
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

            <div style={{ borderBottom: '1px solid rgba(82, 183, 136, 0.1)', paddingBottom: '20px' }}>
              <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-color)' }}>
                4. Secure Local HTTPS & SSL Setup
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                The Next.js development server runs using <code>next dev --experimental-https</code> with self-signed SSL certificates inside <code>frontend/certificates</code>. 
                If you encounter a browser security warning:
              </p>
              <div style={{ background: 'rgba(82, 183, 136, 0.05)', borderLeft: '4px solid var(--primary-color)', padding: '12px', borderRadius: '6px', fontSize: '13px', marginTop: '8px', color: 'var(--text-color)' }}>
                Click <strong>Advanced</strong> &rarr; <strong>Proceed to localhost (unsafe)</strong>. This is normal for local HTTPS servers using self-signed certs.
              </div>
            </div>

            <FacebookSetupGuide />
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
      window.showNotification?.("Message sent successfully! We'll get back to you soon.", "success");
    }, 1000);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--text-color)', background: 'radial-gradient(circle at 50% 50%, #0D2016 0%, #050806 100%)', scrollBehavior: 'smooth' }}>
      {/* Sticky Header Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5, 8, 6, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(82, 183, 136, 0.1)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', fontWeight: 800, color: 'var(--primary-color)' }}>
            <span style={{ fontSize: '24px' }}>🌱</span> DigiM
          </div>
          <nav style={{ display: 'flex', gap: '32px' }}>
            <a href="#about" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }}>About</a>
            <a href="#products" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }}>Product & Services</a>
            <a href="#features" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }}>Features</a>
            <a href="#contact" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }}>Contact</a>
          </nav>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-secondary" onClick={onGetStarted} style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '10px' }}>Log In</button>
            <button className="btn-primary" onClick={onGetStarted} style={{ padding: '8px 20px', fontSize: '14px', borderRadius: '10px' }}>Get Started</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '100px 24px 80px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h1 className="fade-in-up" style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.15, marginBottom: '24px', background: 'linear-gradient(135deg, #ECFDF5 0%, #52B788 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Grow Your Local Business <br /> On Autopilot with AI
        </h1>
        <p className="fade-in-up" style={{ fontSize: '18px', color: 'var(--text-light)', lineHeight: 1.6, maxWidth: '750px', margin: '0 auto 40px' }}>
          DigiM app handles your social media marketing natively. Write, design, schedule, and analyze campaigns in seconds. Zero tech skills, design skills, or marketing background required.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button className="btn-primary" onClick={onGetStarted} style={{ padding: '16px 36px', fontSize: '16px' }}>Launch Your First Campaign</button>
          <a href="#features" className="btn-secondary" style={{ padding: '16px 36px', fontSize: '16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Explore Features</a>
        </div>
      </section>

      {/* Value Propositions / Business Angle Section */}
      <section id="about" style={{ padding: '80px 24px', borderTop: '1px solid rgba(82, 183, 136, 0.1)', background: 'rgba(12, 20, 16, 0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '12px' }}>Built For Business Growth</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>How DigiM app simplifies marketing and drives actual ROI for local businesses.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
            <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏰</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Save 10+ Hours / Week</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6 }}>
                Stop stressing over copy or graphics. Input a 1-sentence prompt and our AI generates tailored text and asset suggestions in seconds.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📈</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Maximize Marketing ROI</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6 }}>
                Reach local buyers. AI structures campaigns designed around target demographics, ages, and interests to optimize post value.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>Keep Absolute Consistency</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6 }}>
                Never forget to post. Keep your Facebook & Instagram pages active and engaging on autopilot.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🛠</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>No Tech Experience Needed</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6 }}>
                Designed with a single-column layout, plain language toggles, and clear setup checklists. Connect platforms with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products & Services Section */}
      <section id="products" style={{ padding: '80px 24px', borderTop: '1px solid rgba(82, 183, 136, 0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--primary-color)', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>What We Deliver</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', marginBottom: '24px' }}>All-In-One Social Marketing Engine</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              DigiM app gives you a private agency-level marketing suite at a fraction of the cost. From brand-aligned copy suggestions to asset organization and live publishing sync, everything you need is under one hood.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>✓</span>
                <span>Self-driving content calendar suggestions</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>✓</span>
                <span>Direct Meta Graph API integrations for Instant Syncing</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>✓</span>
                <span>Drag-and-drop media asset vaulting</span>
              </div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(82, 183, 136, 0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Campaign Generator</div>
              <div style={{ fontSize: '11px', color: 'var(--primary-color)', background: 'rgba(82, 183, 136, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>AI Powered</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(5, 8, 6, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(82, 183, 136, 0.05)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>Describe your promotion:</div>
                <div style={{ fontSize: '13px' }}>"Launch our summer floral collection with 20% discount!"</div>
              </div>
              <div style={{ background: 'rgba(82, 183, 136, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(82, 183, 136, 0.2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--primary-color)', marginBottom: '4px', fontWeight: 600 }}>Suggested AI Copy:</div>
                <div style={{ fontSize: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>"Bloom in style this season! 🌸 Elevate your summer wardrobe with 20% OFF our premium collections..."</div>
              </div>
              <button className="btn-primary" style={{ padding: '10px', fontSize: '13px', borderRadius: '8px', width: '100%' }} onClick={onGetStarted}>Generate Now</button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Including Analytics) */}
      <section id="features" style={{ padding: '80px 24px', borderTop: '1px solid rgba(82, 183, 136, 0.1)', background: 'rgba(12, 20, 16, 0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '12px' }}>Powerful App Features</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>Engineered for absolute ease of use and top performance.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🤖</span> Campaign Generator
              </h3>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6 }}>
                Leverages advanced Gemini API models to create cohesive captions, hashtags, and suggestions for visuals. Select tone, target age, gender, and category.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🔄</span> Multi-Platform Sync
              </h3>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6 }}>
                Directly connect Facebook Pages and Instagram Business accounts. Publish content immediately from our web dashboard with a single click.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📊</span> FB & IG Analytics Dashboard
              </h3>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6 }}>
                Track reach, follower growth, impressions, and engagement rates. Compare Facebook and Instagram post metrics side-by-side to understand what works.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '80px 24px', borderTop: '1px solid rgba(82, 183, 136, 0.1)', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '12px' }}>Get In Touch</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>Have questions? Send us a message and our team will get right back to you.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '8px', fontWeight: 500 }}>Name</label>
            <input className="input-field" placeholder="John Doe" required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '8px', fontWeight: 500 }}>Email Address</label>
            <input className="input-field" type="email" placeholder="john@example.com" required value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '8px', fontWeight: 500 }}>Message</label>
            <textarea className="input-field" rows={4} style={{ resize: 'vertical' }} placeholder="Tell us what you're looking for..." required value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Send Message</button>
        </form>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid rgba(82, 183, 136, 0.1)', padding: '32px 24px', background: 'rgba(5, 8, 6, 0.9)', textAlign: 'center', fontSize: '14px', color: 'var(--text-light)' }}>
        <p>© 2026 DigiM app. All rights reserved. Empowering local business marketing.</p>
      </footer>
    </div>
  );
}

function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/meta/analytics?tenant_id=1')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analytics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '16px', width: '100%' }}>
        <span style={{ fontSize: '24px', display: 'block', marginBottom: '16px' }}>⏳</span>
        <p style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Fetching insights from Meta Graph API...</p>
      </div>
    );
  }

  const pData = data ? data[activePlatform] : null;
  const isConnected = data ? data.connected : false;

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Marketing Performance</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
            Real-time Reach and Engagement statistics for connected profiles.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isConnected ? 'rgba(82, 183, 136, 0.1)' : 'rgba(131, 156, 143, 0.1)', border: `1px solid ${isConnected ? 'var(--primary-color)' : 'rgba(131, 156, 143, 0.2)'}`, padding: '8px 16px', borderRadius: '20px', fontSize: '13px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: isConnected ? 'var(--primary-color)' : '#9CA3AF', borderRadius: '50%' }}></span>
          <span style={{ fontWeight: 600 }}>{isConnected ? `Connected to ${data.page_name}` : 'Running in Demo Mode'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'rgba(82, 183, 136, 0.05)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.1)', width: 'fit-content' }}>
        <button 
          onClick={() => setActivePlatform('facebook')}
          style={{ background: activePlatform === 'facebook' ? 'var(--primary-color)' : 'transparent', color: activePlatform === 'facebook' ? '#000000' : 'var(--text-color)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          📘 Facebook
        </button>
        <button 
          onClick={() => setActivePlatform('instagram')}
          style={{ background: activePlatform === 'instagram' ? 'var(--primary-color)' : 'transparent', color: activePlatform === 'instagram' ? '#000000' : 'var(--text-color)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          📸 Instagram
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Followers</span>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{pData?.followers.toLocaleString()}</div>
          <span style={{ color: 'var(--primary-color)', fontSize: '12px', fontWeight: 600 }}>↑ +8.4% this month</span>
        </div>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Estimated Reach</span>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{pData?.reach.toLocaleString()}</div>
          <span style={{ color: 'var(--primary-color)', fontSize: '12px', fontWeight: 600 }}>↑ +14.2% this month</span>
        </div>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Impressions</span>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{pData?.impressions.toLocaleString()}</div>
          <span style={{ color: 'var(--primary-color)', fontSize: '12px', fontWeight: 600 }}>↑ +11.8% this month</span>
        </div>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Engagement Rate</span>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{pData?.engagement_rate}%</div>
          <span style={{ color: 'var(--primary-color)', fontSize: '12px', fontWeight: 600 }}>↑ +0.6% this month</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Follower Growth (Last 6 Weeks)</h4>
          <div style={{ height: '200px', width: '100%', position: 'relative' }}>
            <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="0" y1="40" x2="100%" y2="40" stroke="rgba(82, 183, 136, 0.05)" strokeWidth="1" />
              <line x1="0" y1="90" x2="100%" y2="90" stroke="rgba(82, 183, 136, 0.05)" strokeWidth="1" />
              <line x1="0" y1="140" x2="100%" y2="140" stroke="rgba(82, 183, 136, 0.05)" strokeWidth="1" />
              
              <path 
                d={`M 10,${150 - (pData?.follower_growth[0] / (activePlatform === 'facebook' ? 8 : 16))} 
                   L 90,${150 - (pData?.follower_growth[1] / (activePlatform === 'facebook' ? 8 : 16))} 
                   L 170,${150 - (pData?.follower_growth[2] / (activePlatform === 'facebook' ? 8 : 16))} 
                   L 250,${150 - (pData?.follower_growth[3] / (activePlatform === 'facebook' ? 8 : 16))} 
                   L 330,${150 - (pData?.follower_growth[4] / (activePlatform === 'facebook' ? 8 : 16))} 
                   L 410,${150 - (pData?.follower_growth[5] / (activePlatform === 'facebook' ? 8 : 16))}`}
                fill="none"
                stroke="var(--primary-color)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {pData?.follower_growth.map((val: number, idx: number) => (
                <g key={idx}>
                  <circle cx={10 + idx * 80} cy={150 - (val / (activePlatform === 'facebook' ? 8 : 16))} r="4" fill="var(--bg-dark)" stroke="var(--primary-color)" strokeWidth="2" />
                  <text x={10 + idx * 80} y={130 - (val / (activePlatform === 'facebook' ? 8 : 16))} fill="var(--text-light)" fontSize="10" textAnchor="middle">{val}</text>
                  <text x={10 + idx * 80} y="180" fill="var(--text-light)" fontSize="10" textAnchor="middle">Wk {idx + 1}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Weekly Post Reach</h4>
          <div style={{ height: '200px', width: '100%', position: 'relative' }}>
            <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="0" y1="40" x2="100%" y2="40" stroke="rgba(82, 183, 136, 0.05)" strokeWidth="1" />
              <line x1="0" y1="90" x2="100%" y2="90" stroke="rgba(82, 183, 136, 0.05)" strokeWidth="1" />
              <line x1="0" y1="140" x2="100%" y2="140" stroke="rgba(82, 183, 136, 0.05)" strokeWidth="1" />
              
              <path 
                d={`M 10,160 
                   L 10,${160 - (pData?.reach_trend[0] / 35)} 
                   L 90,${160 - (pData?.reach_trend[1] / 35)} 
                   L 170,${160 - (pData?.reach_trend[2] / 35)} 
                   L 250,${160 - (pData?.reach_trend[3] / 35)} 
                   L 330,${160 - (pData?.reach_trend[4] / 35)} 
                   L 410,${160 - (pData?.reach_trend[5] / 35)} 
                   L 410,160 Z`}
                fill="rgba(82, 183, 136, 0.1)"
                stroke="none"
              />
              
              <path 
                d={`M 10,${160 - (pData?.reach_trend[0] / 35)} 
                   L 90,${160 - (pData?.reach_trend[1] / 35)} 
                   L 170,${160 - (pData?.reach_trend[2] / 35)} 
                   L 250,${160 - (pData?.reach_trend[3] / 35)} 
                   L 330,${160 - (pData?.reach_trend[4] / 35)} 
                   L 410,${160 - (pData?.reach_trend[5] / 35)}`}
                fill="none"
                stroke="var(--primary-color)"
                strokeWidth="2.5"
              />

              {pData?.reach_trend.map((val: number, idx: number) => (
                <g key={idx}>
                  <circle cx={10 + idx * 80} cy={160 - (val / 35)} r="3" fill="var(--primary-color)" />
                  <text x={10 + idx * 80} y={145 - (val / 35)} fill="var(--text-light)" fontSize="9" textAnchor="middle">{val}</text>
                  <text x={10 + idx * 80} y="180" fill="var(--text-light)" fontSize="10" textAnchor="middle">Wk {idx + 1}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', overflow: 'hidden' }}>
        <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Recent Post Performance</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(82, 183, 136, 0.1)', color: 'var(--text-light)', fontSize: '13px' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Post Copy</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Likes</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Comments</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Shares</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Published</th>
              </tr>
            </thead>
            <tbody>
              {pData?.recent_posts.map((post: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(82, 183, 136, 0.05)', fontSize: '14px', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.text}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>👍 {post.likes}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>💬 {post.comments}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>🔄 {post.shares}</td>
                  <td style={{ padding: '16px', color: 'var(--text-light)' }}>{post.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '32px', background: 'linear-gradient(135deg, var(--primary-color) 0%, #2D6A4F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DigiM app</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('campaigns')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'campaigns' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'campaigns' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'campaigns' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'analytics' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'analytics' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'analytics' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'assets' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'assets' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'assets' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Asset Library
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'profile' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'profile' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'settings' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'settings' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Integrations
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'admin' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'admin' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'admin' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Admin Panel
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
        {showWelcome && (
          <div className="fade-in-up" style={{ background: 'rgba(82, 183, 136, 0.05)', border: '1px solid var(--primary-color)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 12px var(--primary-glow)' }}>
            <div>
              <h4 style={{ color: 'var(--primary-color)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>🎉 Welcome to DigiM app!</h4>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.5 }}>
                Your marketing command center is ready. Check out the <strong>Analytics</strong> tab to see your profile's performance, or head to the <strong>Campaigns</strong> tab to generate posts on autopilot.
              </p>
            </div>
            <button onClick={() => setShowWelcome(false)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}>×</button>
          </div>
        )}
        {activeTab === 'campaigns' && <CampaignDashboard />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'assets' && <AssetsLibrary />}
        {activeTab === 'profile' && <Onboarding isSettings={true} />}
        {activeTab === 'settings' && <Platforms isSettings={true} />}
        {activeTab === 'admin' && <AdminPanel />}
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0); // Step 0 is the public Landing Page
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
      
      {step === 0 ? (
        <LandingPage onGetStarted={() => setStep(1)} />
      ) : (
        <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          {step > 1 && step < 4 && <Stepper currentStep={step} />}
          {step === 1 && (
            <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
              <button 
                onClick={() => setStep(0)} 
                style={{ position: 'absolute', top: '-40px', left: '0', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ← Back to Webpage
              </button>
              <Login onNext={() => setStep(4)} />
            </div>
          )}
          {step === 2 && <Onboarding onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <Platforms onBack={() => setStep(2)} onNext={() => setStep(4)} />}
          {step === 4 && <MainDashboard />}
        </div>
      )}

      {notification && (
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: notification.type === 'success' ? '#2E7D58' : '#ef4444',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
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
