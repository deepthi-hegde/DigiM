"use client";

import React, { useState, useEffect, useRef } from 'react';
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
              <input className="input-field" placeholder="e.g. MarketFlow Silks" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
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

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const savedTenantId = localStorage.getItem('tenant_id') || '1';
        const res = await fetch(`/api/meta/status?tenant_id=${savedTenantId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setIsFbConnected(true);
            setFbPageName(data.page_name);
          }
          if (data.has_instagram) {
            setIsIgConnected(true);
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
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const connectRes = await fetch("/api/meta/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
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
              <h4 style={{ fontWeight: 600, fontSize: '16px', color: isFbConnected ? 'var(--primary-color)' : 'var(--text-color)' }}>
                Facebook Page
              </h4>
              <p style={{ fontSize: '13px', color: isFbConnected ? 'var(--text-color)' : 'var(--text-light)' }}>
                {isFbConnected ? `Connected as ${fbPageName}` : 'Ready to connect'}
              </p>
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
        Choose a date and time in the future when you want your post to be published.
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#b0b3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{timeLabel}</span>
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
          Confirm
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

  const displayName = businessName || "Your Business Name";

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
          {/* Draft Post Card Preview */}
          <div style={{ background: '#242526', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', color: '#e4e6eb', marginBottom: '20px' }}>
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

export function CampaignDashboard({ initialCampaign, onClearEdit }: { initialCampaign?: any, onClearEdit?: () => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [freq, setFreq] = useState('3 times a week');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('Product Showcase');
  const [formatType, setFormatType] = useState<'post' | 'reel' | 'carousel'>('post');
  const [gender, setGender] = useState('All');
  const [tone, setTone] = useState('casual');
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [matchRationale, setMatchRationale] = useState('');
  const [recommendAiGen, setRecommendAiGen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [draftScheduledTime, setDraftScheduledTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [visualSuggestion, setVisualSuggestion] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | null>(null);
  const [originalAssetUrl, setOriginalAssetUrl] = useState<string | null>(null);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [carouselUrls, setCarouselUrls] = useState<string[]>([]);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [carouselCount, setCarouselCount] = useState(3);
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');
  const [showLightbox, setShowLightbox] = useState(false);
  const [showFeedPreview, setShowFeedPreview] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [isDraggingOverAssetZone, setIsDraggingOverAssetZone] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const assetPickerFileInputRef = useRef<HTMLInputElement>(null);


  // WhatsApp State variables
  const [publishToWa, setPublishToWa] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [waRecipient, setWaRecipient] = useState('');
  const [waTemplateName, setWaTemplateName] = useState('hello_world');
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // Check WhatsApp connection configuration status and load calendar events on mount
  useEffect(() => {
    const checkWaStatus = async () => {
      try {
        const savedTenantId = localStorage.getItem('tenant_id') || '1';
        const response = await fetch(`/api/whatsapp/status?tenant_id=${savedTenantId}`);
        if (response.ok) {
          const data = await response.json();
          setWaConnected(data.connected);
          if (data.whatsapp_phone_number_id) {
            setWaPhoneId(data.whatsapp_phone_number_id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch WhatsApp status", err);
      }
    };

    const fetchCalendarEvents = async () => {
      try {
        const response = await fetch('/api/calendar/events');
        if (response.ok) {
          const data = await response.json();
          setCalendarEvents(data);
        }
      } catch (err) {
        console.error("Failed to fetch calendar events", err);
      }
    };

    checkWaStatus();
    fetchCalendarEvents();
  }, []);

  const handleSaveWaSettings = async () => {
    if (!waPhoneId || !waToken) {
      notifyError("Please fill in both Phone Number ID and Access Token.");
      return;
    }
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
          whatsapp_phone_number_id: waPhoneId,
          whatsapp_access_token: waToken
        })
      });
      if (response.ok) {
        notifySuccess("WhatsApp settings saved successfully.");
        setWaConnected(true);
        setShowWaSettings(false);
      } else {
        notifyError("Failed to save WhatsApp settings.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Error saving settings.");
    }
  };

  const handleSendWaMessage = async () => {
    if (!waRecipient) {
      notifyError("Please provide a recipient phone number.");
      return;
    }
    setIsSendingWa(true);
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
          recipient_phone: waRecipient,
          template_name: waTemplateName
        })
      });
      const data = await response.json();
      if (response.ok) {
        if (data.status_code === 200) {
          notifySuccess("WhatsApp template message sent successfully!");
        } else {
          notifyError("WhatsApp API Error: " + JSON.stringify(data.response));
        }
      } else {
        notifyError("Failed to send WhatsApp message: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      notifyError("Error sending WhatsApp message.");
    } finally {
      setIsSendingWa(false);
    }
  };

  useEffect(() => {
    if (initialCampaign) {
      setPrompt(initialCampaign.prompt || '');
      setCategory(initialCampaign.category || 'Product Showcase');
      setTone(initialCampaign.tone || 'casual');
      setCampaignId(initialCampaign.id || null);
      setGeneratedText(initialCampaign.generated_text || '');
      setVisualSuggestion(initialCampaign.visual_suggestion || '');
      const hasVisualUrl = initialCampaign.visual_suggestion && (initialCampaign.visual_suggestion.startsWith('/') || initialCampaign.visual_suggestion.startsWith('http'));
      setSelectedAssetUrl(initialCampaign.image_url || (hasVisualUrl ? initialCampaign.visual_suggestion : null));
      setIsLiked(initialCampaign.is_liked || false);
      if (initialCampaign.generated_text) {
        setGenerated(true);
      } else {
        setGenerated(false);
      }
      if (initialCampaign.scheduled_time) {
        setIsScheduling(true);
        try {
          const date = new Date(initialCampaign.scheduled_time);
          const tzOffset = date.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
          setScheduledTime(localISOTime);
        } catch (e) {
          setScheduledTime('');
        }
      } else {
        setIsScheduling(false);
        setScheduledTime('');
      }
      if (initialCampaign.min_age !== undefined) setMinAge(initialCampaign.min_age);
      if (initialCampaign.max_age !== undefined) setMaxAge(initialCampaign.max_age);
      if (initialCampaign.gender) setGender(initialCampaign.gender);
      if (initialCampaign.freq) setFreq(initialCampaign.freq);
    }
  }, [initialCampaign]);

  const fetchLibraryAssets = async () => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/assets?tenant_id=${savedTenantId}`);
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
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/assets/upload?tenant_id=${savedTenantId}`, {
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

  const handleGenerate = async (toneOverride?: string, categoryOverride?: string) => {
    if (!prompt) {
      notifyError("Please enter a campaign goal/prompt");
      return;
    }
    setIsGenerating(true);
    setGenerated(false);

    let bizName = "";
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
        } catch (e) { }
      }
    }

    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
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
      if (data.status === 'success') {
        setGeneratedText(data.generated_text);
        setVisualSuggestion(data.visual_suggestion);
        setCampaignId(data.id || null);
        setIsLiked(data.is_liked || false);
        setShowPromptEditor(false);  // collapse editor on fresh generation
        setGenerated(true);

        setMatchRationale(data.match_rationale || '');
        setRecommendAiGen(Boolean(data.recommend_ai_gen));

        // Smart Media Selection: Pre-select best matched asset from uploaded library
        if (data.matched_asset_url) {
          setSelectedAssetUrl(data.matched_asset_url);
          notifySuccess("✨ Auto-matched best image from your uploaded library!");
        } else {
          setSelectedAssetUrl(null);
          if (data.recommend_ai_gen) {
            notifySuccess("⚠️ No matching photo found in uploaded library. You can generate an AI image or pick from library.");
          }
        }
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

  const [isRefiningText, setIsRefiningText] = useState(false);

  const handleRefineText = async (action: string) => {
    if (!generatedText) {
      notifyError("No caption text available to refine.");
      return;
    }
    setIsRefiningText(true);
    try {
      const response = await fetch('/api/campaign/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: generatedText, action }),
      });
      const data = await response.json();
      if (response.ok && data.refined_text) {
        setGeneratedText(data.refined_text);
        notifySuccess(`Caption refined (${action}) ✨`);
      } else {
        notifyError("Failed to refine caption text.");
      }
    } catch (err) {
      console.error("Refine text failed", err);
      notifyError("Error refining caption text.");
    } finally {
      setIsRefiningText(false);
    }
  };

  const handleGenerateAiImage = async () => {
    if (!visualSuggestion) return;
    setIsGeneratingImage(true);
    try {
      // If we already have a carousel set and user is clicking Regenerate on a single slide, only request 1 image
      const isSingleSlideRegen = carouselUrls.length > 1;
      const countToGen = isSingleSlideRegen ? 1 : (formatType === 'carousel' ? carouselCount : 1);

      const res = await fetch('/api/campaign/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: visualSuggestion,
          num_images: countToGen,
          format_type: formatType
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setHasOverlay(false);
        setOriginalAssetUrl(null);
        setIsSavedToLibrary(false);
        if (isSingleSlideRegen) {
          // Replace only the active single slide in the carousel strip
          const updatedUrls = [...carouselUrls];
          updatedUrls[activeCarouselIndex] = data.url;
          setCarouselUrls(updatedUrls);
          setSelectedAssetUrl(data.url);
          notifySuccess(`Slide #${activeCarouselIndex + 1} regenerated ✨`);
        } else if (data.url) {
          setCarouselUrls([]);
          setSelectedAssetUrl(data.url);
        } else {
          notifyError("Image generation failed");
        }
      }
    } catch (error) {
      console.error("Image gen error", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!selectedAssetUrl) return;
    setIsSavingToLibrary(true);
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch('/api/assets/save-to-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10),
          image_url: selectedAssetUrl
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAssetUrl(data.url);
        fetchLibraryAssets();
        setIsSavedToLibrary(true);
        notifySuccess("Asset saved to library! 🎉");
      } else {
        notifyError("Failed to save asset to library");
      }
    } catch (err) {
      console.error("Save to library error", err);
      notifyError("Error saving asset to library");
    } finally {
      setIsSavingToLibrary(false);
    }
  };

  const handleAssetPickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      notifySuccess("Uploading asset...");
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch(`/api/assets/upload?tenant_id=${savedTenantId}`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedAssetUrl(data.url);
        fetchLibraryAssets();
        setShowAssetPicker(false);
        notifySuccess("Asset uploaded and selected successfully! 🎉");
      } else {
        notifyError("Failed to upload asset");
      }
    } catch (error) {
      console.error("Upload error", error);
      notifyError("Error uploading asset");
    }
  };

  // Brand Logo for Post Overlay
  const [postLogoUrl, setPostLogoUrl] = useState('');
  const [includeLogo, setIncludeLogo] = useState(false);
  const [logoPosition, setLogoPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'bottom-center'>('top-right');
  const postLogoFileInputRef = useRef<HTMLInputElement>(null);

  const handlePostLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      notifySuccess("Uploading logo for post overlay...");
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch(`/api/assets/upload?tenant_id=${savedTenantId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPostLogoUrl(data.url);
        if (typeof window !== 'undefined') localStorage.setItem('brand_logo_url', data.url);
        notifySuccess("Brand logo updated for overlay!");
      }
    } catch (err) {
      notifyError("Failed to upload logo.");
    }
  };

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

    // Toggle off: If overlay is currently applied and user clicked remove without specifying position override
    if (hasOverlay && !overridePos && !targetIncludeLogo) {
      if (originalAssetUrl) {
        setSelectedAssetUrl(originalAssetUrl);
        if (carouselUrls.length > 1) {
          const updatedUrls = [...carouselUrls];
          updatedUrls[activeCarouselIndex] = originalAssetUrl;
          setCarouselUrls(updatedUrls);
        }
      }
      setHasOverlay(false);
      notifySuccess("Brand overlay removed.");
      return;
    }

    if (selectedAssetUrl.endsWith('.mp4')) {
      notifyError("Brand overlay can only be applied to static image assets.");
      return;
    }

    let primaryColor = "#52b788";
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('businessProfile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.brandColorPrimary) primaryColor = parsed.brandColorPrimary;
        } catch (e) { }
      }
    }

    const renderOverlayOnImage = async (imageElement: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { notifyError("Canvas 2D context not supported."); return; }

      const cw = imageElement.naturalWidth || 1080;
      const ch = imageElement.naturalHeight || 1080;
      canvas.width = cw;
      canvas.height = ch;

      // ── 1. Draw base image cleanly (preserving exact natural aspect ratio) ───────────
      ctx.drawImage(imageElement, 0, 0, cw, ch);

      // ── 2. Brand Logo Only Badge with 5 Position Options ───────────────────────
      const activeLogoUrl = postLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('brand_logo_url') : '') || '';

      const finalizeCanvas = () => {
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          if (!hasOverlay) {
            setOriginalAssetUrl(selectedAssetUrl);
          }
          setSelectedAssetUrl(dataUrl);
          setHasOverlay(true);
          notifySuccess(`Brand logo overlay applied (${targetPos}) ✨`);
        } catch (err) {
          console.error('Canvas export failed:', err);
          notifyError('Failed to apply overlay due to cross-origin image policy.');
        }
      };

      if (targetIncludeLogo && activeLogoUrl) {
        const logoImg = new Image();
        logoImg.onload = () => {
          ctx.save();
          const minDim = Math.min(cw, ch);
          const scale = Math.max(0.5, minDim / 1080);
          const lSize = Math.round(90 * scale);
          const lPad = Math.round(10 * scale);
          const lR = Math.round(14 * scale);
          const margin = Math.round(28 * scale);

          let lx = cw - lSize - margin;
          let ly = margin;

          if (targetPos === 'top-left') {
            lx = margin;
            ly = margin;
          } else if (targetPos === 'top-right') {
            lx = cw - lSize - margin;
            ly = margin;
          } else if (targetPos === 'bottom-left') {
            lx = margin;
            ly = ch - lSize - margin;
          } else if (targetPos === 'bottom-right') {
            lx = cw - lSize - margin;
            ly = ch - lSize - margin;
          } else if (targetPos === 'bottom-center') {
            lx = (cw - lSize) / 2;
            ly = ch - lSize - margin;
          }

          // White rounded badge with shadow
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = Math.round(16 * scale);
          ctx.shadowOffsetY = Math.round(4 * scale);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(lx, ly, lSize, lSize, lR);
          ctx.fill();
          ctx.shadowColor = 'transparent';

          // Thin brand-color ring around badge
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = Math.max(2, Math.round(3 * scale));
          ctx.beginPath();
          ctx.roundRect(lx, ly, lSize, lSize, lR);
          ctx.stroke();

          // Logo image inside badge with padding
          ctx.drawImage(logoImg, lx + lPad, ly + lPad, lSize - lPad * 2, lSize - lPad * 2);
          ctx.restore();
          finalizeCanvas();
        };
        logoImg.onerror = () => { finalizeCanvas(); };
        logoImg.src = (window as any).__proxiedLogoUrl || activeLogoUrl;
      } else {
        finalizeCanvas();
      }
    };



    // Helper: resolve any URL through server-side proxy to avoid canvas CORS taint.
    // data: URLs are used as-is; local /api/ paths are same-origin (safe);
    // everything else goes through the proxy so the browser never sees a foreign origin.
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
      const proxiedUrl = toProxiedUrl(sourceUrl);
      const img = await loadImage(proxiedUrl);
      // Patch logo loading to also go through proxy
      const origLogoSrc = targetIncludeLogo && (postLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('brand_logo_url') : '') || '');
      if (origLogoSrc) {
        (window as any).__proxiedLogoUrl = toProxiedUrl(origLogoSrc);
      }
      await renderOverlayOnImage(img);
    } catch (err) {
      console.error("Image load failed even with proxy:", err);
      notifyError("Failed to load creative image for styling. Please try re-selecting the image.");
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
        const savedTenantId = localStorage.getItem('tenant_id') || '1';
        const res = await fetch(`/api/meta/status?tenant_id=${savedTenantId}`);
        const data = await res.json();
        setMetaStatus(data);
      } catch (err) {
        console.error("Failed to fetch meta status", err);
      }
    };
    fetchStatus();
  }, []);

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
        notifySuccess(data.is_liked ? "Post added to style profile! AI will mimic this style." : "Post removed from style profile.");
      }
    } catch (err) {
      console.error(err);
      notifyError("Failed to save style feedback");
    } finally {
      setIsLiking(false);
    }
  };

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleSaveDraft = async (silent: boolean = false) => {
    if (!prompt && !generatedText) {
      if (!silent) notifyError("Please enter a prompt or text before saving draft.");
      return;
    }
    setIsSavingDraft(true);
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch('/api/campaign/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaignId,
          prompt,
          category,
          tone,
          generated_text: generatedText,
          visual_suggestion: visualSuggestion,
          image_url: selectedAssetUrl || null,
          scheduled_time: scheduledTime || null,
          tenant_id: parseInt(savedTenantId, 10)
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.id && !campaignId) {
          setCampaignId(data.id);
        }
        if (!silent) notifySuccess("Draft saved successfully! You can resume anytime.");
      } else {
        if (!silent) notifyError("Failed to save draft.");
      }
    } catch (err) {
      console.error(err);
      if (!silent) notifyError("Error saving draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const response = await fetch('/api/campaign/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: generatedText,
          image_url: selectedAssetUrl || null,
          publish_to_instagram: publishToIg,
          tenant_id: parseInt(savedTenantId, 10),
          scheduled_time: scheduledTime || null,
          campaign_id: campaignId
        })
      });
      const data = await response.json();
      if (response.ok) {
        if (scheduledTime) {
          notifySuccess(`Post scheduled successfully for ${new Date(scheduledTime).toLocaleString()}!`);
          setIsScheduling(false);
          setScheduledTime('');
        } else {
          let targetPlatforms = publishToIg ? "Facebook & Instagram" : "Facebook";
          notifySuccess(`Published successfully to ${targetPlatforms}! ✨`);
        }

        if (onClearEdit) onClearEdit();
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
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            Campaign Setup {campaignId ? `(Editing #${campaignId})` : ''}
          </h2>
          <p style={{ color: 'var(--text-light)' }}>
            {campaignId ? 'Modify details of your scheduled post' : 'Create and publish your next promotion'}
          </p>
        </div>
        {campaignId && (
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px' }}
            onClick={() => {
              setCampaignId(null);
              setPrompt('');
              setGeneratedText('');
              setVisualSuggestion('');
              setSelectedAssetUrl(null);
              setGenerated(false);
              setIsScheduling(false);
              setScheduledTime('');
              if (onClearEdit) onClearEdit();
            }}
          >
            Create New Campaign
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
        {/* Left Column: Controls */}
        <div style={{ flex: '1 1 420px', minWidth: '300px', boxSizing: 'border-box' }}>
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

            {/* Content Format Selection */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-light)' }}>
                Content Format Type:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                {[
                  { id: 'post', label: '🖼️ Post', desc: 'Square 1:1' },
                  { id: 'reel', label: '🎬 Reel', desc: 'Video 9:16' },
                  { id: 'carousel', label: '📱 Story / Carousel', desc: 'Slides 9:16' }
                ].map(fmt => (
                  <label
                    key={fmt.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: formatType === fmt.id ? '2px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.15)',
                      background: formatType === fmt.id ? 'rgba(82, 183, 136, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: formatType === fmt.id ? 'var(--primary-color)' : 'var(--text-color)' }}>
                      <input
                        type="radio"
                        name="contentFormat"
                        checked={formatType === fmt.id}
                        onChange={() => setFormatType(fmt.id as any)}
                        style={{ accentColor: 'var(--primary-color)', flexShrink: 0 }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmt.label}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-light)', paddingLeft: '18px', whiteSpace: 'nowrap' }}>{fmt.desc}</span>
                  </label>
                ))}
              </div>
              {formatType === 'carousel' && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(82, 183, 136, 0.05)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(82, 183, 136, 0.2)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)' }}>
                    📱 Number of Carousel Slides to Generate:
                  </span>
                  <select
                    className="input-field"
                    style={{ width: '80px', padding: '4px 8px', fontSize: '12px', fontWeight: 700 }}
                    value={carouselCount}
                    onChange={(e) => setCarouselCount(parseInt(e.target.value, 10))}
                  >
                    <option value={2}>2 Slides</option>
                    <option value={3}>3 Slides</option>
                    <option value={4}>4 Slides</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Visual Asset</label>

            {/* AI Smart Match Rationale & Recommendation Banners */}
            {matchRationale && !recommendAiGen && (
              <div style={{ marginBottom: '12px', background: 'rgba(82, 183, 136, 0.12)', border: '1px solid var(--primary-color)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>✨</span>
                <span><strong>Matched from your media library:</strong> {matchRationale}</span>
              </div>
            )}
            {recommendAiGen && !selectedAssetUrl && (
              <div style={{ marginBottom: '12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', padding: '12px 14px', borderRadius: '12px', fontSize: '12px', color: '#fbbf24', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️ No Matching Photo in Uploaded Library</span>
                </div>
                <div style={{ opacity: 0.9, lineHeight: '1.4' }}>
                  {matchRationale || "No asset in your uploaded media library matches this campaign concept. Click below to generate a custom AI creative."}
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiImage}
                  disabled={isGeneratingImage || !visualSuggestion}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '2px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  {isGeneratingImage ? '🎨 Generating AI Image...' : '✨ Generate AI Creative with Flux / Imagen'}
                </button>
              </div>
            )}
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer) {
                  e.dataTransfer.dropEffect = 'copy';
                }
                setIsDraggingOverAssetZone(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer) {
                  e.dataTransfer.dropEffect = 'copy';
                }
                setIsDraggingOverAssetZone(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDraggingOverAssetZone(false);
                }
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOverAssetZone(false);

                // 1. Check for files dropped directly from local computer (Finder / Explorer)
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const savedTenantId = localStorage.getItem('tenant_id') || '1';
                    const response = await fetch(`/api/assets/upload?tenant_id=${savedTenantId}`, {
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
                  return;
                }

                // 2. Check for dragged asset URLs (from internal tray or web)
                const draggedUrl = e.dataTransfer.getData('text/plain') ||
                  e.dataTransfer.getData('text/uri-list') ||
                  e.dataTransfer.getData('URL');
                if (draggedUrl) {
                  setSelectedAssetUrl(draggedUrl);
                  notifySuccess("Asset selected!");
                  return;
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
                  <button
                    type="button"
                    onClick={() => dashboardFileInputRef.current?.click()}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    📸 Upload Image or Video
                  </button>
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
                      draggable={true}
                      onDragStart={(e) => {
                        if (e.dataTransfer) {
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData('text/plain', asset.url);
                          e.dataTransfer.setData('text/uri-list', asset.url);
                          e.dataTransfer.setData('URL', asset.url);
                        }
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
                        <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} muted />
                      ) : (
                        <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>



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
              onClick={() => handleGenerate()}
              disabled={isGenerating}
            >
              {isGenerating ? '✨ AI is designing...' : '✨ Generate AI Content'}
            </button>
          </div>
        </div>

        {/* Right Column: AI Preview */}
        <div style={{ flex: '1 1 360px', minWidth: '300px', boxSizing: 'border-box', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', border: '2px dashed rgba(82, 183, 136, 0.25)', display: 'flex', flexDirection: 'column', minHeight: '400px', overflow: 'hidden' }}>
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeInUp 0.5s ease-out' }}>

            {/* Image Preview Container */}
            <div style={{
              background: 'rgba(5, 8, 6, 0.6)',
              borderRadius: '16px',
              height: formatType === 'carousel' ? '360px' : '260px',
              maxHeight: '400px',
              maxWidth: '100%',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {selectedAssetUrl ? (
                <>
                  {selectedAssetUrl.endsWith('.mp4') ? (
                    <video src={selectedAssetUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} autoPlay loop muted />
                  ) : (
                    <img src={selectedAssetUrl} alt="Campaign Asset" style={{ width: '100%', height: '100%', objectFit: formatType === 'carousel' ? 'contain' : imageFit }} />
                  )}

                  {/* Size and Zoom Control buttons on top */}
                  {!selectedAssetUrl.endsWith('.mp4') && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 6 }}>
                      <button
                        type="button"
                        onClick={() => setImageFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                        style={{
                          background: 'rgba(12, 20, 16, 0.8)', color: 'white',
                          border: '1.5px solid rgba(82, 183, 136, 0.3)', borderRadius: '8px',
                          padding: '6px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)'
                        }}
                        title="Toggle between Crop (Cover) and Full image (Contain)"
                      >
                        {imageFit === 'cover' ? '🖼️ Fit Image' : '🖼️ Crop Fill'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLightbox(true)}
                        style={{
                          background: 'rgba(12, 20, 16, 0.8)', color: 'white',
                          border: '1.5px solid rgba(82, 183, 136, 0.3)', borderRadius: '8px',
                          padding: '6px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)'
                        }}
                        title="View entire image in full screen"
                      >
                        🔍 View Full
                      </button>
                    </div>
                  )}

                  {/* Overlay: Regenerate + Save + Download */}
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
                    {selectedAssetUrl && (selectedAssetUrl.startsWith('data:') || selectedAssetUrl.includes('temp_assets') || selectedAssetUrl.includes('temp-ai-gen')) && !isSavedToLibrary && (
                      <button
                        type="button"
                        onClick={handleSaveToLibrary}
                        disabled={isSavingToLibrary}
                        style={{
                          background: 'rgba(82, 183, 136, 0.85)',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backdropFilter: 'blur(4px)',
                          cursor: isSavingToLibrary ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isSavingToLibrary ? '📥 Saving...' : '📥 Save to Library'}
                      </button>
                    )}
                    {isSavedToLibrary && (
                      <span style={{
                        background: 'rgba(82, 183, 136, 0.95)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ✓ Saved
                      </span>
                    )}
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
                        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
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

            {/* Multi-Image Carousel Selector Strip */}
            {carouselUrls.length > 1 && (
              <div style={{ marginBottom: '14px', background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)' }}>
                    📱 Multi-Slide Carousel ({carouselUrls.length} Slides)
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                    Slide {activeCarouselIndex + 1} of {carouselUrls.length}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {carouselUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedAssetUrl(url);
                        setActiveCarouselIndex(idx);
                      }}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: activeCarouselIndex === idx ? '2.5px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.15)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        opacity: activeCarouselIndex === idx ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <img src={url} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '9px', fontWeight: 800, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  {isGeneratingImage ? '🎨 Generating...' : selectedAssetUrl ? '🔄 Regenerate' : '✨ Generate Image'}
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

              {/* Brand Logo Option Bar & Position Selector */}
              {selectedAssetUrl && (
                <div style={{ marginTop: '10px', background: 'rgba(82, 183, 136, 0.05)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeLogo}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setIncludeLogo(isChecked);
                          if (isChecked) {
                            setLogoPosition('top-right');
                            handleApplyBrandOverlay('top-right', true);
                          } else {
                            if (originalAssetUrl) {
                              setSelectedAssetUrl(originalAssetUrl);
                            }
                            setHasOverlay(false);
                            notifySuccess("Brand logo watermark removed.");
                          }
                        }}
                      />
                      Include Brand Logo Watermark
                    </label>

                    {includeLogo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(postLogoUrl || (typeof window !== 'undefined' && localStorage.getItem('brand_logo_url'))) && (
                          <img
                            src={postLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('brand_logo_url') : '') || ''}
                            alt="Logo"
                            style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain', background: '#ffffff', padding: '2px', border: '1px solid var(--primary-color)' }}
                          />
                        )}
                        <input
                          type="file"
                          ref={postLogoFileInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handlePostLogoUpload}
                        />
                        <button
                          type="button"
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-color)', cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => postLogoFileInputRef.current?.click()}
                        >
                          {(postLogoUrl || (typeof window !== 'undefined' && localStorage.getItem('brand_logo_url'))) ? 'Change Logo' : '+ Add Logo'}
                        </button>
                      </div>
                    )}
                  </div>

                  {includeLogo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px dashed rgba(82, 183, 136, 0.15)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600, marginRight: '4px' }}>Logo Position:</span>
                      {[
                        { id: 'top-left', label: '↖ Top Left' },
                        { id: 'top-right', label: '↗ Top Right' },
                        { id: 'bottom-left', label: '↙ Bottom Left' },
                        { id: 'bottom-right', label: '↘ Bottom Right' },
                        { id: 'bottom-center', label: '⬇ Bottom' },
                      ].map((pos) => {
                        const isActive = logoPosition === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => {
                              const p = pos.id as any;
                              setLogoPosition(p);
                              if (hasOverlay) {
                                handleApplyBrandOverlay(p, true);
                              }
                            }}
                            style={{
                              fontSize: '11px',
                              padding: '4px 9px',
                              borderRadius: '6px',
                              border: isActive ? '1.5px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.12)',
                              background: isActive ? 'rgba(82, 183, 136, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                              color: isActive ? 'var(--primary-color)' : 'var(--text-light)',
                              fontWeight: isActive ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {pos.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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

            {/* Tone & Category selectors styled as premium interactive chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { key: "Product Showcase", label: "Product Showcase 🛍️" },
                    { key: "Behind the Scenes", label: "Behind the Scenes 🎬" },
                    { key: "Promotions", label: "Promotions 📣" },
                    { key: "Knowledge Info", label: "Knowledge Info 💡" }
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setCategory(cat.key);
                        handleGenerate(tone, cat.key);
                      }}
                      style={{
                        background: category === cat.key ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: category === cat.key ? '2px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        color: category === cat.key ? 'var(--primary-color)' : 'var(--text-color)',
                        fontWeight: category === cat.key ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        if (category !== cat.key) {
                          e.currentTarget.style.borderColor = 'rgba(82, 183, 136, 0.4)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (category !== cat.key) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tone</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { key: "casual", label: "Casual 😊" },
                    { key: "formal", label: "Formal 👔" },
                    { key: "elaborate", label: "Elaborate 📝" },
                    { key: "shorten", label: "Shorten ✂️" }
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setTone(t.key);
                        if (generated && generatedText) {
                          handleRefineText(t.key);
                        }
                      }}
                      disabled={isRefiningText}
                      style={{
                        background: tone === t.key ? 'rgba(82, 183, 136, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: tone === t.key ? '2px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        color: tone === t.key ? 'var(--primary-color)' : 'var(--text-color)',
                        fontWeight: tone === t.key ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        if (tone !== t.key) {
                          e.currentTarget.style.borderColor = 'rgba(82, 183, 136, 0.4)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (tone !== t.key) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Generated Post Copy</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowFeedPreview(true)}
                  style={{
                    background: 'rgba(82, 183, 136, 0.12)',
                    border: '1px solid var(--primary-color)',
                    color: 'var(--primary-color)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  👁️ Feed Preview (FB / IG)
                </button>
                {campaignId && (
                  <button
                    onClick={handleToggleLike}
                    disabled={isLiking}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isLiked ? '#52b788' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    {isLiked ? '❤️ Style Saved' : '🖤 Save Style (Train AI)'}
                  </button>
                )}
              </div>
            </div>

            <SocialFeedPreviewModal
              isOpen={showFeedPreview}
              onClose={() => setShowFeedPreview(false)}
              imageUrl={selectedAssetUrl}
              caption={generatedText}
              businessName={typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('businessProfile') || '{}').businessName || '') : ''}
              logoUrl={postLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('brand_logo_url') : '') || ''}
            />

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(82, 183, 136, 0.15)', flexGrow: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)', minHeight: '300px' }}>
              <textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                style={{ width: '100%', flexGrow: 1, border: 'none', resize: 'none', outline: 'none', fontSize: '16px', lineHeight: '1.6', color: 'var(--text-color)', fontFamily: 'inherit', background: 'transparent' }}
                placeholder="Edit your post content here..."
              />
            </div>

            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.1)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input type="checkbox" checked={isScheduling} onChange={(e) => {
                  setIsScheduling(e.target.checked);
                  if (!e.target.checked) setScheduledTime('');
                }} />
                Schedule post for later date/time
              </label>
              {isScheduling && !scheduledTime && (
                <MetaPostScheduler
                  initialValue={draftScheduledTime}
                  onSchedule={(isoString) => {
                    setScheduledTime(isoString);
                    setDraftScheduledTime(isoString);
                    const d = new Date(isoString);
                    const label = d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: getBizTimezone() });
                    notifySuccess(`⏰ Scheduled for ${label}`);
                  }}
                  onCancel={() => {
                    setIsScheduling(false);
                    setScheduledTime('');
                  }}
                />
              )}
              {isScheduling && scheduledTime && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(82, 183, 136, 0.1)', border: '1.5px solid var(--primary-color)', borderRadius: '8px', padding: '10px 14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>
                    ✅ Scheduled: {new Date(scheduledTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: getBizTimezone() })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setScheduledTime('')}
                    style={{ fontSize: '11px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change
                  </button>
                </div>
              )}
              {(() => {
                if (!scheduledTime) return null;
                const selectedDate = new Date(scheduledTime);
                const sYear = selectedDate.getFullYear();
                const sMonth = selectedDate.getMonth();
                const sDay = selectedDate.getDate();

                const matchingEvents = calendarEvents.filter(e => {
                  const parts = e.date.split('-');
                  const eYear = parseInt(parts[0], 10);
                  const eMonth = parseInt(parts[1], 10) - 1;
                  const eDay = parseInt(parts[2], 10);
                  return eYear === sYear && eMonth === sMonth && eDay === sDay;
                });

                if (matchingEvents.length === 0) return null;

                return (
                  <div style={{ marginTop: '10px', padding: '12px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid #fbbf24', fontSize: '12px' }}>
                    {matchingEvents.map(event => (
                      <div key={event.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          📅 {event.name} ({event.type.replace('_', ' ')})
                        </span>
                        <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>
                          {event.description}
                        </span>
                        <span style={{ color: '#52b788', fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
                          ✨ Idea: Tailor your campaign copy or run promotions matching this festive occasion!
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* WhatsApp Broadcast Option */}
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '12px', border: '1px solid rgba(82, 183, 136, 0.1)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input type="checkbox" checked={publishToWa} onChange={(e) => {
                  setPublishToWa(e.target.checked);
                }} />
                Send template broadcast via WhatsApp 💬
              </label>
              {publishToWa && (
                <div className="fade-in-up" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Setup Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                      Status: {waConnected ? '🟢 Connected' : '🔴 Credentials Missing'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowWaSettings(!showWaSettings)}
                      style={{ fontSize: '11px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      {showWaSettings ? 'Close Settings' : 'Configure API'}
                    </button>
                  </div>

                  {showWaSettings && (
                    <div style={{ background: 'rgba(5, 8, 6, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(82, 183, 136, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>Phone Number ID</span>
                        <input
                          className="input-field"
                          style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
                          placeholder="e.g. 10452718..."
                          value={waPhoneId}
                          onChange={(e) => setWaPhoneId(e.target.value)}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '2px' }}>System Access Token</span>
                        <input
                          type="password"
                          className="input-field"
                          style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
                          placeholder="EAAG..."
                          value={waToken}
                          onChange={(e) => setWaToken(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={handleSaveWaSettings}
                      >
                        Save Credentials
                      </button>
                    </div>
                  )}

                  {/* Recipient Phone & Template */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Recipient Number</span>
                      <input
                        className="input-field"
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        placeholder="e.g., +919988776655"
                        value={waRecipient}
                        onChange={(e) => setWaRecipient(e.target.value)}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Template Name</span>
                      <input
                        className="input-field"
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        placeholder="hello_world"
                        value={waTemplateName}
                        onChange={(e) => setWaTemplateName(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '10px', fontSize: '13px', borderRadius: '8px', width: '100%', opacity: isSendingWa ? 0.7 : 1 }}
                    disabled={isSendingWa}
                    onClick={handleSendWaMessage}
                  >
                    {isSendingWa ? 'Sending...' : '⚡ Send Test WhatsApp Template'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => handleSaveDraft(false)}
                disabled={isSavingDraft}
              >
                💾 {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                className="btn-primary"
                style={{ flexGrow: 1, background: 'linear-gradient(135deg, var(--secondary-color) 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', opacity: isPublishing ? 0.7 : 1 }}
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? 'Publishing...' : (isScheduling ? '✓ Schedule Post' : (publishToIg ? 'Publish to FB & IG' : 'Publish to Facebook'))}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
              <p style={{ color: 'var(--text-light)', fontSize: '14px', margin: 0 }}>Choose an existing image or video asset for your campaign.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => assetPickerFileInputRef.current?.click()}
                style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                📤 Upload New Asset
              </button>
            </div>
            <input type="file" ref={assetPickerFileInputRef} onChange={handleAssetPickerUpload} style={{ display: 'none' }} accept="image/*,video/*" />

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
      {showLightbox && selectedAssetUrl && (
        <div
          onClick={() => setShowLightbox(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5, 8, 6, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, cursor: 'zoom-out',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
            {selectedAssetUrl.endsWith('.mp4') ? (
              <video src={selectedAssetUrl} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }} controls autoPlay loop muted />
            ) : (
              <img src={selectedAssetUrl} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
            )}
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              style={{
                position: 'absolute', top: '-40px', right: '0',
                background: 'transparent', border: 'none', color: 'white',
                fontSize: '18px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              ✕ Close
            </button>
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

function CalendarTab({ onSelectCampaign }: { onSelectCampaign?: (campaign: any) => void }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTenantId = localStorage.getItem('tenant_id') || '1';
    Promise.all([
      fetch(`/api/campaigns?tenant_id=${savedTenantId}`).then(res => res.json()),
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
        <p style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Loading scheduling calendar...</p>
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
  // Fill empty spaces before start of month
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  // Filter campaigns into scheduled calendar items vs unscheduled drafts
  const scheduledCampaigns = campaigns.filter(c => c.scheduled_time);
  const unscheduledDrafts = campaigns.filter(c => !c.scheduled_time && c.status === 'draft');

  return (
    <div className="fade-in-up glass-panel" style={{ padding: '32px', borderRadius: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Campaign Queue & Calendar</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>
            Manage and monitor your saved drafts & scheduled posts for {monthNames[month]} {year}. Click any item to inspect/edit.
          </p>
        </div>
      </div>

      {/* Unscheduled Saved Drafts Section */}
      {unscheduledDrafts.length > 0 && (
        <div style={{ marginBottom: '24px', background: 'rgba(82, 183, 136, 0.05)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(82, 183, 136, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💾 Saved Drafts ({unscheduledDrafts.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
              Click any draft to edit or schedule
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {unscheduledDrafts.map((draft) => (
              <div
                key={draft.id}
                onClick={() => onSelectCampaign?.(draft)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
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
                {(draft.image_url || (draft.visual_suggestion && (draft.visual_suggestion.startsWith('/') || draft.visual_suggestion.startsWith('http')))) ? (
                  <img src={draft.image_url || draft.visual_suggestion} alt="Draft" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    📝
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {draft.prompt || draft.generated_text || "Saved Draft"}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px' }}>{draft.category}</span>
                    <span>• {draft.tone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

          return (
            <div
              key={`day-${day}`}
              style={{
                minHeight: '120px',
                background: isToday ? 'rgba(82, 183, 136, 0.08)' : 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: isToday ? '1.5px solid var(--primary-color)' : '1px solid rgba(82, 183, 136, 0.15)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.2s'
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
                  const isPast = new Date(post.scheduled_time) < new Date() || post.status === 'published' || post.status === 'failed';
                  const promptText = (post.prompt || post.generated_text || "Campaign").trim();
                  const firstTwoWords = promptText.split(/\s+/).slice(0, 2).join(' ');

                  return (
                    <div
                      key={post.id}
                      onClick={() => onSelectCampaign?.(post)}
                      style={{
                        background: isPast ? 'rgba(255, 255, 255, 0.04)' : 'rgba(82, 183, 136, 0.15)',
                        border: isPast ? '1px dashed rgba(255, 255, 255, 0.2)' : '1.5px solid var(--primary-color)',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        fontSize: '10px',
                        color: isPast ? 'rgba(255, 255, 255, 0.5)' : 'var(--text-color)',
                        cursor: 'pointer',
                        boxShadow: isPast ? 'none' : '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s',
                        opacity: isPast ? 0.75 : 1
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = isPast ? 'rgba(255, 255, 255, 0.08)' : 'rgba(82, 183, 136, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = isPast ? 'rgba(255, 255, 255, 0.04)' : 'rgba(82, 183, 136, 0.15)';
                        e.currentTarget.style.transform = 'none';
                      }}
                      title={`[${postTime}] ${post.prompt || post.generated_text} (${isPast ? 'Past / Scratched' : 'Scheduled'}) - Click to edit`}
                    >
                      <div style={{
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: isPast ? 'line-through' : 'none'
                      }}>
                        {firstTwoWords}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.85, fontSize: '9px', marginTop: '2px' }}>
                        <span>⏰ {postTime}</span>
                        {isPast && (
                          <span style={{ fontSize: '8.5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: post.status === 'failed' ? '#f87171' : '#a3e635' }}>
                            {post.status === 'failed' ? '× failed' : '✓ done'}
                          </span>
                        )}
                      </div>
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

function ArchivedPostsTab() {
  const [archived, setArchived] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = async () => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch(`/api/campaigns/archived?tenant_id=${savedTenantId}`);
      if (res.ok) {
        const data = await res.json();
        setArchived(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleUnarchive = async (id: number) => {
    try {
      const savedTenantId = localStorage.getItem('tenant_id') || '1';
      const res = await fetch(`/api/campaigns/archived/${id}/unarchive?tenant_id=${savedTenantId}`, { method: 'POST' });
      if (res.ok) {
        window.showNotification?.("Post unarchived and restored to active campaigns!", "success");
        fetchArchived();
      }
    } catch (err) {
      console.error(err);
      window.showNotification?.("Failed to unarchive post", "error");
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
            📦 Archived Posts Library
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>
            {archived.length} Archived Items
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: 1.5, margin: 0 }}>
          Posts published over 90 days ago are automatically archived here to keep your active calendar clean. Media files over 180 days are pruned only if GCS cloud storage exceeds 5.0 GB to maintain 100% free storage.
        </p>
      </div>

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

function MainDashboard({ onGoHome, onLogout }: { onGoHome?: () => void, onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState<any>(null);
  const [inspectCampaign, setInspectCampaign] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [archivalWarnings, setArchivalWarnings] = useState<any[]>([]);
  const [storageStatus, setStorageStatus] = useState<any>(null);

  useEffect(() => {
    const fetchWarnings = async () => {
      try {
        const savedTenantId = localStorage.getItem('tenant_id') || '1';
        const [wRes, sRes] = await Promise.all([
          fetch(`/api/campaigns/archival-warnings?tenant_id=${savedTenantId}`),
          fetch('/api/storage/status')
        ]);
        if (wRes.ok) {
          const wData = await wRes.json();
          setArchivalWarnings(wData);
        }
        if (sRes.ok) {
          const sData = await sRes.json();
          setStorageStatus(sData);
        }
      } catch (err) {
        console.error("Error fetching warnings", err);
      }
    };
    fetchWarnings();
  }, []);

  return (
    <>
    <div className="fade-in-up" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      {inspectCampaign && (
        <ScheduledPostInspectorModal
          campaign={inspectCampaign}
          onClose={() => setInspectCampaign(null)}
          onEditInDashboard={(c) => {
            setSelectedCampaignForEdit(c);
            setActiveTab('campaigns');
          }}
          onDelete={(deletedId) => {
            // Trigger calendar refresh by toggling tab or reload
            if (typeof window !== 'undefined') window.location.reload();
          }}
        />
      )}
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '250px', padding: '24px', position: 'sticky', top: '40px' }}>
        <div
          onClick={onGoHome}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          title="Go back to Home Page"
        >
          <img src="/logo.png" alt="DigiM Logo" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(135deg, var(--primary-color) 0%, #2D6A4F 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>DigiM app</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('campaigns')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'campaigns' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'campaigns' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'campaigns' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'calendar' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'calendar' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'calendar' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Calendar Queue
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
            onClick={() => setActiveTab('archived')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', background: activeTab === 'archived' ? 'rgba(82, 183, 136, 0.1)' : 'transparent', color: activeTab === 'archived' ? 'var(--primary-color)' : 'var(--text-color)', fontWeight: activeTab === 'archived' ? 600 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            Archived Posts
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
        {archivalWarnings.length > 0 && (
          <div className="fade-in-up" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1.5px solid #f59e0b', borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '14px' }}>Auto-Archival Warning Notification</div>
                <div style={{ fontSize: '13px', color: 'var(--text-color)', marginTop: '2px' }}>
                  {archivalWarnings.length} published post(s) will be automatically moved to your <strong>Archived Posts</strong> tab within 7 days (90-day retention policy).
                </div>
              </div>
            </div>
            <button onClick={() => setActiveTab('archived')} style={{ background: '#f59e0b', border: 'none', color: '#000000', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
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
                  Your Google Cloud Storage usage is near the 5GB Always Free limit. Heavy media blobs for posts older than 180 days will be pruned to keep cloud costs $0.00.
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
                Your marketing command center is ready. Check out the <strong>Analytics</strong> tab to see your profile's performance, or head to the <strong>Campaigns</strong> tab to generate posts on autopilot.
              </p>
            </div>
            <button onClick={() => setShowWelcome(false)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}>×</button>
          </div>
        )}
        {activeTab === 'campaigns' && (
          <CampaignDashboard
            initialCampaign={selectedCampaignForEdit}
            onClearEdit={() => setSelectedCampaignForEdit(null)}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarTab
            onSelectCampaign={(c) => setInspectCampaign(c)}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'assets' && <AssetsLibrary />}
        {activeTab === 'archived' && <ArchivedPostsTab />}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Onboarding isSettings={true} />
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Sign Out</div>
                  <div style={{ color: 'var(--text-light)', fontSize: '13px' }}>You will be returned to the login screen. Your data stays saved.</div>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                >
                  🚪 Log Out
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'settings' && <Platforms isSettings={true} />}
        {activeTab === 'admin' && <AdminPanel />}
      </div>
    </div>

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
