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

// SVG icons dictionary
const ICONS = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  drafts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h7M9 17h5" />
    </svg>
  ),
  post: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
  reel: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 9l4 3-4 3z" />
    </svg>
  ),
  story: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="3" width="11" height="18" rx="2" />
      <path d="M4 6v12M21 6v12" />
    </svg>
  ),
  postNow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h12M11 6l6 6-6 6" />
      <path d="M20 4v16" />
    </svg>
  ),
  schedule: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  image: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#566661" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-9 9" />
    </svg>
  ),
  spark: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v4h16v-4" />
    </svg>
  ),
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  undo: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  ),
  wand: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20L16 8M14 4v2M18 6h2M18 10v2M20 4l-1.5 1.5" />
    </svg>
  ),
  chevronDown: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  x: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  ),
  hanger: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7a2 2 0 1 1 2-2c0 1-2 1.5-2 3" />
      <path d="M12 8L3 15h18z" />
    </svg>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  ),
  lamp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15c0 3 3.6 5 8 5s8-2 8-5H4z" />
      <path d="M12 15c-2-2-1.5-4.5 0-7 1.5 2.5 2 5 0 7z" />
    </svg>
  ),
  bag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1 13H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  clapper: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="12" rx="2" />
      <path d="M3 9l2-5 16 2-1.5 3M8 4.5l1.5 4.5M14 5.5l1.5 3.5" />
    </svg>
  ),
  megaphone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10v4h4l8 5V5L7 10z" />
      <path d="M19 9a4 4 0 0 1 0 6" />
    </svg>
  ),
  bulb: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </svg>
  )
};

export const CATEGORIES = [
  {
    id: "collection",
    label: "New Collection",
    icon: "hanger",
    caption: (shop) => "Our new collection has arrived! Fresh designs in silk and cotton, now at " + shop + ". Come and see them first.",
    tags: ["#NewCollection", "#NewArrivals", "#SareeLove", "#ShopLocal"]
  },
  {
    id: "summer",
    label: "Summer Sale",
    icon: "sun",
    caption: (shop) => "Beat the heat with our Summer Sale! Up to 30% off cotton sarees and kurtas at " + shop + ". This week only, on MG Road.",
    tags: ["#SummerSale", "#CottonSarees", "#ShopLocal", "#Bengaluru"]
  },
  {
    id: "spotlight",
    label: "Customer Spotlight",
    icon: "star",
    caption: (shop) => "Thank you, Ananya, for choosing " + shop + " for your special day! You looked stunning in our pure Kanjeevaram silk saree. Tag us to get featured!",
    tags: ["#CustomerLove", "#HappyCustomer", "#EthnicWear", "#ShopLocal"]
  },
  {
    id: "festival",
    label: "Festival Offer",
    icon: "lamp",
    caption: (shop) => "Celebrate the festive season in style! Visit " + shop + " for exclusive festival offers on handloom silk and zari collections.",
    tags: ["#FestivalVibes", "#FestiveOffer", "#HandloomLove", "#Celebration"]
  },
  {
    id: "showcase",
    label: "Product Showcase",
    icon: "bag",
    caption: (shop) => "Spotlight on our handwoven Banarasi and Kanjeevaram weaves. Intricate craftsmanship passed down through generations, now at " + shop + ".",
    tags: ["#SilkSarees", "#PureSilk", "#Handcrafted", "#TraditionalWear"]
  },
  {
    id: "bts",
    label: "Behind the Scenes",
    icon: "clapper",
    caption: (shop) => "A sneak peek behind the counter at " + shop + ": inspecting the new handloom arrivals straight from our master weavers.",
    tags: ["#BehindTheScenes", "#ArtisansOfIndia", "#WeavingStories", "#Handloom"]
  },
  {
    id: "promo",
    label: "Promotion",
    icon: "megaphone",
    caption: (shop) => "Weekend special: Get an exclusive matching blouse piece complimentary with every silk saree purchase at " + shop + ".",
    tags: ["#SpecialOffer", "#WeekendDeal", "#SareeShopping", "#Offers"]
  },
  {
    id: "info",
    label: "Knowledge Info",
    icon: "bulb",
    caption: (shop) => "Did you know? Pure silk sarees should always be kept in breathable muslin cloth, never in plastic bags. Visit " + shop + " for more silk care tips!",
    tags: ["#SareeCare", "#SilkCareTips", "#TextileTips", "#ShopLocal"]
  },
  {
    id: "blank",
    label: "Blank post",
    icon: "plus",
    caption: () => "",
    tags: ["#ShopLocal"]
  }
];

