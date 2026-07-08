import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Film, 
  Sparkles, 
  Palette, 
  Layers, 
  Video, 
  Sliders, 
  Download, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Settings, 
  HelpCircle, 
  Info, 
  Calendar, 
  Zap, 
  Cpu, 
  FileText, 
  Eye, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  RefreshCw, 
  X,
  Play,
  ShieldAlert,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRESETS, PresetScene, FilmTreatment } from './data/presets';

// Cohesive animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
  }
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

// Prohibited keywords list for content safety (allows romantic/kissing, blocks explicit sexual/sensual)
const BLOCKED_KEYWORDS = [
  'sex', 'sexual', 'sensual play', 'nude', 'naked', 'erotic', 'porn', 'xxx', 'intercourse', 'striptease',
  'genital', 'penis', 'vagina', 'clitoris', 'blowjob', 'handjob', 'orgasm', 'masturbate', 'penetration',
  'sensual massage', 'escort', 'incest', 'bestiality', 'pedophilia', 'rape', 'harassment', 'sensual touch',
  'make love', 'making love', 'foreplay', 'lustful', 'sensuous body', 'nakedness', 'nudity', 'stripper',
  'bondage', 'fetish', 'sensual scene', 'coitus', 'ejaculation', 'orgasmic', 'panties', 'underwear', 'lingerie model'
];

function isPromptViolatingPolicy(promptText: string): { isViolating: boolean; reason?: string } {
  const text = (promptText || '').toLowerCase();

  for (const keyword of BLOCKED_KEYWORDS) {
    if (text.includes(keyword)) {
      return {
        isViolating: true,
        reason: `Restricted term detected: "${keyword}". Our Creative Guidelines strictly prohibit explicit, sexual, or highly sensual descriptions.`
      };
    }
  }

  if (/\b(sexy|naked|erotic|pornographic|bedroom action|heavy petting)\b/i.test(text)) {
    return {
      isViolating: true,
      reason: "Our Creative Guidelines strictly prohibit explicit, highly sensual, or sexualized content."
    };
  }

  return { isViolating: false };
}

