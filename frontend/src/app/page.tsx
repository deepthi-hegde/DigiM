"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PostComposer } from './PostComposer';
import Script from 'next/script';
import { GoogleOAuthProvider, GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';

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

/**
 * Returns the business timezone from localStorage (set during onboarding).
 * Falls back to 'Asia/Kolkata' if not set.
 */
const getBizTimezone = (): string => {
  if (typeof window === 'undefined') return 'Asia/Kolkata';
  try {
    const profile = JSON.parse(localStorage.getItem('businessProfile') || '{}');
    return profile.timezone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
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

function Login({ onNext }: { onNext: (skipOnboarding?: boolean) => void }) {
  const handleCredential = async (credentialResponse: any) => {
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
        const activeTId = data.tenant_id ? String(data.tenant_id) : '1';
        localStorage.setItem("tenant_id", activeTId);
        localStorage.setItem("user_logged_in", "true");
        if (data.email) localStorage.setItem("user_email", data.email);
        if (data.name) localStorage.setItem("user_name", data.name);

        // Check if tenant already has brand profile setup
        try {
          const profRes = await fetch(`/api/onboarding/brand-profile?tenant_id=${activeTId}`);
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData && profData.business_name) {
              localStorage.setItem("onboarding_completed", "true");
              onNext(true);
              return;
            }
          }
        } catch (pErr) {
          console.error("Profile check error:", pErr);
        }
        onNext(false);
      } else {
        const errText = await res.text();
        console.error("Backend auth failed:", errText);
        notifyError("Failed to authenticate with backend: " + errText);
      }
    } catch (err) {
      console.error("Network error connecting to backend", err);
      onNext(false);
    }
  };

  // Automatically show the One Tap floating prompt
  useGoogleOneTapLogin({
    onSuccess: handleCredential,
    onError: () => console.log('One Tap login failed'),
    cancel_on_tap_outside: false,
  });

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '48px', textAlign: 'center', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img src="/logo.png" alt="DigiM Logo" style={{ width: '64px', height: '64px', borderRadius: '12px', marginBottom: '16px', objectFit: 'cover' }} />
        <h1 style={{ fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          DigiM
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: '16px' }}>Grow your local business on autopilot.</p>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Welcome Back</h2>
      <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '32px' }}>
        A Google sign-in prompt will appear on screen. If you don't see it, click the button below.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
        {/* Standard button as fallback if One Tap is dismissed */}
        <GoogleLogin
          onSuccess={handleCredential}
          onError={() => console.log('Login Failed. Check your Client ID configuration.')}
          shape="pill"
          size="large"
          width="320"
          text="signin_with"
        />
        {/* Demo bypass button */}
        <button
          onClick={() => onNext()}
          style={{
            background: 'transparent',
            border: '1px dashed rgba(82, 183, 136, 0.3)',
            color: 'var(--text-light)',
            padding: '10px 20px',
            borderRadius: '24px',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'all 0.2s'
          }}
        >
          Demo Mode (Bypass Google SSO)
        </button>
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
  const [subStep, setSubStep] = useState(1); // 1: Brand, 2: Target & Tone, 3: Media
  const [assets, setAssets] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Brand state
  const [brandUrl, setBrandUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [industry, setIndustry] = useState("Clothing & Apparel");
  const [category, setCategory] = useState("Textile Readymade");
  const [brandColorPrimary, setBrandColorPrimary] = useState("#52B788");
  const [brandColorSecondary, setBrandColorSecondary] = useState("#1B4332");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      notifySuccess("Uploading brand logo...");
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setBrandLogoUrl(data.url);
        localStorage.setItem('brand_logo_url', data.url);
        notifySuccess("Brand logo uploaded successfully!");
      } else {
        notifyError("Failed to upload logo.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Error uploading logo.");
    }
  };

  // Scraper status
  const [isScraping, setIsScraping] = useState(false);

  // Target & Tone state
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [targetGender, setTargetGender] = useState("All");
  const [targetAgeMin, setTargetAgeMin] = useState(18);
  const [targetAgeMax, setTargetAgeMax] = useState(35);
  const [personaTone, setPersonaTone] = useState("casual");

  // Color Presets
  const COLOR_PALETTES = [
    { name: "Emerald Mint", primary: "#52B788", secondary: "#1B4332" },
    { name: "Ocean Breeze", primary: "#0ea5e9", secondary: "#0369a1" },
    { name: "Royal Purple", primary: "#a855f7", secondary: "#581c87" },
    { name: "Sunset Fire", primary: "#f97316", secondary: "#7c2d12" },
    { name: "Slate Contrast", primary: "#94a3b8", secondary: "#1e293b" }
  ];

  const fetchAssets = async () => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/assets?tenant_id=${savedTenantId}`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    }
  };

  const deleteAsset = async (filename: string) => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/assets/${filename}?tenant_id=${savedTenantId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        notifySuccess("Asset deleted successfully.");
        fetchAssets();
      } else {
        notifyError("Failed to delete asset.");
      }
    } catch (error) {
      console.error(error);
      notifyError("Error deleting asset.");
    }
  };

  // Fetch saved profile on load
  useEffect(() => {
    fetchAssets();

    const loadProfile = async () => {
      try {
        const savedTenantId = localStorage.getItem('tenant_id') || '1';
        const response = await fetch(`/api/onboarding/brand-profile?tenant_id=${savedTenantId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.business_name) {
            setBusinessName(data.business_name);
            setBusinessDescription(data.business_description || "");
            setIndustry(data.industry || "Clothing & Apparel");
            setCategory(data.category || "Textile Readymade");
            setBrandUrl(data.brand_url || "");
            if (data.brand_logo_url) {
              setBrandLogoUrl(data.brand_logo_url);
              localStorage.setItem('brand_logo_url', data.brand_logo_url);
            }
            setBrandColorPrimary(data.brand_color_primary || "#52B788");
            setBrandColorSecondary(data.brand_color_secondary || "#1B4332");
            setTargetGender(data.target_gender || "All");
            setTargetAgeMin(data.target_age_min || 18);
            setTargetAgeMax(data.target_age_max || 35);
            setPersonaTone(data.persona_tone || "casual");
            if (data.timezone) {
              setTimezone(data.timezone);
            }
            if (data.target_locations) {
              setTargetLocations(data.target_locations.split(",").map((l: string) => l.trim()).filter(Boolean));
            }
            return;
          }
        }
      } catch (err) {
        console.error("Error loading brand profile from API", err);
      }

      // Fallback to localStorage if API is empty/fails
      const saved = localStorage.getItem('businessProfile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.businessName) setBusinessName(parsed.businessName);
          if (parsed.industry) setIndustry(parsed.industry);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.brandColorPrimary) setBrandColorPrimary(parsed.brandColorPrimary);
          if (parsed.brandColorSecondary) setBrandColorSecondary(parsed.brandColorSecondary);
          if (parsed.brandUrl) setBrandUrl(parsed.brandUrl);
          if (parsed.brandLogoUrl) setBrandLogoUrl(parsed.brandLogoUrl);
          if (parsed.timezone) setTimezone(parsed.timezone);
        } catch (e) {
          console.error("Failed to parse business profile", e);
        }
      }
    };

    loadProfile();

    const preventGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventGlobalDrop);
    window.addEventListener('drop', preventGlobalDrop);
    return () => {
      window.removeEventListener('dragover', preventGlobalDrop);
      window.removeEventListener('drop', preventGlobalDrop);
    };
  }, []);

  const handleSave = async (shouldAdvance = false) => {
    const savedTenantId = localStorage.getItem('tenant_id') || '1';
    const payload = {
      tenant_id: parseInt(savedTenantId, 10),
      business_name: businessName,
      business_description: businessDescription,
      industry,
      category,
      brand_url: brandUrl,
      brand_logo_url: brandLogoUrl,
      brand_color_primary: brandColorPrimary,
      brand_color_secondary: brandColorSecondary,
      target_locations: targetLocations.join(","),
      timezone,
      target_gender: targetGender,
      target_age_min: targetAgeMin,
      target_age_max: targetAgeMax,
      persona_tone: personaTone
    };

    // Save to local storage for backward compatibility
    localStorage.setItem('brand_logo_url', brandLogoUrl || '');
    localStorage.setItem('businessProfile', JSON.stringify({
      businessName,
      industry,
      category,
      brandColorPrimary,
      brandColorSecondary,
      brandUrl,
      brandLogoUrl,
      timezone
    }));

    try {
      const response = await fetch('/api/onboarding/brand-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData.timezone) {
          setTimezone(resData.timezone);
        }
        notifySuccess("Brand identity profile updated successfully!");
        if (shouldAdvance && onNext) {
          onNext();
        }
      } else {
        notifyError("Failed to save brand profile on the server.");
      }
    } catch (error) {
      console.error("Save profile error", error);
      notifyError("Failed to save brand profile.");
    }
  };

  const handleScrape = async () => {
    if (!brandUrl.trim()) {
      notifyError("Please enter a valid URL to analyze.");
      return;
    }
    setIsScraping(true);
    try {
      const res = await fetch('/api/onboarding/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brandUrl })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' || data.status === 'mock') {
          if (data.business_name) setBusinessName(data.business_name);
          if (data.business_description) setBusinessDescription(data.business_description);
          if (data.industry) setIndustry(data.industry);
          notifySuccess("URL successfully parsed! Profile fields updated.");
        } else {
          notifyError("Unable to extract information from this URL.");
        }
      } else {
        notifyError("Error communicating with website parser API.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Error running URL analyzer.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      try {
        const savedTenantId = localStorage.getItem('tenant_id') || '1';
        const response = await fetch(`/api/assets/upload?tenant_id=${savedTenantId}`, {
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
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleLocationSearch = (val: string) => {
    setLocationSearch(val);
    if (!val.trim()) {
      setLocationSuggestions([]);
      return;
    }
    const matches = INDIAN_CITIES.filter(city =>
      city.toLowerCase().includes(val.toLowerCase()) &&
      !targetLocations.includes(city)
    ).slice(0, 5);
    setLocationSuggestions(matches);
  };

  const addLocation = (city: string) => {
    if (!targetLocations.includes(city)) {
      setTargetLocations([...targetLocations, city]);
    }
    setLocationSearch("");
    setLocationSuggestions([]);
  };

  const removeLocation = (city: string) => {
    setTargetLocations(targetLocations.filter(c => c !== city));
  };

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>

      {/* Sub-steps Header (only if not settings) */}
      {!isSettings ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(82, 183, 136, 0.15)', paddingBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>Step {subStep} of 3</span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
              {subStep === 1 && "Brand Discovery"}
              {subStep === 2 && "Target Audience & Tone"}
              {subStep === 3 && "Media Asset Kit"}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '24px', height: '6px', borderRadius: '3px', background: subStep >= 1 ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
            <div style={{ width: '24px', height: '6px', borderRadius: '3px', background: subStep >= 2 ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
            <div style={{ width: '24px', height: '6px', borderRadius: '3px', background: subStep >= 3 ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid rgba(82, 183, 136, 0.15)', paddingBottom: '12px' }}>
          <button
            type="button"
            className={subStep === 1 ? "btn-primary" : "btn-secondary"}
            style={{ padding: '8px 16px', fontSize: '14px' }}
            onClick={() => setSubStep(1)}
          >
            🎨 Brand Identity
          </button>
          <button
            type="button"
            className={subStep === 2 ? "btn-primary" : "btn-secondary"}
            style={{ padding: '8px 16px', fontSize: '14px' }}
            onClick={() => setSubStep(2)}
          >
            🎯 Target & Tone
          </button>
          <button
            type="button"
            className={subStep === 3 ? "btn-primary" : "btn-secondary"}
            style={{ padding: '8px 16px', fontSize: '14px' }}
            onClick={() => setSubStep(3)}
          >
            📁 Media Library
          </button>
        </div>
      )}

      {/* Step 1: Brand Discovery */}
      {subStep === 1 && (
        <div className="fade-in-up">
          {/* Website Analyzer */}
          <div style={{ marginBottom: '28px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.1)' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>🔗 Import Brand Details (Optional)</label>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px' }}>Enter your website URL, Facebook page, or Instagram link to auto-fill details using AI.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                className="input-field"
                placeholder="e.g. https://mybusiness.com"
                value={brandUrl}
                onChange={(e) => setBrandUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap', padding: '12px 20px' }}
                onClick={handleScrape}
                disabled={isScraping}
              >
                {isScraping ? "Analyzing..." : "AI Analyze ✨"}
              </button>
            </div>
          </div>

          {/* Business Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Business Name *</span>
              <input className="input-field" placeholder="e.g. SriKrish" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Industry Line</span>
              <select className="input-field" style={{ cursor: 'pointer' }} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option>Clothing & Apparel</option>
                <option>FMCG</option>
                <option>Automobile</option>
                <option>Tech & Software</option>
                <option>Food & Beverage</option>
                <option>Health & Wellness</option>
                <option>Real Estate</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Sub-Category</span>
              <input className="input-field" placeholder="e.g. Textile Readymade" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Business Tagline / Description</span>
              <textarea
                className="input-field"
                placeholder="Describe what you sell or stand for..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                style={{ minHeight: '42px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Brand Logo Upload */}
          <div style={{ marginBottom: '24px', background: 'rgba(82, 183, 136, 0.05)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>🏷️ Brand Logo (PNG/JPG)</label>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>Upload your logo. It will be automatically stamped onto every brand overlay post image.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {brandLogoUrl && (
                <img src={brandLogoUrl} alt="Brand Logo Preview" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain', background: '#ffffff', padding: '4px', border: '1.5px solid var(--primary-color)' }} />
              )}
              <input
                type="file"
                ref={logoFileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoFileUpload}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
                onClick={() => logoFileInputRef.current?.click()}
              >
                {brandLogoUrl ? 'Change Logo' : '+ Upload Logo'}
              </button>
            </div>
          </div>

          {/* Brand Colors */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>🎨 Select Brand Theme</span>

            {/* Color Presets */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => {
                    setBrandColorPrimary(palette.primary);
                    setBrandColorSecondary(palette.secondary);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: (brandColorPrimary === palette.primary) ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: palette.primary }} />
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: palette.secondary }} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-color)' }}>{palette.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Pickers */}
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Primary:</span>
                <input
                  type="color"
                  value={brandColorPrimary}
                  onChange={(e) => setBrandColorPrimary(e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={brandColorPrimary}
                  onChange={(e) => setBrandColorPrimary(e.target.value)}
                  style={{ width: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '6px', color: '#fff', fontSize: '12px', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Secondary:</span>
                <input
                  type="color"
                  value={brandColorSecondary}
                  onChange={(e) => setBrandColorSecondary(e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={brandColorSecondary}
                  onChange={(e) => setBrandColorSecondary(e.target.value)}
                  style={{ width: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '6px', color: '#fff', fontSize: '12px', textAlign: 'center' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Target Market & Locations */}
      {subStep === 2 && (
        <div className="fade-in-up">
          {/* Target Locations */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>🎯 Target Locations</label>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px' }}>Where is your business located or where are your customers? This refines localization in copy.</p>

            {/* Visual Tags */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {targetLocations.map((city) => (
                <span
                  key={city}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--accent-purple)',
                    border: '1px solid rgba(82, 183, 136, 0.25)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  📍 {city}
                  <button
                    type="button"
                    onClick={() => removeLocation(city)}
                    style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {targetLocations.length === 0 && (
                <span style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic' }}>No targeted locations selected. Defaulting to nationwide.</span>
              )}
            </div>

            {/* Input with Autocomplete */}
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                placeholder="Search and add cities (e.g. Mumbai, Delhi, Bengaluru)..."
                value={locationSearch}
                onChange={(e) => handleLocationSearch(e.target.value)}
              />
              {locationSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', marginTop: '4px', zIndex: 10, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  {locationSuggestions.map((city) => (
                    <div
                      key={city}
                      onClick={() => addLocation(city)}
                      style={{ padding: '10px 16px', cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(82, 183, 136, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Demographics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
            {/* Target Gender */}
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Audience Gender</span>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {["All", "Female", "Male"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setTargetGender(g)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: targetGender === g ? 'var(--primary-color)' : 'transparent',
                      color: targetGender === g ? '#000' : 'var(--text-color)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Age Range */}
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Target Age Range ({targetAgeMin} - {targetAgeMax})</span>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  className="input-field"
                  min="13"
                  max="100"
                  value={targetAgeMin}
                  onChange={(e) => setTargetAgeMin(Number(e.target.value))}
                  style={{ width: '80px', textAlign: 'center' }}
                />
                <span style={{ color: 'var(--text-light)' }}>to</span>
                <input
                  type="number"
                  className="input-field"
                  min="13"
                  max="100"
                  value={targetAgeMax}
                  onChange={(e) => setTargetAgeMax(Number(e.target.value))}
                  style={{ width: '80px', textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          {/* Persona Tone */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>📢 Default AI Copy Persona Tone</span>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>Select the primary writing personality for generated social posts.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { key: "casual", title: "Casual", desc: "Friendly, relaxed, and conversational." },
                { key: "formal", title: "Formal", desc: "Professional, clean, and authoritative." },
                { key: "elaborate", title: "Elaborate", desc: "Detailed, rich, and highly descriptive." },
                { key: "shorten", title: "Shorten", desc: "Punchy, concise, and direct." }
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setPersonaTone(t.key)}
                  style={{
                    padding: '16px 12px',
                    borderRadius: '12px',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.02)',
                    border: personaTone === t.key ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '100px'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '14px', color: personaTone === t.key ? 'var(--primary-color)' : 'var(--text-color)' }}>{t.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '8px', lineHeight: 1.3 }}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Media Kit Ingestion */}
      {subStep === 3 && (
        <div className="fade-in-up">
          <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>📸 Ingest Business Media Assets</label>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '20px' }}>Upload brand photos or early product videos. The campaign scheduler utilizes these assets when publishing.</p>

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
              padding: '36px',
              textAlign: 'center',
              background: dragActive ? 'rgba(82, 183, 136, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: dragActive ? 'scale(1.01)' : 'scale(1)'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📸</div>
            <p style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '4px' }}>
              {isUploading ? 'Uploading assets...' : 'Drag and drop your images or videos'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>
              Supports JPG, PNG, MP4 up to 50MB.
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

          {/* Uploaded assets container with deletions */}
          {assets.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', display: 'block', marginBottom: '12px', fontWeight: 500 }}>
                Manage Library ({assets.length} items)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
                {assets.map((asset, idx) => (
                  <div
                    key={idx}
                    draggable={true}
                    onDragStart={(e) => {
                      if (e.dataTransfer) {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('text/plain', asset.url);
                        e.dataTransfer.setData('text/uri-list', asset.url);
                        e.dataTransfer.setData('URL', asset.url);
                      }
                    }}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      cursor: 'grab'
                    }}
                  >
                    {asset.type === 'video' ? (
                      <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} muted />
                    ) : (
                      <img src={asset.url} alt={asset.filename} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAsset(asset.filename);
                      }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'opacity 0.2s'
                      }}
                      title="Delete asset"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '28px', marginTop: '32px' }}>

        {/* Back Button */}
        {isSettings ? (
          <div /> // placeholder
        ) : (
          <div>
            {subStep > 1 ? (
              <button type="button" className="btn-secondary" onClick={() => setSubStep(subStep - 1)}>← Back</button>
            ) : (
              onBack && <button type="button" className="btn-secondary" onClick={onBack}>← Back</button>
            )}
          </div>
        )}

        {/* Continue / Save Buttons */}
        <div>
          {isSettings ? (
            <button type="button" className="btn-primary" onClick={() => handleSave(false)}>Save Settings</button>
          ) : (
            subStep < 3 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  handleSave(false);
                  setSubStep(subStep + 1);
                }}
              >
                Continue →
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => handleSave(true)}>Complete Onboarding →</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function Platforms({ onBack, onNext, isSettings = false }: { onBack?: () => void, onNext?: () => void, isSettings?: boolean }) {
  const [isFbConnected, setIsFbConnected] = useState(false);
  const [fbPageName, setFbPageName] = useState("");
  const [isIgConnected, setIsIgConnected] = useState(false);
  const [isConnectingFb, setIsConnectingFb] = useState(false);
  const [isConnectingIg, setIsConnectingIg] = useState(false);
  const [fbUserAccessToken, setFbUserAccessToken] = useState("");
  const [fbTokenInfo, setFbTokenInfo] = useState<{
    tokenValid?: boolean;
    expiresInDays?: number | null;
    expiresAt?: string | null;
    errorMessage?: string | null;
  }>({});

  // New state for Page Selection
  const [fbPages, setFbPages] = useState<any[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState("");

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    console.log("Next.js injected App ID:", appId);

    if (appId) {
      // Setup the initialization callback
      (window as any).fbAsyncInit = function () {
        console.log("FB SDK executing fbAsyncInit");
        (window as any).FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
      };

      // In case the script loaded BEFORE this component mounted
      if ((window as any).FB && !(window as any).FB._initialized) {
        console.log("FB already loaded, calling init manually");
        (window as any).FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
      }
    } else {
      console.warn("Facebook SDK Initialization Skipped: NEXT_PUBLIC_META_APP_ID is missing from .env.local");
      // Define a dummy fbAsyncInit so the FB script doesn't crash when it runs
      (window as any).fbAsyncInit = function () { };
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

  const checkConnection = async () => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch(`/api/meta/status?tenant_id=${savedTenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setIsFbConnected(true);
          setFbPageName(data.page_name);
          setFbTokenInfo({
            tokenValid: data.token_valid,
            expiresInDays: data.expires_in_days,
            expiresAt: data.expires_at,
            errorMessage: data.error_message
          });
        } else {
          setIsFbConnected(false);
          setFbPageName('');
          setFbTokenInfo({});
        }
        if (data.has_instagram) {
          setIsIgConnected(true);
        } else {
          setIsIgConnected(false);
        }
      }
    } catch (e) {
      console.error("Failed to check meta status", e);
    }
  };

  useEffect(() => {
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
              setFbUserAccessToken(response.authResponse.accessToken);
              try {
                const pagesRes = await fetch(`/api/meta/pages?user_access_token=${response.authResponse.accessToken}`);
                if (!pagesRes.ok) throw new Error("Failed to fetch pages");

                const pagesData = await pagesRes.json();

                if (pagesData.data && pagesData.data.length > 0) {
                  const pagesWithUserToken = pagesData.data.map((p: any) => ({
                    ...p,
                    user_access_token: response.authResponse.accessToken
                  }));
                  setFbPages(pagesWithUserToken);
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
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const connectRes = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
          page_id: selectedPage.id,
          page_name: selectedPage.name,
          access_token: selectedPage.access_token,
          user_access_token: selectedPage.user_access_token || fbUserAccessToken || undefined
        })
      });

      if (connectRes.ok) {
        setIsFbConnected(true);
        setFbPageName(selectedPage.name);
        setShowPageSelector(false);
        await checkConnection();
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
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch('/api/meta/connect-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: parseInt(savedTenantId, 10) })
      });
      if (res.ok) {
        setIsIgConnected(true);
        notifySuccess("Instagram Business account connected! 🎉");
      } else {
        const errorData = await res.json().catch(() => ({}));
        notifyError(errorData.detail || "Failed to connect Instagram account");
      }
    } catch (err) {
      console.error("Instagram connect error", err);
      notifyError("Error connecting Instagram account");
    } finally {
      setIsConnectingIg(false);
    }
  };

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Connect Platforms</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>Link your social accounts to publish AI campaigns directly.</p>

      {showPageSelector && (
        <div className="glass-panel" style={{ marginBottom: '40px', padding: '24px', borderRadius: '16px', border: '1px solid var(--primary-color)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-color)' }}>Select Facebook Page</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>Choose which Facebook Page you want to connect to DigiM app.</p>
          <select
            className="input-field"
            value={selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
            style={{ marginBottom: '24px' }}
          >
            {fbPages.map(page => (
              <option key={page.id} value={page.id} style={{ background: 'var(--bg-dark)', color: 'var(--text-color)' }}>{page.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={handleConfirmPage} style={{ padding: '12px 24px', borderRadius: '10px' }}>Confirm & Connect</button>
            <button className="btn-secondary" onClick={() => setShowPageSelector(false)} style={{ padding: '12px 24px', borderRadius: '10px' }}>Cancel</button>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontWeight: 600, fontSize: '16px', color: isFbConnected ? (fbTokenInfo.tokenValid === false ? '#ef4444' : 'var(--primary-color)') : 'var(--text-color)' }}>
                  Facebook Page
                </h4>
                {isFbConnected && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: fbTokenInfo.tokenValid === false ? 'rgba(239, 68, 68, 0.2)' : 'rgba(82, 183, 136, 0.2)',
                    color: fbTokenInfo.tokenValid === false ? '#f87171' : '#52b788'
                  }}>
                    {fbTokenInfo.tokenValid === false ? '❌ Session Expired' : '✓ Connected'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: isFbConnected ? 'var(--text-color)' : 'var(--text-light)', marginTop: '2px' }}>
                {isFbConnected ? `Connected as ${fbPageName}` : 'Ready to connect'}
              </p>
              {isFbConnected && (
                <div style={{ marginTop: '6px', fontSize: '11px', lineHeight: '1.4' }}>
                  {fbTokenInfo.tokenValid === false ? (
                    <span style={{ color: '#f87171', fontWeight: 600 }}>
                      ⚠️ Session expired{fbTokenInfo.expiresAt ? ` on ${fbTokenInfo.expiresAt}` : ''}. Click <strong>Re-connect</strong> to restore auto-publishing.
                    </span>
                  ) : fbTokenInfo.expiresInDays !== null && fbTokenInfo.expiresInDays !== undefined ? (
                    <span style={{ color: fbTokenInfo.expiresInDays <= 3 ? '#fbbf24' : 'var(--text-light)' }}>
                      ⏳ Token valid for <strong>{fbTokenInfo.expiresInDays} day(s)</strong> {fbTokenInfo.expiresAt ? `(expires ${fbTokenInfo.expiresAt})` : ''}
                      {fbTokenInfo.expiresInDays <= 3 && ' — Re-connect soon to renew.'}
                    </span>
                  ) : (
                    <span style={{ color: '#52b788' }}>
                      ♾️ Permanent Token (Non-expiring)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isFbConnected && (
              <button
                className="btn-secondary"
                onClick={async () => {
                  try {
                    const savedTenantId = localStorage.getItem('tenant_id') || '1';
                    await fetch(`/api/meta/disconnect?tenant_id=${savedTenantId}&platform=facebook`, { method: 'POST' });
                  } catch (e) { console.error(e); }
                  setIsFbConnected(false);
                  setFbPageName('');
                  setIsIgConnected(false);
                }}
                style={{ padding: '10px 14px', fontSize: '13px', color: '#ef4444', borderColor: '#ef4444', background: 'rgba(239,68,68,0.07)' }}
              >
                Disconnect
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => {
                setIsFbConnected(false);
                connectFacebook();
              }}
              disabled={isConnectingFb}
              style={isFbConnected ? { padding: '10px 20px', fontSize: '14px', color: 'var(--primary-color)', borderColor: 'var(--primary-color)', background: 'rgba(82, 183, 136, 0.1)' } : { padding: '10px 20px', fontSize: '14px' }}
            >
              {isConnectingFb ? 'Connecting...' : (isFbConnected ? '✓ Change Page' : 'Connect')}
            </button>
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isIgConnected && (
              <button
                className="btn-secondary"
                onClick={async () => {
                  try {
                    const savedTenantId = localStorage.getItem('tenant_id') || '1';
                    await fetch(`/api/meta/disconnect?tenant_id=${savedTenantId}&platform=instagram`, { method: 'POST' });
                  } catch (e) { console.error(e); }
                  setIsIgConnected(false);
                }}
                style={{ padding: '10px 14px', fontSize: '13px', color: '#ef4444', borderColor: '#ef4444', background: 'rgba(239,68,68,0.07)' }}
              >
                Disconnect
              </button>
            )}
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
          {onNext && <button className="btn-primary" onClick={() => { localStorage.setItem('onboarding_completed', 'true'); onNext(); }}>{(isFbConnected || isIgConnected) ? 'Continue →' : 'Skip & Continue →'}</button>}
        </div>
      )}
    </div>
  );
}

function MetaPostScheduler({
  onSchedule,
  onCancel,
  initialValue
}: {
  onSchedule: (isoString: string) => void;
  onCancel?: () => void;
  initialValue?: string;
}) {
  const now = new Date();
  const defaultDt = initialValue ? new Date(initialValue) : new Date(now.getTime() + 24 * 3600 * 1000);
  if (isNaN(defaultDt.getTime())) {
    defaultDt.setTime(now.getTime() + 24 * 3600 * 1000);
  }

  const [selectedDate, setSelectedDate] = useState<Date>(defaultDt);
  const [hour, setHour] = useState<number>(defaultDt.getHours());
  const [minute, setMinute] = useState<number>(Math.floor(defaultDt.getMinutes() / 5) * 5);
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

  const [calMonth, setCalMonth] = useState<number>(defaultDt.getMonth());
  const [calYear, setCalYear] = useState<number>(defaultDt.getFullYear());

  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthNamesFull = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dateLabel = `${selectedDate.getDate()} ${monthNamesShort[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const handleSelectDay = (dayNum: number) => {
    const d = new Date(calYear, calMonth, dayNum, hour, minute);
    setSelectedDate(d);
    setActivePicker(null);
  };

  const isDaySelected = (dayNum: number) => {
    return (
      selectedDate.getDate() === dayNum &&
      selectedDate.getMonth() === calMonth &&
      selectedDate.getFullYear() === calYear
    );
  };

  const isDayDisabled = (dayNum: number) => {
    const d = new Date(calYear, calMonth, dayNum, 23, 59, 59);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return d < todayStart;
  };

  const handleConfirm = () => {
    const finalDt = new Date(selectedDate);
    finalDt.setHours(hour, minute, 0, 0);
    const yr = finalDt.getFullYear();
    const mo = String(finalDt.getMonth() + 1).padStart(2, '0');
    const da = String(finalDt.getDate()).padStart(2, '0');
    const ho = String(finalDt.getHours()).padStart(2, '0');
    const mi = String(finalDt.getMinutes()).padStart(2, '0');
    const isoString = `${yr}-${mo}-${da}T${ho}:${mi}`;
    onSchedule(isoString);
  };

  return (
    <div style={{
      background: '#1c1e21',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      padding: '20px',
      marginTop: '12px',
      color: '#e4e6eb',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      animation: 'fadeInUp 0.2s ease-out'
    }}>
      <div style={{ fontSize: '13px', color: '#e4e6eb', marginBottom: '16px', lineHeight: '1.4', fontWeight: 500 }}>
        Choose a date and time for your post. All times are in <strong style={{ color: '#52b788' }}>IST (India Standard Time)</strong>.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Date Box */}
        <div
          onClick={() => setActivePicker(activePicker === 'date' ? null : 'date')}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: activePicker === 'date' ? '2px solid #1877f2' : '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '12px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '20px', color: '#1877f2' }}>📅</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#b0b3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{dateLabel}</span>
          </div>
        </div>

        {/* Time Box */}
        <div
          onClick={() => setActivePicker(activePicker === 'time' ? null : 'time')}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: activePicker === 'time' ? '2px solid #1877f2' : '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            padding: '12px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ fontSize: '20px', color: '#1877f2' }}>🕒</div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#b0b3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time <span style={{ color: '#52b788', textTransform: 'none' }}>(IST)</span></span>
            <input
              type="time"
              value={`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}
              onClick={e => e.stopPropagation()}
              onChange={e => {
                const [h, m] = e.target.value.split(':').map(Number);
                if (!isNaN(h)) setHour(h);
                if (!isNaN(m)) setMinute(m);
              }}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '15px', fontWeight: 700, padding: 0, colorScheme: 'dark', cursor: 'pointer', width: '100%' }}
            />
          </div>
        </div>

      </div>

      {/* Popover 1: Date Calendar Picker */}
      {activePicker === 'date' && (
        <div style={{
          marginTop: '14px',
          background: '#242526',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#ffffff', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ‹
            </button>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
              {monthNamesFull[calMonth]} {calYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#ffffff', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ›
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <span key={d} style={{ fontSize: '11px', fontWeight: 700, color: '#b0b3b8' }}>{d}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const disabled = isDayDisabled(dayNum);
              const selected = isDaySelected(dayNum);
              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDay(dayNum)}
                  style={{
                    padding: '8px 0',
                    fontSize: '13px',
                    fontWeight: selected ? 700 : 500,
                    borderRadius: '8px',
                    border: 'none',
                    background: selected ? '#1877f2' : 'transparent',
                    color: selected ? '#ffffff' : (disabled ? 'rgba(255,255,255,0.2)' : '#e4e6eb'),
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Popover 2: Time Picker */}
      {activePicker === 'time' && (
        <div style={{
          marginTop: '14px',
          background: '#242526',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#b0b3b8', display: 'block', marginBottom: '6px' }}>Hour (00 - 23)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                {Array.from({ length: 24 }).map((_, h) => (
                  <button
                    key={`h-${h}`}
                    type="button"
                    onClick={() => { setHour(h); }}
                    style={{
                      padding: '6px 0',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: hour === h ? '1.5px solid #1877f2' : '1px solid rgba(255,255,255,0.1)',
                      background: hour === h ? 'rgba(24, 119, 242, 0.25)' : 'rgba(0,0,0,0.2)',
                      color: hour === h ? '#ffffff' : '#b0b3b8',
                      fontWeight: hour === h ? 700 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#b0b3b8', display: 'block', marginBottom: '6px' }}>Minute</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <button
                    key={`m-${m}`}
                    type="button"
                    onClick={() => { setMinute(m); }}
                    style={{
                      padding: '6px 0',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: minute === m ? '1.5px solid #1877f2' : '1px solid rgba(255,255,255,0.1)',
                      background: minute === m ? 'rgba(24, 119, 242, 0.25)' : 'rgba(0,0,0,0.2)',
                      color: minute === m ? '#ffffff' : '#b0b3b8',
                      fontWeight: minute === m ? 700 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePicker(null)}
            style={{ marginTop: '14px', width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Done selecting time
          </button>
        </div>
      )}

      <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #1877f2 0%, #0064e0 100%)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(24, 119, 242, 0.4)',
            transition: 'all 0.15s ease'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function SocialFeedPreviewModal({
  isOpen,
  onClose,
  imageUrl,
  caption,
  businessName = "",
  logoUrl = ""
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  caption: string;
  businessName?: string;
  logoUrl?: string;
}) {
  const [platform, setPlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  if (!isOpen) return null;

  const displayName = businessName
    || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('businessProfile') || '{}').businessName : '')
    || 'Your Brand';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px 20px', overflowY: 'auto' }}>
      <div style={{ background: '#18191a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '520px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setPlatform('facebook')}
              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: platform === 'facebook' ? '#1877f2' : 'transparent', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📘 Facebook Feed
            </button>
            <button
              onClick={() => setPlatform('instagram')}
              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: platform === 'instagram' ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' : 'transparent', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📸 Instagram Feed
            </button>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e4e6eb', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ background: platform === 'facebook' ? '#242526' : '#000000', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', color: '#e4e6eb' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #52b788 0%, #1b4332 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: '#fff' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#f0f2f5' }}>{displayName}</div>
                  <div style={{ fontSize: '11px', color: '#b0b3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Sponsored • 🌐
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '18px', color: '#b0b3b8', cursor: 'pointer' }}>•••</span>
            </div>

            {imageUrl ? (
              <div style={{ width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={imageUrl} alt="Post creative" style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }} />
              </div>
            ) : (
              <div style={{ height: '240px', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#b0b3b8', gap: '8px' }}>
                <span style={{ fontSize: '32px' }}>🖼️</span>
                <span style={{ fontSize: '13px' }}>Creative asset image will appear here</span>
              </div>
            )}

            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: '#b0b3b8' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setLiked(!liked)} style={{ background: 'none', border: 'none', color: liked ? '#1877f2' : '#b0b3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  {liked ? '👍 Liked' : '👍 Like'}
                </button>
                <button style={{ background: 'none', border: 'none', color: '#b0b3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  💬 Comment
                </button>
                <button style={{ background: 'none', border: 'none', color: '#b0b3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  ↗️ Share
                </button>
              </div>
              <button onClick={() => setSaved(!saved)} style={{ background: 'none', border: 'none', color: saved ? '#f59e0b' : '#b0b3b8', cursor: 'pointer', fontSize: '13px' }}>
                {saved ? '🔖 Saved' : '🔖 Save'}
              </button>
            </div>

            <div style={{ padding: '12px 16px 16px', fontSize: '13px', lineHeight: '1.6', color: '#e4e6eb' }}>
              <span style={{ fontWeight: 700, marginRight: '8px' }}>{displayName}</span>
              {caption.length > 180 && !showFullCaption ? (
                <>
                  {caption.slice(0, 180)}...
                  <button onClick={() => setShowFullCaption(true)} style={{ background: 'none', border: 'none', color: '#b0b3b8', cursor: 'pointer', fontWeight: 600, paddingLeft: '4px' }}>
                    See more
                  </button>
                </>
              ) : (
                <span>{caption}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduledPostInspectorModal({
  campaign,
  onClose,
  onEditInDashboard,
  onDelete
}: {
  campaign: any;
  onClose: () => void;
  onEditInDashboard: (c: any) => void;
  onDelete: (id: number) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  if (!campaign) return null;

  const dateStr = campaign.scheduled_time
    ? new Date(campaign.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: getBizTimezone() })
    : 'Draft / Unscheduled';

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this scheduled post?")) return;
    setIsDeleting(true);
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/campaigns/${campaign.id}?tenant_id=${savedTenantId}`, { method: 'DELETE' });
      if (response.ok) {
        window.showNotification?.("Scheduled post deleted successfully", "success");
        onDelete(campaign.id);
        onClose();
      } else {
        window.showNotification?.("Failed to delete post", "error");
      }
    } catch (err) {
      console.error(err);
      window.showNotification?.("Error deleting post", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px 20px', overflowY: 'auto' }}>
      <div style={{ background: '#18191a', borderRadius: '16px', border: '1px solid rgba(82, 183, 136, 0.25)', width: '100%', maxWidth: '540px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9)', marginTop: '0px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scheduled Post Draft Inspector
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
              📅 {dateStr}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e4e6eb', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          {campaign.status === 'failed' && (
            <div style={{ marginBottom: '16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '12px 16px', borderRadius: '12px', color: '#fca5a5' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>❌ Post Publishing Failed</span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                {campaign.failure_reason || "Facebook returned an error while attempting to auto-publish."}
              </div>
              {(campaign.failure_reason || '').toLowerCase().includes('session expired') && (
                <div style={{ marginTop: '10px' }}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onClose(); if (typeof window !== 'undefined') window.location.hash = '#settings'; }}
                    style={{ background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
                  >
                    🔗 Reconnect Facebook Account
                  </a>
                </div>
              )}
            </div>
          )}
          {/* Draft Post Card Preview */}
          <div style={{ background: '#242526', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', color: '#e4e6eb', marginBottom: '20px' }}>
            {/* Post header with business name */}
            {(() => {
              const bizName = typeof window !== 'undefined'
                ? (JSON.parse(localStorage.getItem('businessProfile') || '{}').businessName || 'Your Brand')
                : 'Your Brand';
              const logoUrl = typeof window !== 'undefined' ? localStorage.getItem('brand_logo_url') || '' : '';
              return (
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #52b788 0%, #1b4332 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff' }}>
                      {bizName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#f0f2f5' }}>{bizName}</div>
                    <div style={{ fontSize: '10px', color: '#b0b3b8' }}>Sponsored • 🌐</div>
                  </div>
                </div>
              );
            })()}
            {(campaign.image_url || (campaign.visual_suggestion && (campaign.visual_suggestion.startsWith('/') || campaign.visual_suggestion.startsWith('http')))) ? (
              <div style={{ width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={campaign.image_url || campaign.visual_suggestion} alt="Scheduled post visual" style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }} />
              </div>
            ) : (
              <div style={{ height: '180px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b3b8' }}>
                No image attached
              </div>
            )}
            <div style={{ padding: '14px 16px', fontSize: '13px', lineHeight: '1.6' }}>
              {campaign.generated_text || campaign.prompt}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                onEditInDashboard(campaign);
                onClose();
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px var(--primary-glow)'
              }}
            >
              ✏️ Edit Post Content
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isDeleting ? 'not-allowed' : 'pointer'
              }}
            >
              🗑️ Delete Post
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// DIGIM POST COMPOSER (Redesigned with Complete Prototype Experience)
// ============================================================================

const COMPOSER_ICONS: Record<string, string> = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  hanger: '<path d="M12 7a2 2 0 1 1 2-2c0 1-2 1.5-2 3"/><path d="M12 8L3 15h18z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z"/>',
  lamp: '<path d="M4 15c0 3 3.6 5 8 5s8-2 8-5H4z"/><path d="M12 15c-2-2-1.5-4.5 0-7 1.5 2.5 2 5 0 7z"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  clapper: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 9l2-5 16 2-1.5 3M8 4.5l1.5 4.5M14 5.5l1.5 3.5"/>',
  megaphone: '<path d="M3 10v4h4l8 5V5L7 10z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  send: '<path d="M4 12h12M11 6l6 6-6 6"/><path d="M20 4v16"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  heart: '<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/>',
  share: '<path d="M4 12v7h16v-7M12 3v12M7 8l5-5 5 5"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5.5 5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  square: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
  film: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 9l4 3-4 3z"/>',
  layers: '<rect x="7" y="3" width="11" height="18" rx="2"/><path d="M4 6v12M21 6v12"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',
  wand: '<path d="M4 20L16 8M14 4v2M18 6h2M18 10v2M20 4l-1.5 1.5"/>',
  hash: '<path d="M5 9h15M4 15h15M10 3L8 21M16 3l-2 18"/>',
  drafts: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>'
};

function ComposerIcon({ name, size = 20, className = '', strokeWidth = 2 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const path = COMPOSER_ICONS[name] || '';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      className={className}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

const COMPOSER_CATEGORIES = [
  {
    id: "summer",
    label: "Summer Sale",
    icon: "sun",
    prompt: "Announce our summer clearance sale with up to 30% off all cotton sarees and lightweight ethnic wear this week only.",
    caption: "Beat the heat with our Summer Sale! Up to 30% off cotton sarees and kurtas at SriKrish. This week only, visit us in-store.",
    tags: ["#SummerSale", "#CottonSarees", "#ShopLocal", "#SriKrish"]
  },
  {
    id: "collection",
    label: "New Collection",
    icon: "hanger",
    prompt: "Introduce our fresh new collection in silk and cotton designs, now available at SriKrish.",
    caption: "Our new collection has arrived! Fresh designs in silk and cotton, now at SriKrish. Come and see them first.",
    tags: ["#NewCollection", "#NewArrivals", "#SareeLove", "#ShopLocal"]
  },
  {
    id: "spotlight",
    label: "Customer Spotlight",
    icon: "star",
    prompt: "Share a heartwarming customer appreciation post highlighting their special day wearing our collection.",
    caption: "Thank you for choosing SriKrish for your big day! You looked wonderful. Tag us in your photos to be featured next.",
    tags: ["#CustomerLove", "#HappyCustomers", "#ShopLocal"]
  },
  {
    id: "festival",
    label: "Festival Offer",
    icon: "lamp",
    prompt: "Celebrate the festive season with special discounts on silk sarees all week long.",
    caption: "Celebrate the festive season with us! Special prices on silk sarees all week at SriKrish. Wishing you and your family joy.",
    tags: ["#FestiveOffer", "#FestiveSeason", "#SilkSarees", "#ShopLocal"]
  },
  {
    id: "showcase",
    label: "Product Showcase",
    icon: "bag",
    prompt: "Showcase our handwoven pure silk saree highlighting the craftsmanship and fabric quality.",
    caption: "Meet our signature handloom silk saree: pure zari border, lightweight comfort, and timeless elegance. Available now at SriKrish.",
    tags: ["#ProductShowcase", "#SilkSaree", "#Handloom", "#ShopLocal"]
  },
  {
    id: "bts",
    label: "Behind the Scenes",
    icon: "clapper",
    prompt: "Share a behind the scenes look at how we fold, pack and inspect every saree with care.",
    caption: "A peek behind the counter: this is how we fold, pack and check every saree before it reaches you. Small shop, big care.",
    tags: ["#BehindTheScenes", "#SmallBusiness", "#ShopLocal"]
  },
  {
    id: "promo",
    label: "Promotions",
    icon: "megaphone",
    prompt: "Announce a special weekend flash discount promotion for in-store shoppers.",
    caption: "Special offer at SriKrish! Visit us this weekend and show this post at the counter to claim your exclusive discount.",
    tags: ["#Offer", "#Discount", "#ShopLocal", "#SpecialDeal"]
  },
  {
    id: "info",
    label: "Knowledge Info",
    icon: "bulb",
    prompt: "Share helpful tips on how to identify pure silk and care for handwoven sarees.",
    caption: "How to tell real silk from synthetic: rub the fabric gently. Real silk warms up and feels soft, never slippery. Ask us in store, we are happy to show you.",
    tags: ["#SareeTips", "#SilkCare", "#DidYouKnow", "#ShopLocal"]
  }
];

const COMPOSER_FORMATS = [
  { id: "post", label: "Post", detail: "Square 1:1", icon: "square", ratio: "1 / 1", w: 1080, h: 1080 },
  { id: "reel", label: "Reel", detail: "Video 9:16", icon: "film", ratio: "9 / 16", w: 1080, h: 1920 },
  { id: "story", label: "Story / Carousel", detail: "Slides 9:16", icon: "layers", ratio: "9 / 16", w: 1080, h: 1920 }
];

const COMPOSER_TONES = [
  { id: "casual", label: "Casual", instruction: "more casual, warm and friendly, like a shop owner talking to regular customers" },
  { id: "formal", label: "Formal", instruction: "more formal and polished, without exclamation marks or slang" },
  { id: "shorten", label: "Shorten", instruction: "shorter: about half the length, keeping the key offer or message" },
  { id: "elaborate", label: "Elaborate", instruction: "a little longer: add one or two helpful sentences of detail or a clear call to action" }
];

const PLATFORM_LIMITS: Record<string, { caption: number; tags: number }> = {
  facebook: { caption: 63206, tags: 30 },
  instagram: { caption: 2200, tags: 30 }
};

const COMPOSER_DRAFTS_KEY = "digim-drafts-v1";

const formatComposerWhen = (d: Date) => {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) + ", " +
    d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).replace("am", "AM").replace("pm", "PM");
};

const getNextSaturdayDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  d.setHours(18, 0, 0, 0);
  return d;
};

const toDateInputString = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const normalizeHashtag = (tag: string) => {
  let cleaned = tag.trim().replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '');
  return cleaned ? '#' + cleaned : '';
};

// Vector SVG Sample Library Assets from Prototype
const makeSvgUri = (svgStr: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);

const PROTOTYPE_LIBRARY_ASSETS = [
  {
    id: "saree",
    name: "Silk Saree",
    src: makeSvgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="1000" fill="#f6e3c9"/><g><path d="M230 170 L200 760 L268 760 L290 170 Z" fill="#8a1a45"/><path d="M290 170 L268 760 L336 760 L350 170 Z" fill="#a8245a"/><path d="M350 170 L336 760 L404 760 L410 170 Z" fill="#8a1a45"/><path d="M410 170 L404 760 L472 760 L470 170 Z" fill="#a8245a"/><path d="M470 170 L472 760 L540 760 L530 170 Z" fill="#8a1a45"/><path d="M530 170 L540 760 L608 760 L590 170 Z" fill="#a8245a"/><path d="M590 170 L608 760 L676 760 L650 170 Z" fill="#8a1a45"/><path d="M650 170 L676 760 L744 760 L710 170 Z" fill="#a8245a"/><path d="M710 170 L744 760 L812 760 L770 170 Z" fill="#8a1a45"/></g><path d="M200 760 L812 760 L820 850 L192 850 Z" fill="#e0a526"/><rect x="226" y="150" width="548" height="28" rx="6" fill="#e0a526"/></svg>`)
  },
  {
    id: "sweets",
    name: "Sweets Box",
    src: makeSvgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="1000" fill="#fde6cc"/><rect x="180" y="420" width="640" height="380" rx="24" fill="#c0392b"/><rect x="180" y="420" width="640" height="70" fill="#a03024"/><g fill="#f2b33d"><circle cx="300" cy="380" r="70"/><circle cx="440" cy="360" r="70"/><circle cx="580" cy="370" r="70"/><circle cx="710" cy="385" r="66"/></g><rect x="460" y="420" width="80" height="380" fill="#e8c35a"/></svg>`)
  },
  {
    id: "shop",
    name: "Shop Front",
    src: makeSvgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="1000" fill="#dff1ee"/><rect x="160" y="300" width="680" height="560" fill="#ffffff"/><g fill="#0d6b61"><rect x="160" y="240" width="85" height="120"/><rect x="330" y="240" width="85" height="120"/><rect x="500" y="240" width="85" height="120"/><rect x="670" y="240" width="85" height="120"/></g><rect x="420" y="560" width="160" height="300" fill="#0d6b61"/><rect x="200" y="440" width="180" height="180" fill="#f2a516" opacity=".85"/><rect x="620" y="440" width="180" height="180" fill="#f2a516" opacity=".85"/><rect x="120" y="860" width="760" height="20" fill="#16211f"/></svg>`)
  },
  {
    id: "diya",
    name: "Festival Diyas",
    src: makeSvgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="1000" fill="#2b1638"/><g><path d="M190 640 C210 750 390 750 410 640 Z" fill="#d9822b"/><path d="M300 630 C260 550 290 490 300 450 C310 490 340 550 300 630 Z" fill="#ffcf4a"/><path d="M390 600 C410 710 590 710 610 600 Z" fill="#d9822b"/><path d="M500 590 C460 510 490 450 500 410 C510 450 540 510 500 590 Z" fill="#ffcf4a"/><path d="M590 640 C610 750 790 750 810 640 Z" fill="#d9822b"/><path d="M700 630 C660 550 690 490 700 450 C710 490 740 550 700 630 Z" fill="#ffcf4a"/></g></svg>`)
  },
  {
    id: "gift",
    name: "Gift Box",
    src: makeSvgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="1000" fill="#fbe9ef"/><rect x="250" y="420" width="500" height="400" rx="16" fill="#0d6b61"/><rect x="220" y="340" width="560" height="120" rx="16" fill="#12867a"/><rect x="465" y="340" width="70" height="480" fill="#f2a516"/><path d="M500 340 C420 220 300 260 350 330 Z M500 340 C580 220 700 260 650 330 Z" fill="#f2a516"/></svg>`)
  },
  {
    id: "sunny",
    name: "Summer Sun",
    src: makeSvgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="1000" fill="#bfe6f4"/><circle cx="500" cy="420" r="190" fill="#f9c23c"/><rect x="0" y="780" width="1000" height="220" fill="#f3d9a4"/></svg>`)
  }
];

// ----------------------------------------------------------------------------
// Small Design System Helpers for Composer
// ----------------------------------------------------------------------------

function ComposerBadge({
  kind = "neutral",
  icon,
  children
}: {
  kind?: "neutral" | "ai" | "ok" | "err" | "wait";
  icon?: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    neutral: { bg: "rgba(255,255,255,0.08)", color: "var(--text-light)", border: "rgba(255,255,255,0.12)" },
    ai: { bg: "#f2a516", color: "#16211f", border: "#f2a516" },
    ok: { bg: "rgba(82,183,136,0.18)", color: "var(--primary-color)", border: "rgba(82,183,136,0.35)" },
    err: { bg: "rgba(239,68,68,0.18)", color: "#ef4444", border: "rgba(239,68,68,0.35)" },
    wait: { bg: "rgba(242,165,22,0.18)", color: "#fbbf24", border: "rgba(242,165,22,0.35)" }
  };
  const st = styles[kind] || styles.neutral;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 700,
      background: st.bg,
      color: st.color,
      border: `1px solid ${st.border}`,
      lineHeight: '14px',
      letterSpacing: '0.02em'
    }}>
      {icon && <ComposerIcon name={icon} size={12} />}
      {children}
    </span>
  );
}

function ComposerBtn({
  kind = "primary",
  size = "md",
  icon,
  children,
  onClick,
  disabled = false,
  style = {},
  className = "",
  type = "button"
}: {
  kind?: "primary" | "secondary" | "text" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: string;
  children: React.ReactNode;
  onClick?: (e?: any) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  type?: "button" | "submit";
}) {
  const baseKindStyle: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)",
      color: "#ffffff",
      border: "none",
      boxShadow: "0 2px 10px rgba(82,183,136,0.3)"
    },
    secondary: {
      background: "rgba(255, 255, 255, 0.05)",
      color: "var(--text-color)",
      border: "1px solid rgba(82, 183, 136, 0.25)"
    },
    text: {
      background: "transparent",
      color: "var(--primary-color)",
      border: "none"
    },
    danger: {
      background: "rgba(239, 68, 68, 0.12)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.3)"
    }
  };

  const sizeStyle: Record<string, React.CSSProperties> = {
    sm: { minHeight: "34px", padding: "0 12px", fontSize: "13px" },
    md: { minHeight: "42px", padding: "0 18px", fontSize: "14px" },
    lg: { minHeight: "50px", padding: "0 24px", fontSize: "15px" }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        borderRadius: "10px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
        ...baseKindStyle[kind],
        ...sizeStyle[size],
        ...style
      }}
      className={className}
    >
      {icon && <ComposerIcon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
    </button>
  );
}

function ComposerChip({
  selected,
  icon,
  children,
  onClick,
  disabled = false,
  style = {}
}: {
  selected?: boolean;
  icon?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        minHeight: "38px",
        padding: "0 14px",
        borderRadius: "9999px",
        fontSize: "13px",
        fontWeight: selected ? 700 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        border: selected ? "1.5px solid var(--primary-color)" : "1px solid rgba(255, 255, 255, 0.12)",
        background: selected ? "rgba(82, 183, 136, 0.18)" : "rgba(255, 255, 255, 0.03)",
        color: selected ? "var(--primary-color)" : "var(--text-color)",
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
    >
      {icon && <ComposerIcon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  );
}

function PlatformMarkBadge({ p, size = 26 }: { p: "facebook" | "instagram"; size?: number }) {
  const isFb = p === "facebook";
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "7px",
        background: isFb ? "#1877f2" : "linear-gradient(135deg,#f9a03f,#d92e7f 55%,#7b3fe4)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: size * 0.55,
        lineHeight: 1,
        flexShrink: 0
      }}
    >
      {isFb ? "f" : <span style={{ width: size * 0.5, height: size * 0.5, border: "2px solid #ffffff", borderRadius: "30%", display: "block" }} />}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Preview & Range Subcomponents
// ----------------------------------------------------------------------------

function AgeRangeSliderControl({
  min,
  max,
  onChange
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Target Age Range:</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color)' }}>
          {min} – {max >= 65 ? '65+' : max} years
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Min Age: {min}</span>
          <input
            type="range"
            min={18}
            max={65}
            value={min}
            onChange={(e) => {
              const val = Math.min(parseInt(e.target.value, 10), max - 1);
              onChange(val, max);
            }}
          />
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Max Age: {max >= 65 ? '65+' : max}</span>
          <input
            type="range"
            min={18}
            max={65}
            value={max}
            onChange={(e) => {
              const val = Math.max(parseInt(e.target.value, 10), min + 1);
              onChange(min, val);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function FeedPostPreview({
  platform,
  shopName,
  shopHandle,
  caption,
  tags,
  mediaUrl,
  whenLabel,
  onImageClick,
  imageFit = 'cover'
}: {
  platform: 'facebook' | 'instagram';
  shopName: string;
  shopHandle: string;
  caption: string;
  tags: string[];
  mediaUrl: string | null;
  whenLabel: string;
  onImageClick?: () => void;
  imageFit?: 'cover' | 'contain';
}) {
  const [expanded, setExpanded] = useState(false);
  const isFb = platform === 'facebook';
  const fullText = caption + (tags.length ? `\n\n` + tags.join(' ') : '');
  const limit = isFb ? 180 : 100;
  const isLong = fullText.length > limit;
  const displayText = expanded || !isLong ? caption : caption.slice(0, limit).trimEnd();

  if (isFb) {
    return (
      <article style={{
        background: '#ffffff',
        color: '#050505',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--primary-color)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '18px',
            flexShrink: 0
          }}>
            {shopName ? shopName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shopName || 'SriKrish'}
            </div>
            <div style={{ fontSize: '12px', color: '#65676b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span>{whenLabel}</span>
              <span>•</span>
              <ComposerIcon name="globe" size={12} />
            </div>
          </div>
          <ComposerIcon name="more" size={20} className="text-[#65676b]" />
        </header>

        <div style={{ padding: '0 12px 10px', fontSize: '14px', lineHeight: 1.45, color: '#050505', whiteSpace: 'pre-line' }}>
          {typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? null : displayText}
          {isLong && !expanded && (
            <span>
              ... <button type="button" onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', color: '#65676b', fontWeight: 600, cursor: 'pointer', padding: 0 }}>See more</button>
            </span>
          )}
          {(expanded || !isLong) && tags.length > 0 && (
            <div style={{ marginTop: '8px', color: '#1877f2' }}>
              {tags.join(' ')}
            </div>
          )}
        </div>

        <div
          onClick={onImageClick}
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            background: '#e4e6eb',
            position: 'relative',
            overflow: 'hidden',
            cursor: mediaUrl ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {mediaUrl ? (
            mediaUrl.endsWith('.mp4') ? (
              <video src={mediaUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: imageFit }} />
            ) : (
              <img src={mediaUrl} alt="Post creative" style={{ width: '100%', height: '100%', objectFit: imageFit }} />
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#65676b', padding: '16px' }}>
              <ComposerIcon name="image" size={40} />
              <div style={{ fontSize: '13px', marginTop: '6px' }}>No image selected yet</div>
            </div>
          )}
        </div>

        <footer style={{
          display: 'flex',
          justifyContent: 'space-around',
          borderTop: '1px solid #ced0d4',
          margin: '0 8px',
          padding: '6px 0',
          color: '#65676b',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px' }}>
            <ComposerIcon name="heart" size={18} /> Like
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px' }}>
            <ComposerIcon name="msg" size={18} /> Comment
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px' }}>
            <ComposerIcon name="share" size={18} /> Share
          </span>
        </footer>
      </article>
    );
  }

  // Instagram Feed View
  return (
    <article style={{
      background: '#ffffff',
      color: '#000000',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
        <div style={{
          padding: '2px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg,#f9a03f,#d92e7f,#7b3fe4)',
          display: 'inline-flex'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--primary-color)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            border: '2px solid #ffffff'
          }}>
            {shopName ? shopName.charAt(0).toUpperCase() : 'S'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: '13px', color: '#000000' }}>
          {shopHandle || 'srikrish.official'}
        </div>
        <ComposerIcon name="more" size={18} />
      </header>

      <div
        onClick={onImageClick}
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          background: '#efefef',
          position: 'relative',
          overflow: 'hidden',
          cursor: mediaUrl ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {mediaUrl ? (
          mediaUrl.endsWith('.mp4') ? (
            <video src={mediaUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: imageFit }} />
          ) : (
            <img src={mediaUrl} alt="Post creative" style={{ width: '100%', height: '100%', objectFit: imageFit }} />
          )
        ) : (
          <div style={{ textAlign: 'center', color: '#8e8e8e', padding: '16px' }}>
            <ComposerIcon name="image" size={36} />
            <div style={{ fontSize: '12px', marginTop: '6px' }}>No visual selected</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 12px 6px' }}>
        <ComposerIcon name="heart" size={22} />
        <ComposerIcon name="msg" size={22} />
        <ComposerIcon name="send" size={22} />
        <div style={{ flex: 1 }} />
        <ComposerIcon name="bookmark" size={22} />
      </div>

      <div style={{ padding: '0 12px 12px', fontSize: '13px', lineHeight: 1.4, color: '#262626' }}>
        <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '12px' }}>Liked by customers and others</div>
        <span style={{ fontWeight: 700, marginRight: '6px' }}>{shopHandle || 'srikrish.official'}</span>
        <span>{typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? null : displayText}</span>
        {isLong && !expanded && (
          <span>
            ... <button type="button" onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', color: '#8e8e8e', fontWeight: 600, cursor: 'pointer', padding: 0 }}>more</button>
          </span>
        )}
        {(expanded || !isLong) && tags.length > 0 && (
          <div style={{ marginTop: '4px', color: '#00376b' }}>
            {tags.join(' ')}
          </div>
        )}
      </div>
    </article>
  );
}

function TallPostPreview({
  platform,
  shopName,
  shopHandle,
  format,
  caption,
  tags,
  slides,
  onImageClick
}: {
  platform: 'facebook' | 'instagram';
  shopName: string;
  shopHandle: string;
  format: 'reel' | 'story';
  caption: string;
  tags: string[];
  slides: any[];
  onImageClick?: () => void;
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const isStory = format === 'story';
  const currentSlide = slides[activeSlide] || slides[0] || null;

  return (
    <article style={{
      position: 'relative',
      background: '#000000',
      color: '#ffffff',
      borderRadius: '16px',
      overflow: 'hidden',
      aspectRatio: '9 / 16',
      width: '100%',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Background Media */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onImageClick}>
        {currentSlide && currentSlide.src ? (
          currentSlide.video || currentSlide.src.endsWith('.mp4') ? (
            <video src={currentSlide.src} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={currentSlide.src} alt={currentSlide.name || "Slide"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)' }}>
            <ComposerIcon name={isStory ? "layers" : "film"} size={36} />
            <span style={{ fontSize: '13px' }}>Add {isStory ? "slides" : "a video/cover"}</span>
          </div>
        )}
      </div>

      {/* Gradient Overlays */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Story Progress Indicators */}
      {isStory && slides.length > 0 && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', gap: '4px', zIndex: 10 }}>
          {slides.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '9999px',
                background: idx <= activeSlide ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                transition: 'background 0.2s ease'
              }}
            />
          ))}
        </div>
      )}

      {/* Story Tap Navigation */}
      {isStory && slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
            style={{ position: 'absolute', left: 0, top: '48px', bottom: '80px', width: '35%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 5 }}
          />
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
            style={{ position: 'absolute', right: 0, top: '48px', bottom: '80px', width: '35%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 5 }}
          />
        </>
      )}

      {/* Header Info */}
      <header style={{ position: 'absolute', top: isStory ? '22px' : '14px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--primary-color)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          border: '1.5px solid rgba(255,255,255,0.7)'
        }}>
          {shopName ? shopName.charAt(0).toUpperCase() : 'S'}
        </div>
        <span style={{ fontWeight: 700, fontSize: '13px' }}>
          {platform === 'instagram' ? (shopHandle || 'srikrish.official') : (shopName || 'SriKrish')}
        </span>
        <span style={{ fontSize: '11px', opacity: 0.8 }}>{isStory ? 'Story' : 'Reel'}</span>
        <div style={{ flex: 1 }} />
        <ComposerIcon name="more" size={18} />
      </header>

      {/* Reel Play Badge */}
      {!isStory && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ComposerIcon name="play" size={24} />
          </div>
        </div>
      )}

      {/* Reel Actions on Right */}
      {!isStory && (
        <div style={{ position: 'absolute', right: '10px', bottom: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <ComposerIcon name="heart" size={24} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Like</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <ComposerIcon name="msg" size={24} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Comment</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <ComposerIcon name="send" size={24} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Share</span>
          </div>
        </div>
      )}

      {/* Bottom Content / Caption */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: isStory ? '12px' : '64px', zIndex: 10, fontSize: '13px', lineHeight: 1.35 }}>
        {isStory ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, minHeight: '38px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.7)', padding: '0 14px', display: 'flex', alignItems: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
              Send message...
            </div>
            <ComposerIcon name="heart" size={22} />
            <ComposerIcon name="send" size={22} />
          </div>
        ) : (
          <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            <span style={{ fontWeight: 700, marginRight: '6px' }}>{shopName || 'SriKrish'}</span>
            <span>{caption}</span>
            {tags.length > 0 && <span style={{ opacity: 0.9 }}> {tags.join(' ')}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

// ----------------------------------------------------------------------------
// Modals & Drawers
// ----------------------------------------------------------------------------

function DraftsPanelDrawer({
  isOpen,
  onClose,
  drafts,
  currentDraftId,
  onSelectDraft,
  onDeleteDraft,
  onNewPost
}: {
  isOpen: boolean;
  onClose: () => void;
  drafts: any[];
  currentDraftId: string;
  onSelectDraft: (draft: any) => void;
  onDeleteDraft: (id: string) => void;
  onNewPost: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          background: 'var(--glass-bg)',
          borderLeft: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          animation: 'slideInRight 0.25s ease-out'
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px 0' }}>Saved Drafts ({drafts.length})</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Resume any previously drafted post</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            ✕
          </button>
        </header>

        <div style={{ padding: '16px 24px' }}>
          <ComposerBtn
            kind="primary"
            size="md"
            icon="plus"
            style={{ width: '100%' }}
            onClick={() => {
              onNewPost();
              onClose();
            }}
          >
            Start New Post
          </ComposerBtn>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {drafts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-light)' }}>
              <ComposerIcon name="drafts" size={36} />
              <div style={{ marginTop: '12px', fontWeight: 600, fontSize: '14px' }}>No drafts yet</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Changes you make in the composer are auto-saved here.</div>
            </div>
          ) : (
            drafts.map((d) => {
              const isCurrent = d.id === currentDraftId;
              const dateStr = d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Saved draft';
              const thumb = d.state?.media?.[0]?.src || d.state?.master?.media?.[0]?.src || null;
              const snippet = d.state?.caption || d.state?.master?.caption || d.state?.prompt || 'Untitled draft';

              return (
                <div
                  key={d.id}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: isCurrent ? '1.5px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.15)',
                    background: isCurrent ? 'rgba(82, 183, 136, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {thumb ? (
                      <img src={thumb} alt="Draft thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ComposerIcon name="image" size={24} className="text-white/40" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {snippet}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                      {dateStr}
                    </div>
                    {isCurrent && (
                      <span style={{ fontSize: '10px', color: 'var(--primary-color)', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                        ● Active in editor
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDraft(d);
                        onClose();
                      }}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--primary-color)', color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDraft(d.id)}
                      title="Delete draft"
                      style={{ padding: '4px 8px', borderRadius: '6px', background: 'transparent', color: '#ef4444', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                    >
                      <ComposerIcon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function LibraryModalDialog({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  onUpload
}: {
  isOpen: boolean;
  onClose: () => void;
  assets: any[];
  onSelectAsset: (item: any) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const combinedAssets = [
    ...assets.map(a => ({
      id: a.id || a.url,
      name: a.name || a.filename || 'Uploaded asset',
      src: a.url,
      source: 'library' as const,
      video: (a.url || '').endsWith('.mp4')
    })),
    ...PROTOTYPE_LIBRARY_ASSETS.map(p => ({
      id: p.id,
      name: p.name,
      src: p.src,
      source: 'library' as const,
      video: false
    }))
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(6px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '680px',
        maxHeight: '85vh',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Media Library</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Choose from your store assets or prototype library</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            Showing {combinedAssets.length} assets
          </span>
          <ComposerBtn
            kind="secondary"
            size="sm"
            icon="upload"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload New File
          </ComposerBtn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              onUpload(e);
            }}
          />
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px',
          padding: '4px'
        }}>
          {combinedAssets.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectAsset(item);
                onClose();
              }}
              style={{
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(82, 183, 136, 0.2)',
                background: 'rgba(0,0,0,0.3)',
                aspectRatio: '1 / 1',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(82, 183, 136, 0.2)';
              }}
            >
              {item.video || (item.src || '').endsWith('.mp4') ? (
                <video src={item.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={item.src} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AiModalDialog({
  isOpen,
  onClose,
  format,
  onFormatChange,
  prompt,
  onPromptChange,
  style,
  onStyleChange,
  isGenerating,
  generatedImage,
  onGenerate,
  onUseImage
}: {
  isOpen: boolean;
  onClose: () => void;
  format: 'post' | 'reel' | 'story';
  onFormatChange: (f: 'post' | 'reel' | 'story') => void;
  prompt: string;
  onPromptChange: (p: string) => void;
  style: string;
  onStyleChange: (s: string) => void;
  isGenerating: boolean;
  generatedImage: string | null;
  onGenerate: () => void;
  onUseImage: (url: string) => void;
}) {
  if (!isOpen) return null;

  const STYLES = ['Flat illustration', 'Bold poster', 'Soft pastel', 'Photorealistic'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(6px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '720px',
        maxHeight: '85vh',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Generate an image with AI</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Create custom visual creative for your campaign</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '24px', flex: 1, overflowY: 'auto' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                Content Format
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {COMPOSER_FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => onFormatChange(fmt.id as any)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: format === fmt.id ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.2)',
                      background: format === fmt.id ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: format === fmt.id ? 'var(--primary-color)' : 'var(--text-color)',
                      fontWeight: 600,
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <ComposerIcon name={fmt.icon} size={20} />
                    <span>{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                Describe the image
              </span>
              <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                rows={4}
                className="input-field"
                placeholder="Mention colours, products, ethnic details and the mood you want..."
                style={{ fontSize: '13px', lineHeight: 1.5 }}
              />
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                Visual Style
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {STYLES.map((st) => (
                  <ComposerChip
                    key={st}
                    selected={style === st}
                    onClick={() => onStyleChange(st)}
                  >
                    {st}
                  </ComposerChip>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', display: 'block', textTransform: 'uppercase' }}>
              Preview Result
            </span>
            <div style={{
              width: '100%',
              aspectRatio: format === 'post' ? '1 / 1' : '9 / 16',
              maxHeight: '320px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.4)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {isGenerating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Creating visual...</span>
                </div>
              ) : generatedImage ? (
                <img src={generatedImage} alt="Generated AI visual" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '16px' }}>
                  <ComposerIcon name="spark" size={32} />
                  <div style={{ fontSize: '12px', marginTop: '6px' }}>Your AI creative appears here</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
          <ComposerBtn kind="text" size="md" onClick={onClose}>
            Cancel
          </ComposerBtn>

          {generatedImage ? (
            <>
              <ComposerBtn kind="secondary" size="md" icon="refresh" onClick={onGenerate} disabled={isGenerating}>
                Try again
              </ComposerBtn>
              <ComposerBtn kind="primary" size="md" icon="check" onClick={() => { onUseImage(generatedImage); onClose(); }}>
                Use this image
              </ComposerBtn>
            </>
          ) : (
            <ComposerBtn kind="primary" size="md" icon="spark" onClick={onGenerate} disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </ComposerBtn>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main CampaignDashboard Component
// ----------------------------------------------------------------------------

export function CampaignDashboard({
  initialCampaign,
  onClearEdit,
  onNavigateToTab
}: {
  initialCampaign?: any;
  onClearEdit?: () => void;
  onNavigateToTab?: (tab: string) => void;
}) {
  // Campaign ID & Style Learning
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Core Prompt & Goal
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Product Showcase');
  const [selectedCatId, setSelectedCatId] = useState('showcase');
  const [formatType, setFormatType] = useState<'post' | 'reel' | 'story'>('post');
  const [tone, setTone] = useState('casual');
  const [activeToneBusy, setActiveToneBusy] = useState<string | null>(null);

  // Content Tabs & Platform Overrides
  const [activeContentTab, setActiveContentTab] = useState<'all' | 'facebook' | 'instagram'>('all');
  const [caption, setCaption] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [visualSuggestion, setVisualSuggestion] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(['#ProductShowcase', '#SilkSaree', '#Handloom', '#ShopLocal']);
  const [newTagInput, setNewTagInput] = useState('');

  // Per-platform customizations
  const [overrides, setOverrides] = useState<{
    facebook: { caption?: string; tags?: string[]; media?: any[] };
    instagram: { caption?: string; tags?: string[]; media?: any[] };
  }>({
    facebook: {},
    instagram: {}
  });

  // Media Items (Array of slides / items)
  const [mediaItems, setMediaItems] = useState<any[]>([
    {
      id: "init-media-1",
      name: "Silk Saree",
      src: PROTOTYPE_LIBRARY_ASSETS[0].src,
      source: "library" as const,
      video: false
    }
  ]);
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | null>(PROTOTYPE_LIBRARY_ASSETS[0].src);
  const [originalAssetUrl, setOriginalAssetUrl] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [carouselCount, setCarouselCount] = useState(3);
  const [carouselUrls, setCarouselUrls] = useState<string[]>([]);
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');

  // Brand Overlay
  const [hasOverlay, setHasOverlay] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(false);
  const [logoPosition, setLogoPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'bottom-center'>('top-right');
  const [postLogoUrl, setPostLogoUrl] = useState('');
  const postLogoFileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Channels / Where to Post
  const [channels, setChannels] = useState<{ facebook: boolean; instagram: boolean }>({
    facebook: true,
    instagram: true
  });
  const [metaStatus, setMetaStatus] = useState<{ connected: boolean; page_name: string; has_instagram: boolean }>({
    connected: false,
    page_name: '',
    has_instagram: false
  });
  const [publishToIg, setPublishToIg] = useState(true);

  // Audience & Demographics
  const [audience, setAudience] = useState<'all' | 'women' | 'men'>('all');
  const [gender, setGender] = useState('All');
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(60);
  const [freq, setFreq] = useState('3 times a week');
  const [showAudienceSettings, setShowAudienceSettings] = useState(false);

  // Scheduling & When to Post
  const [whenOption, setWhenOption] = useState<'now' | 'schedule'>('now');
  const [publishDate, setPublishDate] = useState(() => toDateInputString(getNextSaturdayDate()));
  const [publishTime, setPublishTime] = useState('18:00');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showScheduleSuccessModal, setShowScheduleSuccessModal] = useState(false);
  const [scheduledLabelForModal, setScheduledLabelForModal] = useState('');

  // Status & Loaders
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [matchRationale, setMatchRationale] = useState('');
  const [recommendAiGen, setRecommendAiGen] = useState(false);
  const [lastSavedDraftTime, setLastSavedDraftTime] = useState<Date | null>(null);

  // Modals & Panels
  const [previewPlatform, setPreviewPlatform] = useState<'facebook' | 'instagram'>('instagram');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [aiModalPrompt, setAiModalPrompt] = useState('');
  const [aiModalStyle, setAiModalStyle] = useState('Flat illustration');
  const [aiModalImage, setAiModalImage] = useState<string | null>(null);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string>(() => "d_" + Date.now().toString(36));
  const isDirtyRef = useRef(false);

  // WhatsApp Broadcast
  const [publishToWa, setPublishToWa] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [waRecipient, setWaRecipient] = useState('');
  const [waTemplateName, setWaTemplateName] = useState('hello_world');
  const [isSendingWa, setIsSendingWa] = useState(false);

  // Business Profile Info
  const [bizProfile, setBizProfile] = useState<{ name: string; handle: string; industry: string }>({
    name: 'SriKrish',
    handle: 'srikrish.official',
    industry: 'Clothing & Apparel'
  });

  // Load Business Profile & Settings on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedBiz = localStorage.getItem('businessProfile');
        if (savedBiz) {
          const parsed = JSON.parse(savedBiz);
          const name = parsed.businessName && !parsed.businessName.toLowerCase().includes('marketflow') ? parsed.businessName : 'SriKrish';
          const handle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          setBizProfile({ name, handle: handle || 'srikrish.official', industry: parsed.industry || 'Clothing & Apparel' });
        }
        const savedLogo = localStorage.getItem('brand_logo_url');
        if (savedLogo) setPostLogoUrl(savedLogo);

        const savedDefaults = localStorage.getItem('post_defaults');
        if (savedDefaults) {
          const defs = JSON.parse(savedDefaults);
          if (defs.aiImageStyle) setAiModalStyle(defs.aiImageStyle);
          if (defs.hashtags && Array.isArray(defs.hashtags)) setHashtags(defs.hashtags);
        }
      } catch (e) {}

      // Load Drafts from localStorage
      try {
        const rawDrafts = localStorage.getItem(COMPOSER_DRAFTS_KEY);
        if (rawDrafts) {
          const parsed = JSON.parse(rawDrafts);
          setSavedDrafts(Array.isArray(parsed) ? parsed : []);
        }
      } catch (e) {}
    }
  }, []);

  // Sync scheduledTime string from date & time
  useEffect(() => {
    if (whenOption === 'schedule' && publishDate && publishTime) {
      setScheduledTime(`${publishDate}T${publishTime}`);
    } else {
      setScheduledTime('');
    }
  }, [whenOption, publishDate, publishTime]);

  // Fetch Meta & WhatsApp Status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
        const res = await fetch(`/api/meta/status?tenant_id=${savedTenantId}`);
        if (res.ok) {
          const data = await res.json();
          setMetaStatus(data);
          if (data.connected && data.page_name) {
            setBizProfile(prev => ({ ...prev, name: data.page_name }));
          }
          if (data.has_instagram !== undefined) {
            setPublishToIg(data.has_instagram);
            setChannels(prev => ({ ...prev, instagram: data.has_instagram }));
          }
        }
      } catch (e) {
        console.error("Failed to load meta status", e);
      }

      try {
        const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
        const waRes = await fetch(`/api/whatsapp/status?tenant_id=${savedTenantId}`);
        if (waRes.ok) {
          const waData = await waRes.json();
          setWaConnected(waData.connected);
          if (waData.whatsapp_phone_number_id) setWaPhoneId(waData.whatsapp_phone_number_id);
        }
      } catch (e) {}
    };

    const fetchAssets = async () => {
      try {
        const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
        const aRes = await fetch(`/api/assets?tenant_id=${savedTenantId}`);
        if (aRes.ok) {
          const aData = await aRes.json();
          setLibraryAssets(aData);
        }
      } catch (e) {}
    };

    fetchStatus();
    fetchAssets();
  }, []);

  // Sync initialCampaign if passed in (e.g. Editing from Scheduled/Calendar)
  useEffect(() => {
    if (initialCampaign) {
      setPrompt(initialCampaign.prompt || '');
      setCategory(initialCampaign.category || 'Product Showcase');
      setTone(initialCampaign.tone || 'casual');
      setCampaignId(initialCampaign.id || null);
      setGeneratedText(initialCampaign.generated_text || '');
      setCaption(initialCampaign.generated_text || '');
      setVisualSuggestion(initialCampaign.visual_suggestion || '');

      const imgUrl = initialCampaign.image_url || (initialCampaign.visual_suggestion && (initialCampaign.visual_suggestion.startsWith('/') || initialCampaign.visual_suggestion.startsWith('http')) ? initialCampaign.visual_suggestion : null);
      if (imgUrl) {
        setSelectedAssetUrl(imgUrl);
        setMediaItems([{ id: "init-" + Date.now(), name: "Post Creative", src: imgUrl, source: "upload", video: imgUrl.endsWith('.mp4') }]);
      }
      setIsLiked(initialCampaign.is_liked || false);
      setGenerated(Boolean(initialCampaign.generated_text));

      if (initialCampaign.scheduled_time) {
        setWhenOption('schedule');
        try {
          const d = new Date(initialCampaign.scheduled_time);
          setPublishDate(toDateInputString(d));
          const pad = (n: number) => String(n).padStart(2, '0');
          setPublishTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
        } catch (e) {}
      } else {
        setWhenOption('now');
      }

      if (initialCampaign.min_age) setMinAge(initialCampaign.min_age);
      if (initialCampaign.max_age) setMaxAge(initialCampaign.max_age);
      if (initialCampaign.gender) setGender(initialCampaign.gender);
    }
  }, [initialCampaign]);

  // Keep selectedAssetUrl in sync with active media slide
  useEffect(() => {
    const cur = mediaItems[activeSlideIndex] || mediaItems[0];
    if (cur && cur.src) {
      setSelectedAssetUrl(cur.src);
    }
  }, [activeSlideIndex, mediaItems]);

  // Auto-Save Draft to LocalStorage Debounced
  useEffect(() => {
    if (!isDirtyRef.current || !prompt && !caption) return;
    const timer = setTimeout(() => {
      handleSaveDraft(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [prompt, caption, hashtags, mediaItems, whenOption, publishDate, publishTime, category]);

  // Current active content based on tab (all, facebook, instagram)
  const getTabContent = (tab: 'all' | 'facebook' | 'instagram') => {
    if (tab === 'all') {
      return { caption, tags: hashtags, media: mediaItems };
    }
    const o = overrides[tab] || {};
    return {
      caption: o.caption !== undefined ? o.caption : caption,
      tags: o.tags !== undefined ? o.tags : hashtags,
      media: o.media !== undefined ? o.media : mediaItems
    };
  };

  const setTabCaption = (tab: 'all' | 'facebook' | 'instagram', val: string) => {
    isDirtyRef.current = true;
    if (tab === 'all') {
      setCaption(val);
      setGeneratedText(val);
    } else {
      setOverrides(prev => ({
        ...prev,
        [tab]: { ...prev[tab], caption: val }
      }));
    }
  };

  const setTabTags = (tab: 'all' | 'facebook' | 'instagram', tagsArr: string[]) => {
    isDirtyRef.current = true;
    if (tab === 'all') {
      setHashtags(tagsArr);
    } else {
      setOverrides(prev => ({
        ...prev,
        [tab]: { ...prev[tab], tags: tagsArr }
      }));
    }
  };

  const setTabMedia = (tab: 'all' | 'facebook' | 'instagram', mediaArr: any[]) => {
    isDirtyRef.current = true;
    if (tab === 'all') {
      setMediaItems(mediaArr);
    } else {
      setOverrides(prev => ({
        ...prev,
        [tab]: { ...prev[tab], media: mediaArr }
      }));
    }
  };

  const resetTabOverride = (tab: 'facebook' | 'instagram', field: 'caption' | 'tags' | 'media') => {
    setOverrides(prev => {
      const copy = { ...prev[tab] };
      delete copy[field];
      return { ...prev, [tab]: copy };
    });
    notifySuccess(`Reset ${field} to All platforms.`);
  };

  const customizeTabOverride = (tab: 'facebook' | 'instagram', field: 'caption' | 'tags' | 'media') => {
    setOverrides(prev => {
      const val = field === 'caption' ? caption : field === 'tags' ? [...hashtags] : [...mediaItems];
      return { ...prev, [tab]: { ...prev[tab], [field]: val } };
    });
    notifySuccess(`Customized ${field} for ${tab === 'facebook' ? 'Facebook' : 'Instagram'}.`);
  };

  // Clear Form / Create New Post
  const clearForm = () => {
    setPrompt('');
    setCategory('Product Showcase');
    setSelectedCatId('showcase');
    setCaption('');
    setGeneratedText('');
    setVisualSuggestion('');
    setHashtags(['#ProductShowcase', '#SilkSaree', '#Handloom', '#ShopLocal']);
    setMediaItems([
      {
        id: "new-media-1",
        name: "Silk Saree",
        src: PROTOTYPE_LIBRARY_ASSETS[0].src,
        source: "library" as const,
        video: false
      }
    ]);
    setSelectedAssetUrl(PROTOTYPE_LIBRARY_ASSETS[0].src);
    setOverrides({ facebook: {}, instagram: {} });
    setCampaignId(null);
    setIsLiked(false);
    setGenerated(false);
    setMatchRationale('');
    setRecommendAiGen(false);
    setWhenOption('schedule');
    setCurrentDraftId("d_" + Date.now().toString(36));
    if (onClearEdit) onClearEdit();
    notifySuccess("New blank post ready!");
  };

  // ── AI Campaign Generation ──────────────────────────────────────────────
  const handleGenerate = async (toneOverride?: string, categoryOverride?: string) => {
    if (!prompt.trim()) {
      notifyError("Please enter a campaign goal/prompt");
      return;
    }
    setIsGenerating(true);
    setGenerated(false);

    let bizName = bizProfile.name || "SriKrish";
    let phone = "";
    let ind = bizProfile.industry || "Clothing & Apparel";

    try {
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const response = await fetch('/api/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
          prompt,
          minAge,
          maxAge,
          gender,
          freq,
          category: categoryOverride || category,
          businessName: bizName,
          phoneNumber: phone,
          industry: ind,
          tone: toneOverride || tone
        }),
      });

      const data = await response.json();
      if (data.status === 'success' || (response.ok && data.generated_text)) {
        setGeneratedText(data.generated_text);
        setCaption(data.generated_text);
        setVisualSuggestion(data.visual_suggestion || '');
        setCampaignId(data.id || null);
        setIsLiked(data.is_liked || false);
        setGenerated(true);
        isDirtyRef.current = true;

        setMatchRationale(data.match_rationale || '');
        setRecommendAiGen(Boolean(data.recommend_ai_gen));

        // Auto-match best image from library if returned
        if (data.matched_asset_url) {
          setSelectedAssetUrl(data.matched_asset_url);
          setMediaItems([{
            id: "matched-" + Date.now(),
            name: "Auto-matched Photo",
            src: data.matched_asset_url,
            source: "library",
            video: data.matched_asset_url.endsWith('.mp4')
          }]);
          notifySuccess("✨ Auto-matched best image from your uploaded library!");
        }

        notifySuccess("✨ AI created your campaign content!");
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

  // ── Gemini Caption Refinement ───────────────────────────────────────────
  const handleRefineText = async (toneKey: string) => {
    const curCaption = getTabContent(activeContentTab).caption;
    if (!curCaption.trim()) {
      notifyError("No caption text available to refine.");
      return;
    }
    setActiveToneBusy(toneKey);
    try {
      const response = await fetch('/api/campaign/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: toneKey,
          current_text: curCaption,
          category
        })
      });
      const data = await response.json();
      if (data.status === 'success' && data.refined_text) {
        setTabCaption(activeContentTab, data.refined_text);
        notifySuccess(`Caption refined to ${toneKey}! ✨`);
      } else {
        notifyError("Failed to refine caption.");
      }
    } catch (e) {
      console.error(e);
      notifyError("Error refining caption text.");
    } finally {
      setActiveToneBusy(null);
    }
  };

  // ── AI Image Generation ────────────────────────────────────────────────
  const handleGenerateAiImage = async (promptOverride?: string) => {
    const promptToUse = promptOverride || aiModalPrompt || visualSuggestion || prompt || `${category} promotion for ${bizProfile.name}`;
    if (!promptToUse.trim()) {
      notifyError("Please provide an image prompt description.");
      return;
    }

    let styleModifier = '';
    const activeStyle = aiModalStyle;
    if (activeStyle === 'Flat illustration') {
      styleModifier = ', clean flat 2D vector illustration style, vibrant minimalist digital art, clean geometric shapes, no photorealism';
    } else if (activeStyle === 'Bold poster') {
      styleModifier = ', bold graphic design poster style, high contrast, vibrant saturated colors, striking visual composition';
    } else if (activeStyle === 'Soft pastel') {
      styleModifier = ', soft pastel aesthetic style, delicate muted colors, warm gentle natural lighting, artistic fine art';
    } else if (activeStyle === 'Photorealistic' || activeStyle === 'Realistic') {
      styleModifier = ', high-end commercial studio product photography, crisp sharp focus, 8k resolution, photorealistic, natural lighting';
    }

    const fullPrompt = promptToUse + styleModifier;
    setIsGeneratingImage(true);

    try {
      const res = await fetch('/api/campaign/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          num_images: 1,
          format_type: formatType
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.url) {
        const newMedia = {
          id: "ai-" + Date.now(),
          name: promptToUse.slice(0, 30),
          src: data.url,
          source: "ai" as const,
          video: false
        };
        setAiModalImage(data.url);
        if (!showAiModal) {
          setMediaItems(prev => formatType === 'story' ? [...prev, newMedia].slice(0, 10) : [newMedia]);
          setSelectedAssetUrl(data.url);
          notifySuccess("AI Image generated successfully! ✨");
        }
      } else {
        notifyError("Image generation failed");
      }
    } catch (e) {
      console.error("AI image gen error", e);
      notifyError("Error generating AI image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // ── File Upload via Drag-and-drop or File Input ─────────────────────────
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      notifySuccess("Uploading creative asset...");
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const response = await fetch(`/api/assets/upload?tenant_id=${savedTenantId}`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        const uploadedItem = {
          id: "up-" + Date.now(),
          name: file.name,
          src: data.url,
          source: "upload" as const,
          video: file.type.startsWith('video/')
        };
        setMediaItems(prev => formatType === 'story' ? [...prev, uploadedItem].slice(0, 10) : [uploadedItem]);
        setSelectedAssetUrl(data.url);
        notifySuccess("File uploaded and selected! 🎉");
      } else {
        notifyError("Upload failed");
      }
    } catch (e) {
      console.error(e);
      notifyError("Error uploading file");
    }
  };

  // ── Brand Overlay Logic ────────────────────────────────────────────────
  const handleApplyBrandOverlay = async (
    overridePos?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'bottom-center',
    forceIncludeLogo?: boolean
  ) => {
    const targetPos = overridePos || logoPosition;
    const targetIncludeLogo = forceIncludeLogo !== undefined ? forceIncludeLogo : includeLogo;
    if (!selectedAssetUrl) {
      notifyError("Please select or generate a visual asset first.");
      return;
    }

    if (hasOverlay && !overridePos && !targetIncludeLogo) {
      if (originalAssetUrl) {
        setSelectedAssetUrl(originalAssetUrl);
        setMediaItems(prev => prev.map((m, idx) => idx === activeSlideIndex ? { ...m, src: originalAssetUrl } : m));
      }
      setHasOverlay(false);
      notifySuccess("Brand overlay removed.");
      return;
    }

    if (selectedAssetUrl.endsWith('.mp4')) {
      notifyError("Brand overlay can only be applied to static image assets.");
      return;
    }

    const toProxiedUrl = (url: string): string => {
      if (url.startsWith('data:')) return url;
      if (url.startsWith('/api/') || url.startsWith('/assets/')) return url;
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    };

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
      });
    };

    try {
      const sourceUrl = (hasOverlay && originalAssetUrl) ? originalAssetUrl : selectedAssetUrl;
      const img = await loadImage(toProxiedUrl(sourceUrl));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const cw = img.naturalWidth || 1080;
      const ch = img.naturalHeight || 1080;
      canvas.width = cw;
      canvas.height = ch;
      ctx.drawImage(img, 0, 0, cw, ch);

      const activeLogoUrl = postLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('brand_logo_url') : '') || '';
      if (targetIncludeLogo && activeLogoUrl) {
        const logoImg = await loadImage(toProxiedUrl(activeLogoUrl));
        const minDim = Math.min(cw, ch);
        const scale = Math.max(0.5, minDim / 1080);
        const lSize = Math.round(90 * scale);
        const margin = Math.round(28 * scale);

        let lx = cw - lSize - margin;
        let ly = margin;
        if (targetPos === 'top-left') { lx = margin; ly = margin; }
        else if (targetPos === 'top-right') { lx = cw - lSize - margin; ly = margin; }
        else if (targetPos === 'bottom-left') { lx = margin; ly = ch - lSize - margin; }
        else if (targetPos === 'bottom-right') { lx = cw - lSize - margin; ly = ch - lSize - margin; }
        else if (targetPos === 'bottom-center') { lx = Math.round((cw - lSize) / 2); ly = ch - lSize - margin; }

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.drawImage(logoImg, lx, ly, lSize, lSize);
        ctx.restore();
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      if (!hasOverlay) setOriginalAssetUrl(selectedAssetUrl);
      setSelectedAssetUrl(dataUrl);
      setMediaItems(prev => prev.map((m, idx) => idx === activeSlideIndex ? { ...m, src: dataUrl } : m));
      setHasOverlay(true);
      notifySuccess(`Brand logo overlay applied (${targetPos}) ✨`);
    } catch (e) {
      console.error(e);
      notifyError("Failed to apply logo overlay.");
    }
  };

  // ── Save to Media Library ───────────────────────────────────────────────
  const handleSaveToLibrary = async () => {
    if (!selectedAssetUrl) return;
    setIsSavingToLibrary(true);
    try {
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const res = await fetch('/api/assets/save-to-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
          image_url: selectedAssetUrl
        })
      });
      if (res.ok) {
        setIsSavedToLibrary(true);
        notifySuccess("Saved to Media Library! 🎉");
      } else {
        notifyError("Failed to save to library");
      }
    } catch (e) {
      notifyError("Error saving to library");
    } finally {
      setIsSavingToLibrary(false);
    }
  };

  // ── Download Asset ──────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!selectedAssetUrl) return;
    try {
      const response = await fetch(selectedAssetUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `srikrish_post_${Date.now()}.${selectedAssetUrl.endsWith('.mp4') ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(selectedAssetUrl, '_blank');
    }
  };

  // ── Style Learning Toggle ───────────────────────────────────────────────
  const handleToggleLike = async () => {
    if (!campaignId) return;
    setIsLiking(true);
    try {
      const res = await fetch(`/api/campaign/${campaignId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_liked: !isLiked })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsLiked(data.is_liked);
        notifySuccess(data.is_liked ? "Added to Style Profile! AI will mimic this style." : "Removed from Style Profile.");
      }
    } catch (e) {
      notifyError("Failed to save style feedback");
    } finally {
      setIsLiking(false);
    }
  };

  // ── Save Draft (Backend + LocalStorage) ─────────────────────────────────
  const handleSaveDraft = async (silent: boolean = false) => {
    const curCaption = getTabContent('all').caption;
    if (!prompt.trim() && !curCaption.trim()) {
      if (!silent) notifyError("Please enter a prompt or caption before saving draft.");
      return;
    }
    setIsSavingDraft(true);
    const now = new Date();
    setLastSavedDraftTime(now);

    const draftState = {
      prompt,
      category,
      format: formatType,
      caption: curCaption,
      tags: hashtags,
      media: mediaItems,
      overrides,
      channels,
      when: whenOption,
      date: publishDate,
      time: publishTime
    };

    // Save to LocalStorage
    try {
      const existing = savedDrafts.filter(d => d.id !== currentDraftId);
      const updated = [{ id: currentDraftId, updatedAt: Date.now(), state: draftState }, ...existing];
      setSavedDrafts(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMPOSER_DRAFTS_KEY, JSON.stringify(updated));
      }
    } catch (e) {}

    // Save to Backend
    try {
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const response = await fetch('/api/campaign/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaignId,
          prompt,
          category,
          tone,
          generated_text: curCaption,
          visual_suggestion: visualSuggestion,
          image_url: selectedAssetUrl || null,
          scheduled_time: scheduledTime || null,
          tenant_id: parseInt(savedTenantId, 10)
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.id && !campaignId) setCampaignId(data.id);
        if (!silent) notifySuccess("Draft saved successfully! You can resume anytime.");
      }
    } catch (e) {
      if (!silent) notifyError("Error saving draft to cloud.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ── Publish Post ────────────────────────────────────────────────────────
  const handlePublish = async () => {
    const curContent = getTabContent('all');
    if (!channels.facebook && !channels.instagram) {
      notifyError("Please pick at least one platform to publish to (Facebook or Instagram).");
      return;
    }
    if (!curContent.caption.trim() && mediaItems.length === 0) {
      notifyError("Please write a caption or select an image before publishing.");
      return;
    }

    setIsPublishing(true);
    try {
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const response = await fetch('/api/campaign/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: curContent.caption,
          image_url: selectedAssetUrl || null,
          publish_to_instagram: channels.instagram && metaStatus.has_instagram,
          tenant_id: parseInt(savedTenantId, 10),
          scheduled_time: whenOption === 'schedule' ? scheduledTime : null,
          campaign_id: campaignId
        })
      });
      const data = await response.json();

      if (response.ok) {
        if (whenOption === 'schedule' && scheduledTime) {
          const istDate = new Date(scheduledTime.length === 16 ? scheduledTime + ':00+05:30' : scheduledTime);
          const formatted = istDate.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: getBizTimezone()
          });
          setScheduledLabelForModal(formatted);
          setShowScheduleSuccessModal(true);
        } else {
          const targets = channels.instagram && metaStatus.has_instagram ? "Facebook & Instagram" : "Facebook";
          notifySuccess(`Published successfully to ${targets}! ✨`);
          clearForm();
        }
      } else {
        const rawErr = typeof data.detail === 'object' ? JSON.stringify(data.detail) : (data.detail || "Unknown error");
        notifyError("Failed to publish: " + rawErr);
      }
    } catch (e) {
      console.error(e);
      notifyError("Error publishing campaign");
    } finally {
      setIsPublishing(false);
    }
  };

  // ── WhatsApp Settings & Test Send ──────────────────────────────────────
  const handleSaveWaSettings = async () => {
    if (!waPhoneId || !waToken) {
      notifyError("Please fill in both Phone ID and Token.");
      return;
    }
    try {
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
          whatsapp_phone_number_id: waPhoneId,
          whatsapp_access_token: waToken
        })
      });
      if (res.ok) {
        notifySuccess("WhatsApp settings saved.");
        setWaConnected(true);
        setShowWaSettings(false);
      }
    } catch (e) {
      notifyError("Failed to save WhatsApp settings.");
    }
  };

  const handleSendWaMessage = async () => {
    if (!waRecipient) {
      notifyError("Please enter recipient number.");
      return;
    }
    setIsSendingWa(true);
    try {
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const res = await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
          recipient_phone: waRecipient,
          template_name: waTemplateName
        })
      });
      const data = await res.json();
      if (res.ok && data.status_code === 200) {
        notifySuccess("WhatsApp test template sent! 💬");
      } else {
        notifyError("WhatsApp send failed: " + JSON.stringify(data.response || data.detail));
      }
    } catch (e) {
      notifyError("Error sending WhatsApp message.");
    } finally {
      setIsSendingWa(false);
    }
  };

  // Current tab content object
  const currentTabContent = getTabContent(activeContentTab);
  const activeCharLimit = PLATFORM_LIMITS[activeContentTab === 'all' ? 'instagram' : activeContentTab]?.caption || 2200;
  const currentTotalChars = (currentTabContent.caption + " " + currentTabContent.tags.join(" ")).trim().length;
  const isOverCharLimit = currentTotalChars > activeCharLimit;

  return (
    <div className="fade-in-up" style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── HEADER BAR ──────────────────────────────────────────────────────── */}
      <header style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}>
        {/* Left Header Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              if (onNavigateToTab) onNavigateToTab('home');
              else if (onClearEdit) onClearEdit();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(82, 183, 136, 0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              color: 'var(--text-color)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ComposerIcon name="arrowLeft" size={16} /> Home
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-color)' }}>
                Campaign Setup {campaignId ? `(Editing #${campaignId})` : ''}
              </h2>
              {whenOption === 'schedule' ? (
                <ComposerBadge kind="wait" icon="clock">Scheduled</ComposerBadge>
              ) : (
                <ComposerBadge kind="neutral">Draft</ComposerBadge>
              )}
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
              Create and publish your next promotion
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onNavigateToTab && (
            <ComposerBtn
              kind="text"
              size="sm"
              icon="chevron-left"
              onClick={() => {
                if (onClearEdit) onClearEdit();
                onNavigateToTab('home');
              }}
            >
              Back to Home
            </ComposerBtn>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-light)', marginRight: '4px' }}>
            {lastSavedDraftTime ? `Saved to Drafts ${lastSavedDraftTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saves to Drafts as you type'}
          </span>

          <ComposerBtn
            kind="secondary"
            size="sm"
            icon="drafts"
            onClick={() => setShowDraftsDrawer(true)}
          >
            Drafts ({savedDrafts.length})
          </ComposerBtn>

          {campaignId ? (
            <ComposerBtn
              kind="secondary"
              size="sm"
              icon="plus"
              onClick={clearForm}
            >
              + New Post
            </ComposerBtn>
          ) : null}

          <ComposerBtn
            kind="secondary"
            size="sm"
            onClick={() => handleSaveDraft(false)}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </ComposerBtn>

          <ComposerBtn
            kind="primary"
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing
              ? 'Publishing...'
              : (whenOption === 'schedule'
                ? 'Schedule Publish'
                : (channels.instagram && metaStatus.has_instagram
                  ? 'Publish to Facebook & Instagram'
                  : 'Publish to Facebook'))}
          </ComposerBtn>
        </div>
      </header>

      {/* ── TWO-COLUMN WORKSPACE ───────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 440px',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* ════ LEFT COLUMN: COMPOSER CONTROLS ════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* SECTION 1: Campaign Goal & Prompt with Category Chips */}
          <section style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-color)' }}>
                Campaign Goal & Prompt
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
                Describe what you want to promote, or pick a preset topic chip below.
              </p>
            </div>

            <textarea
              className="input-field"
              rows={3}
              placeholder="e.g., Promote our new summer silk collection..."
              value={prompt}
              onChange={(e) => {
                isDirtyRef.current = true;
                setPrompt(e.target.value);
              }}
            />

            {/* Category Chips */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Preset Topics & Campaign Templates
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {COMPOSER_CATEGORIES.map((cat) => (
                  <ComposerChip
                    key={cat.id}
                    icon={cat.icon}
                    selected={selectedCatId === cat.id}
                    onClick={() => {
                      setSelectedCatId(cat.id);
                      setCategory(cat.label);
                      setPrompt(cat.prompt);
                      setTabCaption('all', cat.caption);
                      setTabTags('all', cat.tags);
                      isDirtyRef.current = true;
                      notifySuccess(`Loaded "${cat.label}" template`);
                    }}
                  >
                    {cat.label}
                  </ComposerChip>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
              <ComposerBtn
                kind="primary"
                size="md"
                icon="spark"
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? '✨ AI is designing...' : '✨ Generate AI Content'}
              </ComposerBtn>
            </div>
          </section>

          {/* SECTION 2: Format Selector */}
          <section style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-color)' }}>
                Format
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
                Changes image aspect ratio and preview rendering.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {COMPOSER_FORMATS.map((fmt) => {
                const isSelected = formatType === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setFormatType(fmt.id as any);
                      isDirtyRef.current = true;
                    }}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.2)',
                      background: isSelected ? 'rgba(82, 183, 136, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? 'var(--primary-color)' : 'var(--text-color)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ComposerIcon name={fmt.icon} size={22} className="text-primary" />
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{fmt.label}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{fmt.detail}</span>
                  </button>
                );
              })}
            </div>

            {formatType === 'story' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(82, 183, 136, 0.08)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(82, 183, 136, 0.2)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>
                  📱 Slides: {mediaItems.length} (up to 10 slides)
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Click &apos;Upload&apos; or &apos;Library&apos; below to append more slides.
                </span>
              </div>
            )}
          </section>

          {/* SECTION 3: Content Section with Multi-Platform Tabs & Inherit Pattern */}
          <section style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header with Tabs */}
            <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>
                  Content
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Write once, tweak per platform
                </span>
              </div>

              {/* Platform Tabs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'all' as const, label: 'All platforms' },
                  { id: 'facebook' as const, label: 'Facebook' },
                  { id: 'instagram' as const, label: 'Instagram' }
                ].map((tab) => {
                  const isActive = activeContentTab === tab.id;
                  const hasCustom = tab.id !== 'all' && (overrides[tab.id]?.caption !== undefined || overrides[tab.id]?.media !== undefined || overrides[tab.id]?.tags !== undefined);
                  const isOff = tab.id !== 'all' && !channels[tab.id];

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveContentTab(tab.id)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: isActive ? '2.5px solid var(--primary-color)' : '2.5px solid transparent',
                        background: 'transparent',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        color: isActive ? 'var(--primary-color)' : 'var(--text-light)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.id !== 'all' && <PlatformMarkBadge p={tab.id} size={18} />}
                      <span>{tab.label}</span>
                      {hasCustom && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f2a516' }} />}
                      {isOff && <span style={{ fontSize: '11px', opacity: 0.6 }}>(off)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Inherit info notice if specific platform tab selected */}
              {activeContentTab !== 'all' && (
                <div style={{ background: 'rgba(82, 183, 136, 0.1)', border: '1px solid rgba(82, 183, 136, 0.25)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <ComposerIcon name="info" size={18} className="text-primary" />
                  <span>
                    Changes here only affect <strong>{activeContentTab === 'facebook' ? 'Facebook' : 'Instagram'}</strong>. Uncustomized fields remain in sync with All platforms.
                  </span>
                </div>
              )}

              {/* 1. MEDIA FIELD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>
                    {formatType === 'story' ? `Slides (${mediaItems.length}/10)` : formatType === 'reel' ? 'Video or Cover' : 'Image'}
                  </span>
                  {activeContentTab !== 'all' && (
                    overrides[activeContentTab]?.media !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ComposerBadge kind="wait" icon="check">Customized for {activeContentTab}</ComposerBadge>
                        <ComposerBtn kind="text" size="sm" icon="undo" onClick={() => resetTabOverride(activeContentTab, 'media')}>Reset</ComposerBtn>
                      </div>
                    ) : (
                      <ComposerBtn kind="secondary" size="sm" onClick={() => customizeTabOverride(activeContentTab, 'media')}>
                        Customize for {activeContentTab === 'facebook' ? 'Facebook' : 'Instagram'}
                      </ComposerBtn>
                    )
                  )}
                </div>

                {/* Auto-match & AI recommendation banners */}
                {matchRationale && !recommendAiGen && (
                  <div style={{ background: 'rgba(82, 183, 136, 0.12)', border: '1px solid var(--primary-color)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✨</span>
                    <span><strong>Matched from your media library:</strong> {matchRationale}</span>
                  </div>
                )}
                {recommendAiGen && !selectedAssetUrl && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', padding: '12px 14px', borderRadius: '12px', fontSize: '12px', color: '#fbbf24', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>⚠️ No Matching Photo in Uploaded Library</span>
                    <span style={{ opacity: 0.9 }}>{matchRationale || "No asset in your library matches this campaign concept. Generate a custom AI creative below."}</span>
                    <ComposerBtn kind="primary" size="sm" icon="spark" onClick={() => setShowAiModal(true)} style={{ alignSelf: 'flex-start' }}>
                      Generate AI Creative
                    </ComposerBtn>
                  </div>
                )}

                {/* Media Thumbnails Strip */}
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {currentTabContent.media.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: formatType === 'post' ? '120px' : '90px',
                        aspectRatio: formatType === 'post' ? '1 / 1' : '9 / 16',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: idx === activeSlideIndex ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.2)',
                        background: 'rgba(0,0,0,0.4)',
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setActiveSlideIndex(idx);
                        setSelectedAssetUrl(item.src);
                      }}
                    >
                      {item.video || (item.src || '').endsWith('.mp4') ? (
                        <video src={item.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={item.src} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}

                      {/* AI Badge */}
                      {item.source === 'ai' && (
                        <span style={{ position: 'absolute', top: '4px', left: '4px' }}>
                          <ComposerBadge kind="ai" icon="spark">AI</ComposerBadge>
                        </span>
                      )}

                      {/* Slide number */}
                      {formatType === 'story' && (
                        <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>
                          {idx + 1}
                        </span>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = currentTabContent.media.filter((_, i) => i !== idx);
                          setTabMedia(activeContentTab, updated);
                          if (activeSlideIndex >= updated.length) setActiveSlideIndex(Math.max(0, updated.length - 1));
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <ComposerIcon name="x" size={12} />
                      </button>
                    </div>
                  ))}

                  {currentTabContent.media.length === 0 && (
                    <div style={{
                      width: '140px',
                      aspectRatio: formatType === 'post' ? '1 / 1' : '9 / 16',
                      borderRadius: '10px',
                      border: '2px dashed rgba(82, 183, 136, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-light)',
                      fontSize: '12px',
                      textAlign: 'center',
                      padding: '8px'
                    }}>
                      <ComposerIcon name="image" size={24} />
                      <span style={{ marginTop: '4px' }}>No creative yet</span>
                    </div>
                  )}
                </div>

                {/* Media Actions Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <ComposerBtn
                    kind="secondary"
                    size="sm"
                    icon="upload"
                    onClick={() => mediaFileInputRef.current?.click()}
                  >
                    Upload
                  </ComposerBtn>
                  <input
                    ref={mediaFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  <ComposerBtn
                    kind="secondary"
                    size="sm"
                    icon="grid"
                    onClick={() => setShowLibraryModal(true)}
                  >
                    Library
                  </ComposerBtn>

                  <ComposerBtn
                    kind="secondary"
                    size="sm"
                    icon="spark"
                    onClick={() => {
                      setAiModalPrompt(visualSuggestion || prompt);
                      setShowAiModal(true);
                    }}
                  >
                    Generate with AI
                  </ComposerBtn>

                  {selectedAssetUrl && (
                    <>
                      <ComposerBtn
                        kind="text"
                        size="sm"
                        onClick={handleDownload}
                      >
                        Download
                      </ComposerBtn>

                      {(selectedAssetUrl.startsWith('data:') || selectedAssetUrl.includes('temp')) && !isSavedToLibrary && (
                        <ComposerBtn
                          kind="secondary"
                          size="sm"
                          onClick={handleSaveToLibrary}
                          disabled={isSavingToLibrary}
                        >
                          {isSavingToLibrary ? 'Saving...' : 'Save to Library'}
                        </ComposerBtn>
                      )}
                    </>
                  )}
                </div>

                {/* Brand Overlay Expandable Controls */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(82,183,136,0.15)', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={includeLogo}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setIncludeLogo(val);
                          handleApplyBrandOverlay(logoPosition, val);
                        }}
                      />
                      Add Brand Logo Overlay
                    </label>

                    <button
                      type="button"
                      onClick={() => postLogoFileInputRef.current?.click()}
                      style={{ fontSize: '12px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change Logo
                    </button>
                    <input
                      ref={postLogoFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
                          const res = await fetch(`/api/assets/upload?tenant_id=${savedTenantId}`, { method: 'POST', body: formData });
                          const d = await res.json();
                          if (d.url) {
                            setPostLogoUrl(d.url);
                            if (typeof window !== 'undefined') localStorage.setItem('brand_logo_url', d.url);
                            notifySuccess("Brand logo updated!");
                            if (includeLogo) handleApplyBrandOverlay(logoPosition, true);
                          }
                        }
                      }}
                    />
                  </div>

                  {includeLogo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px dashed rgba(82, 183, 136, 0.15)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600, marginRight: '4px' }}>Position:</span>
                      {[
                        { id: 'top-left', label: '↖ Top Left' },
                        { id: 'top-right', label: '↗ Top Right' },
                        { id: 'bottom-left', label: '↙ Bottom Left' },
                        { id: 'bottom-right', label: '↘ Bottom Right' },
                        { id: 'bottom-center', label: '⬇ Bottom' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => {
                            const p = pos.id as any;
                            setLogoPosition(p);
                            handleApplyBrandOverlay(p, true);
                          }}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: logoPosition === pos.id ? '1.5px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                            background: logoPosition === pos.id ? 'rgba(82,183,136,0.2)' : 'rgba(0,0,0,0.2)',
                            color: logoPosition === pos.id ? 'var(--primary-color)' : 'var(--text-color)',
                            cursor: 'pointer'
                          }}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. CAPTION FIELD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="caption-main" style={{ fontSize: '14px', fontWeight: 700 }}>
                    Caption
                  </label>
                  {activeContentTab !== 'all' && (
                    overrides[activeContentTab]?.caption !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ComposerBadge kind="wait" icon="check">Customized for {activeContentTab}</ComposerBadge>
                        <ComposerBtn kind="text" size="sm" icon="undo" onClick={() => resetTabOverride(activeContentTab, 'caption')}>Reset</ComposerBtn>
                      </div>
                    ) : (
                      <ComposerBtn kind="secondary" size="sm" onClick={() => customizeTabOverride(activeContentTab, 'caption')}>
                        Customize for {activeContentTab === 'facebook' ? 'Facebook' : 'Instagram'}
                      </ComposerBtn>
                    )
                  )}
                </div>

                <textarea
                  id="caption-main"
                  rows={5}
                  value={currentTabContent.caption}
                  onChange={(e) => setTabCaption(activeContentTab, e.target.value)}
                  className="input-field"
                  placeholder="Write what you want to tell customers..."
                  style={{ fontSize: '14px', lineHeight: 1.55 }}
                />

                {/* Character Counter & Tone Refinements */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  {/* Tone Refinement Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
                      <ComposerIcon name="wand" size={14} /> Tone:
                    </span>
                    {COMPOSER_TONES.map((t) => (
                      <ComposerChip
                        key={t.id}
                        onClick={() => handleRefineText(t.id)}
                        disabled={Boolean(activeToneBusy) || !currentTabContent.caption.trim()}
                        style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px' }}
                      >
                        {activeToneBusy === t.id ? 'Refining...' : t.label}
                      </ComposerChip>
                    ))}
                  </div>

                  {/* Character Count */}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isOverCharLimit ? 700 : 500,
                    color: isOverCharLimit ? '#ef4444' : 'var(--text-light)',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {currentTotalChars.toLocaleString('en-IN')} / {activeCharLimit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* 3. HASHTAGS FIELD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="hashtags-input" style={{ fontSize: '14px', fontWeight: 700 }}>
                    Hashtags
                  </label>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', fontVariantNumeric: 'tabular-nums' }}>
                    {currentTabContent.tags.length} / 30
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(82, 183, 136, 0.2)',
                  background: 'rgba(8, 12, 10, 0.8)'
                }}>
                  {currentTabContent.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px 4px 10px',
                        borderRadius: '9999px',
                        background: 'rgba(82, 183, 136, 0.18)',
                        color: 'var(--primary-color)',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = currentTabContent.tags.filter(t => t !== tag);
                          setTabTags(activeContentTab, updated);
                        }}
                        style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}

                  <input
                    id="hashtags-input"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (['Enter', ',', ' '].includes(e.key)) {
                        e.preventDefault();
                        if (newTagInput.trim()) {
                          const cleaned = normalizeHashtag(newTagInput);
                          if (cleaned && !currentTabContent.tags.includes(cleaned)) {
                            setTabTags(activeContentTab, [...currentTabContent.tags, cleaned]);
                          }
                          setNewTagInput('');
                        }
                      }
                    }}
                    placeholder={currentTabContent.tags.length ? "Add more..." : "#ShopLocal"}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-color)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Suggested Hashtags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600 }}>Suggested:</span>
                  {['#ShopLocal', '#SriKrish', '#NewArrivals', '#FestiveSeason'].filter(s => !currentTabContent.tags.includes(s)).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTabTags(activeContentTab, [...currentTabContent.tags, tag])}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px dashed rgba(82, 183, 136, 0.3)',
                        background: 'transparent',
                        color: 'var(--text-light)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* SECTION 4: Where to Post */}
          <section style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-color)' }}>
                Where to post
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
                Choose which connected social channels to publish this post to.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Facebook Card */}
              <div
                onClick={() => setChannels(prev => ({ ...prev, facebook: !prev.facebook }))}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: channels.facebook ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.2)',
                  background: channels.facebook ? 'rgba(82, 183, 136, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <PlatformMarkBadge p="facebook" size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-color)' }}>
                    Facebook Page
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {metaStatus.connected ? `Connected as ${metaStatus.page_name || 'SriKrish'}` : 'SriKrish'}
                  </div>
                </div>
                <div style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '9999px',
                  background: channels.facebook ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: channels.facebook ? 'flex-end' : 'flex-start',
                  transition: 'all 0.15s ease'
                }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ffffff' }} />
                </div>
              </div>

              {/* Instagram Card */}
              <div
                onClick={() => {
                  if (!metaStatus.has_instagram) {
                    notifyError("No Instagram Business account linked to your Facebook Page.");
                    return;
                  }
                  setChannels(prev => ({ ...prev, instagram: !prev.instagram }));
                }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: channels.instagram && metaStatus.has_instagram ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.2)',
                  background: channels.instagram && metaStatus.has_instagram ? 'rgba(82, 183, 136, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: metaStatus.has_instagram ? 'pointer' : 'not-allowed',
                  opacity: metaStatus.has_instagram ? 1 : 0.6,
                  transition: 'all 0.15s ease'
                }}
              >
                <PlatformMarkBadge p="instagram" size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-color)' }}>
                    Instagram Business
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    {metaStatus.has_instagram ? `@${bizProfile.handle}` : 'Not Linked'}
                  </div>
                </div>
                <div style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '9999px',
                  background: channels.instagram && metaStatus.has_instagram ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: channels.instagram && metaStatus.has_instagram ? 'flex-end' : 'flex-start',
                  transition: 'all 0.15s ease'
                }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ffffff' }} />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: Audience & Demographics Accordion */}
          <section style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div
              onClick={() => setShowAudienceSettings(!showAudienceSettings)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text-color)' }}>
                  Audience & Targeting
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                  {audience === 'all' ? 'All shoppers' : audience === 'women' ? 'Women' : 'Men'}, age {minAge}–{maxAge >= 65 ? '65+' : maxAge}
                </span>
              </div>
              <span style={{ fontSize: '18px', color: 'var(--primary-color)' }}>
                {showAudienceSettings ? '▲' : '▼'}
              </span>
            </div>

            {showAudienceSettings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Target Audience
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'all' as const, label: 'All' },
                      { id: 'women' as const, label: 'Women' },
                      { id: 'men' as const, label: 'Men' }
                    ].map((aud) => (
                      <ComposerChip
                        key={aud.id}
                        selected={audience === aud.id}
                        onClick={() => {
                          setAudience(aud.id);
                          setGender(aud.label);
                        }}
                      >
                        {aud.label}
                      </ComposerChip>
                    ))}
                  </div>
                </div>

                <AgeRangeSliderControl
                  min={minAge}
                  max={maxAge}
                  onChange={(newMin, newMax) => {
                    setMinAge(newMin);
                    setMaxAge(newMax);
                  }}
                />
              </div>
            )}
          </section>

          {/* SECTION 6: When to Post */}
          <section style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-color)' }}>
                When to post
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
                Publish immediately or schedule for optimal reach.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setWhenOption('now')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: whenOption === 'now' ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.2)',
                  background: whenOption === 'now' ? 'rgba(82, 183, 136, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                  color: whenOption === 'now' ? 'var(--primary-color)' : 'var(--text-color)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ComposerIcon name="send" size={18} /> Post now
              </button>

              <button
                type="button"
                onClick={() => setWhenOption('schedule')}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: whenOption === 'schedule' ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.2)',
                  background: whenOption === 'schedule' ? 'rgba(82, 183, 136, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                  color: whenOption === 'schedule' ? 'var(--primary-color)' : 'var(--text-color)',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ComposerIcon name="clock" size={18} /> Schedule for later
              </button>
            </div>

            {whenOption === 'schedule' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px' }}>
                {/* Quick Suggestion Chips */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const sat = getNextSaturdayDate();
                      setPublishDate(toDateInputString(sat));
                      setPublishTime('18:00');
                    }}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(82, 183, 136, 0.25)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-color)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Suggested: Sat 6:00 PM
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const tom = new Date();
                      tom.setDate(tom.getDate() + 1);
                      setPublishDate(toDateInputString(tom));
                      setPublishTime('11:00');
                    }}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(82, 183, 136, 0.25)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-color)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Tomorrow 11:00 AM
                  </button>
                </div>

                {/* Pickers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Time</label>
                    <input
                      type="time"
                      className="input-field"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 7: WhatsApp Template Broadcast */}
          <section style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={publishToWa}
                onChange={(e) => setPublishToWa(e.target.checked)}
              />
              Send template broadcast via WhatsApp 💬
            </label>

            {publishToWa && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    Status: {waConnected ? '🟢 Connected' : '🔴 Credentials Missing'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowWaSettings(!showWaSettings)}
                    style={{ fontSize: '12px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {showWaSettings ? 'Close' : 'Configure'}
                  </button>
                </div>

                {showWaSettings && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                    <input
                      className="input-field"
                      placeholder="WhatsApp Phone Number ID"
                      value={waPhoneId}
                      onChange={(e) => setWaPhoneId(e.target.value)}
                    />
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Access Token"
                      value={waToken}
                      onChange={(e) => setWaToken(e.target.value)}
                    />
                    <ComposerBtn kind="secondary" size="sm" onClick={handleSaveWaSettings}>
                      Save WhatsApp Settings
                    </ComposerBtn>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    className="input-field"
                    placeholder="Recipient (+919876543210)"
                    value={waRecipient}
                    onChange={(e) => setWaRecipient(e.target.value)}
                  />
                  <input
                    className="input-field"
                    placeholder="Template (e.g. hello_world)"
                    value={waTemplateName}
                    onChange={(e) => setWaTemplateName(e.target.value)}
                  />
                </div>

                <ComposerBtn
                  kind="primary"
                  size="sm"
                  onClick={handleSendWaMessage}
                  disabled={isSendingWa}
                >
                  {isSendingWa ? 'Sending...' : '⚡ Send Test WhatsApp Template'}
                </ComposerBtn>
              </div>
            )}
          </section>

        </div>

        {/* ════ RIGHT COLUMN: STICKY LIVE PREVIEW ════ */}
        <aside style={{
          position: 'sticky',
          top: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Preview Controls Bar */}
          <div style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            {/* Platform switch */}
            <div style={{ display: 'inline-flex', padding: '3px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
              {(['facebook', 'instagram'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreviewPlatform(p)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: previewPlatform === p ? 'var(--primary-color)' : 'transparent',
                    color: previewPlatform === p ? '#ffffff' : 'var(--text-light)',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <PlatformMarkBadge p={p} size={14} />
                  <span>{p === 'facebook' ? 'Facebook' : 'Instagram'}</span>
                </button>
              ))}
            </div>

            {/* Device switch */}
            <div style={{ display: 'inline-flex', padding: '3px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
              {(['mobile', 'desktop'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPreviewDevice(d)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: previewDevice === d ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: previewDevice === d ? 'var(--text-color)' : 'var(--text-light)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <ComposerIcon name={d === 'mobile' ? 'phone' : 'monitor'} size={14} />
                  <span>{d === 'mobile' ? 'Mobile' : 'Desktop'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Off Warning Notice */}
          {!channels[previewPlatform] && (
            <div style={{ background: 'rgba(242, 165, 22, 0.15)', border: '1px solid rgba(242, 165, 22, 0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ComposerIcon name="info" size={16} />
              <span>{previewPlatform === 'facebook' ? 'Facebook' : 'Instagram'} is off for this post. This is a preview of how it would appear.</span>
            </div>
          )}

          {/* Device Frame Rendering */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {previewDevice === 'mobile' ? (
              // Mobile Frame
              <div style={{
                width: '340px',
                maxWidth: '100%',
                borderRadius: '40px',
                background: '#16211f',
                padding: '12px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                border: '2px solid rgba(82, 183, 136, 0.2)'
              }}>
                <div style={{
                  borderRadius: '30px',
                  overflow: 'hidden',
                  background: formatType !== 'post' ? '#000000' : '#f0f2f5',
                  minHeight: '520px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Phone notch */}
                  <div style={{ height: '24px', background: previewPlatform === 'facebook' && formatType === 'post' ? '#ffffff' : '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '60px', height: '4px', borderRadius: '9999px', background: '#333333' }} />
                  </div>

                  {/* Feed post or tall post */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {formatType === 'post' ? (
                      <FeedPostPreview
                        platform={previewPlatform}
                        shopName={bizProfile.name}
                        shopHandle={bizProfile.handle}
                        caption={currentTabContent.caption}
                        tags={currentTabContent.tags}
                        mediaUrl={selectedAssetUrl}
                        whenLabel={whenOption === 'now' ? 'Just now' : (publishDate ? `${publishDate} ${publishTime}` : 'Scheduled')}
                        onImageClick={() => setShowLightbox(true)}
                        imageFit={imageFit}
                      />
                    ) : (
                      <TallPostPreview
                        platform={previewPlatform}
                        shopName={bizProfile.name}
                        shopHandle={bizProfile.handle}
                        format={formatType}
                        caption={currentTabContent.caption}
                        tags={currentTabContent.tags}
                        slides={currentTabContent.media}
                        onImageClick={() => setShowLightbox(true)}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Desktop Frame
              <div style={{
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
              }}>
                <div style={{ height: '32px', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                  <div style={{ flex: 1, margin: '0 16px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
                </div>
                <div style={{ padding: '16px', background: formatType === 'post' ? '#f0f2f5' : '#000000', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '100%', maxWidth: '380px' }}>
                    {formatType === 'post' ? (
                      <FeedPostPreview
                        platform={previewPlatform}
                        shopName={bizProfile.name}
                        shopHandle={bizProfile.handle}
                        caption={currentTabContent.caption}
                        tags={currentTabContent.tags}
                        mediaUrl={selectedAssetUrl}
                        whenLabel={whenOption === 'now' ? 'Just now' : (publishDate ? `${publishDate} ${publishTime}` : 'Scheduled')}
                        onImageClick={() => setShowLightbox(true)}
                        imageFit={imageFit}
                      />
                    ) : (
                      <TallPostPreview
                        platform={previewPlatform}
                        shopName={bizProfile.name}
                        shopHandle={bizProfile.handle}
                        format={formatType}
                        caption={currentTabContent.caption}
                        tags={currentTabContent.tags}
                        slides={currentTabContent.media}
                        onImageClick={() => setShowLightbox(true)}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Style Profile Like Button */}
          {campaignId ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={isLiking}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: isLiked ? '1.5px solid #ec4899' : '1px solid rgba(255,255,255,0.15)',
                  background: isLiked ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255,255,255,0.04)',
                  color: isLiked ? '#ec4899' : 'var(--text-light)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isLiking ? 'not-allowed' : 'pointer'
                }}
              >
                <span>{isLiked ? '❤️ In Style Profile' : '🤍 Add to Style Profile'}</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>(AI learns this tone)</span>
              </button>
            </div>
          ) : null}
        </aside>

      </div>

      {/* ── DRAWERS & MODALS ───────────────────────────────────────────────── */}
      <DraftsPanelDrawer
        isOpen={showDraftsDrawer}
        onClose={() => setShowDraftsDrawer(false)}
        drafts={savedDrafts}
        currentDraftId={currentDraftId}
        onSelectDraft={(draft) => {
          if (draft && draft.state) {
            const st = draft.state;
            if (st.prompt) setPrompt(st.prompt);
            if (st.category) setCategory(st.category);
            if (st.format) setFormatType(st.format);
            if (st.caption) {
              setCaption(st.caption);
              setGeneratedText(st.caption);
            }
            if (st.tags) setHashtags(st.tags);
            if (st.media && Array.isArray(st.media)) {
              setMediaItems(st.media);
              if (st.media[0]?.src) setSelectedAssetUrl(st.media[0].src);
            }
            if (st.overrides) setOverrides(st.overrides);
            if (st.channels) setChannels(st.channels);
            if (st.when) setWhenOption(st.when);
            if (st.date) setPublishDate(st.date);
            if (st.time) setPublishTime(st.time);
            setCurrentDraftId(draft.id);
            notifySuccess("Draft loaded into composer!");
          }
        }}
        onDeleteDraft={(id) => {
          const filtered = savedDrafts.filter(d => d.id !== id);
          setSavedDrafts(filtered);
          if (typeof window !== 'undefined') {
            localStorage.setItem(COMPOSER_DRAFTS_KEY, JSON.stringify(filtered));
          }
          notifySuccess("Draft deleted.");
        }}
        onNewPost={clearForm}
      />

      <LibraryModalDialog
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        assets={libraryAssets}
        onSelectAsset={(item) => {
          const newItem = {
            id: "lib-" + Date.now(),
            name: item.name,
            src: item.src,
            source: "library" as const,
            video: item.video
          };
          setMediaItems(prev => formatType === 'story' ? [...prev, newItem].slice(0, 10) : [newItem]);
          setSelectedAssetUrl(item.src);
          isDirtyRef.current = true;
          notifySuccess("Asset selected from library!");
        }}
        onUpload={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
            setShowLibraryModal(false);
          }
        }}
      />

      <AiModalDialog
        isOpen={showAiModal}
        onClose={() => {
          setShowAiModal(false);
          setAiModalImage(null);
        }}
        format={formatType}
        onFormatChange={(fmt) => setFormatType(fmt)}
        prompt={aiModalPrompt}
        onPromptChange={(p) => setAiModalPrompt(p)}
        style={aiModalStyle}
        onStyleChange={(s) => setAiModalStyle(s)}
        isGenerating={isGeneratingImage}
        generatedImage={aiModalImage}
        onGenerate={() => handleGenerateAiImage(aiModalPrompt)}
        onUseImage={(imgUrl) => {
          const aiMedia = {
            id: "ai-" + Date.now(),
            name: aiModalPrompt.slice(0, 30) || "AI Creative",
            src: imgUrl,
            source: "ai" as const,
            video: false
          };
          setMediaItems(prev => formatType === 'story' ? [...prev, aiMedia].slice(0, 10) : [aiMedia]);
          setSelectedAssetUrl(imgUrl);
          isDirtyRef.current = true;
          notifySuccess("AI Creative added to post!");
        }}
      />

      {/* Lightbox / Zoom View */}
      {showLightbox && selectedAssetUrl && (
        <div
          onClick={() => setShowLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            {selectedAssetUrl.endsWith('.mp4') ? (
              <video src={selectedAssetUrl} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px' }} />
            ) : (
              <img src={selectedAssetUrl} alt="Zoomed Asset" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain' }} />
            )}
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              style={{ position: 'absolute', top: '-40px', right: 0, background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Schedule Success Modal */}
      {showScheduleSuccessModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1a1d20',
            border: '1px solid rgba(82, 183, 136, 0.3)',
            borderRadius: '24px',
            padding: '36px',
            maxWidth: '460px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(82, 183, 136, 0.15)', border: '2px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px' }}>
              ⏰
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              Post Successfully Scheduled!
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
              Your campaign is queued and scheduled for:<br />
              <strong style={{ color: 'var(--primary-color)', fontSize: '15px' }}>{scheduledLabelForModal}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ComposerBtn
                kind="primary"
                size="md"
                onClick={() => {
                  setShowScheduleSuccessModal(false);
                  if (onNavigateToTab) onNavigateToTab('calendar');
                }}
              >
                📅 View on Calendar
              </ComposerBtn>
              <ComposerBtn
                kind="secondary"
                size="md"
                onClick={() => {
                  setShowScheduleSuccessModal(false);
                  clearForm();
                }}
              >
                ➕ Create Another Post
              </ComposerBtn>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


function AssetsLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/assets?tenant_id=${savedTenantId}`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const uploadFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name}…`);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/assets/upload?tenant_id=${savedTenantId}`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        setUploadProgress('');
        await fetchAssets();
      } else {
        const errText = await response.text();
        console.error("Upload failed:", errText);
        setUploadProgress('');
        alert("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error", error);
      setUploadProgress('');
      alert("Error uploading file. Is the backend running?");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleDeleteAsset = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/assets/${filename}?tenant_id=${savedTenantId}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchAssets();
      } else {
        alert("Failed to delete asset.");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting asset.");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
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
          {isUploading ? (uploadProgress || 'Uploading…') : '+ Upload Asset'}
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

      {/* Upload progress banner */}
      {isUploading && (
        <div style={{ marginBottom: '20px', padding: '14px 20px', borderRadius: '10px', background: 'rgba(82, 183, 136, 0.12)', border: '1px solid var(--primary-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '18px', height: '18px', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-color)' }}>{uploadProgress || 'Uploading…'}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p>Loading assets…</p>
        </div>
      ) : assets.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? 'var(--primary-color)' : '#cbd5e1'}`,
            borderRadius: '16px', padding: '64px 48px', textAlign: 'center',
            background: isDragging ? 'rgba(82, 183, 136, 0.07)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>☁️</div>
          <p style={{ fontWeight: 600, color: 'var(--text-color)', marginBottom: '8px', fontSize: '16px' }}>
            Drag & drop assets here
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '24px' }}>
            PNG, JPG, MP4 up to 50MB
          </p>
          <button
            className="btn-secondary"
            style={{ padding: '10px 24px' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Browse Files
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '10px', border: '2px dashed var(--primary-color)', background: 'rgba(82, 183, 136, 0.07)', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 600 }}>
              Drop to upload
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="asset-card"
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(82,183,136,0.15)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
              >
                <div style={{ height: '150px', background: '#0a0f0c', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {asset.name.toLowerCase().endsWith('.mp4') ? (
                    <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px', color: 'var(--text-color)' }} title={asset.name}>
                    {asset.name}
                  </span>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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
      tip: { bg: 'rgba(82, 183, 136, 0.05)', border: 'var(--primary-color)', icon: '💡' },
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

function LandingPage({ onGetStarted, onLogin }: { onGetStarted: () => void, onLogin: () => void }) {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('user_logged_in') === 'true');
  }, []);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: 800, color: 'var(--primary-color)' }}>
            <img src="/logo.png" alt="DigiM Logo" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} /> DigiM
          </div>
          <nav style={{ display: 'flex', gap: '32px' }}>
            <a href="#about" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }}>About</a>
            <a href="#products" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }}>Product & Services</a>
            <a href="#features" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }}>Features</a>
            <a href="#contact" style={{ color: 'var(--text-light)', textDecoration: 'none', fontWeight: 500, fontSize: '15px', transition: 'color 0.2s' }}>Contact</a>
          </nav>
          <div style={{ display: 'flex', gap: '16px' }}>
            {isLoggedIn ? (
              <button className="btn-primary" onClick={onGetStarted} style={{ padding: '8px 20px', fontSize: '14px', borderRadius: '10px' }}>Open App</button>
            ) : (
              <>
                <button className="btn-secondary" onClick={onLogin} style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '10px' }}>Log In</button>
                <button className="btn-primary" onClick={onGetStarted} style={{ padding: '8px 20px', fontSize: '14px', borderRadius: '10px' }}>Get Started</button>
              </>
            )}
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
          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Submit Inquiry</button>
        </form>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid rgba(82, 183, 136, 0.1)', padding: '32px 24px', background: 'rgba(5, 8, 6, 0.9)', textAlign: 'center', fontSize: '14px', color: 'var(--text-light)' }}>
        <p>© 2026 DigiM app. All rights reserved. Empowering local business marketing.</p>
      </footer>
    </div>
  );
}

function CalendarTab({
  onSelectCampaign,
  onNavigateToTab,
  onSelectDate,
  activeSubTab = 'upcoming',
  onSubTabChange
}: {
  onSelectCampaign?: (campaign: any) => void;
  onNavigateToTab?: (tab: string) => void;
  onSelectDate?: (dateStr: string) => void;
  activeSubTab?: 'upcoming' | 'drafts' | 'past';
  onSubTabChange?: (sub: 'upcoming' | 'drafts' | 'past') => void;
}) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'upcoming' | 'drafts' | 'past'>(activeSubTab);

  useEffect(() => {
    if (activeSubTab) setSubTab(activeSubTab);
  }, [activeSubTab]);

  const handleSubChange = (newSub: 'upcoming' | 'drafts' | 'past') => {
    setSubTab(newSub);
    onSubTabChange?.(newSub);
  };

  useEffect(() => {
    const savedTenantId = localStorage.getItem('tenant_id') || '1';
    Promise.all([
      fetch('/api/campaigns?tenant_id=' + savedTenantId).then(res => res.json()),
      fetch('/api/calendar/events').then(res => res.json()).catch(() => [])
    ])
      .then(([campaignData, calendarData]) => {
        setCampaigns(campaignData);
        setCalendarEvents(calendarData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load calendar or campaigns", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '16px' }}>
        <p style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Loading calendar & posts...</p>
      </div>
    );
  }

  // Get days of the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  // Filter campaigns into scheduled calendar items vs unscheduled drafts
  const isUpcomingCampaign = (c: any) => {
    if (!c || !c.scheduled_time) return false;
    if (c.status === 'archived' || c.status === 'failed' || c.status === 'published') return false;
    const d = new Date(c.scheduled_time).getTime();
    return !isNaN(d) && d > Date.now();
  };
  const scheduledCampaigns = campaigns.filter(isUpcomingCampaign);
  const unscheduledDrafts = campaigns.filter(c => !c.scheduled_time && c.status === 'draft');

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '32px', borderRadius: '20px' }}>
      {/* Calendar Header with Unified Sub-navigation Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Calendar</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '13px', marginTop: '2px' }}>
              Every post in one place: upcoming schedules, drafts in progress, and past published campaigns.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px' }}>
          <button
            type="button"
            onClick={() => handleSubChange('upcoming')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              background: subTab === 'upcoming' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
              color: subTab === 'upcoming' ? '#050806' : 'var(--text-color)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>📅 Upcoming</span>
            {scheduledCampaigns.length > 0 && (
              <span style={{
                background: subTab === 'upcoming' ? 'rgba(0,0,0,0.25)' : 'rgba(82, 183, 136, 0.2)',
                color: subTab === 'upcoming' ? '#050806' : 'var(--primary-color)',
                padding: '1px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                {scheduledCampaigns.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSubChange('drafts')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              background: subTab === 'drafts' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
              color: subTab === 'drafts' ? '#050806' : 'var(--text-color)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>💾 Drafts</span>
            {unscheduledDrafts.length > 0 && (
              <span style={{
                background: subTab === 'drafts' ? 'rgba(0,0,0,0.25)' : 'rgba(82, 183, 136, 0.2)',
                color: subTab === 'drafts' ? '#050806' : 'var(--primary-color)',
                padding: '1px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                {unscheduledDrafts.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSubChange('past')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              background: subTab === 'past' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
              color: subTab === 'past' ? '#050806' : 'var(--text-color)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📜 Past posts
          </button>
        </div>
      </div>

      {/* 1. UPCOMING VIEW */}
      {subTab === 'upcoming' && (
        <div>
{/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: 'var(--text-light)', marginBottom: '12px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {daysGrid.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} style={{ minHeight: '120px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid transparent' }} />;
          }

          // Check if there are posts scheduled for this day
          const dayPosts = scheduledCampaigns.filter(c => {
            const date = new Date(c.scheduled_time);
            return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
          });

          // Check for calendar events matching this day
          const dayEvents = calendarEvents.filter(e => {
            const parts = e.date.split('-');
            const eYear = parseInt(parts[0], 10);
            const eMonth = parseInt(parts[1], 10) - 1;
            const eDay = parseInt(parts[2], 10);
            return eYear === year && eMonth === month && eDay === day;
          });

          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

          const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return (
            <div
              key={`day-${day}`}
              onClick={() => onSelectDate?.(dayDateStr)}
              title={dayPosts.length === 0 ? `Click to schedule post for ${dayDateStr}` : undefined}
              style={{
                minHeight: '120px',
                background: isToday ? 'rgba(82, 183, 136, 0.08)' : 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: isToday ? '1.5px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.15)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--primary-color)' : 'var(--text-light)' }}>
                  {day} {isToday && '•'}
                </span>
                {dayPosts.length > 0 && (
                  <span
                    title={`${dayPosts.length} post(s) scheduled on this day`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#3b82f6',
                      background: 'rgba(59, 130, 246, 0.15)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      border: '1px solid rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />
                    {dayPosts.length}
                  </span>
                )}
              </div>

              {/* Calendar Events (Festivals / Holidays) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {dayEvents.map(event => {
                  let emoji = "🎉";
                  if (event.type === "public_holiday") emoji = "🏢";
                  if (event.type === "restricted_holiday") emoji = "🏛️";
                  if (event.type === "season") emoji = "🌤️";

                  return (
                    <div
                      key={event.name}
                      title={`${event.name}: ${event.description}`}
                      style={{
                        background: event.type === 'season' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                        border: event.type === 'season' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        fontSize: '9px',
                        color: 'var(--text-color)',
                        fontWeight: 600,
                        lineHeight: '1.2',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        cursor: 'default'
                      }}
                    >
                      {emoji} {event.name}
                    </div>
                  );
                })}
              </div>

              {/* Scheduled Posts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flexGrow: 1 }}>
                {dayPosts.map((post) => {
                  const postTime = post.scheduled_time_local || new Date(post.scheduled_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: getBizTimezone() });
                  const isPublished = post.status === 'published';
                  const isFailed = post.status === 'failed';
                  const isScheduled = post.status === 'scheduled';
                  const isPast = new Date(post.scheduled_time) < new Date();
                  const promptText = (post.prompt || post.generated_text || "Campaign").trim();
                  const firstTwoWords = promptText.split(/\s+/).slice(0, 2).join(' ');

                  return (
                    <div
                      key={post.id}
                      onClick={(e) => { e.stopPropagation(); onSelectCampaign?.(post); }}
                      style={{
                        background: isFailed ? 'rgba(239, 68, 68, 0.12)' : isPublished ? 'rgba(82, 183, 136, 0.15)' : isPast ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.15)',
                        border: isFailed ? '1.5px solid rgba(239, 68, 68, 0.6)' : isPublished ? '1.5px solid var(--primary-color)' : isPast ? '1px dashed #f59e0b' : '1px solid #38bdf8',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        fontSize: '10px',
                        color: isFailed ? '#fca5a5' : isPublished ? 'var(--text-color)' : isPast ? '#fde68a' : '#7dd3fc',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      title={isFailed ? (post.failure_reason || 'Failed to publish') : `[${postTime}] ${post.prompt || post.generated_text}`}
                    >
                      <div style={{
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: isPublished ? 'none' : 'none'
                      }}>
                        {firstTwoWords}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9, fontSize: '9px', marginTop: '2px' }}>
                        <span>⏰ {postTime}</span>
                        <span style={{ fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: isFailed ? '#f87171' : isPublished ? '#a3e635' : isPast ? '#f59e0b' : '#38bdf8' }}>
                          {isFailed ? '× failed' : isPublished ? '✓ done' : isPast ? '⏳ processing' : '📅 set'}
                        </span>
                      </div>
                      {isFailed && post.failure_reason && (
                        <div style={{ marginTop: '4px', fontSize: '8.5px', color: '#fca5a5', lineHeight: '1.3' }}>
                          {(post.failure_reason.toLowerCase().includes('session expired') || post.failure_reason.toLowerCase().includes('reconnect')) ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); onNavigateToTab?.('settings'); }}
                              style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '4px', color: '#ffffff', fontSize: '8px', padding: '2px 5px', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🔗 Reconnect Facebook
                            </button>
                          ) : (
                            <span>{post.failure_reason.slice(0, 60)}{post.failure_reason.length > 60 ? '…' : ''}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );

                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign Generations History List */}
      <div style={{ marginTop: '40px', borderTop: '1px solid rgba(82, 183, 136, 0.15)', paddingTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Campaign Generations History ({campaigns.length})</h3>
        {campaigns.length === 0 ? (
          <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>No campaigns generated yet. Head over to the Campaigns tab to create one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {campaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCampaign?.(c)}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(82, 183, 136, 0.15)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-color)';
                  e.currentTarget.style.background = 'rgba(82, 183, 136, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(82, 183, 136, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
                title="Click to load/edit in Campaigns tab"
              >
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', background: 'rgba(82, 183, 136, 0.2)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      {c.category}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Tone: {c.tone}
                    </span>
                    {c.status === 'scheduled' && (
                      <span style={{ fontSize: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        Scheduled: {c.scheduled_time_local ? `${new Date(c.scheduled_time).toLocaleDateString('en-IN', { timeZone: getBizTimezone() })} at ${c.scheduled_time_local}` : new Date(c.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: getBizTimezone() })}
                      </span>
                    )}
                    {c.status === 'published' && (
                      <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        Published
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-color)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Topic: {c.prompt}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{c.generated_text}"
                  </div>
                </div>
                {c.is_liked && (
                  <div style={{ fontSize: '20px', color: '#e63946' }} title="Liked Style (Personalizing your AI)">
                    ❤️
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      )}

      {/* 2. DRAFTS VIEW */}
      {subTab === 'drafts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)' }}>
                Drafts ({unscheduledDrafts.length})
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>
                Drafts save automatically. Pick up where you left off or click any draft to edit and schedule.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab?.('home')}
              style={{
                background: 'var(--primary-color)',
                color: '#050806',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              + Create New Draft
            </button>
          </div>

          {unscheduledDrafts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-color)' }}>No saved drafts yet</div>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px', maxWidth: '380px', margin: '8px auto 20px' }}>
                Drafts save automatically when you design posts. Scheduling one moves it to Upcoming; once it’s out, it moves to Past.
              </p>
              <button
                onClick={() => onNavigateToTab?.('home')}
                style={{
                  background: 'var(--primary-color)',
                  color: '#050806',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Create a post
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {unscheduledDrafts.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => onSelectCampaign?.(draft)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {(draft.image_url || (draft.visual_suggestion && (draft.visual_suggestion.startsWith('/') || draft.visual_suggestion.startsWith('http')))) ? (
                      <img src={draft.image_url || draft.visual_suggestion} alt="Draft" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                        📝
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {draft.prompt || "Saved Draft"}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'rgba(82, 183, 136, 0.15)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '11px' }}>
                          {draft.category || "Post"}
                        </span>
                        <span>Tone: {draft.tone}</span>
                      </div>
                    </div>
                  </div>
                  {draft.generated_text && (
                    <div style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      "{draft.generated_text}"
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 600 }}>Click to edit or schedule →</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Draft #{draft.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PAST POSTS VIEW */}
      {subTab === 'past' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)' }}>Past Posts & Archive</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>
              All your published and archived campaigns in one place. Posts older than 90 days are archived here and can be restored anytime.
            </p>
          </div>
          <ArchivedPostsTab />
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const savedTenantId = localStorage.getItem('tenant_id') || '1';
    fetch(`/api/meta/analytics?tenant_id=${savedTenantId}`)
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

function ArchivedPostsTab({ onRefreshWarnings }: { onRefreshWarnings?: () => void }) {
  const [archived, setArchived] = useState<any[]>([]);
  const [pendingWarnings, setPendingWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const [archRes, warnRes] = await Promise.all([
        fetch(`/api/campaigns/archived?tenant_id=${savedTenantId}`),
        fetch(`/api/campaigns/archival-warnings?tenant_id=${savedTenantId}`)
      ]);
      if (archRes.ok) {
        const data = await archRes.json();
        setArchived(data);
      }
      if (warnRes.ok) {
        const wData = await warnRes.json();
        setPendingWarnings(wData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnarchive = async (id: number) => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch(`/api/campaigns/archived/${id}/unarchive?tenant_id=${savedTenantId}`, { method: 'POST' });
      if (res.ok) {
        window.showNotification?.("Post unarchived and restored to active campaigns!", "success");
        fetchData();
        onRefreshWarnings?.();
      }
    } catch (err) {
      console.error(err);
      window.showNotification?.("Failed to unarchive post", "error");
    }
  };

  const handleArchiveNow = async (id: number) => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch(`/api/campaigns/${id}/archive?tenant_id=${savedTenantId}`, { method: 'POST' });
      if (res.ok) {
        window.showNotification?.("Post moved to archive!", "success");
        fetchData();
        onRefreshWarnings?.();
      }
    } catch (err) {
      console.error(err);
      window.showNotification?.("Failed to archive post", "error");
    }
  };

  const handleKeepActive = async (id: number) => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch(`/api/campaigns/${id}/keep-active?tenant_id=${savedTenantId}`, { method: 'POST' });
      if (res.ok) {
        window.showNotification?.("Retention period refreshed for another 90 days!", "success");
        fetchData();
        onRefreshWarnings?.();
      }
    } catch (err) {
      console.error(err);
      window.showNotification?.("Failed to refresh retention period", "error");
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
            📦 Archived Posts Library
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {pendingWarnings.length > 0 && (
              <span style={{ fontSize: '12px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                ⚠️ {pendingWarnings.length} Pending Archival
              </span>
            )}
            <span style={{ fontSize: '12px', color: 'var(--text-light)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>
              {archived.length} Archived Items
            </span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: 1.5, margin: 0 }}>
          Posts published over 90 days ago are automatically archived here to keep your active calendar clean. Media files over 180 days are pruned only if GCS cloud storage exceeds 5.0 GB to maintain 100% free storage.
        </p>
      </div>

      {pendingWarnings.length > 0 && (
        <div className="fade-in-up" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1.5px solid #f59e0b', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <h4 style={{ color: '#f59e0b', fontSize: '15px', fontWeight: 700, margin: 0 }}>
                Posts Pending Auto-Archival (Next 7 Days)
              </h4>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
              These posts will move to Archive automatically when they reach 90 days.
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {pendingWarnings.map((w) => (
              <div key={w.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, background: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                      ⏳ Moves to archive in {w.days_until_archival} day{w.days_until_archival === 1 ? '' : 's'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      📅 {new Date(w.scheduled_time).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, color: 'var(--text-color)' }}>
                    {w.generated_text || w.prompt}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => handleKeepActive(w.id)}
                    style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(82, 183, 136, 0.2)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer' }}
                    title="Reset 90-day retention timer to keep this post active"
                  >
                    🛡️ Keep Active (+90d)
                  </button>
                  <button
                    onClick={() => handleArchiveNow(w.id)}
                    style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '6px', background: '#f59e0b', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}
                    title="Move immediately to archived posts"
                  >
                    📦 Archive Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Loading archived posts...</div>
      ) : archived.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '16px', color: 'var(--text-light)' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>No archived posts yet</div>
          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Published posts older than 90 days will automatically appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {archived.map((item) => (
            <div key={item.id} className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.08)' }}>
              {(item.visual_suggestion && (item.visual_suggestion.startsWith('/') || item.visual_suggestion.startsWith('http'))) ? (
                <img src={item.visual_suggestion} alt="Visual" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '140px', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: '6px' }}>
                  <span style={{ fontSize: '24px' }}>📦</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{item.media_pruned ? 'Media blob pruned (>180d GCS limit)' : 'No image attached'}</span>
                </div>
              )}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, color: 'var(--text-color)' }}>
                  {item.generated_text || item.prompt}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                    📅 {new Date(item.scheduled_time || item.archived_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleUnarchive(item.id)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(82, 183, 136, 0.15)',
                      border: '1px solid var(--primary-color)',
                      color: 'var(--primary-color)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Restore to Active
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function SettingsView({ initialTab = 'shop_details', onLogout }: { initialTab?: string; onLogout?: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveSubTab(initialTab);
  }, [initialTab]);

  // --- Shop Details State ---
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [industry, setIndustry] = useState('Clothing & Apparel');
  const [category, setCategory] = useState('Clothing');
  const [targetLocations, setTargetLocations] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [brandColorPrimary, setBrandColorPrimary] = useState('#52B788');
  const [isSavingShop, setIsSavingShop] = useState(false);

  // --- Post Defaults State ---
  const [postFacebook, setPostFacebook] = useState(true);
  const [postInstagram, setPostInstagram] = useState(false);
  const [targetGender, setTargetGender] = useState('All');
  const [targetAgeMin, setTargetAgeMin] = useState(18);
  const [targetAgeMax, setTargetAgeMax] = useState(60);
  const [personaTone, setPersonaTone] = useState('casual');
  const [aiImageStyle, setAiImageStyle] = useState('Flat illustration');
  const [defaultFormat, setDefaultFormat] = useState('Post (1:1)');
  const [hashtags, setHashtags] = useState<string[]>(['#ShopLocal', '#LocalBusiness', '#Trending']);
  const [newHashtagInput, setNewHashtagInput] = useState('');
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);

  // --- Profile State ---
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Meta status info
  const [metaInfo, setMetaInfo] = useState<{ connected: boolean; tokenValid?: boolean; pageName?: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
        const [profRes, metaRes] = await Promise.all([
          fetch('/api/onboarding/brand-profile?tenant_id=' + savedTenantId).catch(() => null),
          fetch('/api/meta/status?tenant_id=' + savedTenantId).catch(() => null)
        ]);

        if (profRes && profRes.ok) {
          const data = await profRes.json();
          if (data.business_name) setBusinessName(data.business_name);
          if (data.business_description) setBusinessDescription(data.business_description);
          if (data.industry) setIndustry(data.industry);
          if (data.category) setCategory(data.category);
          if (data.brand_color_primary) setBrandColorPrimary(data.brand_color_primary);
          if (data.target_locations) setTargetLocations(data.target_locations);
          if (data.target_gender) setTargetGender(data.target_gender);
          if (data.target_age_min) setTargetAgeMin(data.target_age_min);
          if (data.target_age_max) setTargetAgeMax(data.target_age_max);
          if (data.persona_tone) setPersonaTone(data.persona_tone);
          if (data.brand_url) setFullAddress(data.brand_url);
        }

        if (metaRes && metaRes.ok) {
          const mData = await metaRes.json();
          setMetaInfo({
            connected: mData.connected,
            tokenValid: mData.token_valid,
            pageName: mData.page_name
          });
        }
      } catch (err) {
        console.error('Failed to load settings data', err);
      }

      if (typeof window !== 'undefined') {
        const email = localStorage.getItem('user_email') || '';
        const savedName = localStorage.getItem('user_name') || '';
        const savedBiz = localStorage.getItem('businessProfile');
        let bizName = '';
        if (savedBiz) {
          try {
            const p = JSON.parse(savedBiz);
            bizName = p.userName || '';
            if (p.businessName) setBusinessName(p.businessName);
            if (p.category) setCategory(p.category);
            if (p.brandColorPrimary) setBrandColorPrimary(p.brandColorPrimary);
          } catch (e) {}
        }
        setProfileName(bizName || savedName || (email ? email.split('@')[0] : ''));
        setProfileEmail(email);

        const savedDefaults = localStorage.getItem('post_defaults');
        if (savedDefaults) {
          try {
            const defs = JSON.parse(savedDefaults);
            if (defs.hashtags) setHashtags(defs.hashtags);
            if (defs.postFacebook !== undefined) setPostFacebook(defs.postFacebook);
            if (defs.postInstagram !== undefined) setPostInstagram(defs.postInstagram);
            if (defs.aiImageStyle) setAiImageStyle(defs.aiImageStyle);
            if (defs.defaultFormat) setDefaultFormat(defs.defaultFormat);
          } catch (e) {}
        }
      }
    };
    loadData();
  }, []);

  const handleSaveShop = async () => {
    setIsSavingShop(true);
    try {
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const payload = {
        tenant_id: parseInt(savedTenantId, 10),
        business_name: businessName,
        business_description: businessDescription,
        industry: industry,
        category: category,
        brand_color_primary: brandColorPrimary,
        target_locations: targetLocations,
        brand_url: fullAddress,
        whatsapp_phone_number_id: whatsappNumber
      };
      const res = await fetch('/api/onboarding/brand-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (typeof window !== 'undefined') {
          const savedBiz = localStorage.getItem('businessProfile');
          const current = savedBiz ? JSON.parse(savedBiz) : {};
          current.businessName = businessName;
          current.industry = industry;
          current.category = category;
          current.brandColorPrimary = brandColorPrimary;
          current.targetLocations = targetLocations;
          localStorage.setItem('businessProfile', JSON.stringify(current));
        }
        notifySuccess('Shop details updated successfully! 🎉');
      } else {
        notifyError('Failed to save shop details.');
      }
    } catch (err) {
      notifyError('Network error saving shop details.');
    } finally {
      setIsSavingShop(false);
    }
  };

  const handleSaveDefaults = async () => {
    setIsSavingDefaults(true);
    try {
      const savedTenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || '1') : '1';
      const payload = {
        tenant_id: parseInt(savedTenantId, 10),
        target_gender: targetGender,
        target_age_min: targetAgeMin,
        target_age_max: targetAgeMax,
        persona_tone: personaTone
      };
      await fetch('/api/onboarding/brand-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('post_defaults', JSON.stringify({
          hashtags,
          postFacebook,
          postInstagram,
          aiImageStyle,
          defaultFormat
        }));
      }
      notifySuccess('Post defaults updated successfully! 🎉');
    } catch (err) {
      notifyError('Failed to save post defaults.');
    } finally {
      setIsSavingDefaults(false);
    }
  };

  const handleSaveProfile = () => {
    setIsSavingProfile(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_name', profileName);
        const savedBiz = localStorage.getItem('businessProfile');
        const current = savedBiz ? JSON.parse(savedBiz) : {};
        current.userName = profileName;
        localStorage.setItem('businessProfile', JSON.stringify(current));
      }
      notifySuccess('Profile updated successfully!');
    } catch (err) {
      notifyError('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addHashtag = () => {
    if (!newHashtagInput.trim()) return;
    let tag = newHashtagInput.trim();
    if (!tag.startsWith('#')) tag = '#' + tag;
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setNewHashtagInput('');
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(t => t !== tagToRemove));
  };

  const SETTINGS_TABS = [
    { id: 'shop_details', label: 'Shop details', icon: '🏪' },
    { id: 'connected_accounts', label: 'Connected accounts', icon: '🔗' },
    { id: 'post_defaults', label: 'Post defaults', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'plan_billing', label: 'Plan and billing', icon: '💳' },
    { id: 'privacy_data', label: 'Privacy and data', icon: '🛡️' }
  ];

  const COLOR_SWATCHES = ['#52B788', '#0ea5e9', '#a855f7', '#f97316', '#1877f2', '#e11d48'];
  const CATEGORY_CHIPS = ['Clothing', 'Food and sweets', 'Fashion', 'Jewelry', 'Electronics', 'Services', 'Retail'];
  const TONE_CHIPS = [
    { id: 'casual', label: 'Casual' },
    { id: 'formal', label: 'Formal' },
    { id: 'festive', label: 'Festive' },
    { id: 'short', label: 'Short' }
  ];
  const IMAGE_STYLES = ['Flat illustration', 'Bold poster', 'Soft pastel', 'Photorealistic'];
  const FORMAT_OPTIONS = ['Post (1:1)', 'Reel (9:16)', 'Story / Carousel (9:16)'];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Settings Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-color)' }}>Settings</h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-light)' }}>
          Manage your business identity, connected channels, post defaults, and account details.
        </p>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Sub-Nav Tabs */}
        <nav
          aria-label="Settings Tabs"
          style={{
            width: '100%',
            maxWidth: '240px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {SETTINGS_TABS.map(tab => {
            const isActive = activeSubTab === tab.id;
            const hasMetaWarning = tab.id === 'connected_accounts' && metaInfo && (!metaInfo.connected || metaInfo.tokenValid === false);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  background: isActive ? 'rgba(82, 183, 136, 0.15)' : 'transparent',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '14px',
                  border: isActive ? '1px solid rgba(82, 183, 136, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                {hasMetaWarning && (
                  <span
                    title="Attention required"
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      display: 'inline-block'
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Content Panel */}
        <div style={{ flex: '1 1 540px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TAB 1: SHOP DETAILS */}
          {activeSubTab === 'shop_details' && (
            <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-color)' }}>Shop details</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-light)' }}>
                  Used in every post and by the AI. Customers can see your name, location, and contact numbers.
                </p>
              </div>

              {/* Logo and Brand Colour */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Logo and colour</b>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'rgba(82, 183, 136, 0.15)',
                      border: '2px solid var(--primary-color)',
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      fontWeight: 800
                    }}
                  >
                    {(businessName.charAt(0) || 'B').toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--text-color)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Upload logo
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={() => notifySuccess('Logo selected.')} />
                      </label>
                      <button
                        type="button"
                        onClick={() => notifySuccess('Default logo restored.')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Square image, at least 400 × 400 px.</span>
                  </div>
                </div>

                {/* Brand Colour Swatches */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Brand colour</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {COLOR_SWATCHES.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBrandColorPrimary(color)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: color,
                          border: brandColorPrimary === color ? '3px solid #ffffff' : '1px solid var(--glass-border)',
                          boxShadow: brandColorPrimary === color ? '0 0 10px ' + color : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title={color}
                      />
                    ))}
                    <input
                      type="color"
                      value={brandColorPrimary}
                      onChange={(e) => setBrandColorPrimary(e.target.value)}
                      style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      title="Custom colour picker"
                    />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Used in AI images and post banners.</span>
                </div>
              </div>

              {/* Basics: Shop Name & What you sell */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Basics</b>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Shop name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. SriKrish"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-color)',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>What you sell</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {CATEGORY_CHIPS.map(chip => {
                      const isSelected = category.toLowerCase() === chip.toLowerCase();
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setCategory(chip)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(82, 183, 136, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '1.5px solid var(--primary-color)' : '1px solid var(--glass-border)',
                            color: isSelected ? 'var(--primary-color)' : 'var(--text-color)',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Location & Contact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Location & Contact</b>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Area and city</label>
                    <input
                      type="text"
                      value={targetLocations}
                      onChange={(e) => setTargetLocations(e.target.value)}
                      placeholder="e.g. MG Road, Bengaluru"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-color)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>WhatsApp contact</label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="e.g. +91 98450 12345"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-color)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Full address (optional)</label>
                  <input
                    type="text"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="e.g. Shop 12, Main Market, Bengaluru 560001"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-color)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleSaveShop}
                  disabled={isSavingShop}
                  className="btn-primary"
                  style={{ minWidth: '140px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
                >
                  {isSavingShop ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTED ACCOUNTS */}
          {activeSubTab === 'connected_accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Platforms isSettings={true} />
            </div>
          )}

          {/* TAB 3: POST DEFAULTS */}
          {activeSubTab === 'post_defaults' && (
            <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-color)' }}>Post defaults</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-light)' }}>
                  Every new post starts with these preferences. You can always adjust them for any individual post.
                </p>
              </div>

              {/* Where to post */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Where to post</b>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-color)' }}>
                    <input
                      type="checkbox"
                      checked={postFacebook}
                      onChange={(e) => setPostFacebook(e.target.checked)}
                      style={{ accentColor: 'var(--primary-color)', width: '18px', height: '18px' }}
                    />
                    <span>📘 Facebook Page</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-color)' }}>
                    <input
                      type="checkbox"
                      checked={postInstagram}
                      onChange={(e) => setPostInstagram(e.target.checked)}
                      style={{ accentColor: 'var(--primary-color)', width: '18px', height: '18px' }}
                    />
                    <span>📸 Instagram</span>
                  </label>
                </div>
              </div>

              {/* Target Audience */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Target audience</b>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['All', 'Women', 'Men'].map(gender => {
                    const isSelected = targetGender.toLowerCase() === gender.toLowerCase();
                    return (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setTargetGender(gender)}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(82, 183, 136, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1.5px solid var(--primary-color)' : '1px solid var(--glass-border)',
                          color: isSelected ? 'var(--primary-color)' : 'var(--text-color)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {gender}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                    Target age range: <strong>{targetAgeMin} to {targetAgeMax} years</strong>
                  </span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="range"
                      min="18"
                      max="40"
                      value={targetAgeMin}
                      onChange={(e) => setTargetAgeMin(parseInt(e.target.value, 10))}
                      style={{ flex: 1, accentColor: 'var(--primary-color)' }}
                    />
                    <input
                      type="range"
                      min="41"
                      max="75"
                      value={targetAgeMax}
                      onChange={(e) => setTargetAgeMax(parseInt(e.target.value, 10))}
                      style={{ flex: 1, accentColor: 'var(--primary-color)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Hashtags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Hashtags added to every post</b>
                <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>You can always remove them on individual posts.</span>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {hashtags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(82, 183, 136, 0.15)',
                        color: 'var(--primary-color)',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', maxWidth: '340px' }}>
                  <input
                    type="text"
                    value={newHashtagInput}
                    onChange={(e) => setNewHashtagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
                    placeholder="Add hashtag (e.g. #Sale)"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-color)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={addHashtag}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'rgba(82, 183, 136, 0.2)',
                      border: '1px solid var(--primary-color)',
                      color: 'var(--primary-color)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Writing & Images */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Writing & AI Style</b>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Caption tone</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {TONE_CHIPS.map(tone => {
                      const isSelected = personaTone.toLowerCase() === tone.id;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => setPersonaTone(tone.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(82, 183, 136, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '1.5px solid var(--primary-color)' : '1px solid var(--glass-border)',
                            color: isSelected ? 'var(--primary-color)' : 'var(--text-color)',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {tone.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>AI image style</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {IMAGE_STYLES.map(style => {
                      const isSelected = aiImageStyle === style;
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setAiImageStyle(style)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(82, 183, 136, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '1.5px solid var(--primary-color)' : '1px solid var(--glass-border)',
                            color: isSelected ? 'var(--primary-color)' : 'var(--text-color)',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleSaveDefaults}
                  disabled={isSavingDefaults}
                  className="btn-primary"
                  style={{ minWidth: '140px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
                >
                  {isSavingDefaults ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS (BLANK per user instruction) */}
          {activeSubTab === 'notifications' && (
            <div className="glass-panel" style={{ padding: '60px 24px', borderRadius: '16px', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {/* Intentionally blank per user specification */}
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeSubTab === 'profile' && (
            <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-color)' }}>Profile</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-light)' }}>
                  How you appear to your team, approvers, and business collaborators.
                </p>
              </div>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <span
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(82, 183, 136, 0.2)',
                    border: '2px solid var(--primary-color)',
                    color: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '24px'
                  }}
                >
                  {(profileName.charAt(0) || profileEmail.charAt(0) || '👤').toUpperCase()}
                </span>
                <div>
                  <b style={{ fontSize: '16px', color: 'var(--text-color)' }}>{profileName || 'User'}</b>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{profileEmail || 'Signed in via Google'}</div>
                </div>
              </div>

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Your name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your Name"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-color)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-light)',
                      fontSize: '14px',
                      cursor: 'not-allowed'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    Managed dynamically by your Google account, which you use to sign in.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-color)' }}>Phone number (optional)</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +91 98450 12345"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-color)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: '13px' }}
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>

              {/* Sign Out Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div>
                  <b style={{ fontSize: '15px', color: '#f87171' }}>Sign out of DigiM</b>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>
                    Sign out of this browser. Your campaigns, connected accounts, and settings stay safely saved.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: PLAN AND BILLING (BLANK per user instruction) */}
          {activeSubTab === 'plan_billing' && (
            <div className="glass-panel" style={{ padding: '60px 24px', borderRadius: '16px', textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {/* Intentionally blank per user specification */}
            </div>
          )}

          {/* TAB 7: PRIVACY AND DATA (LINKS ONLY per user instruction) */}
          {activeSubTab === 'privacy_data' && (
            <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-color)' }}>Privacy and data</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-light)' }}>
                  Policies, terms of service, and public data deletion instructions.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Privacy policy link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div>
                    <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Privacy policy</b>
                    <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>How DigiM uses and protects your data</div>
                  </div>
                  <a
                    href="/privacy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
                  >
                    Open ↗
                  </a>
                </div>

                {/* Terms of service link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div>
                    <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Terms of service</b>
                    <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>The rules and conditions for using DigiM</div>
                  </div>
                  <a
                    href="/privacy.html#terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
                  >
                    Open ↗
                  </a>
                </div>

                {/* Data deletion instructions link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div>
                    <b style={{ fontSize: '15px', color: 'var(--text-color)' }}>Data deletion instructions</b>
                    <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>Public instructions required by Meta for data deletion requests</div>
                  </div>
                  <a
                    href="/privacy.html#data-deletion"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
                  >
                    Open ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ----------------------------------------------------------------------------
// HomeView Component (DigiM Home Page)
// ----------------------------------------------------------------------------
export function HomeView({
  campaigns,
  metaStatus,
  userInfo,
  businessInfo,
  onStartTopic,
  onStartImage,
  onEditDraft,
  onOpenCalendar,
  onReconnectMeta,
  draftsCount,
  upcomingCount
}: {
  campaigns: any[];
  metaStatus: { connected: boolean; page_name?: string } | null;
  userInfo: { name: string; email: string; initial: string };
  businessInfo: { name: string; location: string; initial: string };
  onStartTopic: (topic: string) => void;
  onStartImage: () => void;
  onEditDraft: (draft: any) => void;
  onOpenCalendar: (subTab?: 'upcoming' | 'drafts' | 'past') => void;
  onReconnectMeta: () => void;
  draftsCount: number;
  upcomingCount: number;
}) {
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const g = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    setGreeting(g);
    setCurrentDateStr(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    );
  }, []);

  const drafts = campaigns
    .filter((c: any) => !c.scheduled_time && c.status === 'draft')
    .slice(0, 3);

  const isUpcomingHome = (c: any) => {
    if (!c || !c.scheduled_time) return false;
    if (c.status === 'archived' || c.status === 'failed' || c.status === 'published') return false;
    const d = new Date(c.scheduled_time).getTime();
    return !isNaN(d) && d > Date.now();
  };
  const upcoming = campaigns
    .filter(isUpcomingHome)
    .sort((a: any, b: any) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
    .slice(0, 3);

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Edited recently';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Edited recently';
    const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Edited today';
    if (diffDays === 1) return 'Edited yesterday';
    return `Edited ${diffDays} days ago`;
  };

  const formatScheduledTime = (dateStr?: string) => {
    if (!dateStr) return 'Scheduled';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Scheduled';
    const isToday = d.toDateString() === new Date().toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    const dateStrShort = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
    return `${dateStrShort}, ${timeStr}`;
  };

  const SWATCH_COLORS = ['#2D6A4F', '#742a2a', '#b45309', '#1d4ed8', '#581c87'];

  const TOPIC_CHIPS = [
    {
      id: 'summer',
      name: 'Summer Sale',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )
    },
    {
      id: 'collection',
      name: 'New Collection',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M12 7a2 2 0 1 1 2-2c0 1-2 1.5-2 3" />
          <path d="M12 8L3 15h18z" />
        </svg>
      )
    },
    {
      id: 'spotlight',
      name: 'Customer Spotlight',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
        </svg>
      )
    },
    {
      id: 'festival',
      name: 'Festival Offer',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M4 15c0 3 3.6 5 8 5s8-2 8-5H4z" />
          <path d="M12 15c-2-2-1.5-4.5 0-7 1.5 2.5 2 5 0 7z" />
        </svg>
      )
    },
    {
      id: 'showcase',
      name: 'Product Showcase',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M5 8h14l-1 13H6z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      )
    },
    {
      id: 'bts',
      name: 'Behind the Scenes',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="9" width="18" height="12" rx="2" />
          <path d="M3 9l2-5 16 2-1.5 3M8 4.5l1.5 4.5M14 5.5l1.5 3.5" />
        </svg>
      )
    },
    {
      id: 'promo',
      name: 'Promotions',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M3 10v4h4l8 5V5L7 10z" />
          <path d="M19 9a4 4 0 0 1 0 6" />
        </svg>
      )
    },
    {
      id: 'info',
      name: 'Knowledge Info',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
        </svg>
      )
    }
  ];

  const displayName = userInfo.name || businessInfo.name || 'Ravi';

  return (
    <div className="fade-in-up" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── 1. GREETING & DATE HEADER ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 500, letterSpacing: '0.02em' }}>
          {currentDateStr || 'Today'}
        </span>
        <h1 style={{
          margin: 0,
          fontSize: '30px',
          lineHeight: '36px',
          fontWeight: 800,
          color: 'var(--text-color)',
          letterSpacing: '-0.02em'
        }}>
          {greeting}, {displayName}
        </h1>
      </div>

      {/* ── 2. WHAT DO YOU WANT TO POST TODAY? (QUICK COMPOSER CARD) ────────── */}
      <div className="glass-panel" style={{
        padding: '28px',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '22px',
            lineHeight: '28px',
            fontWeight: 800,
            color: 'var(--text-color)'
          }}>
            What do you want to post today?
          </h2>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '20px', color: 'var(--text-light)' }}>
            Pick a type and we’ll write the first draft for you.
          </p>
        </div>

        {/* Topic Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip.name}
              type="button"
              onClick={() => onStartTopic(chip.id || chip.name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '38px',
                padding: '0 16px',
                borderRadius: '999px',
                border: '1px solid rgba(82, 183, 136, 0.25)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-color)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.color = 'var(--primary-color)';
                e.currentTarget.style.background = 'rgba(82, 183, 136, 0.12)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(82, 183, 136, 0.25)';
                e.currentTarget.style.color = 'var(--text-color)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {chip.icon}
              {chip.name}
            </button>
          ))}
        </div>

        {/* Start from image action */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
          <button
            type="button"
            onClick={onStartImage}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--primary-color)',
              border: 'none',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(82, 183, 136, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M21 16l-5-5-9 9" />
            </svg>
            Start from an image instead
          </button>
        </div>
      </div>

      {/* ── 3. ALERT BANNER (ONLY WHEN DISCONNECTED) ─────────────────────────── */}
      {!metaStatus?.connected && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            color: '#fca5a5'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ flex: 1, minWidth: '240px', fontSize: '14px', lineHeight: '20px' }}>
            <strong style={{ fontWeight: 700, color: '#ffffff' }}>Instagram stopped working.</strong>{' '}
            {upcomingCount > 0 ? `${upcomingCount} scheduled posts won’t go out until you reconnect.` : "Scheduled posts won’t go out until you reconnect."}
          </span>
          <button
            type="button"
            onClick={onReconnectMeta}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '38px',
              padding: '0 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'rgba(220, 38, 38, 0.25)',
              color: '#ffffff',
              border: '1px solid rgba(220, 38, 38, 0.6)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.25)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" />
            </svg>
            Reconnect Instagram
          </button>
        </div>
      )}

      {/* ── 4. TWO-COLUMN WORKSPACE: DRAFTS & UPCOMING ────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* PICK UP WHERE YOU LEFT OFF (DRAFTS) */}
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              lineHeight: '24px',
              fontWeight: 800,
              color: 'var(--text-color)'
            }}>
              Pick up where you left off
            </h2>
            <button
              type="button"
              onClick={() => onOpenCalendar('drafts')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--primary-color)',
                cursor: 'pointer'
              }}
            >
              All drafts ({draftsCount})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {drafts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>
                No drafts yet. Posts you start will save automatically here.
              </div>
            ) : (
              drafts.map((draft: any, idx: number) => {
                const title = draft.name || draft.topic || draft.category || 'Untitled Draft';
                const mediaUrl = draft.media_url || (draft.media_urls && draft.media_urls[0]) || draft.image_url;
                return (
                  <div
                    key={draft.id || idx}
                    onClick={() => onEditDraft(draft)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      minHeight: '64px',
                      padding: '12px 6px',
                      borderBottom: idx < drafts.length - 1 ? '1px solid var(--glass-border)' : 'none',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {mediaUrl ? (
                      <img
                        src={mediaUrl}
                        alt=""
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: SWATCH_COLORS[idx % SWATCH_COLORS.length],
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '18px'
                        }}
                      >
                        {title.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <b style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--text-color)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {title}
                      </b>
                      <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                        {draft.post_type || 'Post'}, {draft.channels || 'Facebook and Instagram'} · {formatRelativeTime(draft.updated_at || draft.created_at)}
                      </span>
                    </div>

                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)', flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COMING UP (SCHEDULED POSTS) */}
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              lineHeight: '24px',
              fontWeight: 800,
              color: 'var(--text-color)'
            }}>
              Coming up
            </h2>
            <button
              type="button"
              onClick={() => onOpenCalendar('upcoming')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--primary-color)',
                cursor: 'pointer'
              }}
            >
              Open Calendar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcoming.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>
                No scheduled posts yet. Schedule your first post to see it here!
              </div>
            ) : (
              upcoming.map((post: any, idx: number) => {
                const title = post.name || post.topic || post.category || 'Scheduled Post';
                const mediaUrl = post.media_url || (post.media_urls && post.media_urls[0]) || post.image_url;
                const isMetaIssue = !metaStatus?.connected;

                return (
                  <div
                    key={post.id || idx}
                    onClick={() => onOpenCalendar('upcoming')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      minHeight: '64px',
                      padding: '12px 6px',
                      borderBottom: idx < upcoming.length - 1 ? '1px solid var(--glass-border)' : 'none',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {mediaUrl ? (
                      <img
                        src={mediaUrl}
                        alt=""
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: SWATCH_COLORS[(idx + 2) % SWATCH_COLORS.length],
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '18px'
                        }}
                      >
                        {title.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <b style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--text-color)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {title}
                      </b>
                      <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                        {formatScheduledTime(post.scheduled_time)} · {post.channels || 'Facebook and Instagram'}
                      </span>
                    </div>

                    {isMetaIssue ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        background: 'rgba(220, 38, 38, 0.15)',
                        border: '1px solid rgba(220, 38, 38, 0.35)',
                        color: '#f87171',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v6M12 16.5v.5" />
                        </svg>
                        Won’t post
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        background: 'rgba(82, 183, 136, 0.15)',
                        border: '1px solid rgba(82, 183, 136, 0.3)',
                        color: 'var(--primary-color)',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        Scheduled
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function MainDashboard({ onGoHome, onLogout }: { onGoHome?: () => void, onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeTab') || 'home';
      if (saved === 'campaigns') return 'home';
      if (saved === 'assets') return 'library';
      if (saved === 'analytics') return 'results';
      return saved;
    }
    return 'home';
  });

  const [calendarSubTab, setCalendarSubTab] = useState<'upcoming' | 'drafts' | 'past'>('upcoming');
  const [showMobileAvatarMenu, setShowMobileAvatarMenu] = useState(false);

  const [businessInfo, setBusinessInfo] = useState<{ name: string; location: string; initial: string }>({
    name: 'SriKrish',
    location: 'MG Road, Bengaluru',
    initial: 'S'
  });

  const [userInfo, setUserInfo] = useState<{ name: string; email: string; initial: string }>({
    name: '',
    email: '',
    initial: ''
  });

  const [metaStatus, setMetaStatus] = useState<{ connected: boolean; page_name?: string } | null>(null);
  const [draftsCount, setDraftsCount] = useState<number>(0);
  const [upcomingCount, setUpcomingCount] = useState<number>(0);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const handleTabChange = (tab: string, sub?: 'upcoming' | 'drafts' | 'past') => {
    let resolvedTab = tab;
    if (tab === 'campaigns') resolvedTab = 'create';
    if (tab === 'assets') resolvedTab = 'library';
    if (tab === 'analytics') resolvedTab = 'results';
    if (tab === 'archived') {
      resolvedTab = 'calendar';
      setCalendarSubTab('past');
    } else if (sub) {
      setCalendarSubTab(sub);
    }
    setActiveTab(resolvedTab);
    if (typeof window !== 'undefined') localStorage.setItem('activeTab', resolvedTab);
  };

  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState<any>(null);
  const [composerInitParams, setComposerInitParams] = useState<{
    mode: 'blank' | 'type' | 'draft' | 'calendar_date';
    category?: string;
    draft?: any;
    date?: string;
    ts?: number;
  }>({ mode: 'blank' });
  const [inspectCampaign, setInspectCampaign] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [archivalWarnings, setArchivalWarnings] = useState<any[]>([]);
  const [storageStatus, setStorageStatus] = useState<any>(null);

  // Load business & user profiles from onboarding data
  useEffect(() => {
    try {
      const savedBiz = localStorage.getItem('businessProfile');
      if (savedBiz) {
        const parsed = JSON.parse(savedBiz);
        const isMf = parsed.businessName && parsed.businessName.toLowerCase().includes('marketflow');
        const name = parsed.businessName && parsed.businessName.trim() && !isMf ? parsed.businessName.trim() : 'SriKrish';
        const loc = parsed.category || parsed.industry || '';
        const initial = (name.charAt(0) || 'B').toUpperCase();
        setBusinessInfo({ name, location: loc, initial });
      }
      const email = localStorage.getItem('user_email') || '';
      const savedName = localStorage.getItem('user_name') || '';
      const userName = (savedBiz ? JSON.parse(savedBiz).userName : '') || savedName || (email ? email.split('@')[0] : '');
      const userInitial = userName ? (userName.charAt(0) || '').toUpperCase() : (email ? (email.charAt(0) || '').toUpperCase() : '');
      setUserInfo({ name: userName, email, initial: userInitial });
    } catch (err) {
      console.error("Error reading business profile", err);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const [mRes, cRes, wRes, sRes] = await Promise.all([
        fetch('/api/meta/status?tenant_id=' + savedTenantId).catch(() => null),
        fetch('/api/campaigns?tenant_id=' + savedTenantId).catch(() => null),
        fetch('/api/campaigns/archival-warnings?tenant_id=' + savedTenantId).catch(() => null),
        fetch('/api/storage/status').catch(() => null)
      ]);
      if (mRes && mRes.ok) {
        const mData = await mRes.json();
        setMetaStatus(mData);
      }
      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        if (Array.isArray(cData)) {
          setCampaigns(cData);
          const drafts = cData.filter((c: any) => !c.scheduled_time && c.status === 'draft');
          setDraftsCount(drafts.length);
          const isUpcomingDashboard = (c: any) => {
            if (!c || !c.scheduled_time) return false;
            if (c.status === 'archived' || c.status === 'failed' || c.status === 'published') return false;
            const d = new Date(c.scheduled_time).getTime();
            return !isNaN(d) && d > Date.now();
          };
          const upcoming = cData.filter(isUpcomingDashboard);
          setUpcomingCount(upcoming.length);
        }
      }
      if (wRes && wRes.ok) {
        const wData = await wRes.json();
        setArchivalWarnings(wData);
      }
      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        setStorageStatus(sData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const isHomeActive = activeTab === 'home';
  const isCreateActive = activeTab === 'create' || activeTab === 'campaigns';
  const isCalendarActive = activeTab === 'calendar';
  const isLibraryActive = activeTab === 'library' || activeTab === 'assets';
  const isResultsActive = activeTab === 'results' || activeTab === 'analytics';
  const isSettingsActive = activeTab === 'settings';
  const isProfileActive = activeTab === 'profile';
  const isAdminActive = activeTab === 'admin';

  return (
    <>
    {/* Mobile Top Header */}
    <div className="mobile-nav" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(5, 8, 6, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      padding: '12px 16px',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={onGoHome}>
        <span style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: 'var(--primary-color)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '16px'
        }}>D</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-color)', textTransform: 'capitalize' }}>
            {isHomeActive ? 'Home' :
             isCreateActive ? 'Create Post' :
             isCalendarActive ? 'Calendar' :
             isLibraryActive ? 'Library' :
             isResultsActive ? 'Results' :
             isSettingsActive ? 'Settings' :
             isProfileActive ? 'Profile' : 'DigiM'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
            {businessInfo.name}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMobileAvatarMenu(true)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(82, 183, 136, 0.2)',
          border: '1.5px solid var(--primary-color)',
          color: 'var(--primary-color)',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {userInfo.initial || '👤'}
      </button>
    </div>

    {/* Main Container */}
    <div className="fade-in-up main-dashboard-wrapper" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
      {inspectCampaign && (
        <ScheduledPostInspectorModal
          campaign={inspectCampaign}
          onClose={() => setInspectCampaign(null)}
          onEditInDashboard={(c) => {
            setSelectedCampaignForEdit(c);
            handleTabChange('home');
          }}
          onDelete={(deletedId) => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
        />
      )}

      {/* Web Sidebar (Creators IA) */}
      <div className="desktop-nav glass-panel" style={{ width: '270px', padding: '20px 16px', position: 'sticky', top: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* DigiM Brand Header */}
        <div
          onClick={onGoHome}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 6px 12px', cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          title="DigiM"
        >
          <span style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'var(--primary-color)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '17px',
            flexShrink: 0
          }}>D</span>
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-color)', margin: 0 }}>DigiM</h3>
        </div>

        {/* Business Switcher Card */}
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          title="View & Edit Shop Details"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minHeight: '52px',
            padding: '8px 12px',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.03)',
            color: 'var(--text-color)',
            textAlign: 'left',
            marginBottom: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%'
          }}
        >
          <span style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(82, 183, 136, 0.15)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '14px',
            flexShrink: 0
          }}>
            {businessInfo.initial}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <b style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {businessInfo.name}
            </b>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {businessInfo.location || 'Shop details'}
            </span>
          </div>
        </button>

        {/* Create Post CTA Button */}
        <button
          type="button"
          onClick={() => {
            setSelectedCampaignForEdit(null);
            setComposerInitParams({ mode: 'blank', ts: Date.now() });
            handleTabChange('create');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '44px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--primary-color)',
            color: '#050806',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 16px var(--primary-glow)',
            marginBottom: '12px',
            transition: 'all 0.2s ease',
            width: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create post
        </button>

        {/* 4 Core Places */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {/* Home */}
          <button
            type="button"
            onClick={() => handleTabChange('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: isHomeActive ? 'rgba(82, 183, 136, 0.15)' : 'transparent',
              color: isHomeActive ? 'var(--primary-color)' : 'var(--text-color)',
              fontWeight: isHomeActive ? 700 : 500,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span style={{ flex: 1 }}>Home</span>
          </button>

          {/* Calendar */}
          <button
            type="button"
            onClick={() => handleTabChange('calendar', 'upcoming')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: isCalendarActive && calendarSubTab === 'upcoming' ? 'rgba(82, 183, 136, 0.15)' : 'transparent',
              color: isCalendarActive ? 'var(--primary-color)' : 'var(--text-color)',
              fontWeight: isCalendarActive ? 700 : 500,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span style={{ flex: 1 }}>Calendar</span>
            {upcomingCount > 0 && (
              <span style={{
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
                borderRadius: '999px',
                background: 'rgba(82, 183, 136, 0.2)',
                color: 'var(--primary-color)',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {upcomingCount}
              </span>
            )}
          </button>

          {/* Calendar Sub-Navigation (Expanded) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '28px', marginTop: '1px', marginBottom: '4px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('calendar', 'upcoming')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                background: isCalendarActive && calendarSubTab === 'upcoming' ? 'rgba(82, 183, 136, 0.12)' : 'transparent',
                color: isCalendarActive && calendarSubTab === 'upcoming' ? 'var(--primary-color)' : 'var(--text-light)',
                fontWeight: isCalendarActive && calendarSubTab === 'upcoming' ? 700 : 500,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <span>Upcoming</span>
              {upcomingCount > 0 && (
                <span style={{
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  borderRadius: '9px',
                  background: 'rgba(82, 183, 136, 0.25)',
                  color: 'var(--primary-color)',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {upcomingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('calendar', 'drafts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '8px',
                background: isCalendarActive && calendarSubTab === 'drafts' ? 'rgba(82, 183, 136, 0.12)' : 'transparent',
                color: isCalendarActive && calendarSubTab === 'drafts' ? 'var(--primary-color)' : 'var(--text-light)',
                fontWeight: isCalendarActive && calendarSubTab === 'drafts' ? 700 : 500,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <span>Drafts</span>
              {draftsCount > 0 && (
                <span style={{
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  borderRadius: '9px',
                  background: 'rgba(82, 183, 136, 0.25)',
                  color: 'var(--primary-color)',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {draftsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('calendar', 'past')}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: '8px',
                background: isCalendarActive && calendarSubTab === 'past' ? 'rgba(82, 183, 136, 0.12)' : 'transparent',
                color: isCalendarActive && calendarSubTab === 'past' ? 'var(--primary-color)' : 'var(--text-light)',
                fontWeight: isCalendarActive && calendarSubTab === 'past' ? 700 : 500,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <span>Past posts</span>
            </button>
          </div>

          {/* Library */}
          <button
            type="button"
            onClick={() => handleTabChange('library')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: isLibraryActive ? 'rgba(82, 183, 136, 0.15)' : 'transparent',
              color: isLibraryActive ? 'var(--primary-color)' : 'var(--text-color)',
              fontWeight: isLibraryActive ? 700 : 500,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span style={{ flex: 1 }}>Library</span>
          </button>

          {/* Results */}
          <button
            type="button"
            onClick={() => handleTabChange('results')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: isResultsActive ? 'rgba(82, 183, 136, 0.15)' : 'transparent',
              color: isResultsActive ? 'var(--primary-color)' : 'var(--text-color)',
              fontWeight: isResultsActive ? 700 : 500,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span style={{ flex: 1 }}>Results</span>
          </button>
        </div>

        {/* Disconnected Alert Banner */}
        {metaStatus && !metaStatus.connected && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '13px',
            lineHeight: '18px',
            marginTop: '8px',
            marginBottom: '4px'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span>⚠️</span>
              <div>
                <strong>Meta / Instagram disconnected.</strong>
                <div style={{ fontSize: '11px', color: 'rgba(239,68,68,0.85)', marginTop: '2px' }}>
                  Scheduled posts won’t go out.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('settings')}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '12px',
                textAlign: 'left',
                paddingLeft: '22px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reconnect →
            </button>
          </div>
        )}

        {/* Bottom Menu Tray */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 12px',
              borderRadius: '10px',
              background: isSettingsActive ? 'rgba(82, 183, 136, 0.15)' : 'transparent',
              color: isSettingsActive ? 'var(--primary-color)' : 'var(--text-color)',
              fontWeight: isSettingsActive ? 700 : 500,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span style={{ flex: 1 }}>Settings</span>
          </button>

          <a
            href="/facebook-setup-guide.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 12px',
              borderRadius: '10px',
              color: 'var(--text-color)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span style={{ flex: 1 }}>Help</span>
          </a>

          {/* User Row */}
          <div
            onClick={() => handleTabChange('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minHeight: '48px',
              padding: '6px 8px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title="Profile and sign out"
          >
            <span style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(82, 183, 136, 0.2)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              flexShrink: 0
            }}>
              {userInfo.initial || '👤'}
            </span>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <b style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userInfo.name}
              </b>
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                Profile and sign out
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLogoutConfirm(true);
              }}
              title="Log Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
        {archivalWarnings.length > 0 && activeTab !== 'archived' && (
          <div className="fade-in-up" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1.5px solid #f59e0b', borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '14px' }}>Auto-Archival Warning Notification</div>
                <div style={{ fontSize: '13px', color: 'var(--text-color)', marginTop: '2px' }}>
                  {archivalWarnings.length} published post(s) will be automatically moved to your <strong>Calendar › Past posts</strong> tab within 7 days (90-day retention policy).
                </div>
              </div>
            </div>
            <button onClick={() => handleTabChange('calendar', 'past')} style={{ background: '#f59e0b', border: 'none', color: '#000000', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              View Archive
            </button>
          </div>
        )}

        {storageStatus?.warning_threshold_exceeded && (
          <div className="fade-in-up" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid #ef4444', borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📦</span>
              <div>
                <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '14px' }}>Storage Quota Warning ({storageStatus.used_gb} GB / 5.0 GB Used)</div>
                <div style={{ fontSize: '13px', color: 'var(--text-color)', marginTop: '2px' }}>
                  Your Google Cloud Storage usage is near the 5GB Always Free limit. Heavy media blobs for posts older than 180 days will be pruned to keep cloud costs /bin/zsh.00.
                </div>
              </div>
            </div>
          </div>
        )}

        {showWelcome && (
          <div className="fade-in-up" style={{ background: 'rgba(82, 183, 136, 0.05)', border: '1px solid var(--primary-color)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 4px 12px var(--primary-glow)' }}>
            <div>
              <h4 style={{ color: 'var(--primary-color)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>🎉 Welcome to DigiM app!</h4>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: 1.5 }}>
                Your marketing command center is ready. Check out the <strong>Results</strong> tab to see your profile's performance, or click <strong>Create post</strong> to generate posts on autopilot.
              </p>
            </div>
            <button onClick={() => setShowWelcome(false)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}>×</button>
          </div>
        )}

        {/* Views */}
        {isHomeActive && (
          <HomeView
            campaigns={campaigns}
            metaStatus={metaStatus}
            userInfo={userInfo}
            businessInfo={businessInfo}
            draftsCount={draftsCount}
            upcomingCount={upcomingCount}
            onStartTopic={(topicId) => {
              setComposerInitParams({ mode: 'type', category: topicId, ts: Date.now() });
              handleTabChange('create');
            }}
            onStartImage={() => {
              setComposerInitParams({ mode: 'blank', ts: Date.now() });
              handleTabChange('create');
            }}
            onEditDraft={(draft) => {
              setComposerInitParams({ mode: 'draft', draft, ts: Date.now() });
              handleTabChange('create');
            }}
            onOpenCalendar={(subTab) => {
              handleTabChange('calendar', subTab);
            }}
            onReconnectMeta={() => {
              handleTabChange('settings');
            }}
          />
        )}
        {isCreateActive && (
          <PostComposer
            initParams={composerInitParams}
            onNavigateToTab={(tab: string) => handleTabChange(tab)}
            businessInfo={businessInfo}
            onSaveSuccess={() => fetchDashboardData()}
          />
        )}
        {isCalendarActive && (
          <CalendarTab
            activeSubTab={calendarSubTab}
            onSubTabChange={setCalendarSubTab}
            onNavigateToTab={(tab) => handleTabChange(tab)}
            onSelectDate={(dateStr) => {
              setComposerInitParams({ mode: 'calendar_date', date: dateStr, ts: Date.now() });
              handleTabChange('create');
            }}
            onSelectCampaign={(c) => {
              if (!c.scheduled_time && c.status === 'draft') {
                setComposerInitParams({ mode: 'draft', draft: { id: c.id, state: c }, ts: Date.now() });
                handleTabChange('create');
              } else {
                setInspectCampaign(c);
              }
            }}
          />
        )}
        {isResultsActive && <AnalyticsTab />}
        {isLibraryActive && <AssetsLibrary />}
        {isProfileActive && (
          <SettingsView initialTab="profile" onLogout={() => setShowLogoutConfirm(true)} />
        )}
        {isSettingsActive && (
          <SettingsView initialTab="shop_details" onLogout={() => setShowLogoutConfirm(true)} />
        )}
        {isAdminActive && <AdminPanel />}
      </div>
    </div>

    {/* Mobile Bottom Tab Bar */}
    <nav className="mobile-nav" aria-label="Main" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      minHeight: '64px',
      background: 'rgba(5, 8, 6, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--glass-border)',
      display: 'none',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 100,
      padding: '4px 8px'
    }}>
      <button
        type="button"
        onClick={() => handleTabChange('home')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          minWidth: '52px',
          fontSize: '11px',
          fontWeight: 600,
          color: isHomeActive ? 'var(--primary-color)' : 'var(--text-light)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        Home
      </button>

      <button
        type="button"
        onClick={() => handleTabChange('calendar', 'upcoming')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          minWidth: '52px',
          fontSize: '11px',
          fontWeight: 600,
          color: isCalendarActive ? 'var(--primary-color)' : 'var(--text-light)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        Calendar
      </button>

      {/* Center Create Action */}
      <button
        type="button"
        onClick={() => {
          setSelectedCampaignForEdit(null);
          setComposerInitParams({ mode: 'blank', ts: Date.now() });
          handleTabChange('create');
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          fontSize: '11px',
          fontWeight: 700,
          color: isCreateActive ? 'var(--primary-color)' : 'var(--text-light)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <span style={{
          width: '44px',
          height: '32px',
          borderRadius: '12px',
          background: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#050806'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </span>
        Create
      </button>

      <button
        type="button"
        onClick={() => handleTabChange('library')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          minWidth: '52px',
          fontSize: '11px',
          fontWeight: 600,
          color: isLibraryActive ? 'var(--primary-color)' : 'var(--text-light)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        Library
      </button>

      <button
        type="button"
        onClick={() => handleTabChange('results')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          minWidth: '52px',
          fontSize: '11px',
          fontWeight: 600,
          color: isResultsActive ? 'var(--primary-color)' : 'var(--text-light)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        Results
      </button>
    </nav>

    {/* Mobile Avatar Menu Drawer */}
    {showMobileAvatarMenu && (
      <div
        onClick={() => setShowMobileAvatarMenu(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="glass-panel"
          style={{
            background: 'var(--glass-bg)',
            borderRadius: '24px 24px 0 0',
            padding: '16px 20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
            borderBottom: 'none'
          }}
        >
          {/* Drag Handle */}
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: '8px' }} />

          {/* User & Store Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(82, 183, 136, 0.2)',
              color: 'var(--primary-color)',
              fontWeight: 800,
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--primary-color)'
            }}>
              {userInfo.initial || '👤'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-color)' }}>{userInfo.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{businessInfo.name}</div>
            </div>
            <button onClick={() => setShowMobileAvatarMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => { setShowMobileAvatarMenu(false); handleTabChange('profile'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-color)', textAlign: 'left', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              👤 Profile
            </button>
            <button
              onClick={() => { setShowMobileAvatarMenu(false); handleTabChange('settings'); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-color)', textAlign: 'left', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                🔗 Connected accounts
              </div>
              {metaStatus && !metaStatus.connected && (
                <span style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: '6px' }}>Needs reconnecting</span>
              )}
            </button>
            <button
              onClick={() => { setShowMobileAvatarMenu(false); handleTabChange('profile'); }}
              style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-color)', textAlign: 'left', borderRadius: '10px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600 }}>🏪 Shop details</span>
              <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Name, location, what you sell</span>
            </button>
            <button
              onClick={() => { setShowMobileAvatarMenu(false); handleTabChange('settings'); }}
              style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-color)', textAlign: 'left', borderRadius: '10px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600 }}>⚙️ Settings</span>
              <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Notifications, default audience</span>
            </button>
            <button
              onClick={() => { setShowMobileAvatarMenu(false); window.open('/facebook-setup-guide.html', '_blank'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-color)', textAlign: 'left', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              ❓ Help & Documentation
            </button>
            <button
              onClick={() => { setShowMobileAvatarMenu(false); setShowLogoutConfirm(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', textAlign: 'left', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
            >
              🚪 Sign out
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Logout Confirmation Modal */}
    {showLogoutConfirm && (
      <div
        onClick={() => setShowLogoutConfirm(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="glass-panel"
          style={{ width: '100%', maxWidth: '420px', padding: '36px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚪</div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Log Out?</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.5 }}>
            You will be signed out of your account and returned to the login screen. Your data will remain saved.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-color)', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            >
              Cancel
            </button>
            <button
              onClick={onLogout}
              style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.background = '#dc2626')}
              onMouseOut={e => (e.currentTarget.style.background = '#ef4444')}
            >
              Yes, Log Out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function App() {
  // Start at -1 (not yet mounted) so server and client render the same HTML.
  // A useEffect sets the real step after hydration by reading localStorage.
  const [step, setStep] = useState(-1);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Determine initial step after mount — runs only on the client
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
    if (isLoggedIn) {
      setStep(4); // Already logged in — go straight to dashboard
    } else {
      setStep(0); // Not logged in — show landing page
    }
  }, []);

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
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // (Removed auto-session-resume: login is now always explicit via user_logged_in flag)

  // Render nothing until we've checked localStorage on the client.
  // This prevents any SSR/CSR mismatch.
  if (step === -1) return null;

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      {/* Inject the official Facebook JS SDK */}
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="lazyOnload" crossOrigin="anonymous" />

      {step === 0 ? (
        <LandingPage
          onGetStarted={() => {
            const isCompleted = localStorage.getItem('onboarding_completed') === 'true';
            if (isCompleted) {
              setStep(4);
            } else {
              setStep(1);
            }
          }}
          onLogin={() => setStep(1)}
        />
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
              <Login onNext={(skipOnboarding) => setStep(skipOnboarding ? 4 : 2)} />
            </div>
          )}
          {step === 2 && <Onboarding onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <Platforms onBack={() => setStep(2)} onNext={() => setStep(4)} />}
          {step === 4 && <MainDashboard onGoHome={() => setStep(0)} onLogout={() => {
            localStorage.removeItem('user_logged_in');
            localStorage.removeItem('tenant_id');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_name');
            localStorage.removeItem('onboarding_completed');
            localStorage.removeItem('businessProfile');
            setStep(1);
          }} />}
        </div>
      )}

      {/* Success Notification (Toast top-right) */}
      {notification && notification.type === 'success' && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: '#2E7D58',
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
          <span style={{ fontSize: '20px' }}>✅</span>
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Success
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

      {/* User-Friendly Actionable Error Modal with OK button */}
      {notification && notification.type === 'error' && (
        <div
          onClick={() => setNotification(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{
              width: '90%',
              maxWidth: '380px',
              padding: '24px',
              borderRadius: '20px',
              background: 'var(--glass-bg)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(82, 183, 136, 0.15)',
              border: notification.type === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              {notification.type === 'error' ? '⚠️' : '✨'}
            </div>

            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.85 }}>
                {notification.type === 'error' ? 'Action Required' : 'Notification'}
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--text-light)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                {notification.message}
              </p>
            </div>

            <button
              onClick={() => setNotification(null)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px 18px',
                marginTop: '4px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              OK, Got it
            </button>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}
