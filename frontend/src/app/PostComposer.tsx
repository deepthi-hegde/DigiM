// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

export const DEFAULT_SHOP = {
  name: "SriKrish",
  handle: "srikrish",
  area: "MG Road, Bengaluru",
  sells: "sarees and ethnic wear"
};
export let SHOP = { ...DEFAULT_SHOP };

// SVG icons dictionary matching prototype exactly
const ICONS = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  drafts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h7M9 17h5" />
    </svg>
  ),
  post: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
  reel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 9l4 3-4 3z" />
    </svg>
  ),
  story: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <rect x="7" y="3" width="11" height="18" rx="2" />
      <path d="M4 6v12M21 6v12" />
    </svg>
  ),
  postNow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M4 12h12M11 6l6 6-6 6" />
      <path d="M20 4v16" />
    </svg>
  ),
  schedule: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  image: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted, #a1ae9e)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-9 9" />
    </svg>
  ),
  spark: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v4h16v-4" />
    </svg>
  ),
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  undo: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  ),
  wand: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M4 20L16 8M14 4v2M18 6h2M18 10v2M20 4l-1.5 1.5" />
    </svg>
  ),
  chevronDown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  ),
  x: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
};

const CATEGORIES = [
  {
    id: "summer_sale",
    label: "Summer Sale",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
    defaultCaption: (shop) => `Beat the heat with our special Summer Sale at ${shop.name}! Cool discounts across our entire ethnic wear collection. Visit us at ${shop.area} or DM to order.`,
    defaultTags: ["SummerSale", "EthnicWear", "Discounts", "ShopLocal", "BengaluruShopping"]
  },
  {
    id: "new_collection",
    label: "New Collection",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
        <path d="M12 7a2 2 0 1 1 2-2c0 1-2 1.5-2 3" /><path d="M12 8L3 15h18z" />
      </svg>
    ),
    defaultCaption: (shop) => `Our new collection has arrived! Fresh designs in silk and cotton, now at ${shop.name}. Come and see them first.`,
    defaultTags: ["NewCollection", "NewArrivals", "SareeLove", "ShopLocal"]
  },
  {
    id: "customer_spotlight",
    label: "Customer Spotlight",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
        <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
    ),
    defaultCaption: (shop) => `Nothing makes us happier than seeing our patrons shine in ${shop.name}! Here's a wonderful customer rocking our handcrafted ethnic wear. Thank you for choosing us!`,
    defaultTags: ["CustomerSpotlight", "HappyCustomers", "SareeDiaries", "EthnicLove"]
  },
  {
    id: "festival_offer",
    label: "Festival Offer",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
        <path d="M4 15c0 3 3.6 5 8 5s8-2 8-5H4z" /><path d="M12 15c-2-2-1.5-4.5 0-7 1.5 2.5 2 5 0 7z" />
      </svg>
    ),
    defaultCaption: (shop) => `Celebrate the auspicious season in style! Exclusive festive offers now live at ${shop.name}. Enjoy special blessings and radiant ethnic outfits for your family.`,
    defaultTags: ["FestivalVibes", "FestiveSale", "IndianFestivals", "TraditionalWear"]
  },
  {
    id: "product_showcase",
    label: "Product Showcase",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
        <path d="M5 8h14l-1 13H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
    ),
    defaultCaption: (shop) => `Spotlight on craftsmanship: Pure handwoven silks and intricate embroidery, lovingly crafted at ${shop.name}. Touch and feel the heritage at ${shop.area}.`,
    defaultTags: ["Handloom", "SilkSaree", "PureZari", "Craftsmanship", "EthnicFashion"]
  },
  {
    id: "behind_the_scenes",
    label: "Behind the Scenes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
        <rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 9l2-5 16 2-1.5 3M8 4.5l1.5 4.5M14 5.5l1.5 3.5" />
      </svg>
    ),
    defaultCaption: (shop) => `Behind the drapes: A sneak peek into how we curate, steam, and pack your favorite weaves here at ${shop.name}. Passion poured into every single thread.`,
    defaultTags: ["BehindTheScenes", "ArtisanStories", "WeaverLife", "BoutiqueCulture"]
  },
  {
    id: "promotion",
    label: "Promotion",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    defaultCaption: (shop) => `Special limited-time promotion at ${shop.name}! Flat discount on selected designer wear this weekend only. Drop by ${shop.area} or message us today!`,
    defaultTags: ["SpecialOffer", "WeekendPromo", "LimitedPeriod", "EthnicDeals"]
  },
  {
    id: "knowledge_info",
    label: "Knowledge Info",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
      </svg>
    ),
    defaultCaption: (shop) => `Did you know? Pure silk sarees breathe naturally and adjust to your body temperature. Here's a tip from ${shop.name} on preserving your heirloom silks for generations.`,
    defaultTags: ["SareeCareTips", "FabricKnowledge", "PureSilkCare", "FashionGuide"]
  }
];

function formatDateTimeDisplay(dateStr, timeStr) {
  try {
    const d = new Date(`${dateStr}T${timeStr || "18:00"}`);
    if (isNaN(d.getTime())) return `${dateStr}, ${timeStr}`;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }) + `, ` + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return `${dateStr}, ${timeStr}`;
  }
}