export default function App() {
  // Application State
  const [activePreset, setActivePreset] = useState<PresetScene>(PRESETS[0]);
  const [prompt, setPrompt] = useState<string>(PRESETS[0].prompt);
  const [genre, setGenre] = useState<string>(PRESETS[0].genre);
  const [lighting, setLighting] = useState<string>(PRESETS[0].lighting);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  
  // Active generated treatment state
  const [currentTreatment, setCurrentTreatment] = useState<FilmTreatment>(PRESETS[0].treatment);
  const [currentImage, setCurrentImage] = useState<string | null>(PRESETS[0].coverImage);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Copy Feedback state
  const [copiedColorIndex, setCopiedColorIndex] = useState<number | null>(null);
  const [copiedDoc, setCopiedDoc] = useState<boolean>(false);

  // Subscription Pricing States
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutName, setCheckoutName] = useState<string>('');
  const [checkoutCard, setCheckoutCard] = useState<string>('');
  const [checkoutEmail, setCheckoutEmail] = useState<string>('');
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);

  // Subscription status (persisted in localStorage)
  const [userSubscription, setUserSubscription] = useState<{
    active: boolean;
    planName: string;
    email: string;
    subscriberName: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('NOIRGEN_USER_SUBSCRIPTION');
      return saved ? JSON.parse(saved) : { active: false, planName: '', email: '', subscriberName: '' };
    } catch {
      return { active: false, planName: '', email: '', subscriberName: '' };
    }
  });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Image zoom modal
  const [showZoomModal, setShowZoomModal] = useState<boolean>(false);

  // Content moderation and safety policy state
  const [violationCount, setViolationCount] = useState<number>(() => {
    return Number(localStorage.getItem('NOIRGEN_VIOLATION_COUNT') || '0');
  });
  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [violationReason, setViolationReason] = useState<string>('');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showCancelledModal, setShowCancelledModal] = useState<boolean>(false);
  const [cancelledEmailAddress, setCancelledEmailAddress] = useState<string>('');

  // Sync state when active preset changes
  const handleSelectPreset = (preset: PresetScene) => {
    setActivePreset(preset);
    setPrompt(preset.prompt);
    setGenre(preset.genre);
    setLighting(preset.lighting);
    setCurrentTreatment(preset.treatment);
    setCurrentImage(preset.coverImage);
    setError(null);
  };

  // Generate treatment via Fireworks AI API
  const handleGenerateTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    
    // Check if the user is authorized to generate custom treatments.
    if (!userSubscription.active) {
      setError("Subscription Required: To generate custom lookbook treatments via the active cinematic AI engine, please choose a plan from the pricing table below. Subscribing instantly unlocks high-fidelity generation.");
      setLoading(false);
      // Scroll smoothly to pricing section
      const pricingEl = document.getElementById('pricing');
      if (pricingEl) {
        pricingEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Policy Moderation Check
    const safetyCheck = isPromptViolatingPolicy(prompt);
    if (safetyCheck.isViolating) {
      setLoading(false);
      const newCount = violationCount + 1;
      
      if (newCount >= 2) {
        const userEmail = userSubscription.email || 'director@indiecinema.com';
        setCancelledEmailAddress(userEmail);
        
        // Cancel subscription
        const resetSub = { active: false, planName: '', email: '', subscriberName: '' };
        setUserSubscription(resetSub);
        localStorage.setItem('NOIRGEN_USER_SUBSCRIPTION', JSON.stringify(resetSub));
        
        // Reset violation count
        setViolationCount(0);
        localStorage.setItem('NOIRGEN_VIOLATION_COUNT', '0');
        
        setShowCancelledModal(true);
      } else {
        setViolationCount(newCount);
        localStorage.setItem('NOIRGEN_VIOLATION_COUNT', String(newCount));
        setViolationReason(safetyCheck.reason || 'Restricted content detected.');
        setShowViolationModal(true);
      }
      return;
    }

    // Simulate high-fidelity cinematic loading steps
    const steps = [
      'Deconstructing narrative prompt...',
      'Mapping visual lighting cues (Lumen/Raytracing)...',
      'Configuring lens profiles (Cooke Anamorphic)...',
      'Baking 3D HDRI reflection maps...',
      'Mixing key, fill, and rim color values...',
      'Formulating digital VFX fog coefficients...',
      'Compiling final lookbook treatment...'
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setLoadingStep(steps[stepIdx]);
    }, 2200);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          settings: {
            genre,
            lighting,
            aspect_ratio: aspectRatio
          },
          isSubscribed: userSubscription.active,
          subscriberEmail: userSubscription.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with Fireworks AI API.');
      }

      if (data.success) {
        setCurrentTreatment(data.treatment);
        setCurrentImage(data.image || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop'); // default placeholder if image failed
        setActivePreset({
          id: 'custom-generation',
          name: data.treatment.mood.title,
          genre,
          lighting,
          prompt,
          coverImage: data.image || '',
          treatment: data.treatment
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during lookbook generation.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // Copy Color Hex code to Clipboard
  const handleCopyColor = (hex: string, idx: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedColorIndex(idx);
    setTimeout(() => setCopiedColorIndex(null), 1500);
  };

  // Trigger browser Print-friendly view for Treatment PDF exporting
  const handleExportPDF = () => {
    window.print();
  };

  // FAQ list
  const faqs = [
    {
      q: "What is NoirGen AI?",
      a: "NoirGen AI is an elite pre-production digital lookbook assistant designed for independent filmmakers, directors of photography, and VFX supervisors. It converts simple text scripts or scene prompts into full-scale, production-ready aesthetic profiles, detailing camera formats, precise lenses, exact lighting temperatures, color swatches, and 3D engine/VFX rendering workflows."
    },
    {
      q: "How does the Fireworks AI integration work?",
      a: "The suite utilizes Fireworks AI's state-of-the-art inference engine. We use Llama 3.1 70B Instruct to perform ultra-fast cinematic structure parsing and logic, and the FLUX-1 Schnell model to generate a pristine widescreen pre-production frame matching the exact color temperature and lens configuration."
    },
    {
      q: "Can I use the app without a subscription?",
      a: "Absolutely! NoirGen AI comes pre-loaded with four high-fidelity production treatments (Neo-Tokyo Cyberpunk, Obsidian Desert Sci-Fi, Desaturated Moss Folk Horror, and 1970s Golden Hour Thriller). You can explore, copy, and export these treatments immediately. To run custom prompts and generate your own bespoke pre-production guides, you simply need to purchase a subscription plan."
    },
    {
      q: "Can the 3D VFX setup be imported into Unreal Engine or Blender?",
      a: "Yes! The VFX and 3D guidelines recommend actual engine attributes (such as volumetric scattering, height fog coefficients, HDRI structures, and render roughness). You can copy these directly into Unreal Engine, Blender, or Maya to recreate the exact atmosphere in your virtual environment."
    },
    {
      q: "What benefits do the subscription tiers offer?",
      a: "Subscriptions cater to different project lengths, starting from 1 month (ideal for single-project indie filmmakers preparing their pitch deck) to 1 year (ideal for production houses maintaining an active pre-production pipeline). Subscribers get premium lookbook outputs, unlimited high-res image generation, PDF exports, and 3D metadata exports."
    }
  ];

  return (
    <div className="min-h-screen bg-noir-950 text-gray-200 selection:bg-amber-orange selection:text-white font-sans relative overflow-x-hidden">
      
      {/* Background Ambience / Glow - Matching Reference Image */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none overflow-hidden z-0">
        {/* Dynamic Warm Glowing Orb Header */}
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[120%] aspect-square rounded-full bg-gradient-to-b from-amber-500/20 via-orange-600/5 to-transparent blur-[120px]" />
        
        {/* Beautiful Orange/Gold wave geometries representing the abstract structures in reference image */}
        <div className="absolute top-[80px] left-[-20%] w-[140%] h-[180px] rounded-[50%] bg-gradient-to-r from-orange-500/10 via-amber-600/8 to-red-600/5 blur-[50px] rotate-[-6deg] transform" />
        <div className="absolute top-[180px] right-[-10%] w-[80%] h-[120px] rounded-[50%] bg-gradient-to-l from-orange-400/5 via-amber-500/5 to-transparent blur-[40px] rotate-[10deg] transform" />
      </div>

      {/* Floating Header */}
      <header className="sticky top-0 z-50 bg-noir-950/85 backdrop-blur-md border-b border-noir-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-orange to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Film className="w-5.5 h-5.5 text-noir-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Noir<span className="text-amber-orange">Gen</span> AI
              </span>
              <span className="block text-[9px] text-gray-500 font-mono tracking-wider -mt-1 uppercase">Pre-Prod Companion</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#presets" className="hover:text-white transition-colors">Presets</a>
            <a href="#suite" className="hover:text-white transition-colors">Interactive Suite</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a 
              href="#rules" 
              className="hover:text-white text-amber-orange/90 flex items-center gap-1 transition-colors text-sm font-mono uppercase tracking-wider"
            >
              <Scale className="w-3.5 h-3.5" /> Rules
            </a>
          </nav>

          {/* Call to Action & Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a 
              href="#rules"
              className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg border border-noir-700 bg-noir-800 hover:bg-noir-700 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Creative Guidelines & Rules"
            >
              <Scale className="w-3.5 h-3.5 text-amber-orange" />
              <span>Rules</span>
            </a>

            {userSubscription.active ? (
              <div className="flex items-center gap-2.5 bg-amber-950/40 border border-amber-500/30 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs font-semibold text-amber-400">
                <Zap className="w-3.5 h-3.5 text-amber-orange fill-amber-orange animate-pulse" />
                <span className="hidden sm:inline">{userSubscription.planName}</span>
                <span className="sm:hidden">Pro</span>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to cancel your active NoirGen subscription? This will revoke access to the developer's shared AI API engine.")) {
                      const resetSub = { active: false, planName: '', email: '', subscriberName: '' };
                      setUserSubscription(resetSub);
                      localStorage.setItem('NOIRGEN_USER_SUBSCRIPTION', JSON.stringify(resetSub));
                    }
                  }}
                  className="ml-1 text-gray-500 hover:text-red-400 hover:underline transition-colors font-mono text-[10px]"
                  title="Cancel active subscription"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <a 
                href="#pricing" 
                className="bg-gradient-to-r from-amber-orange to-amber-500 hover:opacity-95 text-noir-950 font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-95 animate-pulse"
                id="btn-nav-get-started"
              >
                Subscribe
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">

        {/* Hero Landing Stage */}
        <motion.section 
          id="about" 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative no-print"
        >
          
          {/* Tag badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-950/40 border border-orange-500/20 text-[11px] font-mono text-amber-400 mb-8 tracking-wide uppercase shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AMD ACT II HACKATHON ENTRY</span>
            <span className="text-gray-600">•</span>
            <span>POWERED BY FIREWORKS AI</span>
          </motion.div>

          {/* Main Cinematic Title */}
          <motion.h1 
            variants={itemVariants}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6"
          >
            Transform your Script into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-orange">
              Powerful Visual Treatments
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p 
            variants={itemVariants}
            className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          >
            The premium pre-production assistant for independent filmmakers, directors of photography, and VFX designers. Generate professional lighting configurations, precise camera lenses, color palettes, and 3D environment workflows in seconds.
          </motion.p>

          {/* Action Call buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <a 
              href="#suite" 
              className="w-full sm:w-auto bg-gradient-to-r from-amber-orange to-amber-500 hover:opacity-95 hover:scale-[1.02] text-noir-950 font-semibold px-8 py-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-noir-950" />
              Enter Interactive Suite
            </a>
            <a 
              href="#pricing" 
              className="w-full sm:w-auto bg-noir-900 border border-noir-700 text-white hover:bg-noir-800 hover:border-noir-600 font-medium px-8 py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4 text-amber-orange" />
              View Subscription Plans
            </a>
          </motion.div>

          {/* Showcase Partner Badges */}
          <motion.div 
            variants={itemVariants}
            className="border-t border-b border-noir-800/60 py-6 max-w-5xl mx-auto"
          >
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-4">Supported Lookbook Configurations</p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-45">
              <div className="font-display text-xs font-bold tracking-wider text-white hover:opacity-100 transition-opacity">UNREAL ENGINE 5.4</div>
              <div className="font-display text-xs font-bold tracking-wider text-white hover:opacity-100 transition-opacity">BLENDER CYCLES</div>
              <div className="font-display text-xs font-bold tracking-wider text-white hover:opacity-100 transition-opacity">ARRI ALEXA LF</div>
              <div className="font-display text-xs font-bold tracking-wider text-white hover:opacity-100 transition-opacity">RED MONSTRO</div>
              <div className="font-display text-xs font-bold tracking-wider text-white hover:opacity-100 transition-opacity">DAVINCI RESOLVE</div>
            </div>
          </motion.div>
        </motion.section>

        {/* Curated Interactive Presets */}
        <section id="presets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 no-print">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-amber-orange mb-1 font-mono text-xs uppercase tracking-wider">
                <Palette className="w-4 h-4" />
                <span>Curated Lookbooks</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Select a Cinematic Template
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Explore beautifully organized mock treatments instantly without needing an active API key.
              </p>
            </div>
            
            <div className="text-xs text-gray-500 font-mono mt-2 md:mt-0 bg-noir-900 px-3 py-1.5 rounded-lg border border-noir-800">
              Selected: <span className="text-white font-semibold">{activePreset.name}</span>
            </div>
          </div>

          {/* Presets Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {PRESETS.map((preset) => {
              const isActive = activePreset.id === preset.id;
              return (
                <motion.div 
                  key={preset.id}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer bg-noir-900 ${
                    isActive 
                      ? 'border-amber-orange shadow-lg shadow-orange-500/5 scale-[1.02]' 
                      : 'border-noir-800 hover:border-noir-700'
                  }`}
                  id={`preset-${preset.id}`}
                >
                  {/* Preset Image */}
                  <div className="h-40 w-full relative overflow-hidden">
                    <img 
                      src={preset.coverImage} 
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-noir-900 via-noir-900/40 to-transparent" />
                    
                    {/* Badges */}
                    <span className="absolute top-3 left-3 bg-noir-950/80 backdrop-blur-md text-[10px] text-amber-orange font-mono px-2 py-0.5 rounded-md border border-noir-800">
                      {preset.genre}
                    </span>
                  </div>

                  {/* Preset Text */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-orange transition-colors">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {preset.prompt}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-noir-800 pt-3">
                      <div className="flex gap-1">
                        {preset.treatment.palette.colors.map((c, i) => (
                          <span 
                            key={i} 
                            style={{ backgroundColor: c.hex }}
                            className="w-3.5 h-3.5 rounded-full border border-noir-950 block" 
                            title={`${c.name} (${c.hex})`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">
                        {preset.treatment.camera.focalLength.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator bar */}
                  {isActive && (
                    <motion.div 
                      layoutId="activePresetIndicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-orange to-amber-500" 
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Core Interactive Production Suite */}
        <section id="suite" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          
          {/* Subtle Decorative Helix Wave matching reference style */}
          <div className="absolute right-0 bottom-[-100px] w-96 h-96 bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Stage Header */}
          <div className="border-t border-noir-800 pt-12 mb-10 no-print">
            <div className="flex items-center gap-2 text-amber-orange mb-1 font-mono text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              <span>Interactive Engine</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-white tracking-tight">
              NoirGen Pre-Production Suite
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Input script requirements below to prompt the Fireworks AI engine, or continue customizing the active template lookbook.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Configurator form - Column left */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="lg:col-span-5 bg-noir-900 border border-noir-800 rounded-2xl p-6 shadow-xl relative no-print"
            >
              <h3 className="text-base font-semibold text-white mb-4 pb-3 border-b border-noir-800 flex items-center justify-between">
                <span>Lookbook Controller</span>
                <span className="text-[10px] font-mono text-gray-500 bg-noir-950 px-2.5 py-1 rounded-md border border-noir-800">
                  Customization Mode
                </span>
              </h3>

              <form onSubmit={handleGenerateTreatment} className="space-y-5">
                
                 {/* Scene description prompt */}
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                    <span>Scene Prompt / Script Excerpt</span>
                    <span className="text-gray-600 text-[10px]">{prompt.length} chars</span>
                  </label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your cinematic scene in detail..."
                    rows={4}
                    className="w-full bg-noir-950 text-white border border-noir-700 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-amber-orange focus:ring-1 focus:ring-amber-orange/40"
                    id="input-scene-prompt"
                  />
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span className="text-amber-500/80">Romantic & kissing scene setups are allowed.</span>
                    <button 
                      type="button" 
                      onClick={() => setShowRulesModal(true)} 
                      className="text-amber-orange hover:underline font-mono uppercase font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Scale className="w-3 h-3 text-amber-orange" /> Read Rules
                    </button>
                  </div>
                </div>

                {/* Grid inputs for configurations */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Genre */}
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase tracking-wider">
                      Genre Treatment
                    </label>
                    <select 
                      value={genre} 
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full bg-noir-950 text-white border border-noir-700 rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-orange"
                      id="select-genre"
                    >
                      <option value="Cyberpunk Noir">Cyberpunk Noir</option>
                      <option value="Classic Noir">Classic Film Noir</option>
                      <option value="Sci-Fi Post-Apocalyptic">Sci-Fi Post-Apocalypse</option>
                      <option value="Retro 1970s Thriller">Retro 1970s Thriller</option>
                      <option value="Folk Horror">Folk Horror</option>
                      <option value="Neo-Western">Neo-Western</option>
                      <option value="Industrial Dark Fantasy">Dark Fantasy</option>
                      <option value="Dystopian Surveillance">Dystopian Thriller</option>
                    </select>
                  </div>

                  {/* Lighting profile */}
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase tracking-wider">
                      Lighting Base
                    </label>
                    <select 
                      value={lighting} 
                      onChange={(e) => setLighting(e.target.value)}
                      className="w-full bg-noir-950 text-white border border-noir-700 rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-orange"
                      id="select-lighting"
                    >
                      <option value="Chiaroscuro Neon">Neon Chiaroscuro</option>
                      <option value="Low-Key High Contrast">Low-Key (Classic Drama)</option>
                      <option value="Overcast Sandstorm">Overcast Dust Storm</option>
                      <option value="Overcast Nordic Noon">Flat Overcast Highlands</option>
                      <option value="Low-Sun Golden Hour">Low-Sun Golden Hour</option>
                      <option value="Tungsten Backlit Shadows">Tungsten Backlight</option>
                      <option value="Hyper-Vibrant Cyber Glow">Vibrant Cyber Glow</option>
                      <option value="Sub-surface Ambient Volumetric">Volumetric Ambient</option>
                    </select>
                  </div>

                  {/* Aspect ratio */}
                  <div className="col-span-2">
                    <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase tracking-wider">
                      Aspect Ratio (Image Resolution)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { ratio: '16:9', label: '16:9', desc: 'Cinematic' },
                        { ratio: '2.39:1', label: '2.39:1', desc: 'Scope' },
                        { ratio: '4:3', label: '4:3', desc: 'Vintage' },
                        { ratio: '1:1', label: '1:1', desc: 'Square' }
                      ].map((item) => (
                        <button 
                          key={item.ratio}
                          type="button"
                          onClick={() => setAspectRatio(item.ratio)}
                          className={`py-2 px-1 rounded-lg border text-center transition-all ${
                            aspectRatio === item.ratio 
                              ? 'border-amber-orange bg-orange-950/20 text-white' 
                              : 'border-noir-700 bg-noir-950 text-gray-400 hover:text-white hover:border-noir-600'
                          }`}
                        >
                          <div className="text-xs font-semibold">{item.label}</div>
                          <div className="text-[8px] font-mono opacity-60 uppercase">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subscription / AI Engine Notice */}
                {!userSubscription.active ? (
                  <div className="p-3 bg-amber-950/15 border border-amber-500/20 rounded-xl flex gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-orange shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-medium text-amber-300">Curated Library Mode Active</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
                        You are exploring pre-loaded high-fidelity treatments. To generate your own bespoke narrative pre-production guides, please purchase an active subscription plan below.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-medium text-emerald-300">Cinematic AI Engine Ready</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
                        Your active {userSubscription.planName} has full access. Enter custom scripts to generate professional lookbooks instantly.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit and Action Buttons */}
                <div className="pt-3 flex gap-3">
                  <button 
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className={`flex-1 bg-gradient-to-r from-amber-orange to-amber-500 disabled:from-noir-800 disabled:to-noir-800 disabled:text-gray-500 text-noir-950 font-bold py-3.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] cursor-pointer`}
                    id="btn-generate-lookbook"
                  >
                    {loading ? (
                      <RefreshCw className="w-4.5 h-4.5 animate-spin text-noir-950" />
                    ) : (
                      <Sparkles className="w-4.5 h-4.5 text-noir-950 fill-noir-950" />
                    )}
                    {loading ? 'AI GEN RUNNING...' : 'GENERATE TREATMENT'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSelectPreset(PRESETS[0])}
                    className="bg-noir-950 border border-noir-700 text-gray-400 hover:text-white px-4 rounded-xl hover:bg-noir-800 transition-colors"
                    title="Reset to Template"
                  >
                    Reset
                  </button>
                </div>
              </form>

              {/* PDF Print/Export action inside Controller */}
              <div className="mt-6 pt-5 border-t border-noir-800/80 flex items-center justify-between text-xs text-gray-500">
                <span className="font-mono">Ready for Pitch Deck</span>
                <button 
                  onClick={handleExportPDF}
                  className="text-amber-orange hover:text-orange-400 font-semibold flex items-center gap-1.5 hover:underline"
                  id="btn-print-treatment"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Lookbook PDF
                </button>
              </div>
            </motion.div>

            {/* AI Output Lookbook Treatment - Column right */}
            <div className="lg:col-span-7 space-y-6 print-page">
              
              {/* If Loading state */}
              {loading && (
                <div className="bg-noir-900 border border-noir-800 rounded-2xl p-12 text-center h-[520px] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                  
                  {/* Animated rotating gear or circular gradient */}
                  <div className="w-16 h-16 rounded-full border-4 border-noir-800 border-t-amber-orange animate-spin mb-6" />
                  
                  <h4 className="text-base font-bold text-white tracking-tight mb-2">
                    NoirGen AI Consultation Active
                  </h4>
                  <p className="text-xs text-gray-400 font-mono animate-pulse max-w-sm">
                    {loadingStep}
                  </p>
                  
                  <div className="mt-8 text-[10px] text-gray-500 max-w-xs leading-normal">
                    Llama 3.1 is drafting lens settings & color weights. Flux is baking widescreen atmosphere.
                  </div>
                </div>
              )}

              {/* If Error state */}
              {error && !loading && (
                <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-white">Generation Failed</h4>
                  <p className="text-xs text-red-300 mt-1 max-w-md mx-auto leading-relaxed">
                    {error}
                  </p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <button 
                      onClick={() => setError(null)}
                      className="px-4 py-2 bg-noir-800 text-xs font-semibold rounded-lg text-white hover:bg-noir-700"
                    >
                      Dismiss
                    </button>
                    {!userSubscription.active && (
                      <a 
                        href="#pricing"
                        className="px-4 py-2 bg-amber-orange text-xs font-bold rounded-lg text-noir-950 hover:opacity-90 flex items-center justify-center"
                      >
                        View Pricing Plans
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Render Treatment Profile */}
              {!loading && !error && (
                <motion.div 
                  key={currentTreatment.id || 'treatment-profile'}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="space-y-6"
                >
                  
                  {/* Cinematic Render Image Frame */}
                  <div className="bg-noir-900 border border-noir-800 rounded-2xl overflow-hidden shadow-2xl group relative">
                    <div className="aspect-video w-full bg-noir-950 relative overflow-hidden flex items-center justify-center">
                      {currentImage ? (
                        <>
                          <img 
                            src={currentImage} 
                            alt={currentTreatment.mood.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-all"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-noir-900/80 via-noir-900/10 to-transparent" />
                        </>
                      ) : (
                        <div className="text-center p-6 text-gray-500 font-mono">
                          <Film className="w-12 h-12 text-noir-800 mx-auto mb-2" />
                          <p className="text-xs">No Scene Frame Rendered</p>
                        </div>
                      )}

                      {/* Floating overlay attributes */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-amber-orange uppercase tracking-wider bg-noir-950/85 backdrop-blur-md px-2 py-0.5 rounded border border-noir-800 inline-block mb-1.5">
                            Visual Composition Frame
                          </span>
                          <h4 className="text-white text-sm font-bold drop-shadow-md">
                            {currentTreatment.mood.title}
                          </h4>
                        </div>
                        {currentImage && (
                          <div className="flex gap-2 no-print">
                            <button 
                              onClick={() => setShowZoomModal(true)}
                              className="p-2 bg-noir-950/80 hover:bg-noir-950 backdrop-blur-md rounded-lg text-gray-300 hover:text-white border border-noir-800 transition-all cursor-pointer"
                              title="Zoom Frame"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a 
                              href={currentImage} 
                              download={`${currentTreatment.mood.title}.jpg`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-noir-950/80 hover:bg-noir-950 backdrop-blur-md rounded-lg text-gray-300 hover:text-white border border-noir-800 transition-all flex items-center justify-center cursor-pointer"
                              title="Download JPEG Image"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabbed / Bento layout for cinematic treatments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Visual Mood & Atmosphere Card */}
                    <motion.div 
                      whileHover={{ y: -4, borderColor: 'rgba(245, 158, 11, 0.25)' }}
                      transition={{ duration: 0.2 }}
                      className="bg-noir-900 border border-noir-800 rounded-xl p-5 shadow transition-colors duration-300"
                    >
                      <div className="flex items-center gap-2 text-amber-orange mb-3 pb-2 border-b border-noir-800/60">
                        <Sparkles className="w-4 h-4" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Atmospheric Mood & Tone</h4>
                      </div>
                      
                      <div className="space-y-3.5">
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Psychological Tonality</span>
                          <p className="text-xs font-semibold text-white mt-0.5">{currentTreatment.mood.tonality}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Atmosphere & References</span>
                          <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{currentTreatment.mood.description}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Lighting Design</span>
                          <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{currentTreatment.mood.lighting}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Key Vibe Nodes</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {currentTreatment.mood.vibeElements.map((el, i) => (
                              <span key={i} className="text-[10px] bg-noir-950 text-gray-400 px-2 py-0.5 rounded border border-noir-800 font-mono">
                                • {el}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Color Palette Card */}
                    <motion.div 
                      whileHover={{ y: -4, borderColor: 'rgba(245, 158, 11, 0.25)' }}
                      transition={{ duration: 0.2 }}
                      className="bg-noir-900 border border-noir-800 rounded-xl p-5 shadow relative transition-colors duration-300"
                    >
                      <div className="flex items-center gap-2 text-amber-orange mb-3 pb-2 border-b border-noir-800/60">
                        <Palette className="w-4 h-4" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Colorist Recommendations</h4>
                      </div>

                      <div className="space-y-4">
                        <p className="text-xs text-gray-300 leading-relaxed">
                          {currentTreatment.palette.reasoning}
                        </p>

                        {/* Interactive Color Blocks */}
                        <div className="space-y-2">
                          <span className="block text-[10px] text-gray-500 font-mono uppercase mb-2">Widescreen Palette (Click to Copy)</span>
                          <div className="grid grid-cols-1 gap-2">
                            {currentTreatment.palette.colors.map((color, idx) => {
                              const isCopied = copiedColorIndex === idx;
                              return (
                                <motion.div 
                                  key={idx}
                                  whileHover={{ x: 4, borderColor: 'rgba(245, 158, 11, 0.35)' }}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() => handleCopyColor(color.hex, idx)}
                                  className="group/item flex items-center justify-between p-2 rounded-lg bg-noir-950 hover:bg-noir-950/75 border border-noir-800 hover:border-noir-700 transition-all cursor-pointer"
                                  title={`Copy hex: ${color.hex}`}
                                  id={`color-swatch-${idx}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div 
                                      style={{ backgroundColor: color.hex }}
                                      className="w-8 h-8 rounded-md border border-noir-800 shadow-inner shrink-0"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-white">{color.name}</span>
                                        <span className="text-[10px] font-mono text-amber-orange">{color.hex}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-400 line-clamp-1 leading-normal">{color.description}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="pr-1">
                                    {isCopied ? (
                                      <span className="text-[9px] font-mono text-emerald-400 font-semibold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                        COPIED!
                                      </span>
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-gray-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Camera & Lens Recommendation Card */}
                    <motion.div 
                      whileHover={{ y: -4, borderColor: 'rgba(245, 158, 11, 0.25)' }}
                      transition={{ duration: 0.2 }}
                      className="bg-noir-900 border border-noir-800 rounded-xl p-5 shadow transition-colors duration-300"
                    >
                      <div className="flex items-center gap-2 text-amber-orange mb-3 pb-2 border-b border-noir-800/60">
                        <Camera className="w-4 h-4" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Cinematographer Specifications</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Target Camera Format</span>
                          <p className="text-xs font-bold text-white mt-0.5">{currentTreatment.camera.format}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Recommended Lens</span>
                          <p className="text-xs text-gray-200 mt-0.5 leading-tight">{currentTreatment.camera.lens}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Focal Length</span>
                          <p className="text-xs text-gray-200 mt-0.5 leading-tight">{currentTreatment.camera.focalLength}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Optic Aperture</span>
                          <p className="text-xs text-gray-200 mt-0.5 leading-tight">{currentTreatment.camera.aperture}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Composition Rule</span>
                          <p className="text-xs text-gray-200 mt-0.5 leading-tight">{currentTreatment.camera.composition}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Choreography & Camera Motion</span>
                          <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{currentTreatment.camera.movement}</p>
                        </div>
                        <div className="col-span-2 bg-noir-950 p-3 rounded-lg border border-noir-800">
                          <span className="block text-[9px] text-amber-orange font-mono uppercase tracking-wider mb-1">Director's Blocking Memo</span>
                          <p className="text-xs text-gray-300 leading-relaxed italic">
                            "{currentTreatment.camera.directorNotes}"
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* 3D VFX & HDRI recommendation */}
                    <motion.div 
                      whileHover={{ y: -4, borderColor: 'rgba(245, 158, 11, 0.25)' }}
                      transition={{ duration: 0.2 }}
                      className="bg-noir-900 border border-noir-800 rounded-xl p-5 shadow transition-colors duration-300"
                    >
                      <div className="flex items-center gap-2 text-amber-orange mb-3 pb-2 border-b border-noir-800/60">
                        <Layers className="w-4 h-4" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider">3D VFX & Pipeline Directives</h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Dome HDRI Light Reference</span>
                          <p className="text-xs text-white font-medium mt-0.5">{currentTreatment.vfx3d.hdriSetup}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">3D Engine Pipeline (Unreal/Blender)</span>
                          <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{currentTreatment.vfx3d.softwareWorkflow}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Particle & Volumetric Simulations</span>
                          <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{currentTreatment.vfx3d.vfxElements}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-500 font-mono uppercase">Atmospheric Height Fog Settings</span>
                          <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{currentTreatment.vfx3d.ambientSetup}</p>
                        </div>
                      </div>
                    </motion.div>

                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </section>

        {/* Subscription Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 no-print relative">
          
          {/* Back light */}
          <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-80 h-80 bg-orange-500/5 rounded-full blur-[90px] pointer-events-none" />

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-amber-orange font-mono text-xs uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              <span>Subscription Suite</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Pre-Production Subscription Plans
            </h2>
            <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">
              Get unlimited access to Fireworks AI lookbook generation, high-res FLUX image exports, and custom 3D scene data.
            </p>

            {/* Toggle Billing Period */}
            <div className="inline-flex items-center mt-6 p-1 rounded-xl bg-noir-900 border border-noir-800">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-amber-orange text-noir-950' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingCycle('annually')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annually' 
                    ? 'bg-amber-orange text-noir-950' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annually (Save 20%)
                <span className="text-[9px] bg-noir-950 text-amber-orange font-bold font-mono px-1.5 py-0.5 rounded">
                  PRO
                </span>
              </button>
            </div>
          </div>

          {/* Subscriptions Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            
            {/* 1 Month Plan */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-noir-900 border border-noir-800 rounded-2xl p-6 flex flex-col justify-between hover:border-noir-700 transition-all relative"
            >
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Single project pitch</span>
                <h3 className="text-base font-bold text-white mt-1">1-Month Starter</h3>
                
                <div className="my-5">
                  <span className="font-display text-3xl font-extrabold text-white">
                    ${billingCycle === 'monthly' ? '29' : '23'}
                  </span>
                  <span className="text-xs text-gray-500 font-mono"> / month</span>
                </div>

                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Ideal for independent directors preparing a single short film or visual pitch deck.
                </p>

                <ul className="space-y-2.5 border-t border-noir-850 pt-5 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>30 custom AI Lookbooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>FLUX-1 Widescreen frame generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>Print PDF pitch exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>HDRI & VFX pipeline parameters</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => setSelectedPlan('1-Month Starter')}
                className="w-full bg-noir-950 hover:bg-noir-850 border border-noir-700 text-white font-semibold py-2.5 rounded-lg text-xs mt-8 transition-colors"
                id="btn-subscribe-1-month"
              >
                Select Plan
              </button>
            </motion.div>

            {/* 3 Month Plan - Popular */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-noir-900 border-2 border-amber-orange rounded-2xl p-6 flex flex-col justify-between shadow-xl shadow-orange-500/5 relative"
            >
              <span className="absolute top-0 right-6 -translate-y-1/2 bg-amber-orange text-noir-950 text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>

              <div>
                <span className="text-[10px] font-mono text-amber-orange uppercase">Indie slate prep</span>
                <h3 className="text-base font-bold text-white mt-1">3-Month Producer</h3>
                
                <div className="my-5">
                  <span className="font-display text-3xl font-extrabold text-white">
                    ${billingCycle === 'monthly' ? '79' : '63'}
                  </span>
                  <span className="text-xs text-gray-500 font-mono"> / 3 mos</span>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    (~${billingCycle === 'monthly' ? '26' : '21'}/mo value)
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Best for small indie crews working through storyboard, color script, and lens configurations.
                </p>

                <ul className="space-y-2.5 border-t border-noir-850 pt-5 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span className="font-semibold text-white">100 custom AI Lookbooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>SDXL + FLUX Widescreen frames</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>Interactive color swatch palette</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>3D Unreal Engine integration notes</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => setSelectedPlan('3-Month Producer')}
                className="w-full bg-gradient-to-r from-amber-orange to-amber-500 text-noir-950 font-bold py-2.5 rounded-lg text-xs mt-8 transition-opacity hover:opacity-95"
                id="btn-subscribe-3-month"
              >
                Get Started Now
              </button>
            </motion.div>

            {/* 6 Month Plan */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-noir-900 border border-noir-800 rounded-2xl p-6 flex flex-col justify-between hover:border-noir-700 transition-all relative"
            >
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Active commercial house</span>
                <h3 className="text-base font-bold text-white mt-1">6-Month Studio Pro</h3>
                
                <div className="my-5">
                  <span className="font-display text-3xl font-extrabold text-white">
                    ${billingCycle === 'monthly' ? '139' : '111'}
                  </span>
                  <span className="text-xs text-gray-500 font-mono"> / 6 mos</span>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    (~${billingCycle === 'monthly' ? '23' : '18'}/mo value)
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Tailored for directors of photography handling multiple commercials and short project slates.
                </p>

                <ul className="space-y-2.5 border-t border-noir-850 pt-5 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span className="font-semibold text-white">300 custom AI Lookbooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>Unlimited color swatch copy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>Full focal-length calculation sheets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>Export layout and pipeline logs</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => setSelectedPlan('6-Month Studio Pro')}
                className="w-full bg-noir-950 hover:bg-noir-850 border border-noir-700 text-white font-semibold py-2.5 rounded-lg text-xs mt-8 transition-colors"
                id="btn-subscribe-6-month"
              >
                Select Plan
              </button>
            </motion.div>

            {/* 1 Year Plan */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-noir-900 border border-noir-800 rounded-2xl p-6 flex flex-col justify-between hover:border-noir-700 transition-all relative"
            >
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">Infinite Slate Prep</span>
                <h3 className="text-base font-bold text-white mt-1">1-Year Elite</h3>
                
                <div className="my-5">
                  <span className="font-display text-3xl font-extrabold text-white">
                    ${billingCycle === 'monthly' ? '249' : '199'}
                  </span>
                  <span className="text-xs text-gray-500 font-mono"> / year</span>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    (~${billingCycle === 'monthly' ? '20' : '16'}/mo value)
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  The ultimate pre-production toolset for boutique and large-scale production houses.
                </p>

                <ul className="space-y-2.5 border-t border-noir-850 pt-5 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span className="font-semibold text-white">Unlimited lookbook treatments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>Highest priority Fireworks rendering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>Unreal Engine 5.4 substrate outputs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-orange shrink-0" />
                    <span>Shared team workspace profile</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => setSelectedPlan('1-Year Elite')}
                className="w-full bg-noir-950 hover:bg-noir-850 border border-noir-700 text-white font-semibold py-2.5 rounded-lg text-xs mt-8 transition-colors"
                id="btn-subscribe-1-year"
              >
                Select Plan
              </button>
            </motion.div>

          </motion.div>
        </section>

        {/* Creative Guidelines & Content Rules Section */}
        <section id="rules" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 no-print border-t border-noir-900/60">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 text-amber-orange font-mono text-xs uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" />
              <span>Creative Guidelines</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Platform Rules & Compliance
            </h2>
            <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
              Please review our creative and compliance guidelines to ensure safe and responsible use of AI lookbook generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Permitted content */}
            <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-noir-850 pb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Permitted Material</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                You have full creative freedom to draft pre-production treatments across all primary genres:
              </p>
              <ul className="space-y-2.5 text-xs text-gray-300 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Multiple Genres:</strong> Horror, Suspense, Sci-Fi, Thriller, Historical Drama, Comedy, and Action.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Romantic & Kissing:</strong> You are fully allowed to configure sets, lighting temperatures, and lens setups for kissing, hugging, and intimate dramatic scenes.</span>
                </li>
              </ul>
            </div>

            {/* Prohibited content */}
            <div className="bg-noir-900 border border-noir-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-noir-850 pb-3">
                <div className="w-8 h-8 rounded-lg bg-red-950/40 text-red-400 border border-red-500/20 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Strictly Prohibited</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                To prevent misuse, standard automated filters flag restricted concepts:
              </p>
              <ul className="space-y-2.5 text-xs text-gray-300 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Explicit Material:</strong> Prompts detailing sexually explicit scenes, graphic physical acts, or anatomical elements are blocked.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Highly Suggestive content:</strong> Prompts requesting pornography, erotic artwork, or physical nudity violate creative policies.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-950/15 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-orange shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wide">Warning & Subscription Actions</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Violating policies triggers a first-warning alert. Attempting to bypass safety filters a second time will cause <strong>automatic termination</strong> of the subscription plan to maintain platform safety.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 no-print">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1 text-amber-orange font-mono text-xs uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Reference FAQ</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-noir-900 border border-noir-800 rounded-xl overflow-hidden transition-colors hover:border-noir-750"
                >
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between font-semibold text-white text-sm"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4.5 h-4.5 text-amber-orange shrink-0" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-gray-500 shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-4 border-t border-noir-850 pt-3 text-xs text-gray-400 leading-relaxed"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer credits */}
      <footer className="bg-noir-950 border-t border-noir-800 py-12 text-center text-xs text-gray-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-center items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-orange to-amber-500 flex items-center justify-center">
              <Film className="w-4.5 h-4.5 text-noir-950 stroke-[2.5]" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-white">
              Noir<span className="text-amber-orange">Gen</span> AI
            </span>
          </div>

          <p className="max-w-md mx-auto leading-relaxed">
            NoirGen AI is an entry for the AMD Act II Hackathon. Built to empower independent filmmakers and speed up lookbook pre-production using high-speed Fireworks AI inference.
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-mono uppercase tracking-wider text-gray-400">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#presets" className="hover:text-white transition-colors">Presets</a>
            <a href="#suite" className="hover:text-white transition-colors">Suite</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <button 
              onClick={() => setShowRulesModal(true)} 
              className="text-amber-orange hover:text-orange-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" /> Creative Rules
            </button>
          </div>

          <div className="text-[10px] font-mono text-gray-600">
            &copy; {new Date().getFullYear()} NoirGen AI. All Rights Reserved. Crafted with React, Tailwind, and Fireworks AI.
          </div>
        </div>
      </footer>

      {/* MODAL: Checkout Portal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/80 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-noir-900 border border-noir-800 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl"
            >
              <div className="bg-gradient-to-r from-orange-950/30 via-amber-950/20 to-transparent p-6 pb-4 border-b border-noir-850">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-orange" />
                    <h3 className="text-sm font-bold text-white">Subscribe to NoirGen</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedPlan(null);
                      setCheckoutSuccess(false);
                      setCheckoutName('');
                      setCheckoutCard('');
                      setCheckoutEmail('');
                    }}
                    className="p-1 rounded hover:bg-noir-800 text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  You have selected the <span className="text-white font-semibold">{selectedPlan}</span>
                </div>
              </div>

              <div className="p-6">
                {!checkoutSuccess ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const newSub = {
                      active: true,
                      planName: selectedPlan || 'Starter Plan',
                      email: checkoutEmail,
                      subscriberName: checkoutName
                    };
                    setUserSubscription(newSub);
                    localStorage.setItem('NOIRGEN_USER_SUBSCRIPTION', JSON.stringify(newSub));
                    setCheckoutSuccess(true);
                  }} className="space-y-4">
                    
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                        Full Name
                      </label>
                      <input 
                        required
                        type="text"
                        placeholder="John Ford"
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        className="w-full bg-noir-950 text-white border border-noir-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-amber-orange"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                        Email Address
                      </label>
                      <input 
                        required
                        type="email"
                        placeholder="director@indiecinema.com"
                        value={checkoutEmail}
                        onChange={(e) => setCheckoutEmail(e.target.value)}
                        className="w-full bg-noir-950 text-white border border-noir-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-amber-orange"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                        Mock Credit Card
                      </label>
                      <input 
                        required
                        type="text"
                        placeholder="4242 •••• •••• 4242"
                        value={checkoutCard}
                        onChange={(e) => setCheckoutCard(e.target.value)}
                        className="w-full bg-noir-950 text-white border border-noir-700 rounded-lg py-2 px-3 text-xs font-mono focus:outline-none focus:border-amber-orange"
                      />
                    </div>

                    <div className="bg-noir-950 p-3 rounded-lg border border-noir-800 text-[10px] text-gray-400 leading-normal">
                      Note: Submitting this checkout will instantly activate your active subscription in your browser and unlock complete developer API treatments.
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-amber-orange to-amber-500 text-noir-950 font-bold py-3 rounded-lg text-xs mt-6 transition-opacity hover:opacity-95"
                    >
                      Process Mock Subscription
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Check className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Subscription Active!</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Thank you, <span className="text-white font-semibold">{checkoutName}</span>. Your mock checkout for the <span className="text-white font-semibold">{selectedPlan}</span> was processed. Elite pre-production features are now unlocked.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedPlan(null);
                        setCheckoutSuccess(false);
                        setCheckoutName('');
                        setCheckoutCard('');
                        setCheckoutEmail('');
                      }}
                      className="px-6 py-2 bg-noir-950 border border-noir-700 text-xs font-bold rounded-lg text-white hover:bg-noir-850"
                    >
                      Back to Pre-Production Suite
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Image Zoom */}
      <AnimatePresence>
        {showZoomModal && currentImage && (
          <div 
            onClick={() => setShowZoomModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/95 backdrop-blur-md no-print cursor-zoom-out"
          >
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
              <button 
                onClick={() => setShowZoomModal(false)}
                className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white bg-noir-900 border border-noir-850 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <img 
                src={currentImage} 
                alt="Zoomed Treatment Frame"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[80vh] object-contain rounded-lg border border-noir-800 shadow-2xl"
              />
              
              <div className="mt-4 text-center">
                <h5 className="text-sm font-bold text-white">{currentTreatment.mood.title}</h5>
                <p className="text-xs text-gray-400 mt-1">{currentTreatment.mood.tonality}</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Rules & Regulations */}
      <AnimatePresence>
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/80 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-noir-900 border border-noir-800 rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl text-gray-200"
            >
              <div className="bg-gradient-to-r from-amber-950/30 via-orange-950/20 to-transparent p-6 pb-4 border-b border-noir-850">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-orange" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Creative Guidelines & Rules</h3>
                  </div>
                  <button 
                    onClick={() => setShowRulesModal(false)}
                    className="p-1 rounded hover:bg-noir-800 text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs leading-relaxed">
                <div className="p-3.5 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1">
                  <h4 className="font-bold text-amber-orange flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> STRICT CONTENT MODERATION POLICY
                  </h4>
                  <p className="text-gray-400">
                    To maintain a professional, secure, and compliant pre-production environment, our AI lookbook generator enforces standard content filtering.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white font-mono uppercase tracking-wide border-b border-noir-800 pb-1">Permitted Cinematic Content</h4>
                  <p className="text-gray-400">
                    You have <span className="text-emerald-400 font-semibold">full creative and genre freedom</span>! You can design, draft, and structure lookbooks for:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                    <li><strong className="text-white">Multiple Genres</strong>: Horror, Suspense, Sci-Fi, Comedy, Thriller, Historical Drama, Action, etc.</li>
                    <li><strong className="text-white">Romantic & Kissing Scenes</strong>: You are fully permitted to design sets, lighting ratios, lens profiles, and color schemes for intimate romantic scenes, hugging, embracing, or kissing.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white font-mono uppercase tracking-wide border-b border-noir-800 pb-1">Strictly Prohibited Content</h4>
                  <p className="text-gray-400">
                    To prevent any abuse or policy issues, the following material is <span className="text-red-400 font-semibold">strictly forbidden</span>:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                    <li><strong className="text-red-400">Explicit Sexual Material</strong>: Any sexually explicit prompt, graphic depiction of sexual acts, or anatomical descriptions.</li>
                    <li><strong className="text-red-400">Highly Sensual / Suggestive Descriptions</strong>: Prompts seeking to generate pornography, erotic art, or explicit nudity.</li>
                  </ul>
                </div>

                <div className="p-3 bg-noir-950 rounded-lg border border-noir-850 text-gray-400 text-[11px]">
                  <strong className="text-white">Subscription Penalty Note</strong>: Violating these rules will trigger an instant safety filter warning on the first attempt. A second violation will result in the <strong className="text-red-400">immediate cancellation of your subscription</strong> with policy violation logs, and a notice sent directly to your registered email address.
                </div>
              </div>

              <div className="bg-noir-950 p-4 border-t border-noir-850 flex justify-end">
                <button 
                  onClick={() => setShowRulesModal(false)}
                  className="px-5 py-2 bg-amber-orange text-noir-950 font-bold text-xs rounded-lg hover:opacity-95"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Rule Violation Warning (1st violation) */}
      <AnimatePresence>
        {showViolationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/90 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-noir-900 border-2 border-amber-600 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl text-gray-200"
            >
              <div className="bg-amber-950/40 p-6 pb-4 border-b border-amber-500/20 text-center">
                <div className="w-14 h-14 bg-amber-950/80 text-amber-500 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg mb-3 animate-bounce">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">Rule Violation Warning!</h3>
                <p className="text-xs text-amber-400 mt-1">First Policy Offense Recorded (1/2)</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-noir-950 p-4 rounded-xl border border-noir-800 space-y-2">
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Detection Logs:</p>
                  <p className="text-xs text-red-300 font-medium italic">"{violationReason}"</p>
                </div>

                <div className="text-xs text-gray-300 space-y-2 leading-relaxed">
                  <p>
                    Our system has detected restricted or highly sensual/explicit terminology. 
                  </p>
                  <p>
                    <strong className="text-white">Policy Reminder</strong>: Designing romantic set builds, mood boards, lighting schemas, and kissing scenes is perfectly permitted. However, graphic, sexual, or highly sensual descriptions are prohibited.
                  </p>
                  <p className="text-amber-300 font-semibold bg-amber-950/20 p-2.5 rounded border border-amber-500/10">
                    ⚠️ CRITICAL: Attempting to bypass this safety filter a second time will immediately CANCEL your active subscription plan.
                  </p>
                </div>

                <button 
                  onClick={() => setShowViolationModal(false)}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-noir-950 font-bold py-3 rounded-lg text-xs mt-4 transition-all hover:opacity-95"
                >
                  I Acknowledge & Will Revise Prompt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Subscription Cancelled due to Violation */}
      <AnimatePresence>
        {showCancelledModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/95 backdrop-blur-md no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-noir-900 border-2 border-red-600 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl text-gray-200"
            >
              <div className="bg-red-950/40 p-6 pb-4 border-b border-red-500/20 text-center">
                <div className="w-16 h-16 bg-red-950/80 text-red-500 border border-red-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg mb-3 animate-pulse">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">Subscription Terminated</h3>
                <p className="text-xs text-red-400 mt-1">Rule Violation Final Action</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-red-950/10 border border-red-500/20 p-4 rounded-xl text-center">
                  <p className="text-xs text-gray-200 leading-relaxed font-semibold">
                    Due to violation of our policy we canceled your subscription.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    A confirmation email has been sent to your registered email address:
                  </p>
                  <p className="text-sm font-mono text-white font-bold underline decoration-red-500 mt-1">
                    {cancelledEmailAddress || 'director@indiecinema.com'}
                  </p>
                </div>

                <div className="text-xs text-gray-400 leading-relaxed text-center">
                  <p>
                    We maintain a strict zero-tolerance policy for sexually explicit or highly sensual material. Your account has been reverted to free tier. Any active payments have been stopped.
                  </p>
                </div>

                <button 
                  onClick={() => setShowCancelledModal(false)}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-lg text-xs mt-4 hover:bg-red-700 transition-colors"
                >
                  Close & Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
