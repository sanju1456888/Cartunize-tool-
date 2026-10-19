// Demo / starter content. Firebase সেট করার আগে সাইটে এটা দেখাবে,
// আর অ্যাডমিন প্যানেলের "Demo ডেটা লোড করুন" বাটনে এটা ডাটাবেসে ঢুকবে।
const DEMO = {
  settings: {
    siteName: "CARTUNIZE",
    logoUrl: "",
    noticeText: "Launch offer: প্রথম ১০০ জনের জন্য বিশেষ ছাড়",
    heroBadge1: "100% Genuine License Keys",
    heroBadge2: "10,000+ Creators Trust Us",
    heroTitle: "Professional Tools for Creators & Studios",
    heroSub: "Genuine license keys, plugins, extensions and templates for animation, design, video editing and more.",
    heroImage: "",
    heroBtnText: "Explore Tools",
    heroBtnLink: "#tools",
    trust1: "Instant Delivery",
    trust2: "Lifetime Validity",
    trust3: "24/7 Support",
    trust4: "100% Genuine Keys",
    toolsTitle: "CARTUNIZE Master Panel",
    toolsSub: "Explore our wide range of creative tools and resources.",
    plansTitle: "Choose Plans",
    plansSub: "Choose the perfect subscription plan for your workflow.",
    pluginTag: "OFFICIAL PLUGIN LAUNCH",
    pluginTitle: "CARTUNIZE Master Panel",
    pluginSub: "The ultimate tools suite for animators",
    pluginDesc: "Automate character rigging, lip-sync and production tasks with one-click tools.",
    pluginBtn: "Download Plugin",
    pluginLink: "#",
    pluginVersion: "1.0.0",
    pluginSize: "70 MB",
    learnTitle: "Video Tutorials",
    learnSub: "Master every tool step by step with our video lessons.",
    downloadsTitle: "Downloads",
    downloadsSub: "Plugins, extensions and free resources.",
    assetsTitle: "Animation Assets",
    assetsSub: "Ready-to-use packs for your projects.",
    blogTitle: "Latest Updates & Resources",
    blogSub: "Tips, tutorials and news for your creative journey.",
    footerText: "Professional toolkits & license keys for creators. Upgrade your workflow with powerful tools and flexible license plans.",
    copyright: "CARTUNIZE. All rights reserved.",
    stat1v: "50,000+", stat1l: "Creators Worldwide",
    stat2v: "1M+", stat2l: "Assets Downloaded",
    stat3v: "100%", stat3l: "Secure & Safe",
    stat4v: "4.9/5", stat4l: "Customer Rating",
    currency: "₹",
    email: "",
    whatsapp: "",
    telegram: "",
    facebook: "",
    youtube: "",
    instagram: ""
  },
  tools: [
    { name: "Character Gen", desc: "Build characters fast", icon: "🧍", order: 1, active: true },
    { name: "Props & BGs", desc: "Backgrounds and props", icon: "🖼️", order: 2, active: true },
    { name: "Script Writer", desc: "Story and scripts", icon: "📝", order: 3, active: true },
    { name: "Sound Effects", desc: "SFX library", icon: "🔊", order: 4, active: true },
    { name: "Lip Sync", desc: "Auto mouth shapes", icon: "👄", order: 5, active: true },
    { name: "Smart Rig", desc: "One-click rigging", icon: "⚙️", order: 6, active: true }
  ],
  plans: [
    { name: "Creator Plan", tagline: "Perfect for beginners", price: 449, yearlyPrice: 4199, period: "month",
      features: "Use on 2 PCs\nFull access to Master Panel\nAll AI Tools (Standard)\nStandard Email Support",
      deviceNote: "2 Devices", badge: "", buyLink: "#", image: "", order: 1, active: true },
    { name: "Pro Plan", tagline: "Best for creators & freelancers", price: 749, yearlyPrice: 6999, period: "month",
      features: "Use on 4 PCs\nFull access to Master Panel\nAll AI Tools (More credits)\nPriority feature updates\nPriority WhatsApp support",
      deviceNote: "4 Devices", badge: "Most Popular", buyLink: "#", image: "", order: 2, active: true },
    { name: "Studio Plan", tagline: "For professionals & teams", price: 1399, yearlyPrice: 12999, period: "month",
      features: "Use on 8 PCs\nFull access to Master Panel\nAll AI Tools (Maximum limits)\nEarly access to beta features\nDedicated 1-on-1 support",
      deviceNote: "8 Devices", badge: "", buyLink: "#", image: "", order: 3, active: true }
  ],
  videos: [
    { title: "How to Install the Plugin", group: "Setup & Activation", url: "", thumb: "", duration: "12:33",
      desc: "Step-by-step setup guide: extract, install and activate your license key.", order: 1, active: true },
    { title: "Rigging Made Easy", group: "Rigging", url: "", thumb: "", duration: "04:25",
      desc: "Rig a full character in minutes.", order: 2, active: true }
  ],
  downloads: [
    { title: "CARTUNIZE Master Panel", desc: "Main plugin for Windows & Mac", version: "1.0.0", size: "70 MB", link: "#", image: "", order: 1, active: true }
  ],
  assets: [
    { title: "Starter Character Pack", desc: "10 ready characters", image: "", link: "#", order: 1, active: true }
  ],
  posts: [
    { title: "System & Course Info", category: "Blog", date: "2026-10-20", image: "",
      excerpt: "Recommended PC builds and system requirements for smooth animation work.", link: "#", order: 1, active: true }
  ]
};