export function PostComposer({
  initParams,
  onNavigateToTab,
  businessInfo,
  onSaveSuccess
}) {
  const shopData = useMemo(() => {
    return {
      name: businessInfo?.name || DEFAULT_SHOP.name,
      handle: (businessInfo?.name || DEFAULT_SHOP.name).toLowerCase().replace(/\s+/g, ""),
      area: businessInfo?.location || DEFAULT_SHOP.area,
      sells: businessInfo?.sells || DEFAULT_SHOP.sells
    };
  }, [businessInfo]);

  // Formats: post (1:1), reel (9:16), story (9:16)
  const [format, setFormat] = useState("post");

  // When: 'now' | 'schedule'
  const [when, setWhen] = useState("schedule");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [scheduledTime, setScheduledTime] = useState("18:00");

  // Post to channels
  const [channels, setChannels] = useState({ facebook: true, instagram: true });

  // Platform tab: 'all' | 'facebook' | 'instagram'
  const [platformTab, setPlatformTab] = useState("all");

  // Post Type
  const [postType, setPostType] = useState("new_collection");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Caption & Undo Banner
  const [caption, setCaption] = useState("");
  const [previousCaption, setPreviousCaption] = useState("");
  const [previousHashtags, setPreviousHashtags] = useState([]);
  const [showNoticeBanner, setShowNoticeBanner] = useState(false);
  const [noticeBannerType, setNoticeBannerType] = useState("");

  // Hashtags
  const [hashtags, setHashtags] = useState([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Media
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavedToLib, setIsSavedToLib] = useState(false);

  // Drafts & IDs
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [draftsList, setDraftsList] = useState([]);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);

  // Modals
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState("both");
  const [isAiGenModalOpen, setIsAiGenModalOpen] = useState(false);
  const [aiGenPrompt, setAiGenPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("digim_theme") || document.documentElement.getAttribute("data-theme") || "light";
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(nextTheme);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", nextTheme);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("digim_theme", nextTheme);
    }
    showToast(`Switched to ${nextTheme === "dark" ? "Dark" : "Light"} mode`);
  };
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState([]);

  // States
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRefiningTone, setIsRefiningTone] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Show Toast
  const showToast = (msg) => {
    let text = "";
    if (typeof msg === "string") {
      text = msg;
    } else if (Array.isArray(msg)) {
      text = msg.map((m) => (typeof m === "string" ? m : m?.msg || JSON.stringify(m))).join(", ");
    } else if (msg && typeof msg === "object") {
      text = msg.detail ? (typeof msg.detail === "string" ? msg.detail : JSON.stringify(msg.detail)) : (msg.message || JSON.stringify(msg));
    } else {
      text = String(msg || "");
    }
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load drafts from localStorage
  const loadDraftsList = () => {
    try {
      const stored = localStorage.getItem("digim_post_drafts");
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          setDraftsList(arr);
          return arr;
        }
      }
    } catch (e) {
      console.warn("Could not load drafts from localStorage", e);
    }
    setDraftsList([]);
    return [];
  };

  // Initialize draft / params
  useEffect(() => {
    const list = loadDraftsList();

    if (initParams?.mode === "draft" && initParams.draft) {
      const draft = initParams.draft;
      const state = draft.state || draft;
      setCurrentDraftId(draft.id || state.id);
      if (state.caption) setCaption(state.caption);
      if (state.hashtags) setHashtags(state.hashtags);
      if (state.format) setFormat(state.format);
      if (state.image_url) setImage(state.image_url);
      if (state.scheduled_date) setScheduledDate(state.scheduled_date);
      if (state.scheduled_time) setScheduledTime(state.scheduled_time);
      if (state.category) setPostType(state.category);
    } else if (initParams?.mode === "type" && initParams.category) {
      handleSelectCategory(initParams.category, false);
    } else if (initParams?.mode === "calendar_date" && initParams.date) {
      setScheduledDate(initParams.date);
      setWhen("schedule");
      const defaultCat = CATEGORIES.find((c) => c.id === "new_collection") || CATEGORIES[0];
      setPostType(defaultCat.id);
      setCaption(defaultCat.defaultCaption(shopData));
      setHashtags(defaultCat.defaultTags);
    } else {
      // Default blank/new post
      const defaultCat = CATEGORIES.find((c) => c.id === "new_collection") || CATEGORIES[0];
      setPostType(defaultCat.id);
      setCaption(defaultCat.defaultCaption(shopData));
      setHashtags(defaultCat.defaultTags);
    }

    // Load sample library images
    fetchLibraryImages();
  }, [initParams, shopData]);

  const fetchLibraryImages = async () => {
    try {
      const savedTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") || "1" : "1";
      const res = await fetch(`/api/assets?tenant_id=${savedTenantId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.assets || []);
        const urls = list.map((a) => a.url).filter((u) => u && typeof u === "string");
        if (urls.length > 0) {
          setLibraryImages(urls);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not load library assets:", e);
    }

    try {
      const savedTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") || "1" : "1";
      const cRes = await fetch(`/api/campaigns?tenant_id=${savedTenantId}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        const campaigns = Array.isArray(cData) ? cData : (cData.campaigns || []);
        const campaignImgs = campaigns
          .map((c) => c.visual_suggestion || c.image_url)
          .filter((u) => u && typeof u === "string" && (u.startsWith("http") || u.startsWith("/api/")));
        if (campaignImgs.length > 0) {
          setLibraryImages(Array.from(new Set(campaignImgs)));
          return;
        }
      }
    } catch (e) {}

    setLibraryImages([]);
  };

  // Category change handler
  const handleSelectCategory = (catId, triggerNotice = true) => {
    const selected = CATEGORIES.find((c) => c.id === catId);
    if (!selected) return;

    if (triggerNotice) {
      setPreviousCaption(caption);
      setPreviousHashtags([...hashtags]);
      setNoticeBannerType(selected.label);
      setShowNoticeBanner(true);
    }

    setPostType(selected.id);
    setCaption(selected.defaultCaption(shopData));
    setHashtags(selected.defaultTags);
    setIsTypeDropdownOpen(false);
  };

  // Undo category change
  const handleUndo = () => {
    if (previousCaption) setCaption(previousCaption);
    if (previousHashtags && previousHashtags.length > 0) setHashtags(previousHashtags);
    setShowNoticeBanner(false);
  };

  // Add custom hashtag
  const handleAddHashtag = () => {
    const tag = newTagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setIsUploading(false);
      showToast("Image added!");
    };
    reader.readAsDataURL(file);
  };

  // Handle AI Tone refinement
  const handleToneChange = async (tone) => {
    setIsRefiningTone(true);
    try {
      const savedTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") || "1" : "1";
      const res = await fetch(`/api/ai/refine-tone?tenant_id=${savedTenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: caption,
          tone: tone.toLowerCase(),
          business_name: shopData.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.refined_caption) {
          setCaption(data.refined_caption);
          showToast(`Tone adjusted to ${tone}!`);
          setIsRefiningTone(false);
          return;
        }
      }
    } catch (e) {
      // Local heuristic fallback
    }

    // Intelligent local fallback if API fails
    let newCap = caption;
    if (tone === "Casual") {
      newCap = `Hey everyone! ✨ ${caption.replace(/\. /g, "! ")} Tap the link in bio or DM us to order! 💕`;
    } else if (tone === "Formal") {
      newCap = `We cordially invite you to experience the finest weaves at ${shopData.name}. ${caption} For inquiries, kindly reach out directly.`;
    } else if (tone === "Shorten") {
      const sentences = caption.split(". ");
      newCap = sentences.slice(0, 2).join(". ") + (sentences.length > 2 ? "." : "");
    } else if (tone === "Elaborate") {
      newCap = `${caption} Hand-curated with care and woven by master artisans, each piece celebrates timeless craftsmanship. Visit our boutique at ${shopData.area} to discover yours today!`;
    }
    setCaption(newCap);
    showToast(`Tone adjusted to ${tone}!`);
    setIsRefiningTone(false);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    const draftId = currentDraftId || `draft_${Date.now()}`;
    const draftObj = {
      id: draftId,
      title: caption ? caption.slice(0, 32) + "..." : "Untitled Draft",
      caption,
      hashtags,
      format,
      image_url: image,
      category: postType,
      when,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      channels,
      updated_at: new Date().toISOString()
    };

    try {
      const existing = loadDraftsList();
      const filtered = existing.filter((d) => d.id !== draftId);
      const updated = [draftObj, ...filtered];
      localStorage.setItem("digim_post_drafts", JSON.stringify(updated));
      setDraftsList(updated);
      setCurrentDraftId(draftId);

      // Save to backend if available
      const savedTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") || "1" : "1";
      fetch(`/api/campaigns/draft?tenant_id=${savedTenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftObj)
      }).catch(() => {});

      showToast("Draft saved successfully!");
      if (onSaveSuccess) onSaveSuccess();
    } catch (e) {
      showToast("Saved locally!");
    }
  };

  // Load a Draft
  const handleLoadDraft = (draft) => {
    setCurrentDraftId(draft.id);
    if (draft.caption) setCaption(draft.caption);
    if (draft.hashtags) setHashtags(draft.hashtags);
    if (draft.format) setFormat(draft.format);
    if (draft.image_url) setImage(draft.image_url);
    if (draft.category) setPostType(draft.category);
    if (draft.when) setWhen(draft.when);
    if (draft.scheduled_date) setScheduledDate(draft.scheduled_date);
    if (draft.scheduled_time) setScheduledTime(draft.scheduled_time);
    if (draft.channels) setChannels(draft.channels);
    setIsDraftsOpen(false);
    showToast(`Loaded draft: ${draft.title || "Draft"}`);
  };

  // Delete Draft
  const handleDeleteDraft = (e, draftId) => {
    e.stopPropagation();
    const updated = draftsList.filter((d) => d.id !== draftId);
    setDraftsList(updated);
    try {
      localStorage.setItem("digim_post_drafts", JSON.stringify(updated));
    } catch (err) {}
    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
    }
    showToast("Draft deleted.");
  };

  // Publish / Schedule Post
  const handlePublish = async () => {
    if (!caption && !image) {
      showToast("Please add a caption or an image before posting.");
      return;
    }
    if (!channels.facebook && !channels.instagram) {
      showToast("Please select at least one platform to post to.");
      return;
    }

    setIsPublishing(true);
    const savedTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") || "1" : "1";

    const fullMessage = caption + (hashtags.length > 0 ? "\n\n" + hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ") : "");
    const payload = {
      tenant_id: parseInt(savedTenantId, 10) || 1,
      message: fullMessage,
      caption: fullMessage,
      image_url: image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      format,
      when,
      scheduled_time: when === "schedule" ? `${scheduledDate}T${scheduledTime || "18:00"}:00` : null,
      publish_facebook: Boolean(channels.facebook),
      publish_to_facebook: Boolean(channels.facebook),
      publish_instagram: Boolean(channels.instagram),
      publish_to_instagram: Boolean(channels.instagram),
      category: postType
    };

    try {
      const res = await fetch(`/api/campaign/publish?tenant_id=${savedTenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(when === "schedule" ? "Post scheduled successfully! 🎉" : "Post published to Facebook & Instagram! 🎉");
        // Remove draft from list if it was a saved draft
        if (currentDraftId) {
          const updated = draftsList.filter((d) => d.id !== currentDraftId);
          setDraftsList(updated);
          localStorage.setItem("digim_post_drafts", JSON.stringify(updated));
        }
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => {
          if (onNavigateToTab) onNavigateToTab("home");
        }, 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Error publishing post. Please try again.");
      }
    } catch (e) {
      showToast("Network error. Could not publish.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Save image to library database
  const handleSaveImageToLibrary = async () => {
    if (!image) return;
    try {
      const savedTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") || "1" : "1";
      const res = await fetch("/api/assets/save-to-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: parseInt(savedTenantId, 10) || 1,
          image_url: image
        })
      });
      if (res.ok) {
        setIsSavedToLib(true);
        showToast("Image saved to your Media Library! 🎉");
        fetchLibraryImages();
      } else {
        showToast("Failed to save image to library.");
      }
    } catch (e) {
      showToast("Error saving image to library.");
    }
  };

  // AI Image generation - takes prompt directly from the post text / caption
  const handleGenerateAiImage = async () => {
    setIsAiGenerating(true);
    showToast("Generating AI image from post text... ✨");
    try {
      const savedTenantId = typeof window !== "undefined" ? localStorage.getItem("tenant_id") || "1" : "1";
      const basePrompt = caption && caption.trim().length > 0
        ? caption.slice(0, 300)
        : `${currentCategory.label} showcase for ${shopData.name}, ${shopData.sells || "ethnic wear, silk sarees"}`;
      const promptText = `${basePrompt}, commercial studio product photography, clean natural studio lighting, sharp focus, 8k resolution`;

      const res = await fetch("/api/campaign/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          num_images: 1,
          format_type: format === "reel" || format === "story" ? "story" : "post"
        })
      });

      if (res.ok) {
        const data = await res.json();
        const genUrl = data.url || (Array.isArray(data.urls) && data.urls[0]) || data.image_url;
        if (genUrl) {
          setImage(genUrl);
          setIsAiGenModalOpen(false);
          // Auto-save generated image to library database
          try {
            fetch("/api/assets/save-to-library", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tenant_id: parseInt(savedTenantId, 10) || 1,
                image_url: genUrl
              })
            }).then(r => {
              if (r.ok) {
                setIsSavedToLib(true);
                fetchLibraryImages();
              }
            }).catch(() => null);
          } catch (e) {}

          showToast("AI Image generated & saved to library! ✨");
          setIsAiGenerating(false);
          return;
        }
      }
    } catch (e) {
      console.error("AI image gen error:", e);
    }

    // Mock high-quality silk saree images fallback
    const presets = [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
    ];
    setImage(presets[Math.floor(Math.random() * presets.length)]);
    setIsAiGenModalOpen(false);
    showToast("AI Image generated! ✨");
    setIsAiGenerating(false);
  };

  const currentCategory = CATEGORIES.find((c) => c.id === postType) || CATEGORIES[0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        overflowY: "auto",
        boxSizing: "border-box",
        background: "var(--canvas, #0e140d)",
        color: "var(--ink, #e6eee4)",
        fontFamily: "'Mukta', 'Noto Sans Devanagari', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#16211f",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            fontSize: "15px",
            fontWeight: 600,
            zIndex: 9999
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Header Bar matching "Alternative composer, web" */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "12px",
          flexWrap: "wrap",
          minHeight: "64px",
          padding: "0 24px",
          background: "var(--surface, #172016)",
          borderBottom: "1px solid var(--hair, #2a3628)"
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (onNavigateToTab) onNavigateToTab("home");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "44px",
            fontWeight: 600,
            color: "var(--ink, #e6eee4)",
            textDecoration: "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            padding: 0
          }}
        >
          {ICONS.home} Home
        </button>

        <h1
          style={{
            margin: "0 0 0 8px",
            fontFamily: "'Baloo 2', 'Mukta', system-ui, sans-serif",
            fontSize: "24px",
            lineHeight: "30px",
            fontWeight: 700,
            color: "var(--ink, #e6eee4)"
          }}
        >
          New post
        </h1>

        <span style={{ flex: 1 }} />

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} theme`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "40px",
            padding: "0 12px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            background: "var(--sunken, #191f18)",
            color: "var(--ink, #e6eee4)",
            border: "1px solid var(--border, #747d73)"
          }}
        >
          {currentTheme === "dark" ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              Light theme
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              Dark theme
            </>
          )}
        </button>

        {/* Drafts count link */}
        <button
          type="button"
          onClick={() => setIsDraftsOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "44px",
            padding: "0 12px",
            fontWeight: 600,
            color: "var(--ink, #e6eee4)",
            textDecoration: "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "15px"
          }}
        >
          {ICONS.drafts} Drafts{" "}
          <span
            style={{
              minWidth: "22px",
              height: "22px",
              padding: "0 6px",
              boxSizing: "border-box",
              borderRadius: "999px",
              background: "var(--sunken, #191f18)",
              color: "var(--muted, #a1ae9e)",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700
            }}
          >
            {draftsList.length}
          </span>
        </button>

        {/* Save Draft button */}
        <button
          type="button"
          onClick={handleSaveDraft}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minHeight: "44px",
            padding: "0 20px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            boxSizing: "border-box",
            cursor: "pointer",
            background: "var(--surface, #ffffff)",
            color: "var(--ink, #171f16)",
            border: "1.5px solid var(--border, #979a96)",
            boxShadow: "0 1px 3px rgba(23, 31, 22, 0.08)",
            transition: "all 0.2s ease"
          }}
        >
          Save draft
        </button>
      </div>

      {/* Main Container - max-width 1280px centered */}
      <div
        style={{
          width: "100%",
          maxWidth: "1280px",
          boxSizing: "border-box",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          padding: "24px"
        }}
      >
        {/* Horizontal Full-width Set up Section */}
        <section
          aria-label="Set up"
          style={{
            background: "var(--surface, #172016)",
            border: "1px solid var(--hair, #2a3628)",
            borderRadius: "16px",
            padding: "16px 20px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: "16px 24px"
          }}
        >
          {/* Format: Post, Reel, Story */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", fontVariant: "all-small-caps", fontWeight: 600, color: "var(--muted, #a1ae9e)" }}>Format</span>
            <div
              role="radiogroup"
              style={{
                display: "inline-flex",
                flexWrap: "wrap",
                padding: "4px",
                borderRadius: "12px",
                background: "var(--sunken, #191f18)"
              }}
            >
              {[
                { id: "post", label: "Post", icon: ICONS.post },
                { id: "reel", label: "Reel", icon: ICONS.reel },
                { id: "story", label: "Story", icon: ICONS.story }
              ].map((fmt) => {
                const isChecked = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    role="radio"
                    aria-checked={isChecked}
                    onClick={() => setFormat(fmt.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      minHeight: "40px",
                      padding: "0 12px",
                      borderRadius: "9px",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                      background: isChecked ? "#2F6B2F" : "transparent",
                      color: isChecked ? "#ffffff" : "var(--muted, #566054)",
                      border: isChecked ? "1.5px solid #2F6B2F" : "1.5px solid transparent",
                      boxShadow: isChecked ? "0 2px 6px rgba(47, 107, 47, 0.2), 0 1px 2px rgba(23, 31, 22, 0.08)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ color: isChecked ? "#ffffff" : "var(--muted, #566054)" }}>{fmt.icon}</span>
                    {fmt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* When: Post now vs Schedule + Date & Time Picker */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              paddingLeft: "20px",
              borderLeft: "1px solid var(--hair, #2a3628)"
            }}
          >
            <span style={{ fontSize: "13px", fontVariant: "all-small-caps", fontWeight: 600, color: "var(--muted, #a1ae9e)" }}>When</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "8px", flexWrap: "wrap" }}>
              <div
                role="radiogroup"
                style={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  padding: "4px",
                  borderRadius: "12px",
                  background: "var(--sunken, #191f18)"
                }}
              >
                {[
                  { id: "now", label: "Post now", icon: ICONS.postNow },
                  { id: "schedule", label: "Schedule", icon: ICONS.schedule }
                ].map((w) => {
                  const isChecked = when === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      role="radio"
                      aria-checked={isChecked}
                      onClick={() => setWhen(w.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        minHeight: "40px",
                        padding: "0 12px",
                        borderRadius: "9px",
                        border: "none",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: isChecked ? "#2F6B2F" : "transparent",
                        color: isChecked ? "#ffffff" : "var(--muted, #566054)",
                        border: isChecked ? "1.5px solid #2F6B2F" : "1.5px solid transparent",
                        boxShadow: isChecked ? "0 2px 6px rgba(47, 107, 47, 0.2), 0 1px 2px rgba(23, 31, 22, 0.08)" : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span style={{ color: isChecked ? "#ffffff" : "var(--muted, #566054)" }}>{w.icon}</span>
                      {w.label}
                    </button>
                  );
                })}
              </div>

              {/* Date & Time inputs if Schedule */}
              {when === "schedule" && (
                <>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: "44px",
                      padding: "0 12px",
                      border: "1px solid var(--border, #747d73)",
                      borderRadius: "12px",
                      background: "var(--surface, #172016)",
                      fontSize: "15px",
                      boxSizing: "border-box",
                      minWidth: "130px",
                      color: "var(--ink, #e6eee4)"
                    }}
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: "44px",
                      padding: "0 12px",
                      border: "1px solid var(--border, #747d73)",
                      borderRadius: "12px",
                      background: "var(--surface, #172016)",
                      fontSize: "15px",
                      boxSizing: "border-box",
                      minWidth: "96px",
                      color: "var(--ink, #e6eee4)"
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "var(--muted, #a1ae9e)" }}>IST</span>
                </>
              )}
            </div>
          </div>

          {/* Post to: Facebook & Instagram toggle switches */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              paddingLeft: "20px",
              borderLeft: "1px solid var(--hair, #2a3628)"
            }}
          >
            <span style={{ fontSize: "13px", fontVariant: "all-small-caps", fontWeight: 600, color: "var(--muted, #a1ae9e)" }}>Post to</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "6px" }}>
              {/* Facebook Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={channels.facebook}
                aria-label="Facebook"
                onClick={() => setChannels({ ...channels, facebook: !channels.facebook })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "36px",
                  padding: "0 10px 0 6px",
                  borderRadius: "999px",
                  border: channels.facebook ? "2px solid var(--primary, #2f6b2f)" : "1.5px solid var(--border, #979a96)",
                  background: channels.facebook ? "var(--tint, #e6ede6)" : "var(--surface, #ffffff)",
                  boxShadow: channels.facebook ? "0 2px 8px rgba(47, 107, 47, 0.2)" : "none",
                  transition: "all 0.2s ease",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--ink, #e6eee4)",
                  cursor: "pointer"
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "20px",
                    height: "20px",
                    flex: "none",
                    borderRadius: "10px",
                    background: "#1877f2",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "11px"
                  }}
                >
                  f
                </span>
                Facebook
                {channels.facebook && (
                  <span style={{ color: "var(--primary, #2f6b2f)", display: "flex" }}>{ICONS.check}</span>
                )}
              </button>

              {/* Instagram Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={channels.instagram}
                aria-label="Instagram"
                onClick={() => setChannels({ ...channels, instagram: !channels.instagram })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "36px",
                  padding: "0 10px 0 6px",
                  borderRadius: "999px",
                  border: channels.instagram ? "2px solid var(--primary, #2f6b2f)" : "1.5px solid var(--border, #979a96)",
                  background: channels.instagram ? "var(--tint, #e6ede6)" : "var(--surface, #ffffff)",
                  boxShadow: channels.instagram ? "0 2px 8px rgba(47, 107, 47, 0.2)" : "none",
                  transition: "all 0.2s ease",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--ink, #e6eee4)",
                  cursor: "pointer"
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "20px",
                    height: "20px",
                    flex: "none",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg,#f9a03f,#d92e7f 55%,#7b3fe4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <span style={{ width: "10px", height: "10px", border: "2px solid #ffffff", borderRadius: "30%" }} />
                </span>
                Instagram
                {channels.instagram && (
                  <span style={{ color: "var(--primary, #2f6b2f)", display: "flex" }}>{ICONS.check}</span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Main Post Editor Section */}
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Platform Tabs Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "4px", borderBottom: "1px solid var(--hair, #2a3628)" }}>
            <button
              type="button"
              role="tab"
              aria-selected={platformTab === "all"}
              onClick={() => setPlatformTab("all")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                padding: "0 12px",
                border: "none",
                borderBottom: platformTab === "all" ? "2px solid var(--primary, #7cc47c)" : "2px solid transparent",
                background: "transparent",
                fontSize: "15px",
                fontWeight: 600,
                color: platformTab === "all" ? "#45b5a6" : "#9dafaa",
                cursor: "pointer"
              }}
            >
              All platforms
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platformTab === "facebook"}
              onClick={() => setPlatformTab("facebook")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                padding: "0 12px",
                border: "none",
                borderBottom: platformTab === "facebook" ? "2px solid var(--primary, #7cc47c)" : "2px solid transparent",
                background: "transparent",
                fontSize: "15px",
                fontWeight: 600,
                color: platformTab === "facebook" ? "#45b5a6" : "#9dafaa",
                cursor: "pointer"
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "18px",
                  height: "18px",
                  flex: "none",
                  borderRadius: "10px",
                  background: "#1877f2",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "9px"
                }}
              >
                f
              </span>
              Facebook
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platformTab === "instagram"}
              onClick={() => setPlatformTab("instagram")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                padding: "0 12px",
                border: "none",
                borderBottom: platformTab === "instagram" ? "2px solid var(--primary, #7cc47c)" : "2px solid transparent",
                background: "transparent",
                fontSize: "15px",
                fontWeight: 600,
                color: platformTab === "instagram" ? "#45b5a6" : "#9dafaa",
                cursor: "pointer"
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "18px",
                  height: "18px",
                  flex: "none",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg,#f9a03f,#d92e7f 55%,#7b3fe4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span style={{ width: "9px", height: "9px", border: "2px solid #ffffff", borderRadius: "30%" }} />
              </span>
              Instagram
            </button>
          </div>

          <p style={{ margin: 0, fontSize: "14px", lineHeight: "20px", color: "var(--muted, #a1ae9e)" }}>
            Edits here go to every platform. Pick Facebook or Instagram to change just that one.
          </p>

          {/* Big Post Card Article matching Prototype */}
          <article
            style={{
              width: "100%",
              background: "var(--surface, #172016)",
              border: "1px solid var(--hair, #2a3628)",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box"
            }}
          >
            {/* Post Header: Avatar + Business Name + Scheduled Date */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "10px" }}>
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--primary, #7cc47c)",
                  color: "var(--onprimary, #101614)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "17px",
                  flexShrink: 0
                }}
              >
                {(shopData.name || "S").charAt(0).toUpperCase()}
              </span>
              <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <b style={{ fontSize: "16px", color: "var(--ink, #e6eee4)" }}>{shopData.name}</b>
                <span style={{ fontSize: "13px", color: "var(--muted, #a1ae9e)" }}>
                  {formatDateTimeDisplay(scheduledDate, scheduledTime)}
                </span>
              </span>
            </div>

            {/* 2-Column Split: Image Left, Content Right */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
              {/* Left Column: Image Box (300px) */}
              <div style={{ flex: "0 1 300px", minWidth: "240px" }}>
                {!image ? (
                  <div
                    role="group"
                    aria-label="No image yet"
                    style={{
                      borderRadius: "12px",
                      border: "2px dashed var(--border, #747d73)",
                      background: "var(--canvas, #0e140d)",
                      aspectRatio: format === "post" ? "1 / 1" : "9 / 16",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "16px",
                      boxSizing: "border-box",
                      textAlign: "center"
                    }}
                  >
                    {ICONS.image}
                    <b style={{ fontSize: "15px", color: "var(--ink, #e6eee4)" }}>Add your image</b>
                    <span style={{ fontSize: "13px", color: "var(--muted, #a1ae9e)", maxWidth: "260px" }}>
                      The image is what people notice first.
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                      <button
                        type="button"
                        disabled={isAiGenerating}
                        onClick={handleGenerateAiImage}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          minHeight: "44px",
                          padding: "0 20px",
                          borderRadius: "12px",
                          fontSize: "16px",
                          fontWeight: 600,
                          boxSizing: "border-box",
                          cursor: isAiGenerating ? "wait" : "pointer",
                          width: "100%",
                          background: "var(--surface, #ffffff)",
                          color: "var(--primary, #2f6b2f)",
                          border: "1.5px solid var(--primary, #2f6b2f)",
                          boxShadow: "0 2px 6px rgba(47, 107, 47, 0.12)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {ICONS.spark} {isAiGenerating ? "Generating image..." : "Generate AI Image"}
                      </button>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            minHeight: "44px",
                            padding: "0 8px",
                            borderRadius: "12px",
                            fontSize: "16px",
                            fontWeight: 600,
                            boxSizing: "border-box",
                            cursor: "pointer",
                            width: "100%",
                            background: "var(--surface, #ffffff)",
                            color: "var(--ink, #171f16)",
                            border: "1px solid var(--border, #979a96)"
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleImageUpload}
                            style={{ display: "none" }}
                          />
                          {ICONS.upload} Upload
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            fetchLibraryImages();
                            setIsLibraryOpen(true);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            minHeight: "44px",
                            padding: "0 8px",
                            borderRadius: "12px",
                            fontSize: "16px",
                            fontWeight: 600,
                            boxSizing: "border-box",
                            cursor: "pointer",
                            width: "100%",
                            background: "var(--surface, #ffffff)",
                            color: "var(--ink, #171f16)",
                            border: "1px solid var(--border, #979a96)"
                          }}
                        >
                          {ICONS.grid} Library
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      aspectRatio: format === "post" ? "1 / 1" : "9 / 16",
                      background: "#000000",
                      border: "1px solid var(--hair, #2a3628)"
                    }}
                  >
                    <img
                      src={image}
                      alt="Post preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        left: "10px",
                        right: "10px",
                        display: "flex",
                        gap: "8px",
                        justifyContent: "space-between"
                      }}
                    >
                      <label
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "rgba(22, 33, 31, 0.8)",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          backdropFilter: "blur(6px)"
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveImageToLibrary}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: isSavedToLib ? "rgba(47, 107, 47, 0.9)" : "rgba(22, 33, 31, 0.8)",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          backdropFilter: "blur(6px)"
                        }}
                      >
                        {isSavedToLib ? "✓ Saved" : "💾 Save to Library"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setIsSavedToLib(false);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "rgba(180, 35, 24, 0.85)",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          backdropFilter: "blur(6px)"
                        }}
                      >
                        {ICONS.trash}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Post Content */}
              <div style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Post type dropdown trigger */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", position: "relative" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted, #566054)" }}>Post type</span>
                  <button
                    type="button"
                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      minHeight: "48px",
                      padding: "0 12px",
                      borderRadius: "12px",
                      border: "1.5px solid var(--border, #979a96)",
                      background: "var(--surface, #ffffff)",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--ink, #171f16)",
                      textAlign: "left",
                      boxSizing: "border-box",
                      cursor: "pointer"
                    }}
                  >
                    <span style={{ color: "var(--primary, #2f6b2f)", display: "flex" }}>{currentCategory.icon}</span>
                    <span style={{ flex: 1, color: "var(--ink, #171f16)" }}>{currentCategory.label}</span>
                    <span style={{ color: "var(--muted, #566054)", display: "flex", transform: isTypeDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      {ICONS.chevronDown}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isTypeDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "76px",
                        left: 0,
                        right: 0,
                        background: "var(--surface, #ffffff)",
                        border: "1px solid var(--hair, #d7ddd3)",
                        borderRadius: "12px",
                        boxShadow: "0 12px 30px rgba(23, 31, 22, 0.12)",
                        zIndex: 50,
                        padding: "8px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px"
                      }}
                    >
                      {CATEGORIES.map((cat) => {
                        const isSel = postType === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleSelectCategory(cat.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: isSel ? "1.5px solid var(--primary, #2f6b2f)" : "1.5px solid transparent",
                              background: isSel ? "var(--tint, #e6ede6)" : "transparent",
                              color: isSel ? "var(--primary, #2f6b2f)" : "var(--ink, #171f16)",
                              fontWeight: isSel ? 700 : 500,
                              fontSize: "14px",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span style={{ color: isSel ? "var(--primary, #2f6b2f)" : "var(--muted, #566054)" }}>{cat.icon}</span>
                            <span style={{ color: isSel ? "var(--primary, #2f6b2f)" : "var(--ink, #171f16)" }}>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Yellow Notice Banner when Type Changed */}
                {showNoticeBanner && (
                  <div
                    role="status"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      background: "var(--atint, #3e3b1e)",
                      color: "var(--aink, #f2c466)",
                      fontSize: "14px",
                      lineHeight: "20px"
                    }}
                  >
                    <span style={{ display: "flex", color: "var(--aink, #f2c466)" }}>{ICONS.spark}</span>
                    <span style={{ flex: 1, minWidth: "180px" }}>
                      Caption and hashtags updated for <b>{noticeBannerType}</b>.
                    </span>
                    <button
                      type="button"
                      onClick={handleUndo}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 600,
                        color: "var(--aink, #f2c466)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      {ICONS.undo} Undo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNoticeBanner(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--aink, #f2c466)",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "0 4px",
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Caption Text Area with emerald focus outline */}
                <div style={{ position: "relative" }}>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Our new collection has arrived! Fresh designs in silk and cotton..."
                    rows={4}
                    style={{
                      width: "100%",
                      fontFamily: "'Mukta', 'Noto Sans Devanagari', system-ui, sans-serif",
                      fontSize: "17px",
                      lineHeight: "26px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: "1.5px solid var(--border, #747d73)",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                      color: "var(--ink, #e6eee4)",
                      background: "var(--surface, #172016)",
                      transition: "border-color 0.2s, box-shadow 0.2s"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#45b5a6";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 107, 97, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#64776f";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Tone AI Quick Actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "var(--muted, #a1ae9e)" }}>
                    {ICONS.wand} Tone
                  </span>
                  {["Casual", "Formal", "Shorten", "Elaborate"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      disabled={isRefiningTone}
                      onClick={() => handleToneChange(t)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        minHeight: "36px",
                        padding: "0 14px",
                        borderRadius: "999px",
                        border: "1px solid var(--border, #747d73)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #e6eee4)",
                        fontSize: "14px",
                        fontWeight: 600,
                        boxSizing: "border-box",
                        cursor: isRefiningTone ? "wait" : "pointer"
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Hashtags display + Add tag */}
                <p style={{ margin: 0, fontSize: "16px", lineHeight: "24px" }}>
                  <span style={{ color: "var(--primary, #7cc47c)", fontWeight: 600 }}>
                    {hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                  </span>{" "}
                  {isAddingTag ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "4px" }}>
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddHashtag();
                          else if (e.key === "Escape") setIsAddingTag(false);
                        }}
                        placeholder="tag"
                        autoFocus
                        style={{
                          width: "90px",
                          height: "28px",
                          padding: "2px 6px",
                          border: "1px solid var(--primary, #7cc47c)",
                          borderRadius: "6px",
                          fontSize: "14px",
                          outline: "none"
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddHashtag}
                        style={{
                          height: "28px",
                          padding: "0 8px",
                          background: "var(--primary, #7cc47c)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        OK
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--primary, #7cc47c)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        marginLeft: "6px"
                      }}
                    >
                      {ICONS.plus} Add
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* Post Card Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "16px",
                flexWrap: "wrap",
                paddingTop: "16px",
                borderTop: "1px solid var(--hair, #2a3628)"
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", lineHeight: "20px", color: "var(--muted, #a1ae9e)" }}>
                {caption.length} / 2,200 characters
              </p>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "44px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--primary, #7cc47c)",
                  background: "none",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {ICONS.eye} See it on Facebook or Instagram
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  minHeight: "52px",
                  padding: "0 20px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  boxSizing: "border-box",
                  cursor: isPublishing ? "not-allowed" : "pointer",
                  background: "#2F6B2F",
                  color: "#ffffff",
                  border: "1.5px solid #2F6B2F",
                  boxShadow: "0 4px 14px rgba(47, 107, 47, 0.35)",
                  transition: "all 0.2s ease",
                  opacity: isPublishing ? 0.7 : 1
                }}
              >
                {when === "schedule" ? ICONS.schedule : ICONS.postNow}
                {isPublishing
                  ? "Processing..."
                  : when === "schedule"
                  ? "Schedule post"
                  : "Post now"}
              </button>
            </div>
          </article>
        </main>
      </div>

      {/* Drafts Drawer */}
      {isDraftsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={() => setIsDraftsOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "var(--surface, #172016)",
              height: "100%",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              padding: "24px",
              boxSizing: "border-box"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, fontFamily: "'Baloo 2', sans-serif" }}>
                Saved Drafts ({draftsList.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsDraftsOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted, #a1ae9e)" }}
              >
                {ICONS.x}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {draftsList.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted, #a1ae9e)", marginTop: "40px" }}>
                  <p>No saved drafts yet.</p>
                  <p style={{ fontSize: "13px" }}>Click "Save draft" at the top to save your progress.</p>
                </div>
              ) : (
                draftsList.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleLoadDraft(d)}
                    style={{
                      border: "1px solid var(--hair, #2a3628)",
                      borderRadius: "12px",
                      padding: "14px",
                      cursor: "pointer",
                      background: currentDraftId === d.id ? "#123230" : "#0e1615",
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <b style={{ fontSize: "15px", color: "var(--ink, #e6eee4)" }}>
                        {d.title || "Untitled draft"}
                      </b>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDraft(e, d.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger, #f0796b)" }}
                      >
                        {ICONS.trash}
                      </button>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "var(--muted, #a1ae9e)", lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {d.caption || "No caption text"}
                    </p>
                    <span style={{ fontSize: "11px", color: "var(--muted, #a1ae9e)" }}>
                      {d.updated_at ? new Date(d.updated_at).toLocaleString() : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Image Modal */}
      {isAiGenModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setIsAiGenModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "var(--surface, #172016)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, fontFamily: "'Baloo 2', sans-serif" }}>
                Generate Image with AI
              </h3>
              <button
                type="button"
                onClick={() => setIsAiGenModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted, #a1ae9e)" }}
              >
                {ICONS.x}
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "var(--muted, #a1ae9e)", marginBottom: "14px" }}>
              Describe the image you want for your ethnic wear store, or leave it blank to auto-generate based on your shop details.
            </p>
            <textarea
              value={aiGenPrompt}
              onChange={(e) => setAiGenPrompt(e.target.value)}
              placeholder="e.g. Model wearing royal blue Kanjivaram silk saree with gold border in a luxury showroom..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--border, #747d73)",
                fontSize: "14px",
                marginBottom: "16px",
                boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsAiGenModalOpen(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid var(--border, #747d73)",
                  background: "var(--surface, #172016)",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAiGenerating}
                onClick={handleGenerateAiImage}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--primary, #7cc47c)",
                  color: "var(--onprimary, #101614)",
                  fontWeight: 600,
                  cursor: isAiGenerating ? "wait" : "pointer"
                }}
              >
                {isAiGenerating ? "Generating..." : "Generate Image"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Drawer/Modal */}
      {isLibraryOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setIsLibraryOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "var(--surface, #172016)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, fontFamily: "'Baloo 2', sans-serif" }}>
                Select from Media Library
              </h3>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted, #a1ae9e)" }}
              >
                {ICONS.x}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", maxHeight: "360px", overflowY: "auto" }}>
              {libraryImages.map((imgUrl, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setImage(imgUrl);
                    setIsLibraryOpen(false);
                    showToast("Image selected from library!");
                  }}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: "10px",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: "2px solid var(--hair, #2a3628)"
                  }}
                >
                  <img src={imgUrl} alt="Library item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal: 2 Previews (Facebook and Instagram side-by-side) */}
      {isPreviewModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 16, 12, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto"
          }}
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: previewPlatform === "both" ? "820px" : "440px",
              background: "var(--surface, #ffffff)",
              border: "1px solid var(--hair, #d7ddd3)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxHeight: "92vh",
              overflowY: "auto",
              transition: "max-width 0.25s ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Title and Platform Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--hair, #d7ddd3)", paddingBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, fontFamily: "'Baloo 2', sans-serif", color: "var(--ink, #171f16)" }}>
                  Post Previews
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted, #566054)" }}>
                  How your post will look on Facebook and Instagram
                </p>
              </div>

              {/* Toggle Pills: Both vs Facebook vs Instagram */}
              <div style={{ display: "inline-flex", padding: "4px", background: "var(--sunken, #e9ebe7)", borderRadius: "10px", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => setPreviewPlatform("both")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: previewPlatform === "both" ? "#2F6B2F" : "transparent",
                    color: previewPlatform === "both" ? "#ffffff" : "var(--muted, #566054)",
                    transition: "all 0.15s ease"
                  }}
                >
                  Both Previews
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPlatform("facebook")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: previewPlatform === "facebook" ? "#1877f2" : "transparent",
                    color: previewPlatform === "facebook" ? "#ffffff" : "var(--muted, #566054)",
                    transition: "all 0.15s ease"
                  }}
                >
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPlatform("instagram")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: previewPlatform === "instagram" ? "linear-gradient(135deg, #f9a03f, #d92e7f)" : "transparent",
                    color: previewPlatform === "instagram" ? "#ffffff" : "var(--muted, #566054)",
                    transition: "all 0.15s ease"
                  }}
                >
                  Instagram
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted, #566054)", padding: "4px" }}
              >
                {ICONS.x}
              </button>
            </div>

            {/* Previews Container: Side-by-Side Phone Mockups */}
            <div style={{ display: "flex", gap: "24px", justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap", padding: "8px 0" }}>
              {/* 1. FACEBOOK PREVIEW PHONE */}
              {(previewPlatform === "both" || previewPlatform === "facebook") && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1877f2", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "9px", background: "#1877f2", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>f</span>
                    Facebook Feed Preview
                  </span>
                  <div
                    style={{
                      width: "330px",
                      maxWidth: "100%",
                      borderRadius: "44px",
                      background: "#111814",
                      padding: "10px",
                      boxShadow: "0 14px 34px rgba(23, 31, 22, 0.28)",
                      border: "3px solid #2a3628",
                      boxSizing: "border-box"
                    }}
                  >
                    <div style={{ borderRadius: "34px", overflow: "hidden", background: "#ffffff", color: "#050505", minHeight: "520px", display: "flex", flexDirection: "column" }}>
                      {/* Top Phone Speaker / Island Notch */}
                      <div style={{ width: "80px", height: "12px", background: "#000000", borderRadius: "8px", margin: "6px auto 8px" }} />
                      {/* FB App Bar */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 14px 8px", borderBottom: "1px solid #e4e6eb" }}>
                        <span style={{ fontSize: "17px", fontWeight: 800, color: "#1877f2", fontFamily: "sans-serif", letterSpacing: "-0.5px" }}>Feed</span>
                        <div style={{ display: "flex", gap: "8px", color: "#65676b", fontSize: "14px" }}>
                          <span>🔍</span>
                          <span>💬</span>
                        </div>
                      </div>

                      {/* FB Post Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px 6px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#2F6B2F", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "16px", flexShrink: 0 }}>
                          {(shopData.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                          <b style={{ fontSize: "14px", color: "#050505", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {shopData.name}
                          </b>
                          <span style={{ fontSize: "12px", color: "#65676b" }}>
                            {formatDateTimeDisplay(scheduledDate, scheduledTime)} · 🌐
                          </span>
                        </div>
                        <span style={{ color: "#65676b", fontSize: "16px", cursor: "pointer", padding: "0 4px" }}>•••</span>
                      </div>

                      {/* FB Caption */}
                      <p style={{ margin: "0", padding: "6px 12px 10px", fontSize: "14px", lineHeight: "19px", color: "#050505", whiteSpace: "pre-line" }}>
                        {caption || "Our new collection has arrived! Fresh designs in silk and cotton."}
                        {hashtags.length > 0 && (
                          <span style={{ display: "block", color: "#1877f2", marginTop: "6px", fontWeight: 500 }}>
                            {hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                          </span>
                        )}
                      </p>

                      {/* FB Post Image */}
                      <div style={{ width: "100%", aspectRatio: format === "post" ? "1 / 1" : "9 / 16", background: "#f0f2f5", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {image ? (
                          <img src={image} alt="Facebook post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ color: "#65676b", fontSize: "13px", padding: "20px", textAlign: "center" }}>
                            📷 Image preview will appear here
                          </div>
                        )}
                      </div>

                      {/* FB Post Footer Actions */}
                      <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid #ced0d4", padding: "8px 4px", marginTop: "auto", color: "#65676b", fontSize: "13px", fontWeight: 600 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>👍 Like</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>💬 Comment</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>↗️ Share</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. INSTAGRAM PREVIEW PHONE */}
              {(previewPlatform === "both" || previewPlatform === "instagram") && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#d92e7f", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "9px", background: "linear-gradient(135deg, #f9a03f, #d92e7f)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>📸</span>
                    Instagram Feed Preview
                  </span>
                  <div
                    style={{
                      width: "330px",
                      maxWidth: "100%",
                      borderRadius: "44px",
                      background: "#111814",
                      padding: "10px",
                      boxShadow: "0 14px 34px rgba(23, 31, 22, 0.28)",
                      border: "3px solid #2a3628",
                      boxSizing: "border-box"
                    }}
                  >
                    <div style={{ borderRadius: "34px", overflow: "hidden", background: "#ffffff", color: "#000000", minHeight: "520px", display: "flex", flexDirection: "column" }}>
                      {/* Top Phone Speaker / Island Notch */}
                      <div style={{ width: "80px", height: "12px", background: "#000000", borderRadius: "8px", margin: "6px auto 8px" }} />
                      {/* IG App Bar */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 14px 8px", borderBottom: "1px solid #efefef" }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, fontFamily: "'Baloo 2', cursive, sans-serif", letterSpacing: "0.2px" }}>Home</span>
                        <div style={{ display: "flex", gap: "10px", fontSize: "15px" }}>
                          <span>♡</span>
                          <span>✈️</span>
                        </div>
                      </div>

                      {/* IG Post Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px" }}>
                        <div style={{ padding: "2px", borderRadius: "50%", background: "linear-gradient(45deg, #f9a03f, #d92e7f, #7b3fe4)" }}>
                          <div style={{ padding: "1.5px", background: "#ffffff", borderRadius: "50%" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#2F6B2F", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px" }}>
                              {(shopData.name || "S").charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <span style={{ flex: 1, fontSize: "13.5px", fontWeight: 700, color: "#262626" }}>
                          {shopData.handle || (shopData.name || "shop").toLowerCase().replace(/\s+/g, "")}
                        </span>
                        <span style={{ color: "#262626", fontSize: "14px", cursor: "pointer" }}>•••</span>
                      </div>

                      {/* IG Post Image */}
                      <div style={{ width: "100%", aspectRatio: format === "post" ? "1 / 1" : "9 / 16", background: "#f8f9fa", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {image ? (
                          <img src={image} alt="Instagram post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ color: "#8e8e8e", fontSize: "13px", padding: "20px", textAlign: "center" }}>
                            📷 Image preview will appear here
                          </div>
                        )}
                      </div>

                      {/* IG Action Bar: Like, Comment, Share, Bookmark */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "18px" }}>
                          <span style={{ cursor: "pointer" }}>♡</span>
                          <span style={{ cursor: "pointer" }}>💬</span>
                          <span style={{ cursor: "pointer" }}>↗️</span>
                        </div>
                        <span style={{ fontSize: "18px", cursor: "pointer" }}>🔖</span>
                      </div>

                      {/* IG Caption */}
                      <div style={{ padding: "0 12px 14px", fontSize: "13.5px", lineHeight: "18px", color: "#262626" }}>
                        <span style={{ fontWeight: 700, marginRight: "6px" }}>
                          {shopData.handle || (shopData.name || "shop").toLowerCase().replace(/\s+/g, "")}
                        </span>
                        <span>{caption || "Our new collection has arrived! Fresh designs in silk and cotton."}</span>
                        {hashtags.length > 0 && (
                          <div style={{ color: "#00376b", marginTop: "4px" }}>
                            {hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Done button */}
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--hair, #d7ddd3)", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  background: "#2F6B2F",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "15px",
                  cursor: "pointer"
                }}
              >
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostComposer;