const SAMPLE_LIBRARY = [
  { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80", title: "Silk Saree Elegance" },
  { url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80", title: "Handloom Cotton Drape" },
  { url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80", title: "Festive Zari Border" },
  { url: "https://images.unsplash.com/photo-1610030469668-93510cb2866c?auto=format&fit=crop&w=800&q=80", title: "Bridal Red Kanjeevaram" },
  { url: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80", title: "Artisan Weave Texture" },
  { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80", title: "Store Collection Display" }
];

export function PostComposer({ initParams, onNavigateToTab, businessInfo, onSaveSuccess }) {
  const shopName = businessInfo?.name || SHOP.name || "SriKrish";
  const shopInitial = shopName.trim().charAt(0).toUpperCase() || "S";

  // Formats: post (1:1), reel (9:16), story (9:16)
  const [format, setFormat] = useState("post");

  // When: "now" or "schedule"
  const [when, setWhen] = useState("schedule");

  // Default date: tomorrow
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [scheduledDate, setScheduledDate] = useState(getTomorrowStr());
  const [scheduledTime, setScheduledTime] = useState("18:00");

  // Post to channels
  const [channels, setChannels] = useState({ facebook: true, instagram: true });

  // Platform tab for editing: "all", "facebook", "instagram"
  const [activeTab, setActiveTab] = useState("all");

  // Selected Category
  const [selectedCatId, setSelectedCatId] = useState("collection");
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  // Post content
  const initialCategory = CATEGORIES.find(c => c.id === "collection") || CATEGORIES[0];
  const [caption, setCaption] = useState(initialCategory.caption(shopName));
  const [hashtags, setHashtags] = useState([...initialCategory.tags]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);

  // Undo history for post type changes
  const [undoState, setUndoState] = useState(null);
  const [showBanner, setShowBanner] = useState(true);

  // Media
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Drafts drawer & list
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [draftsList, setDraftsList] = useState([]);
  const [currentDraftId, setCurrentDraftId] = useState(null);

  // Saving / Publishing status
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [previewPlatform, setPreviewPlatform] = useState(null); // null, "facebook", "instagram"

  const fileInputRef = useRef(null);

  const getSavedTenantId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tenant_id") || "1";
    }
    return "1";
  };

  // Fetch drafts
  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/campaign/drafts?tenant_id=" + getSavedTenantId());
      if (res.ok) {
        const data = await res.json();
        setDraftsList(Array.isArray(data) ? data : data.drafts || []);
      }
    } catch (e) {
      console.warn("Could not fetch drafts:", e);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  // Handle initParams
  useEffect(() => {
    if (!initParams) return;

    if (initParams.mode === "type" && initParams.category) {
      const cat = CATEGORIES.find(c => c.id === initParams.category) || CATEGORIES[0];
      setSelectedCatId(cat.id);
      setCaption(cat.caption(shopName));
      setHashtags([...cat.tags]);
      setShowBanner(true);
      setUndoState(null);
    } else if (initParams.mode === "calendar_date" && initParams.date) {
      setWhen("schedule");
      setScheduledDate(initParams.date);
    } else if (initParams.mode === "draft" && initParams.draft) {
      loadDraftData(initParams.draft);
    } else if (initParams.mode === "blank") {
      setSelectedCatId("blank");
      setCaption("");
      setHashtags(["#ShopLocal"]);
      setShowBanner(false);
    }
  }, [initParams]);

  // Handle category switch
  const handleSelectCategory = (catId) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (!cat) return;

    // Save undo state
    setUndoState({
      catId: selectedCatId,
      caption: caption,
      hashtags: [...hashtags]
    });

    setSelectedCatId(catId);
    setCaption(cat.caption(shopName));
    setHashtags([...cat.tags]);
    setShowBanner(true);
    setIsCatDropdownOpen(false);
  };

  const handleUndo = () => {
    if (!undoState) return;
    setSelectedCatId(undoState.catId);
    setCaption(undoState.caption);
    setHashtags([...undoState.hashtags]);
    setUndoState(null);
    setShowBanner(false);
  };

  // Tone transformations
  const handleToneChange = (tone) => {
    if (!caption) return;
    let newCap = caption;
    if (tone === "casual") {
      newCap = caption.replace(/^Our /i, "Hey everyone! Our ")
        .replace(/Come and see them first\./i, "Drop by and check them out! \ud83d\ude0a")
        .replace(/Beat the heat/i, "Beat the heat \u2600\ufe0f");
    } else if (tone === "formal") {
      newCap = caption.replace(/^Hey everyone! /i, "")
        .replace(/Drop by and check them out! \ud83d\ude0a/i, "We invite you to visit our store to explore the collection.")
        .replace(/\ud83d\ude0a|\u2600\ufe0f/g, "");
    } else if (tone === "shorten") {
      const sentences = caption.split(/(?<=[.!?])\s+/);
      newCap = sentences.slice(0, 1).join(" ");
    } else if (tone === "elaborate") {
      if (!caption.includes("Visit us on MG Road")) {
        newCap = caption.trim() + " Visit us on MG Road, Bengaluru or message us directly on WhatsApp to place your orders.";
      }
    }
    setCaption(newCap);
  };

  // Add / remove hashtags
  const handleAddHashtag = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTagInput.trim()) return;
    let tag = newTagInput.trim();
    if (!tag.startsWith("#")) tag = "#" + tag;
    tag = tag.replace(/\s+/g, "");
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setNewTagInput("");
    setShowAddTag(false);
  };

  const handleRemoveHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter(t => t !== tagToRemove));
  };

  // File upload
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI image generation
  const handleGenerateAI = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const randomImg = SAMPLE_LIBRARY[Math.floor(Math.random() * SAMPLE_LIBRARY.length)].url;
      setMediaUrl(randomImg);
      setIsGeneratingAI(false);
      setStatusMessage({ type: "success", text: "AI generated a fresh showcase image!" });
      setTimeout(() => setStatusMessage(null), 3000);
    }, 900);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      const tenantId = getSavedTenantId();
      const payload = {
        id: currentDraftId,
        category: selectedCatId,
        format,
        caption,
        hashtags,
        media_url: mediaUrl,
        channels,
        when,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime
      };

      const res = await fetch("/api/campaign/draft?tenant_id=" + tenantId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        if (result.id) setCurrentDraftId(result.id);
        setStatusMessage({ type: "success", text: "Draft saved successfully!" });
        fetchDrafts();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setStatusMessage({ type: "success", text: "Draft saved locally." });
      }
    } catch (e) {
      setStatusMessage({ type: "success", text: "Draft saved locally." });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Load draft
  const loadDraftData = (draft) => {
    if (!draft) return;
    setCurrentDraftId(draft.id || null);
    if (draft.category) setSelectedCatId(draft.category);
    if (draft.format) setFormat(draft.format);
    if (draft.caption !== undefined) setCaption(draft.caption);
    if (draft.hashtags) setHashtags(Array.isArray(draft.hashtags) ? draft.hashtags : []);
    if (draft.media_url) setMediaUrl(draft.media_url);
    if (draft.channels) setChannels(draft.channels);
    if (draft.when) setWhen(draft.when);
    if (draft.scheduled_date) setScheduledDate(draft.scheduled_date);
    if (draft.scheduled_time) setScheduledTime(draft.scheduled_time);
    setIsDraftsOpen(false);
    setShowBanner(false);
  };

  // Schedule or Publish
  const handlePublish = async () => {
    if (!channels.facebook && !channels.instagram) {
      setStatusMessage({ type: "error", text: "Please select at least one platform (Facebook or Instagram)." });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setIsPublishing(true);
    try {
      const tenantId = getSavedTenantId();
      const payload = {
        category: selectedCatId,
        format,
        caption,
        hashtags: hashtags.join(" "),
        media_url: mediaUrl,
        platforms: {
          facebook: !!channels.facebook,
          instagram: !!channels.instagram
        },
        is_scheduled: when === "schedule",
        scheduled_date: when === "schedule" ? scheduledDate : null,
        scheduled_time: when === "schedule" ? scheduledTime : null
      };

      const res = await fetch("/api/campaign/publish?tenant_id=" + tenantId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: when === "schedule" ? "Post scheduled successfully!" : "Post published successfully!"
        });
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => {
          if (onNavigateToTab) onNavigateToTab("calendar");
        }, 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({
          type: "error",
          text: err.detail || "Failed to publish post. Please verify platform connection."
        });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (e) {
      setStatusMessage({ type: "error", text: "Network error occurred." });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsPublishing(false);
    }
  };

  // Formatted date string for preview
  const formattedScheduledText = useMemo(() => {
    if (when === "now") return "Just now";
    try {
      const parts = scheduledDate.split("-");
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dayStr = dayNames[d.getDay()];
      const monthStr = monthNames[d.getMonth()];
      
      const tparts = (scheduledTime || "18:00").split(":");
      const hours = parseInt(tparts[0], 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedH = hours % 12 || 12;
      return dayStr + " " + day + " " + monthStr + ", " + formattedH + ":" + tparts[1] + " " + ampm;
    } catch (err) {
      return scheduledDate + ", " + scheduledTime;
    }
  }, [when, scheduledDate, scheduledTime]);

  const activeCat = CATEGORIES.find(c => c.id === selectedCatId) || CATEGORIES[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "#f4f6f5",
        color: "#16211f",
        fontFamily: "'Mukta', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Hidden File Input for Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* Toast / Status banner */}
      {statusMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 99999,
            padding: "12px 20px",
            borderRadius: "12px",
            background: statusMessage.type === "error" ? "#b42318" : "#0d6b61",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "15px",
            boxShadow: "0 8px 24px rgba(22, 33, 31, 0.16)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {statusMessage.type === "error" ? "⚠️" : "✓"} {statusMessage.text}
        </div>
      )}

      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "12px",
          flexWrap: "wrap",
          minHeight: "64px",
          padding: "0 24px",
          background: "#ffffff",
          borderBottom: "1px solid #d6dedb"
        }}
      >
        <button
          type="button"
          onClick={() => onNavigateToTab && onNavigateToTab("home")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "44px",
            fontWeight: 600,
            color: "#16211f",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          {ICONS.home} Home
        </button>

        <h1
          style={{
            margin: "0 0 0 8px",
            fontFamily: "'Baloo 2', 'Mukta', sans-serif",
            fontSize: "24px",
            lineHeight: "30px",
            fontWeight: 700
          }}
        >
          New post
        </h1>

        <span style={{ flex: 1 }} />

        {/* Drafts button */}
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
            color: "#16211f",
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
              background: "#e9eeec",
              color: "#566661",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {draftsList.length}
          </span>
        </button>

        {/* Save Draft */}
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
            background: "#ffffff",
            color: "#16211f",
            border: "1px solid #7a8b86"
          }}
        >
          Save draft
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          padding: "32px 24px",
          justifyContent: "center",
          alignItems: "flex-start"
        }}
      >
        {/* Left Column: Set up Panel (340px) */}
        <div style={{ flex: "0 1 340px", minWidth: "280px" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #d6dedb",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "'Baloo 2', 'Mukta', sans-serif",
                fontSize: "21px",
                lineHeight: "28px",
                fontWeight: 600
              }}
            >
              Set up
            </h2>

            {/* Format: Post, Reel, Story */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#566661" }}>Format</span>
              <div
                role="radiogroup"
                style={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  padding: "4px",
                  borderRadius: "12px",
                  background: "#e9eeec"
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
                        background: isChecked ? "#ffffff" : "transparent",
                        color: isChecked ? "#16211f" : "#566661",
                        boxShadow: isChecked ? "0 1px 2px rgba(22,33,31,.12)" : "none"
                      }}
                    >
                      <span style={{ color: isChecked ? "#0d6b61" : "#566661" }}>{fmt.icon}</span>
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* When: Post now vs Schedule */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "16px", borderTop: "1px solid #d6dedb" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#566661" }}>When</span>
              <div
                role="radiogroup"
                style={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  padding: "4px",
                  borderRadius: "12px",
                  background: "#e9eeec"
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
                        background: isChecked ? "#ffffff" : "transparent",
                        color: isChecked ? "#16211f" : "#566661",
                        boxShadow: isChecked ? "0 1px 2px rgba(22,33,31,.12)" : "none"
                      }}
                    >
                      <span style={{ color: isChecked ? "#0d6b61" : "#566661" }}>{w.icon}</span>
                      {w.label}
                    </button>
                  );
                })}
              </div>

              {/* Date & Time pickers (only if schedule) */}
              {when === "schedule" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: "44px",
                      padding: "0 12px",
                      border: "1px solid #7a8b86",
                      borderRadius: "12px",
                      background: "#ffffff",
                      fontSize: "15px",
                      boxSizing: "border-box",
                      minWidth: "140px",
                      color: "#16211f"
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
                      border: "1px solid #7a8b86",
                      borderRadius: "12px",
                      background: "#ffffff",
                      fontSize: "15px",
                      boxSizing: "border-box",
                      minWidth: "100px",
                      color: "#16211f"
                    }}
                  />
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: "20px", color: "#566661" }}>IST</p>
                </div>
              )}
            </div>

            {/* Post to: Facebook & Instagram */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "16px", borderTop: "1px solid #d6dedb" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#566661" }}>Post to</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "8px" }}>
                {/* Facebook switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={channels.facebook}
                  onClick={() => setChannels({ ...channels, facebook: !channels.facebook })}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "36px",
                    padding: "0 10px 0 6px",
                    borderRadius: "999px",
                    border: channels.facebook ? "1px solid #0d6b61" : "1px solid #d6dedb",
                    background: channels.facebook ? "#e2f0ed" : "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: channels.facebook ? "#16211f" : "#566661",
                    cursor: "pointer"
                  }}
                >
                  <span
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
                    <span style={{ color: "#0d6b61" }}>{ICONS.check}</span>
                  )}
                </button>

                {/* Instagram switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={channels.instagram}
                  onClick={() => setChannels({ ...channels, instagram: !channels.instagram })}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "36px",
                    padding: "0 10px 0 6px",
                    borderRadius: "999px",
                    border: channels.instagram ? "1px solid #0d6b61" : "1px solid #d6dedb",
                    background: channels.instagram ? "#e2f0ed" : "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: channels.instagram ? "#16211f" : "#566661",
                    cursor: "pointer"
                  }}
                >
                  <span
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
                    <span style={{ color: "#0d6b61" }}>{ICONS.check}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
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
                width: "100%",
                background: "#0d6b61",
                color: "#ffffff",
                border: "1px solid #0d6b61",
                opacity: isPublishing ? 0.7 : 1,
                marginTop: "8px"
              }}
            >
              {when === "schedule" ? ICONS.schedule : ICONS.postNow}
              {isPublishing
                ? "Processing..."
                : when === "schedule"
                ? "Schedule post"
                : "Publish now"}
            </button>
          </div>
        </div>

        {/* Right Column: Post Editor & Preview (820px) */}
        <main style={{ flex: "0 1 820px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Platform Switcher Tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "4px", borderBottom: "1px solid #d6dedb" }}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                padding: "0 12px",
                border: "none",
                borderBottom: activeTab === "all" ? "2px solid #0d6b61" : "2px solid transparent",
                background: "transparent",
                fontSize: "15px",
                fontWeight: 600,
                color: activeTab === "all" ? "#0d6b61" : "#566661",
                cursor: "pointer"
              }}
            >
              All platforms
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "facebook"}
              onClick={() => setActiveTab("facebook")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                padding: "0 12px",
                border: "none",
                borderBottom: activeTab === "facebook" ? "2px solid #0d6b61" : "2px solid transparent",
                background: "transparent",
                fontSize: "15px",
                fontWeight: 600,
                color: activeTab === "facebook" ? "#0d6b61" : "#566661",
                cursor: "pointer"
              }}
            >
              <span
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
              aria-selected={activeTab === "instagram"}
              onClick={() => setActiveTab("instagram")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                padding: "0 12px",
                border: "none",
                borderBottom: activeTab === "instagram" ? "2px solid #0d6b61" : "2px solid transparent",
                background: "transparent",
                fontSize: "15px",
                fontWeight: 600,
                color: activeTab === "instagram" ? "#0d6b61" : "#566661",
                cursor: "pointer"
              }}
            >
              <span
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

          <p style={{ margin: 0, fontSize: "14px", lineHeight: "20px", color: "#566661" }}>
            Edits here go to every platform. Pick Facebook or Instagram to change just that one.
          </p>

          {/* The Post Editor Card (The post IS the editor) */}
          <article
            style={{
              width: "100%",
              background: "#ffffff",
              border: "1px solid #d6dedb",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box"
            }}
          >
            {/* Header: Avatar, Name, Scheduled Time */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "10px" }}>
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#0d6b61",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "16px"
                }}
              >
                {shopInitial}
              </span>
              <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <b style={{ fontSize: "16px", color: "#16211f" }}>{shopName}</b>
                <span style={{ fontSize: "13px", color: "#566661" }}>{formattedScheduledText}</span>
              </span>
            </div>

            {/* Media Box & Caption Area */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
              {/* Media Container (300px min 240px) */}
              <div style={{ flex: "0 1 300px", minWidth: "240px" }}>
                {mediaUrl ? (
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #d6dedb",
                      aspectRatio: format === "post" ? "1 / 1" : "9 / 16",
                      background: "#16211f",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <img
                      src={mediaUrl}
                      alt="Post visual"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {/* Change / Remove overlay */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        right: "8px",
                        display: "flex",
                        gap: "6px"
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "rgba(22, 33, 31, 0.75)",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaUrl(null)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "rgba(180, 35, 24, 0.8)",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    role="group"
                    aria-label="No image yet"
                    style={{
                      borderRadius: "12px",
                      border: "2px dashed #7a8b86",
                      background: "#f4f6f5",
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
                    <b style={{ fontSize: "15px", color: "#16211f" }}>Add your image</b>
                    <span style={{ fontSize: "13px", color: "#566661", maxWidth: "260px" }}>
                      The image is what people notice first.
                    </span>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "4px" }}>
                      {/* Generate with AI button */}
                      <button
                        type="button"
                        disabled={isGeneratingAI}
                        onClick={handleGenerateAI}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          minHeight: "44px",
                          padding: "0 20px",
                          borderRadius: "12px",
                          fontSize: "15px",
                          fontWeight: 600,
                          boxSizing: "border-box",
                          cursor: isGeneratingAI ? "wait" : "pointer",
                          width: "100%",
                          background: "#ffffff",
                          color: "#16211f",
                          border: "1px solid #7a8b86"
                        }}
                      >
                        <span style={{ color: "#0d6b61" }}>{ICONS.spark}</span>
                        {isGeneratingAI ? "Generating..." : "Generate with AI"}
                      </button>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {/* Upload button */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            minHeight: "44px",
                            padding: "0 8px",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: 600,
                            boxSizing: "border-box",
                            cursor: "pointer",
                            width: "100%",
                            background: "#ffffff",
                            color: "#16211f",
                            border: "1px solid #7a8b86"
                          }}
                        >
                          {ICONS.upload} Upload
                        </button>

                        {/* Library button */}
                        <button
                          type="button"
                          onClick={() => setIsLibraryOpen(true)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            minHeight: "44px",
                            padding: "0 8px",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: 600,
                            boxSizing: "border-box",
                            cursor: "pointer",
                            width: "100%",
                            background: "#ffffff",
                            color: "#16211f",
                            border: "1px solid #7a8b86"
                          }}
                        >
                          {ICONS.grid} Library
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side of Editor: Post type, Caption, Tones, Hashtags */}
              <div style={{ flex: "1 1 340px", minWidth: "260px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Post Type Selector */}
                <div style={{ position: "relative" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#566661", display: "block", marginBottom: "4px" }}>
                    Post type
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "44px",
                      padding: "0 14px",
                      borderRadius: "12px",
                      border: "1px solid #7a8b86",
                      background: "#ffffff",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#16211f",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left"
                    }}
                  >
                    <span style={{ color: "#0d6b61" }}>{ICONS[activeCat.icon] || ICONS.hanger}</span>
                    <span style={{ flex: 1 }}>{activeCat.label}</span>
                    <span style={{ color: "#566661" }}>{ICONS.chevronDown}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {isCatDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        marginTop: "4px",
                        background: "#ffffff",
                        border: "1px solid #d6dedb",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(22, 33, 31, 0.12)",
                        maxHeight: "280px",
                        overflowY: "auto",
                        padding: "6px"
                      }}
                    >
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            width: "100%",
                            padding: "10px 12px",
                            border: "none",
                            borderRadius: "8px",
                            background: selectedCatId === cat.id ? "#e2f0ed" : "transparent",
                            color: selectedCatId === cat.id ? "#0d6b61" : "#16211f",
                            fontWeight: selectedCatId === cat.id ? 700 : 500,
                            fontSize: "14px",
                            textAlign: "left",
                            cursor: "pointer"
                          }}
                        >
                          <span style={{ color: selectedCatId === cat.id ? "#0d6b61" : "#566661" }}>
                            {ICONS[cat.icon] || ICONS.hanger}
                          </span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Banner: Caption and hashtags updated */}
                {showBanner && selectedCatId !== "blank" && (
                  <div
                    role="status"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      background: "#fdf1d8",
                      color: "#7a4f00",
                      fontSize: "14px",
                      lineHeight: "20px"
                    }}
                  >
                    <span style={{ color: "#7a4f00" }}>{ICONS.spark}</span>
                    <span style={{ flex: 1, minWidth: "180px" }}>
                      Caption and hashtags updated for <b>{activeCat.label}</b>.
                    </span>
                    {undoState && (
                      <button
                        type="button"
                        onClick={handleUndo}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 600,
                          color: "#7a4f00",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        {ICONS.undo} Undo
                      </button>
                    )}
                  </div>
                )}

                {/* Caption Textarea (The Post Caption itself) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your post caption..."
                    rows={4}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: "'Mukta', sans-serif",
                      fontSize: "17px",
                      lineHeight: "26px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: "1px solid #d6dedb",
                      outline: "none",
                      color: "#16211f",
                      resize: "vertical",
                      background: "#ffffff"
                    }}
                    onFocus={(e) => { e.target.style.outline = "2px solid #0d6b61"; }}
                    onBlur={(e) => { e.target.style.outline = "none"; }}
                  />

                  {/* AI Tone Tools */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "#566661" }}>
                      {ICONS.wand} Tone
                    </span>
                    {["Casual", "Formal", "Shorten", "Elaborate"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToneChange(t.toLowerCase())}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          minHeight: "34px",
                          padding: "0 12px",
                          borderRadius: "999px",
                          border: "1px solid #7a8b86",
                          background: "#ffffff",
                          color: "#16211f",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hashtags */}
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#0d6b61",
                        fontWeight: 600,
                        fontSize: "15px",
                        background: "#e2f0ed",
                        padding: "2px 8px",
                        borderRadius: "6px"
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveHashtag(tag)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#566661",
                          fontSize: "14px",
                          padding: "0 2px"
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {showAddTag ? (
                    <form onSubmit={handleAddHashtag} style={{ display: "inline-flex", gap: "4px" }}>
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="#tag"
                        autoFocus
                        style={{
                          width: "90px",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          border: "1px solid #0d6b61",
                          fontSize: "14px"
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "#0d6b61",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Add
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddTag(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0d6b61",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      {ICONS.plus} Add
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer row: Character count & Platform preview switch */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                paddingTop: "12px",
                borderTop: "1px solid #d6dedb"
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", lineHeight: "20px", color: "#566661" }}>
                {caption.length} / 2,200 characters
              </p>

              <button
                type="button"
                onClick={() => setPreviewPlatform(previewPlatform ? null : "facebook")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0d6b61",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {ICONS.eye} {previewPlatform ? "Hide live preview" : "See it on Facebook or Instagram"}
              </button>
            </div>

            {/* Expanded realistic social preview */}
            {previewPlatform && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  background: "#f4f6f5",
                  borderRadius: "12px",
                  border: "1px solid #d6dedb"
                }}
              >
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform("facebook")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: previewPlatform === "facebook" ? "#1877f2" : "#ffffff",
                      color: previewPlatform === "facebook" ? "#ffffff" : "#16211f",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Facebook Feed View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform("instagram")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: previewPlatform === "instagram" ? "linear-gradient(135deg,#f9a03f,#d92e7f)" : "#ffffff",
                      color: previewPlatform === "instagram" ? "#ffffff" : "#16211f",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Instagram Feed View
                  </button>
                </div>

                <div
                  style={{
                    maxWidth: "440px",
                    margin: "0 auto",
                    background: "#ffffff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0d6b61",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700
                      }}
                    >
                      {shopInitial}
                    </div>
                    <div>
                      <b style={{ fontSize: "14px", display: "block" }}>{shopName}</b>
                      <span style={{ fontSize: "12px", color: "#666" }}>{formattedScheduledText}</span>
                    </div>
                  </div>
                  {mediaUrl && (
                    <img
                      src={mediaUrl}
                      alt="preview"
                      style={{ width: "100%", maxHeight: "360px", objectFit: "cover" }}
                    />
                  )}
                  <div style={{ padding: "12px" }}>
                    <p style={{ margin: "0 0 6px 0", fontSize: "14px", lineHeight: "20px" }}>{caption}</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#0d6b61" }}>{hashtags.join(" ")}</p>
                  </div>
                </div>
              </div>
            )}
          </article>
        </main>
      </div>

      {/* Library Modal */}
      {isLibraryOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "rgba(22, 33, 31, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Choose from Image Library</h3>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#566661" }}
              >
                {ICONS.x}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {SAMPLE_LIBRARY.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMediaUrl(item.url);
                    setIsLibraryOpen(false);
                  }}
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "2px solid transparent",
                    padding: 0,
                    cursor: "pointer",
                    background: "#f4f6f5"
                  }}
                >
                  <img src={item.url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drafts Drawer */}
      {isDraftsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "rgba(22, 33, 31, 0.4)",
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={() => setIsDraftsOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              height: "100%",
              background: "#ffffff",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #d6dedb"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Drafts</h3>
                <span style={{ fontSize: "13px", color: "#566661" }}>
                  Posts you haven't scheduled or published yet
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftsOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#566661" }}
              >
                {ICONS.x}
              </button>
            </div>

            {/* Drafts list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {draftsList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#566661" }}>
                  <p style={{ fontWeight: 600, fontSize: "16px", color: "#16211f" }}>No drafts saved yet</p>
                  <p style={{ fontSize: "14px" }}>Hit "Save draft" anytime while composing to store your progress.</p>
                </div>
              ) : (
                draftsList.map((d, i) => (
                  <div
                    key={d.id || i}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid #d6dedb",
                      background: "#f4f6f5",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <b style={{ fontSize: "15px" }}>{d.category || "Post draft"}</b>
                      <span style={{ fontSize: "12px", color: "#566661" }}>
                        {d.format || "post"} • {d.updated_at || "Recent"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", color: "#16211f", maxHeight: "40px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {d.caption || "No caption"}
                    </p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        type="button"
                        onClick={() => loadDraftData(d)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "#0d6b61",
                          color: "#ffffff",
                          border: "none",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Keep editing
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom button */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #d6dedb" }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedCatId("blank");
                  setCaption("");
                  setHashtags(["#ShopLocal"]);
                  setMediaUrl(null);
                  setCurrentDraftId(null);
                  setIsDraftsOpen(false);
                }}
                style={{
                  width: "100%",
                  minHeight: "44px",
                  borderRadius: "12px",
                  background: "#0d6b61",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "15px",
                  cursor: "pointer"
                }}
              >
                + Start a new post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
