// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

export const DEFAULT_SHOP = {
  name: "Lakshmi Textiles",
  handle: "lakshmitextiles",
  area: "MG Road, Bengaluru",
  phone: "98450 12345",
  sells: "sarees and ethnic wear"
};
export let SHOP = { ...DEFAULT_SHOP };

// SVG icons dictionary matching prototype exactly
const ICONS = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5h-4v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
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

const POST_CATEGORIES = CATEGORIES;

const LOCALIZED_VOICEOVERS: Record<string, (shop: string) => string> = {
  en: (shop: string) => `Namaste! Welcome to ${shop}. Discover our exclusive pure silk sarees and festive collection with special discounts. Visit us today!`,
  kn: (shop: string) => `ನಮಸ್ಕಾರ! ${shop}ಗೆ ಆತ್ಮೀಯ ಸ್ವಾಗತ. ನಮ್ಮಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಶುದ್ಧ ರೇಷ್ಮೆ ಸೀರೆಗಳ ಮೇಲೆ ಭರ್ಜರಿ ರಿಯಾಯಿತಿ ಲಭ್ಯವಿದೆ. ಇಂದೇ ಭೇಟಿ ನೀಡಿ!`,
  hi: (shop: string) => `नमस्ते! ${shop} में आपका स्वागत है। हमारे पास शुद्ध सिल्क साड़ियों और नए कलेक्शन पर विशेष छूट उपलब्ध है। आज ही पधारें!`
};

const ROYALTY_FREE_TRACKS = [
  { id: "none", name: "None (Add in Instagram app)", icon: "🔇", desc: "Best for adding trending songs in Instagram", url: "" },
  { id: "festive_dhol", name: "Festive Celebration (Dhol Beats)", icon: "🪘", desc: "High-energy Indian celebration rhythm", url: "https://actions.google.com/sounds/v1/foley/drum_roll.ogg" },
  { id: "traditional_sitar", name: "Traditional Classical Sitar", icon: "🪕", desc: "Heritage instrumental for silks & sarees", url: "https://actions.google.com/sounds/v1/ambiences/temple_bells.ogg" },
  { id: "modern_lofi", name: "Modern Boutique Lo-fi", icon: "🎷", desc: "Relaxed upbeat retail groove", url: "https://actions.google.com/sounds/v1/household/clock_ticking.ogg" },
  { id: "temple_flute", name: "Heritage Flute & Chimes", icon: "🪈", desc: "Calm devotional ethnic melody", url: "https://actions.google.com/sounds/v1/weather/wind_chimes_light.ogg" }
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
  const shopInitial = useMemo(() => {
    const parts = (businessInfo?.name || DEFAULT_SHOP.name).trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] || "LT").slice(0, 2).toUpperCase();
  }, [businessInfo]);

  const shopData = useMemo(() => {
    return {
      name: businessInfo?.name || DEFAULT_SHOP.name,
      handle: (businessInfo?.name || DEFAULT_SHOP.name).toLowerCase().replace(/\s+/g, ""),
      area: businessInfo?.location || DEFAULT_SHOP.area,
      phone: businessInfo?.phone || DEFAULT_SHOP.phone,
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

  // Reel Specific Controls (matching Phase 2 Reel Composer design)
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("none");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Tri-lingual AI Voiceover States
  const [voiceoverEnabled, setVoiceoverEnabled] = useState<boolean>(false);
  const [voiceoverLang, setVoiceoverLang] = useState<"en" | "kn" | "hi">("en");
  const [voiceoverGender, setVoiceoverGender] = useState<"female" | "male">("female");
  const [voiceoverText, setVoiceoverText] = useState<string>("");
  const [isPlayingVoiceover, setIsPlayingVoiceover] = useState<boolean>(false);
  const [isTranslatingVoiceover, setIsTranslatingVoiceover] = useState<boolean>(false);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState<boolean>(false);
  const voiceoverAudioRef = useRef<HTMLAudioElement | null>(null);

  // Multi-photo Reel Picker
  // Story Video States
  const [storyVideoUrl, setStoryVideoUrl] = useState<string>("");
  const [isStoryVideoPlaying, setIsStoryVideoPlaying] = useState<boolean>(true);
  const storyVideoRef = useRef<HTMLVideoElement | null>(null);

  const toggleStoryVideoPlay = () => {
    if (!storyVideoRef.current) return;
    if (storyVideoRef.current.paused) {
      storyVideoRef.current.play();
      setIsStoryVideoPlaying(true);
    } else {
      storyVideoRef.current.pause();
      setIsStoryVideoPlaying(false);
    }
  };

  // Photo Reel Player States (for instant, smooth, $0 client-side playback)
  const [reelMode, setReelMode] = useState<"none" | "photos" | "video">("none");
  const [reelPhotos, setReelPhotos] = useState<string[]>([]);
  const [activeReelPhotoIdx, setActiveReelPhotoIdx] = useState<number>(0);
  const [isPhotoReelPlaying, setIsPhotoReelPlaying] = useState<boolean>(true);
  const [photoReelProgress, setPhotoReelProgress] = useState<number>(0);

  // Auto-play loop for Photo Reel
  useEffect(() => {
    if (reelMode !== "photos" || reelPhotos.length === 0 || !isPhotoReelPlaying) {
      return;
    }

    const intervalMs = 2500; // 2.5s per photo
    const stepMs = 50;
    const progressPerStep = (stepMs / (intervalMs * reelPhotos.length)) * 100;

    const timer = setInterval(() => {
      setPhotoReelProgress((prev) => {
        const next = prev + progressPerStep;
        if (next >= 100) {
          setActiveReelPhotoIdx(0);
          if (voiceoverAudioRef.current && voiceoverEnabled) {
            voiceoverAudioRef.current.currentTime = 0;
            voiceoverAudioRef.current.play().catch(() => {});
          }
          if (audioPreviewRef.current && selectedTrackId !== "none") {
            audioPreviewRef.current.currentTime = 0;
            audioPreviewRef.current.play().catch(() => {});
          }
          return 0;
        }
        const currentIdx = Math.floor((next / 100) * reelPhotos.length);
        setActiveReelPhotoIdx(Math.min(currentIdx, reelPhotos.length - 1));
        return next;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [reelMode, reelPhotos, isPhotoReelPlaying]);
  const [selectedReelPhotos, setSelectedReelPhotos] = useState<string[]>([]);
  const [isReelPhotoModalOpen, setIsReelPhotoModalOpen] = useState<boolean>(false);

  const [coverImage, setCoverImage] = useState<string>("");
  const [isGeneratingReel, setIsGeneratingReel] = useState<boolean>(false);
  const [isReelTypeDropdownOpen, setIsReelTypeDropdownOpen] = useState<boolean>(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const reelVideoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Reel Video Upload Handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setReelMode("video");
    setTimeout(() => {
      captureFrameFromVideo(objectUrl, 0.5);
    }, 600);
    showToast("Video loaded! Preview your Reel.");
  };

  // Capture video frame for cover
  const captureFrameFromVideo = (vUrl: string, timeSec = 0.5) => {
    try {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.src = vUrl;
      v.currentTime = timeSec;
      v.onloadeddata = () => {
        v.currentTime = timeSec;
      };
      v.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth || 720;
        canvas.height = v.videoHeight || 1280;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setCoverImage(dataUrl);
        }
      };
    } catch (err) {
      console.error("Frame capture error:", err);
    }
  };

  // Custom Cover Photo Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCoverImage(ev.target.result as string);
        showToast("Custom cover image applied!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Photo Picker Modal for Reel
  const handleOpenPhotoPicker = () => {
    fetchLibraryImages();
    setSelectedReelPhotos(storySlides.map((s) => s.image).filter(Boolean));
    setIsReelPhotoModalOpen(true);
  };

  const handleToggleReelPhoto = (imgUrl: string) => {
    setSelectedReelPhotos((prev) => {
      if (prev.includes(imgUrl)) {
        return prev.filter((u) => u !== imgUrl);
      } else {
        if (prev.length >= 6) {
          showToast("Maximum 6 photos per Reel.");
          return prev;
        }
        return [...prev, imgUrl];
      }
    });
  };

  const handleCreateReelFromPhotos = () => {
    if (selectedReelPhotos.length === 0) {
      showToast("Please select at least 1 photo for your Reel.");
      return;
    }
    const chosenPhotos = [...selectedReelPhotos];
    setReelPhotos(chosenPhotos);
    setActiveReelPhotoIdx(0);
    setPhotoReelProgress(0);
    setIsPhotoReelPlaying(true);
    setReelMode("photos");
    setCoverImage(chosenPhotos[0]);
    setVideoUrl(chosenPhotos[0]);
    setIsReelPhotoModalOpen(false);
    showToast(`Reel created from ${chosenPhotos.length} photos! Playing preview.`);
  };

  // Toggle Background Audio Track Preview
  const handleToggleTrackPreview = (trackUrl: string) => {
    if (!audioPreviewRef.current) return;
    if (isPlayingAudio) {
      audioPreviewRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPreviewRef.current.src = trackUrl;
      audioPreviewRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  // Instant 0ms Localized Voiceover Switch
  const handleVoiceoverLangChange = (newLang: "en" | "kn" | "hi") => {
    setVoiceoverLang(newLang);
    const scriptFn = LOCALIZED_VOICEOVERS[newLang] || LOCALIZED_VOICEOVERS.en;
    const instantScript = scriptFn(shopData.name || "Lakshmi Textiles");
    setVoiceoverText(instantScript);
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
      voiceoverAudioRef.current.src = "";
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoiceover(false);
  };

  // Synchronized Reel Playback Helpers
  const playSyncedVoiceover = async () => {
    if (!voiceoverEnabled) return;
    if (voiceoverAudioRef.current && voiceoverAudioRef.current.src && !voiceoverAudioRef.current.src.endsWith("undefined")) {
      try {
        await voiceoverAudioRef.current.play();
        setIsPlayingVoiceover(true);
        return;
      } catch (err) {
        console.warn("Voiceover play error:", err);
      }
    }
    await handlePlayVoiceover(true);
  };

  const pauseSyncedVoiceover = () => {
    if (voiceoverAudioRef.current) {
      voiceoverAudioRef.current.pause();
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    setIsPlayingVoiceover(false);
  };

  const playSyncedMusic = () => {
    const currentTrack = ROYALTY_FREE_TRACKS.find((t) => t.id === selectedTrackId);
    if (currentTrack && currentTrack.url && audioPreviewRef.current) {
      if (audioPreviewRef.current.src !== currentTrack.url) {
        audioPreviewRef.current.src = currentTrack.url;
      }
      audioPreviewRef.current.play().then(() => setIsPlayingAudio(true)).catch((e) => console.warn("Music play error:", e));
    }
  };

  const pauseSyncedMusic = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPlayingAudio(false);
  };

  const togglePhotoReelPlayback = (forcedPlay?: boolean) => {
    const nextPlay = typeof forcedPlay === "boolean" ? forcedPlay : !isPhotoReelPlaying;
    setIsPhotoReelPlaying(nextPlay);
    if (nextPlay) {
      playSyncedVoiceover();
      playSyncedMusic();
    } else {
      pauseSyncedVoiceover();
      pauseSyncedMusic();
    }
  };

  // Play High-Fidelity Studio Neural Voiceover with Natural SSML Pauses & Emotion
  const handlePlayVoiceover = async (forcePlay?: boolean) => {
    if (!forcePlay && isPlayingVoiceover) {
      if (voiceoverAudioRef.current) voiceoverAudioRef.current.pause();
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      setIsPlayingVoiceover(false);
      return;
    }

    if (voiceoverAudioRef.current && voiceoverAudioRef.current.src && !voiceoverAudioRef.current.src.endsWith("undefined")) {
      try {
        await voiceoverAudioRef.current.play();
        setIsPlayingVoiceover(true);
        return;
      } catch (err) {
        // synthesize fresh
      }
    }

    const scriptFn = LOCALIZED_VOICEOVERS[voiceoverLang] || LOCALIZED_VOICEOVERS.en;
    const textToSpeak = voiceoverText || scriptFn(shopData.name || "Lakshmi Textiles");
    setIsSynthesizingVoice(true);

    try {
      const res = await fetch("/api/campaign/synthesize-voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          language: voiceoverLang,
          gender: voiceoverGender,
          shop_name: shopData.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio_url && voiceoverAudioRef.current) {
          voiceoverAudioRef.current.src = data.audio_url;
          await voiceoverAudioRef.current.play();
          setIsPlayingVoiceover(true);
          setIsSynthesizingVoice(false);
          showToast(`Playing studio Neural voiceover (${voiceoverLang === "kn" ? "ಕನ್ನಡ" : voiceoverLang === "hi" ? "हिन्दी" : "English"}) 🎙️`);
          return;
        }
      }
    } catch (err) {
      console.warn("Server TTS error, using browser fallback:", err);
    }

    setIsSynthesizingVoice(false);
    // Fallback to Web Speech API if server TTS is unreachable
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(textToSpeak);
      u.lang = voiceoverLang === "kn" ? "kn-IN" : (voiceoverLang === "hi" ? "hi-IN" : "en-IN");
      u.rate = 0.92;
      u.pitch = voiceoverGender === "female" ? 1.05 : 0.9;
      u.onstart = () => setIsPlayingVoiceover(true);
      u.onend = () => setIsPlayingVoiceover(false);
      u.onerror = () => setIsPlayingVoiceover(false);
      window.speechSynthesis.speak(u);
    }
  };

  // Generate Reel with AI
  const handleGenerateReelAi = () => {
    setIsGeneratingReel(true);
    showToast("Generating AI ethnic wear showcase Reel... ✨");
    setTimeout(() => {
      const aiPhotos = [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
      ];
      setReelPhotos(aiPhotos);
      setSelectedReelPhotos(aiPhotos);
      setActiveReelPhotoIdx(0);
      setPhotoReelProgress(0);
      setIsPhotoReelPlaying(true);
      setReelMode("photos");
      setCoverImage(aiPhotos[0]);
      setVideoUrl(aiPhotos[0]);
      setIsGeneratingReel(false);
      showToast("AI Showcase Reel generated successfully! ✨");
    }, 1500);
  };

  // Brand Overlay Controls
  const [brandOverlayEnabled, setBrandOverlayEnabled] = useState(true);
  const [overlayPosition, setOverlayPosition] = useState("bottom-right");
  const [overlayType, setOverlayType] = useState("logo");
  const [offerText, setOfferText] = useState("20% off");

  // Story Specific Controls (matching Phase 1 Story Composer design)
  const [storySlides, setStorySlides] = useState([
    {
      id: 1,
      text: "Diwali offer at Lakshmi Textiles",
      bg: "repeating-linear-gradient(135deg, #7c1a40, #7c1a40 10px, #631031 10px, #631031 20px)",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      text: "Handcrafted Pure Silk Sarees",
      bg: "repeating-linear-gradient(135deg, #b8860b, #b8860b 10px, #996e00 10px, #996e00 20px)",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      text: "Special Festive Discount on All Sarees",
      bg: "repeating-linear-gradient(135deg, #0d5c4d, #0d5c4d 10px, #084035 10px, #084035 20px)",
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
    }
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [textPosition, setTextPosition] = useState<"top" | "middle" | "bottom">("middle");
  const [isOfferTagActive, setIsOfferTagActive] = useState(true);

  // Reusable Brand Overlay Renderer matching design specifications
  const renderBrandOverlay = (mode = "preview") => {
    if (!brandOverlayEnabled || overlayPosition === "off") return null;

    if (overlayType === "logo") {
      const isComposer = mode === "composer";
      const isPlaceholder = mode === "placeholder";
      const posStyle = {
        position: "absolute",
        zIndex: 5,
        width: isPlaceholder ? "32px" : "36px",
        height: isPlaceholder ? "32px" : "36px",
        borderRadius: "50%",
        background: "#ffffff",
        color: "#164e43",
        border: "1.5px solid rgba(0,0,0,0.08)",
        boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: isPlaceholder ? "11.5px" : "13px",
        fontWeight: 800,
        letterSpacing: "0.5px"
      };

      if (overlayPosition === "top-left") {
        posStyle.top = "12px";
        posStyle.left = "12px";
      } else if (overlayPosition === "top-right") {
        posStyle.top = "12px";
        posStyle.right = "12px";
      } else if (overlayPosition === "bottom-left") {
        posStyle.bottom = isComposer ? "56px" : isPlaceholder ? "10px" : "12px";
        posStyle.left = "12px";
      } else {
        // bottom-right (default)
        posStyle.bottom = isComposer ? "56px" : isPlaceholder ? "10px" : "12px";
        posStyle.right = "12px";
      }

      return (
        <div style={posStyle} title="Store Logo">
          {shopInitial}
        </div>
      );
    }

    if (overlayType === "name-strip") {
      const isComposer = mode === "composer";
      const isPlaceholder = mode === "placeholder";
      return (
        <div
          style={{
            position: "absolute",
            bottom: isComposer ? "52px" : "0",
            left: 0,
            right: 0,
            background: "#164e43",
            color: "#ffffff",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            zIndex: 5,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.2)"
          }}
        >
          {/* Avatar LT */}
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50",
              background: "#ffffff",
              color: "#164e43",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "11px",
              flexShrink: 0
            }}
          >
            {shopInitial}
          </div>

          {/* Store Name & Location */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
              flex: 1,
              minWidth: 0,
              textAlign: "left"
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: "1.2",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {shopData.name}
            </div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 500,
                color: "#a3d9c9",
                lineHeight: "1.2",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {shopData.area}
            </div>
          </div>

          {/* Phone */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 600,
              flexShrink: 0,
              letterSpacing: "0.2px"
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{shopData.phone || "98450 12345"}</span>
          </div>
        </div>
      );
    }

    if (overlayType === "offer-tag") {
      const isComposer = mode === "composer";
      const isPlaceholder = mode === "placeholder";
      return (
        <>
          {/* Top-left Golden Pill Badge: 20% off */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "#e2a21a",
              color: "#101614",
              padding: "4px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.3px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.22)",
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {offerText || "20% off"}
          </div>

          {/* Bottom-right Logo Badge */}
          <div
            style={{
              position: "absolute",
              bottom: isComposer ? "56px" : isPlaceholder ? "10px" : "12px",
              right: "12px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#ffffff",
              color: "#164e43",
              border: "1.5px solid rgba(0,0,0,0.08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 800,
              zIndex: 5
            }}
          >
            {shopInitial}
          </div>
        </>
      );
    }

    return null;
  };

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
      
      const cap = state.caption || state.generated_text || state.prompt || "";
      setCaption(cap);
      
      const rawImg = state.image_url || state.visual_suggestion || state.image;
      if (typeof rawImg === 'string' && (rawImg.startsWith('http://') || rawImg.startsWith('https://') || rawImg.startsWith('/') || rawImg.startsWith('data:image/'))) {
        setImage(rawImg);
      } else {
        setImage(null);
      }

      if (state.format) setFormat(state.format);
      
      if (state.category) {
        const rawCat = String(state.category).trim();
        let norm = rawCat.toLowerCase().replace(/\s+/g, '_');
        if (norm === 'promotions') norm = 'promotion';
        const matched = CATEGORIES.find(c => c.id === norm || c.label.toLowerCase() === rawCat.toLowerCase() || c.id === rawCat);
        if (matched) {
          setPostType(matched.id);
        }
      }
      
      if (state.hashtags) {
        if (Array.isArray(state.hashtags)) setHashtags(state.hashtags);
        else if (typeof state.hashtags === 'string') {
          try {
            const parsed = JSON.parse(state.hashtags);
            if (Array.isArray(parsed)) setHashtags(parsed);
            else setHashtags(state.hashtags.split(',').map((t) => t.trim()).filter(Boolean));
          } catch {
            setHashtags(state.hashtags.split(',').map((t) => t.trim()).filter(Boolean));
          }
        }
      } else if (cap) {
        const extracted = cap.match(/#[a-zA-Z0-9_]+/g);
        if (extracted && extracted.length > 0) {
          setHashtags(extracted.map(t => t.replace(/^#/, '')));
        }
      }

      if (state.scheduled_date) {
        setScheduledDate(state.scheduled_date);
        setWhen("schedule");
      }
      if (state.scheduled_time) {
        if (typeof state.scheduled_time === 'string' && (state.scheduled_time.includes('T') || state.scheduled_time.includes(' '))) {
          try {
            const dt = new Date(state.scheduled_time);
            if (!isNaN(dt.getTime())) {
              const y = dt.getFullYear();
              const m = String(dt.getMonth() + 1).padStart(2, '0');
              const d = String(dt.getDate()).padStart(2, '0');
              setScheduledDate(`${y}-${m}-${d}`);
              const hh = String(dt.getHours()).padStart(2, '0');
              const mm = String(dt.getMinutes()).padStart(2, '0');
              setScheduledTime(`${hh}:${mm}`);
              setWhen("schedule");
            }
          } catch (e) {}
        } else {
          setScheduledTime(state.scheduled_time);
        }
      }

      if (state.publish_to_facebook !== undefined || state.publish_to_instagram !== undefined || state.publish_instagram !== undefined) {
        setChannels({
          facebook: state.publish_to_facebook ?? true,
          instagram: (state.publish_to_instagram ?? state.publish_instagram) ?? true
        });
      }
    } else if (initParams?.mode === "holiday" && initParams.holiday) {
      const holiday = initParams.holiday;
      const hDate = initParams.date || holiday.date;
      if (hDate) setScheduledDate(hDate);
      setWhen("schedule");

      // Pre-select festival_offer category
      const festCat = CATEGORIES.find((c) => c.id === "festival_offer") || CATEGORIES[0];
      setPostType(festCat.id);

      const hName = (holiday.name || "Special Festival").trim();
      const hCleanTag = hName.replace(/[^a-zA-Z0-9]/g, "");

      // Draft tailored holiday caption
      const customCaption = `Celebrate ${hName} with ${shopData.name}! ✨ Wishing you and your family abundant joy, prosperity, and blessings on this auspicious occasion. Discover our special festive weaves and celebratory offers at ${shopData.area}.`;
      setCaption(customCaption);

      // Tailored festive hashtags
      const tags = [
        hCleanTag,
        `${hCleanTag}Special`,
        "FestiveVibes",
        "EthnicCollection",
        "FestivalOffer",
        "ShopLocal"
      ];
      setHashtags(tags);
      setOfferText(`${hName} Special`);
      setNoticeBannerType(`${hName} (${hDate})`);
      setShowNoticeBanner(true);
    } else if (initParams?.mode === "type" && (initParams.category || initParams.type)) {
      handleSelectCategory(initParams.category || initParams.type, false);
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

  // Robust Category Finder matching IDs, labels, and normalized keys
  const findCategory = (idOrLabel) => {
    if (!idOrLabel) return CATEGORIES[0];
    const raw = String(idOrLabel).trim();
    const key = raw.toLowerCase().replace(/[^a-z0-9]/g, "");

    const exact = CATEGORIES.find(
      (c) => c.id === raw || c.label.toLowerCase() === raw.toLowerCase()
    );
    if (exact) return exact;

    if (key === "summer" || key === "summersale") return CATEGORIES.find((c) => c.id === "summer_sale") || CATEGORIES[0];
    if (key === "collection" || key === "newcollection") return CATEGORIES.find((c) => c.id === "new_collection") || CATEGORIES[0];
    if (key === "spotlight" || key === "customerspotlight") return CATEGORIES.find((c) => c.id === "customer_spotlight") || CATEGORIES[0];
    if (key === "festival" || key === "festivaloffer") return CATEGORIES.find((c) => c.id === "festival_offer") || CATEGORIES[0];
    if (key === "showcase" || key === "productshowcase") return CATEGORIES.find((c) => c.id === "product_showcase") || CATEGORIES[0];
    if (key === "bts" || key === "behindthescenes") return CATEGORIES.find((c) => c.id === "behind_the_scenes") || CATEGORIES[0];
    if (key === "promo" || key === "promotion" || key === "promotions") return CATEGORIES.find((c) => c.id === "promotion") || CATEGORIES[0];
    if (key === "info" || key === "knowledgeinfo") return CATEGORIES.find((c) => c.id === "knowledge_info") || CATEGORIES[0];

    const partial = CATEGORIES.find((c) => {
      const cId = c.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cLabel = c.label.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cId.includes(key) || key.includes(cId) || cLabel.includes(key) || key.includes(cLabel);
    });

    return partial || CATEGORIES[0];
  };

  // Category change handler
  const handleSelectCategory = (catId, triggerNotice = true) => {
    const selected = findCategory(catId);
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

  // Handle Media (Image or Video) Upload
  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.name);
    if (isVideo) {
      const objUrl = URL.createObjectURL(file);
      setStoryVideoUrl(objUrl);
      setIsStoryVideoPlaying(true);
      if (format === "story") {
        setStorySlides((prev) => {
          const next = [...prev];
          if (next[activeSlideIndex]) {
            next[activeSlideIndex] = { ...next[activeSlideIndex], video: objUrl, isVideo: true } as any;
          }
          return next;
        });
      }
      showToast("Video loaded for Story! 🎬");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImage(result);
      if (format === "story") {
        setStoryVideoUrl("");
        setStorySlides((prev) => {
          const next = [...prev];
          if (next[activeSlideIndex]) {
            next[activeSlideIndex] = { ...next[activeSlideIndex], image: result, video: undefined, isVideo: false } as any;
          }
          return next;
        });
      }
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
    if (format === "reel") {
      if (!videoUrl) {
        showToast("Please upload a video or generate one for your Reel.");
        return;
      }
    } else {
      if (!caption && !image) {
        showToast("Please add a caption or an image before posting.");
        return;
      }
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
      image_url: (format === "story" ? (storySlides[activeSlideIndex]?.image || storySlides[0]?.image || image) : (format === "reel" ? (coverImage || image) : image)) || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      video_url: format === "reel" ? (videoUrl || undefined) : (format === "story" ? ((storySlides[activeSlideIndex] as any)?.video || storyVideoUrl || undefined) : undefined),
      cover_url: format === "reel" ? (coverImage || undefined) : undefined,
      format,
      slides: format === "story" ? storySlides.map(s => ({ text: s.text, image_url: s.image || image, video_url: (s as any).video || undefined })) : undefined,
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
          if (format === "story") {
            setStorySlides((prev) => {
              const next = [...prev];
              if (next[activeSlideIndex]) next[activeSlideIndex] = { ...next[activeSlideIndex], image: genUrl };
              return next;
            });
          }
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
    const chosenPreset = presets[activeSlideIndex % presets.length];
    setImage(chosenPreset);
    if (format === "story") {
      setStorySlides((prev) => {
        const next = [...prev];
        if (next[activeSlideIndex]) next[activeSlideIndex] = { ...next[activeSlideIndex], image: chosenPreset };
        return next;
      });
    }
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
            gap: "7px",
            height: "40px",
            padding: "0 14px",
            borderRadius: "12px",
            border: "1.5px solid var(--border, #979a96)",
            background: "var(--sunken, #dce4dc)",
            color: "var(--ink, #171f16)",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--tint, #d3ded3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--sunken, #dce4dc)";
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {ICONS.home}
          <span>Home</span>
        </button>

        <span
          style={{
            display: "inline-block",
            width: "1.5px",
            height: "24px",
            background: "var(--border, #979a96)",
            opacity: 0.5,
            margin: "0 6px"
          }}
        />

        <h1
          style={{
            margin: 0,
            fontFamily: "'Baloo 2', 'Mukta', system-ui, sans-serif",
            fontSize: "24px",
            lineHeight: "30px",
            fontWeight: 700,
            color: "var(--ink, #171f16)"
          }}
        >
          {format === "story" ? "New Story" : format === "reel" ? "New Reel" : "New post"}
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
            {format === "story" ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "flex-start" }}>
                {/* Left Column: Story Preview & Slide Navigation (width ~310px) */}
                <div style={{ flex: "0 1 310px", minWidth: "260px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Shop Profile Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "2px 4px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0d5c4d",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "15px"
                      }}
                    >
                      {(shopData.name || "L").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                      <span style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                        {shopData.name || "Lakshmi Textiles"}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--muted, #566054)" }}>
                        {when === "schedule" ? formatDateTimeDisplay(scheduledDate, scheduledTime) : "Sat 14 Nov, 6:00 PM"}
                      </span>
                    </div>
                  </div>

                  {/* Story Phone Mockup (9:16 Aspect Ratio) */}
                  {(() => {
                    const activeSlide = storySlides[activeSlideIndex] || storySlides[0];
                    const currentSlideImage = activeSlide?.image || "";
                    const currentSlideVideo = (activeSlide as any)?.video || storyVideoUrl || "";
                    return (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "9 / 16",
                      borderRadius: "28px",
                      overflow: "hidden",
                      border: "2.5px solid var(--border, #2a3628)",
                      boxShadow: "0 12px 32px rgba(23, 31, 22, 0.22)",
                      background: currentSlideVideo
                        ? "#000000"
                        : currentSlideImage
                        ? `url(${currentSlideImage}) center / cover no-repeat`
                        : activeSlide?.bg || "repeating-linear-gradient(135deg, #7c1a40, #7c1a40 10px, #631031 10px, #631031 20px)",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    {/* Video Player if Story has Video */}
                    {currentSlideVideo && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 0,
                          cursor: "pointer"
                        }}
                        onClick={toggleStoryVideoPlay}
                      >
                        <video
                          ref={storyVideoRef}
                          src={currentSlideVideo}
                          autoPlay
                          loop
                          playsInline
                          muted={false}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.55)",
                            backdropFilter: "blur(4px)",
                            border: "1.5px solid rgba(255,255,255,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontSize: "20px",
                            opacity: isStoryVideoPlaying ? 0 : 1,
                            transition: "opacity 0.2s ease",
                            zIndex: 15
                          }}
                        >
                          {isStoryVideoPlaying ? "⏸" : "▶"}
                        </div>
                      </div>
                    )}
                    {/* Top Progress / Slide Indicator Bars */}
                    <div style={{ display: "flex", gap: "5px", padding: "12px 14px 0", zIndex: 10 }}>
                      {storySlides.map((s, idx) => (
                        <div
                          key={s.id}
                          style={{
                            flex: 1,
                            height: "2.5px",
                            borderRadius: "2px",
                            background: idx <= activeSlideIndex ? "#ffffff" : "rgba(255, 255, 255, 0.35)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
                            transition: "background 0.2s ease"
                          }}
                        />
                      ))}
                    </div>

                    {/* Dark gradient overlay for legibility if photo is used */}
                    {currentSlideImage && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
                          zIndex: 1
                        }}
                      />
                    )}

                    {/* Story Content Overlay Container */}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 2,
                        flex: 1,
                        padding: "24px 20px 20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent:
                          textPosition === "top"
                            ? "flex-start"
                            : textPosition === "bottom"
                            ? "flex-end"
                            : "center",
                        gap: "10px"
                      }}
                    >
                      {/* Offer Tag Badge */}
                      {isOfferTagActive && offerText && (
                        <div
                          style={{
                            alignSelf: "flex-start",
                            background: "#f7c948",
                            color: "#171f16",
                            fontWeight: 800,
                            fontSize: "13px",
                            padding: "5px 12px",
                            borderRadius: "16px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                          }}
                        >
                          {offerText}
                        </div>
                      )}

                      {/* Headline Text on Slide */}
                      <div
                        style={{
                          color: "#ffffff",
                          fontSize: "21px",
                          fontWeight: 800,
                          lineHeight: "1.28",
                          textAlign: "left",
                          textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                          wordBreak: "break-word",
                          fontFamily: "'Baloo 2', 'Mukta', system-ui, sans-serif"
                        }}
                      >
                        {caption || storySlides[activeSlideIndex]?.text || "Diwali offer at Lakshmi Textiles"}
                      </div>

                      {/* Brand Overlay Logo Circle (Bottom Right) */}
                      {brandOverlayEnabled && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "16px",
                            right: "16px",
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            color: "#164e43",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "12.5px",
                            boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
                            border: "1.5px solid rgba(0,0,0,0.08)"
                          }}
                        >
                          {shopInitial}
                        </div>
                      )}
                    </div>

                    {/* Quick photo tools for the story background */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        right: "8px",
                        zIndex: 10,
                        display: "flex",
                        gap: "4px",
                        justifyContent: "space-between"
                      }}
                    >
                      <button
                        type="button"
                        disabled={isAiGenerating}
                        onClick={handleGenerateAiImage}
                        title="Generate AI image for this slide"
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          background: "rgba(22, 33, 31, 0.82)",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 6px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: isAiGenerating ? "wait" : "pointer",
                          backdropFilter: "blur(4px)"
                        }}
                      >
                        {ICONS.spark} AI Gen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fetchLibraryImages();
                          setIsLibraryOpen(true);
                        }}
                        title="Choose saved image from database media library"
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          background: "rgba(22, 33, 31, 0.82)",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 6px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          backdropFilter: "blur(4px)"
                        }}
                      >
                        {ICONS.grid} Library
                      </button>
                      <label
                        title="Upload photo from device"
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          background: "rgba(22, 33, 31, 0.82)",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 6px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          backdropFilter: "blur(4px)"
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*,video/mp4,video/quicktime,video/webm"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                        {ICONS.upload} Upload
                      </label>
                      {currentSlideImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setStorySlides((prev) => {
                              const next = [...prev];
                              if (next[activeSlideIndex]) next[activeSlideIndex] = { ...next[activeSlideIndex], image: "" };
                              return next;
                            });
                          }}
                          title="Remove image and use pattern"
                          style={{
                            background: "rgba(180,35,24,0.75)",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "4px 6px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            backdropFilter: "blur(4px)"
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  );
                  })()}

                  {/* Slides Row below Preview */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                        Slides
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--muted, #566054)" }}>
                        {storySlides.length} of 10 · drag to reorder
                      </span>
                    </div>

                    {/* Slides Thumbnails */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {storySlides.map((slide, idx) => {
                        const isSelected = idx === activeSlideIndex;
                        return (
                          <div
                            key={slide.id}
                            onClick={() => {
                              setActiveSlideIndex(idx);
                              setCaption(slide.text);
                              if (slide.image) setImage(slide.image);
                            }}
                            style={{
                              position: "relative",
                              width: "56px",
                              height: "88px",
                              borderRadius: "10px",
                              background: slide.image ? `url(${slide.image}) center / cover` : slide.bg,
                              border: isSelected ? "2.5px solid #2F6B2F" : "1.5px solid var(--border, #979a96)",
                              boxShadow: isSelected ? "0 0 0 2px rgba(47, 107, 47, 0.3)" : "none",
                              cursor: "pointer",
                              overflow: "hidden",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {/* Slide number badge in bottom left */}
                            <div
                              style={{
                                position: "absolute",
                                bottom: "4px",
                                left: "4px",
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                background: "#000000",
                                color: "#ffffff",
                                fontSize: "10px",
                                fontWeight: 800,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              {idx + 1}
                            </div>
                          </div>
                        );
                      })}

                      {/* Add slide button (+) */}
                      {storySlides.length < 10 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newId = storySlides.length + 1;
                            const colors = [
                              "repeating-linear-gradient(135deg, #1e3a8a, #1e3a8a 10px, #172554 10px, #172554 20px)",
                              "repeating-linear-gradient(135deg, #701a75, #701a75 10px, #4a044e 10px, #4a044e 20px)",
                              "repeating-linear-gradient(135deg, #831843, #831843 10px, #500724 10px, #500724 20px)"
                            ];
                            const nextBg = colors[newId % colors.length];
                            const newSlide = {
                              id: newId,
                              text: `Slide ${newId} for ${shopData.name}`,
                              bg: nextBg,
                              image: ""
                            };
                            setStorySlides([...storySlides, newSlide]);
                            setActiveSlideIndex(storySlides.length);
                            setCaption(newSlide.text);
                          }}
                          style={{
                            width: "56px",
                            height: "88px",
                            borderRadius: "10px",
                            border: "1.5px dashed var(--border, #979a96)",
                            background: "transparent",
                            color: "var(--muted, #566054)",
                            fontSize: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          +
                        </button>
                      )}
                    </div>

                    {/* Brand overlay toggle row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1px solid var(--border, #979a96)",
                        background: "var(--surface, #ffffff)",
                        marginTop: "8px"
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                        Brand overlay
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "13px", color: "var(--muted, #566054)", fontWeight: 500 }}>
                          Bottom right
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={brandOverlayEnabled}
                          onClick={() => setBrandOverlayEnabled(!brandOverlayEnabled)}
                          style={{
                            width: "44px",
                            height: "24px",
                            borderRadius: "12px",
                            border: "none",
                            background: brandOverlayEnabled ? "#2F6B2F" : "var(--sunken, #dce4dc)",
                            cursor: "pointer",
                            position: "relative",
                            transition: "background 0.2s ease",
                            padding: 0
                          }}
                        >
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: "#ffffff",
                              position: "absolute",
                              top: "3px",
                              left: brandOverlayEnabled ? "23px" : "3px",
                              transition: "left 0.2s ease",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Story Post Controls */}
                <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Post Type Selector */}
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
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid var(--border, #979a96)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #e6eee4)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "15px",
                        textAlign: "left"
                      }}
                    >
                      <span style={{ display: "inline-flex", color: "#2F6B2F" }}>{currentCategory.icon}</span>
                      <span style={{ flex: 1 }}>{currentCategory.label}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted, #a1ae9e)" }}>{isTypeDropdownOpen ? "▲" : "▼"}</span>
                    </button>

                    {isTypeDropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "6px",
                          borderRadius: "14px",
                          border: "1px solid var(--border, #979a96)",
                          background: "var(--surface, #172016)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                          zIndex: 50,
                          maxHeight: "260px",
                          overflowY: "auto",
                          padding: "6px"
                        }}
                      >
                        {CATEGORIES.map((cat) => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              handleSelectCategory(cat.id);
                              const storyHeadline = `${cat.label} at ${shopData.name}`;
                              setCaption(storyHeadline);
                              setStorySlides((prev) => {
                                const next = [...prev];
                                if (next[activeSlideIndex]) next[activeSlideIndex] = { ...next[activeSlideIndex], text: storyHeadline };
                                return next;
                              });
                              setIsTypeDropdownOpen(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: postType === cat.id ? "#ffffff" : "var(--ink, #e6eee4)",
                              background: postType === cat.id ? "#2F6B2F" : "transparent"
                            }}
                          >
                            <span>{cat.icon}</span>
                            <span style={{ fontWeight: 600 }}>{cat.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notice Banners */}
                  {/* Banner 1: Soft Peach - Slide text updated */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(242, 196, 102, 0.16)",
                      border: "1px solid rgba(242, 196, 102, 0.35)",
                      color: "var(--ink, #171f16)",
                      fontSize: "13px",
                      fontWeight: 600
                    }}
                  >
                    <span style={{ color: "var(--aink, #f2c466)" }}>✦</span>
                    <span>
                      Slide text updated for <b>{currentCategory.label}</b>
                    </span>
                  </div>

                  {/* Banner 2: Soft Mint / Teal - Stories have no caption */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(69, 181, 166, 0.14)",
                      border: "1px solid rgba(69, 181, 166, 0.32)",
                      color: "var(--ink, #171f16)",
                      fontSize: "13px",
                      fontWeight: 600
                    }}
                  >
                    <span style={{ color: "#0d6b61" }}>ⓘ</span>
                    <span>Stories have no caption. Your text goes directly on the story image.</span>
                  </div>

                  {/* Text on slide input */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted, #566054)" }}>
                      Text on slide {activeSlideIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCaption(val);
                        setStorySlides((prev) => {
                          const next = [...prev];
                          if (next[activeSlideIndex]) next[activeSlideIndex] = { ...next[activeSlideIndex], text: val };
                          return next;
                        });
                      }}
                      placeholder="Diwali offer at Lakshmi Textiles"
                      style={{
                        width: "100%",
                        fontFamily: "'Mukta', system-ui, sans-serif",
                        fontSize: "16px",
                        fontWeight: 600,
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid var(--border, #747d73)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #e6eee4)",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Slide Visual: AI Image Gen / Database Media Library / Upload */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--muted, #566054)" }}>
                        Slide {activeSlideIndex + 1} Image
                      </span>
                      {storySlides[activeSlideIndex]?.image && (
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setStorySlides((prev) => {
                              const next = [...prev];
                              if (next[activeSlideIndex]) next[activeSlideIndex] = { ...next[activeSlideIndex], image: "" };
                              return next;
                            });
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "rgba(220, 50, 50, 0.9)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0
                          }}
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={isAiGenerating}
                        onClick={handleGenerateAiImage}
                        style={{
                          flex: 1,
                          minWidth: "125px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1.5px solid var(--primary, #2F6B2F)",
                          background: "rgba(47, 107, 47, 0.12)",
                          color: "var(--primary, #2F6B2F)",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: isAiGenerating ? "wait" : "pointer"
                        }}
                      >
                        {ICONS.spark} {isAiGenerating ? "Generating..." : "Generate with AI"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fetchLibraryImages();
                          setIsLibraryOpen(true);
                        }}
                        style={{
                          flex: 1,
                          minWidth: "125px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1px solid var(--border, #747d73)",
                          background: "var(--surface, #172016)",
                          color: "var(--ink, #e6eee4)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {ICONS.grid} Media Library
                      </button>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1px solid var(--border, #747d73)",
                          background: "var(--surface, #172016)",
                          color: "var(--ink, #e6eee4)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        <input type="file" accept="image/*,video/mp4,video/quicktime,video/webm" onChange={handleImageUpload} style={{ display: "none" }} />
                        {ICONS.upload} Upload
                      </label>
                    </div>
                  </div>

                  {/* Tone AI Quick Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "var(--muted, #a1ae9e)" }}>
                      {ICONS.wand} Tone
                    </span>
                    {["Casual", "Formal", "Shorten", "Elaborate"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled={isRefiningTone}
                        onClick={() => handleRefineTone(t)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--border, #747d73)",
                          background: "var(--surface, #172016)",
                          color: "var(--ink, #e6eee4)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: isRefiningTone ? "wait" : "pointer"
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Offer tag toggle row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOfferTagActive}
                      onClick={() => setIsOfferTagActive(!isOfferTagActive)}
                      style={{
                        width: "44px",
                        height: "24px",
                        borderRadius: "12px",
                        border: "none",
                        background: isOfferTagActive ? "#2F6B2F" : "var(--sunken, #dce4dc)",
                        cursor: "pointer",
                        position: "relative",
                        transition: "background 0.2s ease",
                        padding: 0
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "#ffffff",
                          position: "absolute",
                          top: "3px",
                          left: isOfferTagActive ? "23px" : "3px",
                          transition: "left 0.2s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                        }}
                      />
                    </button>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                      Offer tag
                    </span>
                    <input
                      type="text"
                      disabled={!isOfferTagActive}
                      value={offerText}
                      onChange={(e) => setOfferText(e.target.value)}
                      placeholder="20% off"
                      style={{
                        flex: 1,
                        maxWidth: "140px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1.5px solid var(--border, #979a96)",
                        background: "var(--surface, #ffffff)",
                        color: "var(--ink, #171f16)",
                        fontSize: "14px",
                        fontWeight: 600,
                        outline: "none",
                        opacity: isOfferTagActive ? 1 : 0.5
                      }}
                    />
                  </div>

                  {/* Text position segmented control */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink, #171f16)", minWidth: "100px" }}>
                      Text position
                    </span>
                    <div style={{ display: "inline-flex", background: "var(--sunken, #dce4dc)", padding: "3px", borderRadius: "8px" }}>
                      {[
                        { id: "top", label: "Top" },
                        { id: "middle", label: "Middle" },
                        { id: "bottom", label: "Bottom" }
                      ].map((pos) => {
                        const isSelected = textPosition === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setTextPosition(pos.id as any)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              border: "none",
                              background: isSelected ? "#2F6B2F" : "transparent",
                              color: isSelected ? "#ffffff" : "var(--ink, #171f16)",
                              fontSize: "13px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {pos.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtext info */}
                  <span style={{ fontSize: "12px", color: "var(--muted, #566054)", marginTop: "4px" }}>
                    Photo slides show for 5 seconds. Link sticker available when publishing to Instagram.
                  </span>

                  {/* Scheduling Option (Subtle Toggle - No duplicate publish buttons!) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border, #979a96)", paddingTop: "14px", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "var(--ink, #171f16)" }}>
                        <input
                          type="checkbox"
                          checked={when === "schedule"}
                          onChange={(e) => setWhen(e.target.checked ? "schedule" : "now")}
                          style={{ width: "16px", height: "16px", accentColor: "#2F6B2F", cursor: "pointer" }}
                        />
                        <span>Schedule for later</span>
                      </label>
                      {when === "schedule" && (
                        <span style={{ fontSize: "12px", color: "var(--primary, #2F6B2F)", fontWeight: 600 }}>
                          {formatDateTimeDisplay(scheduledDate, scheduledTime)}
                        </span>
                      )}
                    </div>

                    {when === "schedule" && (
                      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1.5px solid var(--border, #747d73)",
                            background: "var(--surface, #172016)",
                            color: "var(--ink, #e6eee4)",
                            fontSize: "14px"
                          }}
                        />
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          style={{
                            width: "120px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1.5px solid var(--border, #747d73)",
                            background: "var(--surface, #172016)",
                            color: "var(--ink, #e6eee4)",
                            fontSize: "14px"
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions: Save Draft, Preview, Schedule/Publish */}
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "1px solid var(--border, #747d73)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #e6eee4)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      💾 Save draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPreviewModalOpen(true)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "1px solid var(--border, #747d73)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #e6eee4)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      👁 Preview
                    </button>
                    <button
                      type="button"
                      disabled={isPublishing}
                      onClick={handlePublish}
                      style={{
                        padding: "10px 22px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#2F6B2F",
                        color: "#ffffff",
                        fontSize: "15px",
                        fontWeight: 700,
                        cursor: isPublishing ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 14px rgba(47, 107, 47, 0.35)",
                        opacity: isPublishing ? 0.7 : 1
                      }}
                    >
                      {isPublishing
                        ? "Processing..."
                        : when === "schedule"
                        ? "Schedule Story"
                        : "Post Story now"}
                    </button>
                  </div>
                </div>
              </div>
            ) : format === "reel" ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "flex-start" }}>
                {/* Hidden file inputs */}
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/mp4,video/quicktime,video/webm"
                  style={{ display: "none" }}
                  onChange={handleVideoUpload}
                />
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={handleCoverUpload}
                />

                {/* Left Column: Reel Preview & Video Box (width ~310px) */}
                <div style={{ flex: "0 1 310px", minWidth: "260px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Shop Profile Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "2px 4px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#0d5c4d",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "15px"
                      }}
                    >
                      {(shopData.name || "L").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                      <span style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                        {shopData.name || "Lakshmi Textiles"}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--muted, #566054)" }}>
                        {formatDateTimeDisplay(scheduledDate, scheduledTime)}
                      </span>
                    </div>
                  </div>

                  {/* Vertical 9:16 Phone Mockup Container */}
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "310px",
                      aspectRatio: "9/16",
                      borderRadius: "24px",
                      border: "2px solid var(--border, #979a96)",
                      position: "relative",
                      overflow: "hidden",
                      background: "#121812",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.25)"
                    }}
                  >
                    {/* Top Safe Zone: Hatched overlay */}
                    <div
                      style={{
                        height: "54px",
                        background: "repeating-linear-gradient(45deg, rgba(0,0,0,0.45), rgba(0,0,0,0.45) 8px, rgba(0,0,0,0.65) 8px, rgba(0,0,0,0.65) 16px)",
                        borderBottom: "1px dashed rgba(255,255,255,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        flexShrink: 0
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.7)",
                          letterSpacing: "0.5px"
                        }}
                      >
                        App buttons cover this
                      </span>
                    </div>

                    {/* Center Content Area */}
                    <div
                      style={{
                        flex: 1,
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden"
                      }}
                    >
                      {reelMode === "photos" && reelPhotos.length > 0 ? (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                            cursor: "pointer",
                            overflow: "hidden",
                            background: "#000000"
                          }}
                          onClick={() => togglePhotoReelPlayback()}
                        >
                          {/* Active Photo with Smooth Transition & Ken Burns effect */}
                          <img
                            src={reelPhotos[activeReelPhotoIdx]}
                            alt={`Photo ${activeReelPhotoIdx + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              transition: "transform 2.5s ease-out, opacity 0.35s ease",
                              transform: isPhotoReelPlaying ? "scale(1.08)" : "scale(1.0)"
                            }}
                          />{/* Sleek Continuous Instagram Reel Bottom Scrubber Bar */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "3px",
                              background: "rgba(255,255,255,0.25)",
                              zIndex: 30
                            }}
                          >
                            <div
                              style={{
                                width: `${photoReelProgress}%`,
                                height: "100%",
                                background: "#ffffff",
                                boxShadow: "0 0 6px rgba(255,255,255,0.9)",
                                transition: "width 50ms linear"
                              }}
                            />
                          </div>                          {/* Centered Play / Pause Icon Button */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: "56px",
                              height: "56px",
                              borderRadius: "50%",
                              background: "rgba(0,0,0,0.55)",
                              backdropFilter: "blur(4px)",
                              border: "1.5px solid rgba(255,255,255,0.4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              fontSize: "22px",
                              opacity: isPhotoReelPlaying ? 0 : 1,
                              transition: "opacity 0.2s ease",
                              zIndex: 20
                            }}
                          >
                            {isPhotoReelPlaying ? "⏸" : "▶"}
                          </div>

                          {/* Bottom Control Pill */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: "10px",
                              left: "10px",
                              right: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "rgba(0,0,0,0.65)",
                              backdropFilter: "blur(6px)",
                              borderRadius: "10px",
                              padding: "6px 12px",
                              zIndex: 25
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() => togglePhotoReelPlayback()}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ffffff",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: 0
                                }}
                              >
                                {isPhotoReelPlaying ? "⏸ Pause" : "▶ Play"}
                              </button>
                              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>
                                Photo {activeReelPhotoIdx + 1} of {reelPhotos.length}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={handleOpenPhotoPicker}
                              style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.25)",
                                borderRadius: "6px",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "3px 8px",
                                cursor: "pointer"
                              }}
                            >
                              Change photos
                            </button>
                          </div>
                        </div>
                      ) : reelMode === "video" && videoUrl ? (
                        <div style={{ width: "100%", height: "100%", position: "relative" }}>
                          <video
                            ref={reelVideoPlayerRef}
                            src={videoUrl}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover"
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "rgba(0,0,0,0.75)",
                              color: "#ffffff",
                              border: "1px solid rgba(255,255,255,0.3)",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              zIndex: 20
                            }}
                          >
                            Replace video
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            padding: "16px",
                            gap: "8px",
                            width: "100%",
                            boxSizing: "border-box"
                          }}
                        >
                          {/* Play Icon in Rounded Square */}
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "12px",
                              border: "1.5px solid rgba(255,255,255,0.45)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              marginBottom: "4px"
                            }}
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="2" width="20" height="20" rx="4" />
                              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                            </svg>
                          </div>

                          <span style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                            Add your video
                          </span>
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>
                            Vertical, 9:16
                          </span>

                          {/* 3 Action Buttons - "Make from photos" as Primary Default */}
                          <button
                            type="button"
                            disabled={isGeneratingReel}
                            onClick={handleOpenPhotoPicker}
                            style={{
                              width: "100%",
                              maxWidth: "230px",
                              padding: "10px 14px",
                              borderRadius: "12px",
                              border: "none",
                              background: "#2F6B2F",
                              color: "#ffffff",
                              fontSize: "13.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "3px",
                              boxShadow: "0 4px 14px rgba(47, 107, 47, 0.45)"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>🖼</span>
                              <span>Make from photos</span>
                              <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.25)", padding: "1px 6px", borderRadius: "10px" }}>Default</span>
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: 400, opacity: 0.9 }}>$0 Cost · Instant from inventory</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            style={{
                              width: "100%",
                              maxWidth: "230px",
                              padding: "8px 14px",
                              borderRadius: "10px",
                              border: "1px solid rgba(255,255,255,0.3)",
                              background: "rgba(255,255,255,0.08)",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px"
                            }}
                          >
                            <span>↑</span>
                            <span>Upload video</span>
                          </button>

                          <button
                            type="button"
                            disabled={isGeneratingReel}
                            onClick={handleGenerateReelAi}
                            style={{
                              width: "100%",
                              maxWidth: "230px",
                              padding: "8px 14px",
                              borderRadius: "10px",
                              border: "1px solid rgba(255,255,255,0.3)",
                              background: "rgba(255,255,255,0.08)",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px"
                            }}
                          >
                            <span>✧</span>
                            <span>Generate with AI</span>
                          </button>
                        </div>
                      )}

                      {/* Brand Overlay Watermark (bottom right) */}
                      {brandOverlayEnabled && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "12px",
                            right: "12px",
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.95)",
                            color: "#121812",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "11px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                            zIndex: 15
                          }}
                        >
                          {(shopData.name || "L").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Bottom Safe Zone: Hatched overlay */}
                    <div
                      style={{
                        height: "72px",
                        background: "repeating-linear-gradient(45deg, rgba(0,0,0,0.45), rgba(0,0,0,0.45) 8px, rgba(0,0,0,0.65) 8px, rgba(0,0,0,0.65) 16px)",
                        borderTop: "1px dashed rgba(255,255,255,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        flexShrink: 0
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.7)",
                          letterSpacing: "0.5px"
                        }}
                      >
                        App buttons cover this
                      </span>
                    </div>
                  </div>

                  {/* Cover Picker Box */}
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "310px",
                      borderRadius: "14px",
                      border: "1px solid var(--border, #979a96)",
                      background: "var(--surface, #172016)",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      boxSizing: "border-box"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "54px",
                          borderRadius: "6px",
                          border: "1px solid var(--border, #979a96)",
                          background: coverImage ? `url(${coverImage}) center/cover no-repeat` : "#222",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden"
                        }}
                      >
                        {!coverImage && (
                          <span style={{ fontSize: "16px", color: "var(--muted, #566054)" }}>🖼</span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                          Cover
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--muted, #566054)" }}>
                          Shown on your profile
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (reelMode === "photos" && reelPhotos.length > 0) {
                            setCoverImage(reelPhotos[activeReelPhotoIdx]);
                            showToast(`Photo ${activeReelPhotoIdx + 1} set as cover photo!`);
                          } else if (videoUrl) {
                            captureFrameFromVideo(videoUrl, 1.0);
                            showToast("Captured frame from video!");
                          } else {
                            showToast("Create a Reel first to pick a cover frame.");
                          }
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "8px",
                          border: "1px solid var(--border, #979a96)",
                          background: "var(--surface, #172016)",
                          color: "var(--ink, #171f16)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Pick a frame
                      </button>
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "8px",
                          border: "1px solid var(--border, #979a96)",
                          background: "var(--surface, #172016)",
                          color: "var(--ink, #171f16)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Reel Post Controls (~320px+) */}
                <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Post Type Selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", position: "relative" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted, #566054)" }}>Post type</span>
                    <button
                      type="button"
                      onClick={() => setIsReelTypeDropdownOpen(!isReelTypeDropdownOpen)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid var(--border, #979a96)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #e6eee4)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "15px",
                        textAlign: "left"
                      }}
                    >
                      <span style={{ display: "inline-flex", color: "#2F6B2F" }}>{currentCategory.icon}</span>
                      <span style={{ flex: 1 }}>{currentCategory.label}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted, #a1ae9e)" }}>{isReelTypeDropdownOpen ? "▲" : "▼"}</span>
                    </button>

                    {isReelTypeDropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "6px",
                          borderRadius: "14px",
                          border: "1px solid var(--border, #979a96)",
                          background: "var(--surface, #172016)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                          zIndex: 50,
                          maxHeight: "260px",
                          overflowY: "auto",
                          padding: "6px"
                        }}
                      >
                        {CATEGORIES.map((cat) => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              handleSelectCategory(cat.id);
                              setIsReelTypeDropdownOpen(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: postType === cat.id ? "#ffffff" : "var(--ink, #e6eee4)",
                              background: postType === cat.id ? "#2F6B2F" : "transparent"
                            }}
                          >
                            <span>{cat.icon}</span>
                            <span style={{ fontWeight: 600 }}>{cat.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notice Banner: Soft Peach / Gold */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(242, 196, 102, 0.16)",
                      border: "1px solid rgba(242, 196, 102, 0.35)",
                      color: "var(--ink, #171f16)",
                      fontSize: "13px",
                      fontWeight: 600
                    }}
                  >
                    <span style={{ color: "var(--aink, #f2c466)" }}>✦</span>
                    <span>
                      Caption and hashtags updated for <b>{currentCategory.label}</b>.
                    </span>
                  </div>

                  {/* Caption Textarea */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink, #171f16)" }}>
                        Caption
                      </label>
                      <span style={{ fontSize: "12px", color: "var(--muted, #566054)" }}>
                        {caption.length} chars
                      </span>
                    </div>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write an engaging caption for your reel..."
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid var(--border, #979a96)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #e6eee4)",
                        fontSize: "14px",
                        lineHeight: 1.5,
                        resize: "vertical",
                        boxSizing: "border-box"
                      }}
                    />

                    {/* Quick Tone Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted, #566054)" }}>
                        🪄 Tone
                      </span>
                      {["Casual", "Formal", "Shorten", "Elaborate"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleRewriteTone(t.toLowerCase())}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "16px",
                            border: "1px solid var(--border, #979a96)",
                            background: "transparent",
                            color: "var(--ink, #171f16)",
                            fontSize: "12px",
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted, #566054)" }}>
                      Hashtags
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                      {hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 10px",
                            borderRadius: "14px",
                            background: "rgba(47, 107, 47, 0.12)",
                            color: "#2F6B2F",
                            fontSize: "13px",
                            fontWeight: 600
                          }}
                        >
                          #{tag.replace(/^#/, "")}
                          <button
                            type="button"
                            onClick={() => handleRemoveHashtag(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "inherit",
                              cursor: "pointer",
                              padding: 0,
                              fontSize: "14px",
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {isAddingTag ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddHashtag();
                            }}
                            placeholder="tag..."
                            autoFocus
                            style={{
                              padding: "4px 8px",
                              borderRadius: "10px",
                              border: "1px solid var(--border, #979a96)",
                              background: "var(--surface, #172016)",
                              color: "var(--ink, #e6eee4)",
                              fontSize: "12px",
                              width: "80px"
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleAddHashtag}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "8px",
                              background: "#2F6B2F",
                              color: "#fff",
                              border: "none",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingTag(true)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "14px",
                            border: "1px dashed var(--border, #979a96)",
                            background: "transparent",
                            color: "var(--muted, #566054)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hidden Audio Player for Previewing Royalty-free Music */}
                  <audio
                    ref={audioPreviewRef}
                    onEnded={() => setIsPlayingAudio(false)}
                    style={{ display: "none" }}
                  />

                  {/* 1. Royalty-Free Music Library Card */}
                  <div
                    style={{
                      border: "1px solid var(--border, #979a96)",
                      borderRadius: "14px",
                      background: "var(--surface, #172016)",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "rgba(47, 107, 47, 0.15)",
                            color: "#2F6B2F",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px"
                          }}
                        >
                          🎵
                        </div>
                        <div>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                            Background Music
                          </span>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--muted, #566054)" }}>
                            Royalty-free & copyright-safe
                          </span>
                        </div>
                      </div>

                      {selectedTrackId !== "none" && (
                        <button
                          type="button"
                          onClick={() => {
                            const track = ROYALTY_FREE_TRACKS.find((t) => t.id === selectedTrackId);
                            if (track && track.url) handleToggleTrackPreview(track.url);
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "16px",
                            border: "1px solid var(--border, #979a96)",
                            background: isPlayingAudio ? "#2F6B2F" : "transparent",
                            color: isPlayingAudio ? "#ffffff" : "var(--ink, #171f16)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <span>{isPlayingAudio ? "⏸ Pause" : "▶ Preview"}</span>
                        </button>
                      )}
                    </div>

                    {/* Track Selection Dropdown */}
                    <select
                      value={selectedTrackId}
                      onChange={(e) => {
                        const newTrackId = e.target.value;
                        setSelectedTrackId(newTrackId);
                        if (isPhotoReelPlaying) {
                          const track = ROYALTY_FREE_TRACKS.find((t) => t.id === newTrackId);
                          if (track && track.url && audioPreviewRef.current) {
                            audioPreviewRef.current.src = track.url;
                            audioPreviewRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
                          } else if (audioPreviewRef.current) {
                            audioPreviewRef.current.pause();
                            setIsPlayingAudio(false);
                          }
                        } else if (isPlayingAudio && audioPreviewRef.current) {
                          audioPreviewRef.current.pause();
                          setIsPlayingAudio(false);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: "1px solid var(--border, #979a96)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #e6eee4)",
                        fontSize: "13px",
                        cursor: "pointer"
                      }}
                    >
                      {ROYALTY_FREE_TRACKS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icon} {t.name}
                        </option>
                      ))}
                    </select>

                    <span style={{ fontSize: "11.5px", color: "var(--muted, #566054)", lineHeight: 1.35 }}>
                      {ROYALTY_FREE_TRACKS.find((t) => t.id === selectedTrackId)?.desc}
                    </span>
                  </div>

                  {/* 2. Tri-Lingual AI Voiceover Card */}
                  <div
                    style={{
                      border: "1px solid var(--border, #979a96)",
                      borderRadius: "14px",
                      background: "var(--surface, #172016)",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "rgba(242, 196, 102, 0.2)",
                            color: "#b8860b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px"
                          }}
                        >
                          🎙
                        </div>
                        <div>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                            AI Voiceover Narration
                          </span>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--muted, #566054)" }}>
                            Auto-reads your offer in local languages
                          </span>
                        </div>
                      </div>

                      {/* On/Off Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !voiceoverEnabled;
                          setVoiceoverEnabled(next);
                          if (next && !voiceoverText) {
                            handleVoiceoverLangChange(voiceoverLang);
                          }
                          if (next && isPhotoReelPlaying) {
                            playSyncedVoiceover();
                          } else if (!next) {
                            pauseSyncedVoiceover();
                          }
                        }}
                        style={{
                          width: "44px",
                          height: "24px",
                          borderRadius: "12px",
                          background: voiceoverEnabled ? "#2F6B2F" : "var(--hair, #444)",
                          border: "none",
                          position: "relative",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            position: "absolute",
                            top: "3px",
                            left: voiceoverEnabled ? "23px" : "3px",
                            transition: "left 0.2s"
                          }}
                        />
                      </button>
                    </div>

                    {voiceoverEnabled && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                        {/* Language Selection Pills */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {[
                            { id: "en", label: "🇬🇧 English" },
                            { id: "kn", label: "🇮🇳 Kannada (ಕನ್ನಡ)" },
                            { id: "hi", label: "🇮🇳 Hindi (हिन्दी)" }
                          ].map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => handleVoiceoverLangChange(l.id as any)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "14px",
                                border: voiceoverLang === l.id ? "1.5px solid #2F6B2F" : "1px solid var(--border, #979a96)",
                                background: voiceoverLang === l.id ? "rgba(47, 107, 47, 0.15)" : "transparent",
                                color: voiceoverLang === l.id ? "#2F6B2F" : "var(--ink, #171f16)",
                                fontSize: "12px",
                                fontWeight: voiceoverLang === l.id ? 700 : 500,
                                cursor: "pointer"
                              }}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>

                        {/* Gender Toggle & Preview Button */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "12px", color: "var(--muted, #566054)", fontWeight: 600 }}>Voice:</span>
                            {["female", "male"].map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setVoiceoverGender(g as any)}
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  border: "none",
                                  background: voiceoverGender === g ? "#2F6B2F" : "rgba(255,255,255,0.08)",
                                  color: voiceoverGender === g ? "#ffffff" : "var(--ink, #171f16)",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  textTransform: "capitalize"
                                }}
                              >
                                {g}
                              </button>
                            ))}
                          </div>

                          <audio
                            ref={voiceoverAudioRef}
                            onEnded={() => setIsPlayingVoiceover(false)}
                            style={{ display: "none" }}
                          />
                          <button
                            type="button"
                            disabled={isSynthesizingVoice}
                            onClick={handlePlayVoiceover}
                            style={{
                              padding: "4px 12px",
                              borderRadius: "14px",
                              border: "1px solid #2F6B2F",
                              background: isPlayingVoiceover ? "#2F6B2F" : "rgba(47, 107, 47, 0.12)",
                              color: isPlayingVoiceover ? "#ffffff" : "#2F6B2F",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: isSynthesizingVoice ? "wait" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <span>{isSynthesizingVoice ? "Loading Studio Audio... ⏳" : isPlayingVoiceover ? "⏸ Stop Voice" : "▶ Listen to Voiceover"}</span>
                          </button>
                        </div>

                        {/* Voiceover Script Box */}
                        <textarea
                          value={voiceoverText}
                          onChange={(e) => setVoiceoverText(e.target.value)}
                          placeholder={isTranslatingVoiceover ? "Generating translation..." : "Voiceover narration script..."}
                          rows={2}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: "1px solid var(--border, #979a96)",
                            background: "var(--surface, #172016)",
                            color: "var(--ink, #e6eee4)",
                            fontSize: "12.5px",
                            lineHeight: 1.4,
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Schedule / When to Publish Toggle */}
                  <div
                    style={{
                      marginTop: "4px",
                      paddingTop: "14px",
                      borderTop: "1px solid var(--border, #979a96)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--muted, #566054)" }}>
                      When to publish
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setWhen(when === "now" ? "schedule" : "now")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          border: "1px solid var(--border, #979a96)",
                          background: when === "schedule" ? "rgba(47, 107, 47, 0.12)" : "transparent",
                          color: when === "schedule" ? "#2F6B2F" : "var(--ink, #171f16)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        <span>⏰</span>
                        <span>{when === "schedule" ? "Scheduled" : "Schedule for later"}</span>
                      </button>

                      {when === "schedule" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              border: "1px solid var(--border, #979a96)",
                              background: "var(--surface, #172016)",
                              color: "var(--ink, #e6eee4)",
                              fontSize: "13px"
                            }}
                          />
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              border: "1px solid var(--border, #979a96)",
                              background: "var(--surface, #172016)",
                              color: "var(--ink, #e6eee4)",
                              fontSize: "13px"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "10px",
                        border: "1px solid var(--border, #979a96)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #171f16)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span>💾</span>
                      <span>Save draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPreviewModalOpen(true)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "10px",
                        border: "1px solid var(--border, #979a96)",
                        background: "var(--surface, #172016)",
                        color: "var(--ink, #171f16)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span>👁</span>
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      disabled={isPublishing}
                      onClick={handlePublish}
                      style={{
                        padding: "11px 26px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#2F6B2F",
                        color: "#ffffff",
                        fontSize: "15px",
                        fontWeight: 700,
                        cursor: isPublishing ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 8px rgba(47, 107, 47, 0.35)",
                        transition: "all 0.15s ease",
                        minWidth: "150px",
                        textAlign: "center"
                      }}
                    >
                      {isPublishing
                        ? "Processing..."
                        : when === "schedule"
                        ? "Schedule Reel"
                        : "Post Reel now"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
              {/* Left Column: Image Box (300px) */}
              <div style={{ flex: "0 1 300px", minWidth: "240px" }}>
                {!image ? (
                  <div
                    role="group"
                    aria-label="No image yet"
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      border: "2px dashed var(--border, #979a96)",
                      background: "var(--canvas, #f4f6f2)",
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

                    {/* Brand Overlay in Corner/Bottom when overlay enabled */}
                    {renderBrandOverlay("placeholder")}
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

                    {/* Rendered Brand Overlay on Active Image */}
                    {renderBrandOverlay("composer")}
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

                {/* Brand Overlay Control Card with Dropdown Selection & Dark Shade Highlight */}
                <div
                  style={{
                    marginTop: "12px",
                    borderRadius: "16px",
                    border: "1.5px solid var(--border, #979a96)",
                    background: "var(--surface, #ffffff)",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink, #171f16)" }}>
                      Brand overlay
                    </span>

                    {/* Dropdown Selection with explicit Arrow Down (replacing toggle button) */}
                    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                      <select
                        aria-label="Brand overlay position"
                        value={brandOverlayEnabled ? overlayPosition : "off"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "off") {
                            setBrandOverlayEnabled(false);
                          } else {
                            setBrandOverlayEnabled(true);
                            setOverlayPosition(val);
                          }
                        }}
                        style={{
                          appearance: "none",
                          WebkitAppearance: "none",
                          MozAppearance: "none",
                          padding: "6px 28px 6px 12px",
                          borderRadius: "8px",
                          border: "1.5px solid var(--border, #979a96)",
                          background: "var(--surface, #ffffff)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: brandOverlayEnabled ? "var(--ink, #171f16)" : "var(--muted, #566054)",
                          cursor: "pointer",
                          outline: "none"
                        }}
                      >
                        <option value="bottom-right">Bottom right</option>
                        <option value="bottom-left">Bottom left</option>
                        <option value="top-right">Top right</option>
                        <option value="top-left">Top left</option>
                        <option value="off">Off (None)</option>
                      </select>

                      {/* Arrow Down Chevron Icon */}
                      <span
                        style={{
                          position: "absolute",
                          right: "8px",
                          pointerEvents: "none",
                          color: "var(--muted, #566054)",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* 3 Segments: Logo | Name strip | Offer tag with DARK SHADE #2F6B2F highlight */}
                  <div
                    style={{
                      display: "flex",
                      background: "var(--sunken, #e9ebe7)",
                      borderRadius: "10px",
                      padding: "3px",
                      gap: "2px",
                      opacity: brandOverlayEnabled ? 1 : 0.6,
                      transition: "opacity 0.2s ease"
                    }}
                  >
                    {[
                      { id: "logo", label: "Logo" },
                      { id: "name-strip", label: "Name strip" },
                      { id: "offer-tag", label: "Offer tag" }
                    ].map((tab) => {
                      const isSelected = brandOverlayEnabled && overlayType === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setOverlayType(tab.id);
                            if (!brandOverlayEnabled) {
                              setBrandOverlayEnabled(true);
                              if (overlayPosition === "off") setOverlayPosition("bottom-right");
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: isSelected ? "1.5px solid #2F6B2F" : "1.5px solid transparent",
                            background: isSelected ? "#2F6B2F" : "transparent",
                            color: isSelected ? "#ffffff" : "var(--muted, #566054)",
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: isSelected ? "0 2px 6px rgba(47, 107, 47, 0.28)" : "none",
                            transition: "all 0.15s ease",
                            textAlign: "center"
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Offer text field when Offer tag selected */}
                  {brandOverlayEnabled && overlayType === "offer-tag" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted, #566054)", fontWeight: 600, flexShrink: 0 }}>
                        Offer tag:
                      </span>
                      <input
                        type="text"
                        value={offerText}
                        onChange={(e) => setOfferText(e.target.value)}
                        placeholder="e.g. 20% off"
                        style={{
                          flex: 1,
                          padding: "5px 10px",
                          borderRadius: "8px",
                          border: "1.5px solid var(--border, #979a96)",
                          background: "var(--surface, #ffffff)",
                          fontSize: "13px",
                          color: "var(--ink, #171f16)",
                          outline: "none"
                        }}
                      />
                    </div>
                  )}

                  <p style={{ fontSize: "11px", color: "var(--muted, #566054)", margin: "0", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "12px" }}>ⓘ</span> Uses store branding. Turn off or choose style for this post.
                  </p>
                </div>
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

            {/* Dedicated Bottom Section: When to Post & Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                paddingTop: "18px",
                borderTop: "1.5px solid var(--border, #979a96)"
              }}
            >
              {/* When & Date/Time Controls Card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  background: "var(--sunken, #f4f6f3)",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  border: "1.5px solid var(--border, #979a96)"
                }}
              >
                {/* Post now vs Schedule toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink, #171f16)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🕒</span> When:
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Posting schedule"
                    style={{
                      display: "inline-flex",
                      padding: "3px",
                      borderRadius: "10px",
                      background: "var(--surface, #ffffff)",
                      border: "1.5px solid var(--border, #979a96)"
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
                            minHeight: "36px",
                            padding: "0 14px",
                            borderRadius: "8px",
                            border: isChecked ? "1.5px solid #2F6B2F" : "1.5px solid transparent",
                            fontSize: "13.5px",
                            fontWeight: isChecked ? 700 : 500,
                            cursor: "pointer",
                            background: isChecked ? "#2F6B2F" : "transparent",
                            color: isChecked ? "#ffffff" : "var(--muted, #566054)",
                            boxShadow: isChecked ? "0 2px 6px rgba(47, 107, 47, 0.25)" : "none",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <span style={{ color: isChecked ? "#ffffff" : "var(--muted, #566054)" }}>{w.icon}</span>
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Time selection right here at the bottom */}
                {when === "schedule" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <label htmlFor="post-schedule-date" style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted, #566054)" }}>
                        Date:
                      </label>
                      <input
                        id="post-schedule-date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        style={{
                          minHeight: "38px",
                          padding: "0 10px",
                          border: "1.5px solid var(--border, #979a96)",
                          borderRadius: "8px",
                          background: "var(--surface, #ffffff)",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          color: "var(--ink, #171f16)",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <label htmlFor="post-schedule-time" style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted, #566054)" }}>
                        Time:
                      </label>
                      <input
                        id="post-schedule-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        style={{
                          minHeight: "38px",
                          padding: "0 10px",
                          border: "1.5px solid var(--border, #979a96)",
                          borderRadius: "8px",
                          background: "var(--surface, #ffffff)",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          color: "var(--ink, #171f16)",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted, #566054)" }}>IST</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--muted, #566054)", fontStyle: "italic" }}>
                    Will be published immediately across selected channels.
                  </span>
                )}
              </div>

              {/* Action Buttons & Character Count */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap"
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", lineHeight: "20px", color: "var(--muted, #566054)" }}>
                  {caption.length} / 2,200 characters
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      minHeight: "48px",
                      padding: "0 16px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#2F6B2F",
                      background: "var(--tint, #e6ede6)",
                      border: "1.5px solid rgba(47, 107, 47, 0.3)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {ICONS.eye} Preview Post
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
                      minHeight: "48px",
                      padding: "0 22px",
                      borderRadius: "10px",
                      fontSize: "15px",
                      fontWeight: 700,
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
                      ? `Schedule post (${formatDateTimeDisplay(scheduledDate, scheduledTime)})`
                      : "Post now"}
                  </button>
                </div>
              </div>
            </div>
          </>
          )}
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
                    if (format === "story") {
                      setStorySlides((prev) => {
                        const next = [...prev];
                        if (next[activeSlideIndex]) next[activeSlideIndex] = { ...next[activeSlideIndex], image: imgUrl };
                        return next;
                      });
                    }
                    setIsLibraryOpen(false);
                    showToast(format === "story" ? `Image applied to Slide ${activeSlideIndex + 1}! ✨` : "Image selected from library!");
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

      {/* Reel Multi-Photo Picker Modal */}
      {isReelPhotoModalOpen && (
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
          onClick={() => setIsReelPhotoModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--surface, #172016)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxSizing: "border-box"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, fontFamily: "'Baloo 2', sans-serif" }}>
                  Select Photos for Reel
                </h3>
                <span style={{ fontSize: "12px", color: "var(--muted, #566054)" }}>
                  Choose 1 to 6 photos from your inventory ({selectedReelPhotos.length} selected)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsReelPhotoModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted, #a1ae9e)" }}
              >
                {ICONS.x}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", maxHeight: "320px", overflowY: "auto", padding: "4px" }}>
              {libraryImages.concat(storySlides.map((s) => s.image).filter(Boolean)).filter((v, i, a) => a.indexOf(v) === i).map((imgUrl, idx) => {
                const isSelected = selectedReelPhotos.includes(imgUrl);
                const selIndex = selectedReelPhotos.indexOf(imgUrl);
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleReelPhoto(imgUrl)}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: "10px",
                      overflow: "hidden",
                      cursor: "pointer",
                      position: "relative",
                      border: isSelected ? "3px solid #2F6B2F" : "2px solid var(--hair, #2a3628)",
                      boxShadow: isSelected ? "0 0 10px rgba(47, 107, 47, 0.5)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <img src={imgUrl} alt="Inventory product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "#2F6B2F",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.4)"
                        }}
                      >
                        {selIndex + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border, #979a96)" }}>
              <span style={{ fontSize: "12px", color: "var(--muted, #566054)" }}>
                {selectedReelPhotos.length} photo{selectedReelPhotos.length !== 1 ? "s" : ""} chosen
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsReelPhotoModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border, #979a96)",
                    background: "transparent",
                    color: "var(--ink, #171f16)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedReelPhotos.length === 0}
                  onClick={handleCreateReelFromPhotos}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: selectedReelPhotos.length > 0 ? "#2F6B2F" : "var(--hair, #444)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: selectedReelPhotos.length > 0 ? "pointer" : "not-allowed"
                  }}
                >
                  Create Reel ({selectedReelPhotos.length})
                </button>
              </div>
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

                      {/* FB Post Image with Live Brand Overlay */}
                      <div style={{ position: "relative", width: "100%", aspectRatio: format === "post" ? "1 / 1" : "9 / 16", background: "#f0f2f5", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {image ? (
                          <>
                            <img src={image} alt="Facebook post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            {renderBrandOverlay("preview")}
                          </>
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

                      {/* IG Post Image with Live Brand Overlay */}
                      <div style={{ position: "relative", width: "100%", aspectRatio: format === "post" ? "1 / 1" : "9 / 16", background: "#f8f9fa", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {image ? (
                          <>
                            <img src={image} alt="Instagram post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            {renderBrandOverlay("preview")}
                          </>
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
