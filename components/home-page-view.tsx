'use client';

import Image from 'next/image';
import type { ChangeEvent, Dispatch, MouseEvent, RefObject, SetStateAction } from 'react';
import {
  Image as ImageIcon,
  Star,
  Settings2,
  Globe2,
  Layers,
  Code2,
  Terminal,
  ExternalLink,
  Zap,
  ChevronRight,
  Hash,
  Sparkles,
  MonitorPlay,
  Bot,
  Clipboard,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  RATING_PROVIDER_OPTIONS,
  type RatingPreference,
} from '@/lib/ratingPreferences';
import {
  BACKDROP_RATING_LAYOUT_OPTIONS,
  type BackdropRatingLayout,
} from '@/lib/backdropRatingLayout';
import {
  POSTER_RATING_LAYOUT_OPTIONS,
  isVerticalPosterRatingLayout,
  type PosterRatingLayout,
} from '@/lib/posterRatingLayout';
import {
  RATING_STYLE_OPTIONS,
  type RatingStyle,
} from '@/lib/ratingStyle';

type PreviewType = 'poster' | 'backdrop' | 'logo';
type ProxyEnabledTypes = Record<PreviewType, boolean>;
type SupportedLanguage = {
  code: string;
  label: string;
  flag: string;
};
type StreamBadgesSetting = 'auto' | 'on' | 'off';
type QualityBadgesSide = 'left' | 'right';
type PosterQualityBadgesPosition = 'auto' | QualityBadgesSide;

type HomePageViewState = {
  previewType: PreviewType;
  mediaId: string;
  lang: string;
  supportedLanguages: SupportedLanguage[];
  tmdbKey: string;
  mdblistKey: string;
  proxyManifestUrl: string;
  proxyEnabledTypes: ProxyEnabledTypes;
  proxyTranslateMeta: boolean;
  exportStatus: 'idle' | 'with' | 'without';
  importStatus: 'idle' | 'success' | 'error';
  importMessage: string;
  posterRatingsLayout: PosterRatingLayout;
  posterRatingsMaxPerSide: number | null;
  backdropRatingsLayout: BackdropRatingLayout;
  qualityBadgesSide: QualityBadgesSide;
  posterQualityBadgesPosition: PosterQualityBadgesPosition;
  configCopied: boolean;
  proxyCopied: boolean;
  copied: boolean;
};

type HomePageViewDerived = {
  baseUrl: string;
  previewUrl: string;
  proxyUrl: string;
  canGenerateConfig: boolean;
  canGenerateProxy: boolean;
  isConfigStringVisible: boolean;
  isProxyUrlVisible: boolean;
  displayedConfigString: string;
  displayedProxyUrl: string;
  styleLabel: string;
  textLabel: string;
  providersLabel: string;
  activeRatingStyle: RatingStyle;
  activeImageText: 'original' | 'clean' | 'alternative';
  activeRatingPreferences: RatingPreference[];
  shouldShowQualityBadgesPosition: boolean;
  shouldShowQualityBadgesSide: boolean;
  qualityBadgeTypeLabel: string;
  activeStreamBadges: StreamBadgesSetting;
  activeQualityBadgesStyle: RatingStyle;
};

type HomePageViewActions = {
  handleAnchorClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  handleExportConfig: (includeKeys: boolean) => void;
  handleImportFile: (event: ChangeEvent<HTMLInputElement>) => void;
  handleCopyConfig: () => void;
  handleCopyProxy: () => void;
  handleCopyPrompt: () => void;
  setPreviewType: Dispatch<SetStateAction<PreviewType>>;
  setMediaId: Dispatch<SetStateAction<string>>;
  setLang: Dispatch<SetStateAction<string>>;
  setTmdbKey: Dispatch<SetStateAction<string>>;
  setMdblistKey: Dispatch<SetStateAction<string>>;
  setPosterRatingsLayout: Dispatch<SetStateAction<PosterRatingLayout>>;
  setPosterRatingsMaxPerSide: Dispatch<SetStateAction<number | null>>;
  setBackdropRatingsLayout: Dispatch<SetStateAction<BackdropRatingLayout>>;
  setPosterQualityBadgesPosition: Dispatch<SetStateAction<PosterQualityBadgesPosition>>;
  setQualityBadgesSide: Dispatch<SetStateAction<QualityBadgesSide>>;
  setRatingStyleForType: (value: RatingStyle) => void;
  setImageTextForType: (value: 'original' | 'clean' | 'alternative') => void;
  setActiveStreamBadges: Dispatch<SetStateAction<StreamBadgesSetting>>;
  setActiveQualityBadgesStyle: Dispatch<SetStateAction<RatingStyle>>;
  toggleRatingPreference: (rating: RatingPreference) => void;
  updateProxyManifestUrl: (value: string) => void;
  toggleProxyEnabledType: (type: PreviewType) => void;
  toggleProxyTranslateMeta: () => void;
  toggleConfigStringVisibility: () => void;
  toggleProxyUrlVisibility: () => void;
};

export type HomePageViewProps = {
  refs: {
    navRef: RefObject<HTMLElement | null>;
  };
  state: HomePageViewState;
  derived: HomePageViewDerived;
  actions: HomePageViewActions;
};

const VISIBLE_RATING_PROVIDER_OPTIONS = RATING_PROVIDER_OPTIONS;
const PROXY_TYPES: PreviewType[] = ['poster', 'backdrop', 'logo'];
const STREAM_BADGE_OPTIONS: Array<{ id: StreamBadgesSetting; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'On' },
  { id: 'off', label: 'Off' },
];
const QUALITY_BADGE_SIDE_OPTIONS: Array<{ id: QualityBadgesSide; label: string }> = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];
const POSTER_QUALITY_BADGE_POSITION_OPTIONS: Array<{
  id: PosterQualityBadgesPosition;
  label: string;
}> = [
  { id: 'auto', label: 'Auto' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

export function HomePageView({ refs, state, derived, actions }: HomePageViewProps) {
  const { navRef } = refs;
  const {
    previewType,
    mediaId,
    lang,
    supportedLanguages,
    tmdbKey,
    mdblistKey,
    proxyManifestUrl,
    proxyEnabledTypes,
    proxyTranslateMeta,
    exportStatus,
    importStatus,
    importMessage,
    posterRatingsLayout,
    posterRatingsMaxPerSide,
    backdropRatingsLayout,
    qualityBadgesSide,
    posterQualityBadgesPosition,
    configCopied,
    proxyCopied,
    copied,
  } = state;
  const {
    baseUrl,
    previewUrl,
    proxyUrl,
    canGenerateConfig,
    canGenerateProxy,
    isConfigStringVisible,
    isProxyUrlVisible,
    displayedConfigString,
    displayedProxyUrl,
    styleLabel,
    textLabel,
    providersLabel,
    activeRatingStyle,
    activeImageText,
    activeRatingPreferences,
    shouldShowQualityBadgesPosition,
    shouldShowQualityBadgesSide,
    qualityBadgeTypeLabel,
    activeStreamBadges,
    activeQualityBadgesStyle,
  } = derived;
  const {
    handleAnchorClick,
    handleExportConfig,
    handleImportFile,
    handleCopyConfig,
    handleCopyProxy,
    handleCopyPrompt,
    setPreviewType,
    setMediaId,
    setLang,
    setTmdbKey,
    setMdblistKey,
    setPosterRatingsLayout,
    setPosterRatingsMaxPerSide,
    setBackdropRatingsLayout,
    setPosterQualityBadgesPosition,
    setQualityBadgesSide,
    setRatingStyleForType,
    setImageTextForType,
    setActiveStreamBadges,
    setActiveQualityBadgesStyle,
    toggleRatingPreference,
    updateProxyManifestUrl,
    toggleProxyEnabledType,
    toggleProxyTranslateMeta,
    toggleConfigStringVisibility,
    toggleProxyUrlVisibility,
  } = actions;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06070b] text-slate-200 selection:bg-orange-400/30 font-[var(--font-body)]">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),_transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-220px] top-40 h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.12),_transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute left-[-180px] bottom-[-140px] h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(20,184,166,0.12),_transparent_60%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.025),_rgba(255,255,255,0)_40%,_rgba(255,255,255,0.02)_100%)]" />

      <div className="relative">
        <nav ref={navRef} className="sticky top-0 z-50 border-b border-white/10 bg-[#06070b]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 via-amber-400 to-red-500 flex items-center justify-center shadow-[0_8px_24px_rgba(249,115,22,0.35)]">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="leading-tight">
                <span className="block font-[var(--font-display)] text-lg text-white tracking-tight">ERDB</span>
                <span className="block text-[10px] uppercase tracking-[0.3em] text-orange-300">Stateless</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <a href="#preview" onClick={handleAnchorClick} className="px-3 py-2 rounded-full hover:text-white hover:bg-white/[0.04] transition-colors">Configurator</a>
              <a href="#proxy" onClick={handleAnchorClick} className="px-3 py-2 rounded-full hover:text-white hover:bg-white/[0.04] transition-colors">Addon Proxy</a>
              <a href="#docs" onClick={handleAnchorClick} className="px-3 py-2 rounded-full hover:text-white hover:bg-white/[0.04] transition-colors">API Docs</a>
              <a href="https://github.com/realbestia1/erdb" className="ml-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] text-slate-100 hover:bg-white/10 transition-colors">GitHub</a>
            </div>
          </div>
        </nav>

        <main className="mx-auto w-full max-w-none px-6 py-16 space-y-16">
          {/* Hero Section */}
          <section className="relative grid gap-8 lg:grid-cols-[1fr_0.8fr] items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.35em] text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-orange-300" />
                Stateless Media Layer
              </div>
              <h1 className="text-4xl md:text-6xl font-[var(--font-display)] text-white leading-tight">
                Easy Ratings Database.
                <span className="block text-slate-300 text-2xl md:text-3xl font-[var(--font-body)] mt-2">
                  Design-Grade Ratings,
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-300 to-teal-300">
                  Without the State.
                </span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                Generate expressive posters, backdrops, and logos for addons in real time.
                Pass parameters once and ship beautiful media metadata anywhere.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="#preview" onClick={handleAnchorClick} className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-slate-100 transition-colors">
                  Open Configurator
                </a>
                <a href="#docs" onClick={handleAnchorClick} className="px-6 py-3 rounded-full border border-white/10 bg-white/[0.04] text-white font-semibold hover:bg-white/10 transition-colors">
                  Read API Docs
                </a>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
                  No accounts or tokens
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                  Query-driven layouts
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                  Proxy-ready for addons
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_35px_90px_-70px_rgba(0,0,0,0.8)]">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-slate-400">
                  <span>Live Output</span>
                  <span className="text-teal-300">Instant</span>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-[#0b0f15]/80 p-4">
                    <div className="text-xs text-slate-400">Render Mode</div>
                    <div className="mt-1 text-sm text-white font-semibold">Stateless + CDN friendly</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0b0f15]/80 p-4">
                    <div className="text-xs text-slate-400">Provider Mix</div>
                    <div className="mt-1 text-sm text-white font-semibold">TMDB / IMDb / MDBList + more</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0b0f15]/80 p-4">
                    <div className="text-xs text-slate-400">Addon Proxy</div>
                    <div className="mt-1 text-sm text-white font-semibold">Auto-rewrite catalog + meta</div>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6">
                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Highlights</div>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div>Config string ready for sharing.</div>
                  <div>Translation pipeline for meta content.</div>
                  <div>Works with posters, backdrops, logos.</div>
                </div>
              </div>
            </div>
          </section>

        {/* Live Previewer */}
        <section id="preview" className="scroll-mt-16 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Workspace</div>
              <h2 className="mt-2 text-3xl font-[var(--font-display)] text-white">Configurator & Proxy</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                Tune layout, ratings, badges, and language, then export a shareable config or generate a proxy manifest.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Poster</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Backdrop</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Logo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr] gap-4 items-stretch">
            {/* Controls */}
            <div className="min-w-0 w-full flex flex-col h-full gap-3">
              <div className="flex-1 space-y-3 rounded-[22px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl shadow-[0_30px_80px_-70px_rgba(0,0,0,0.85)]">
                <div>
                  <h2 className="text-xl font-[var(--font-display)] text-white mb-1">Configurator</h2>
                  <p className="text-xs text-slate-400">Adjust parameters to generate the config string and update the live preview.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Config Transfer</span>
                    <span className="text-slate-500">Download or upload the config file.</span>
                    <button
                      onClick={() => handleExportConfig(true)}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${exportStatus === 'with' ? 'bg-green-500 text-white' : 'bg-orange-500 text-black hover:bg-orange-400'}`}
                    >
                      {exportStatus === 'with' ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>DOWNLOADED WITH KEYS</span>
                        </>
                      ) : (
                        <span>DOWNLOAD WITH KEYS</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleExportConfig(false)}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${exportStatus === 'without' ? 'bg-green-500 text-white' : 'bg-[#141b26] text-slate-200 hover:bg-[#1b2331]'}`}
                    >
                      {exportStatus === 'without' ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>DOWNLOADED NO KEYS</span>
                        </>
                      ) : (
                        <span>DOWNLOAD NO KEYS</span>
                      )}
                    </button>
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-semibold bg-[#141b26] text-slate-200 hover:bg-[#1b2331] transition-colors cursor-pointer">
                      <span>UPLOAD CONFIG</span>
                      <input
                        type="file"
                        accept="application/json,.json,.txt"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {importStatus !== 'idle' && (
                    <p className={`mt-2 text-[11px] ${importStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {importMessage}
                    </p>
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">Access Keys</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">TMDB</label>
                      <input type="password" value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} placeholder="v3 Key" className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-orange-500/50 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">MDBList</label>
                      <input type="password" value={mdblistKey} onChange={(e) => setMdblistKey(e.target.value)} placeholder="Key" className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-orange-500/50 outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">Media Target</div>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Type</span>
                      <div className="flex gap-1 p-1 bg-[#0b0f15] rounded-lg border border-white/10">
                        {(['poster', 'backdrop', 'logo'] as const).map(type => (
                          <button key={type} onClick={() => setPreviewType(type)} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${previewType === type ? 'bg-[#141b26] text-white' : 'text-slate-400 hover:text-white'}`}>
                            {type === 'poster' && <ImageIcon className="w-3.5 h-3.5" />}
                            {type === 'backdrop' && <MonitorPlay className="w-3.5 h-3.5" />}
                            {type === 'logo' && <Layers className="w-3.5 h-3.5" />}
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Media ID</span>
                      <input type="text" value={mediaId} onChange={(e) => setMediaId(e.target.value)} placeholder="tt0133093" className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-orange-500/50 outline-none" />
                    </div>
                    {tmdbKey ? (
                      <div className="w-32">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1 mb-1"><Globe2 className="w-3 h-3" /> Lang</span>
                        <div className="relative">
                          <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white appearance-none outline-none focus:border-orange-500/50">
                            {supportedLanguages.map(l => <option key={l.code} value={l.code} className="bg-[#0b0f15]">{l.flag} {l.label}</option>)}
                          </select>
                          <ChevronRight className="w-3 h-3 text-slate-500 absolute right-2 top-2.5 pointer-events-none stroke-2 rotate-90" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-[#080b10] border border-white/10 text-[10px] text-slate-500 flex items-center gap-1.5">
                        <Globe2 className="w-3 h-3 shrink-0" /> Add TMDB key for lang
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b0f15]/80 p-2.5 space-y-3">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">{styleLabel}</span>
                      <div className="flex gap-1 p-1 bg-[#0b0f15] rounded-lg border border-white/10">
                        {RATING_STYLE_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => setRatingStyleForType(opt.id as RatingStyle)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeRatingStyle === opt.id ? 'bg-[#141b26] text-white' : 'text-slate-400 hover:text-white'}`}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    {previewType !== 'logo' && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">{textLabel}</span>
                        <div className="flex gap-1 p-1 bg-[#0b0f15] rounded-lg border border-white/10">
                          {(['original', 'clean', 'alternative'] as const).map(option => (
                            <button key={option} onClick={() => setImageTextForType(option)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeImageText === option ? 'bg-[#141b26] text-white' : 'text-slate-400 hover:text-white'}`}>{option.charAt(0).toUpperCase() + option.slice(1)}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {(previewType === 'poster' || previewType === 'backdrop') && (
                  <div className="rounded-xl border border-white/10 bg-[#0b0f15]/80 p-3 space-y-3">
                    <div className="text-[11px] font-semibold text-slate-400">Layouts</div>
                    {previewType === 'poster' && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Poster Layout</div>
                        <div className="flex flex-wrap gap-3 items-end">
                          <div>
                            <div className="flex flex-wrap gap-1">
                              {POSTER_RATING_LAYOUT_OPTIONS.map(opt => (
                                <button key={opt.id} onClick={() => setPosterRatingsLayout(opt.id as PosterRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${posterRatingsLayout === opt.id ? 'border-orange-500/60 bg-[#141b26] text-white' : 'border-white/10 bg-[#0b0f15] text-slate-400 hover:text-white'}`}>{opt.label}</button>
                              ))}
                            </div>
                          </div>
                          {isVerticalPosterRatingLayout(posterRatingsLayout) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Max/side</span>
                              <input type="number" value={posterRatingsMaxPerSide ?? ''} onChange={(e) => setPosterRatingsMaxPerSide(e.target.value === '' ? null : parseInt(e.target.value))} placeholder="Auto" className="w-16 bg-[#080b10] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-orange-500/50 outline-none" />
                              <button onClick={() => setPosterRatingsMaxPerSide(null)} className="rounded-lg border border-white/10 bg-[#0b0f15] px-2 py-1.5 text-[11px] text-slate-300 hover:bg-[#141b26]">Auto</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {previewType === 'backdrop' && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Backdrop Layout</div>
                        <div className="flex flex-wrap gap-1">
                          {BACKDROP_RATING_LAYOUT_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setBackdropRatingsLayout(opt.id as BackdropRatingLayout)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${backdropRatingsLayout === opt.id ? 'border-orange-500/60 bg-[#141b26] text-white' : 'border-white/10 bg-[#0b0f15] text-slate-400 hover:text-white'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {previewType !== 'logo' && (
                  <div className="rounded-xl border border-white/10 bg-[#0b0f15]/80 p-2.5 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400">
                      Quality Badges - {qualityBadgeTypeLabel}
                    </div>
                    <div className="flex gap-1 p-1 bg-[#0b0f15] rounded-lg border border-white/10">
                    {STREAM_BADGE_OPTIONS.map(option => (
                      <button key={option.id} onClick={() => setActiveStreamBadges(option.id)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeStreamBadges === option.id ? 'bg-[#141b26] text-white' : 'text-slate-400 hover:text-white'}`}>
                        {option.label}
                      </button>
                    ))}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Quality Badge Style</span>
                      <div className="flex flex-wrap gap-1">
                      {RATING_STYLE_OPTIONS.map(option => (
                        <button key={`quality-style-${option.id}`} onClick={() => setActiveQualityBadgesStyle(option.id)} className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${activeQualityBadgesStyle === option.id ? 'border-orange-500/60 bg-[#141b26] text-white' : 'border-white/10 bg-[#0b0f15] text-slate-400 hover:text-white'}`}>
                          {option.label}
                        </button>
                      ))}
                      </div>
                    </div>
                    {shouldShowQualityBadgesPosition && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Side</span>
                        <div className="flex gap-1 p-1 bg-[#0b0f15] rounded-lg border border-white/10">
                          {POSTER_QUALITY_BADGE_POSITION_OPTIONS.map(option => (
                            <button key={option.id} onClick={() => setPosterQualityBadgesPosition(option.id)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${posterQualityBadgesPosition === option.id ? 'bg-[#141b26] text-white' : 'text-slate-400 hover:text-white'}`}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {shouldShowQualityBadgesSide && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Side</span>
                        <div className="flex gap-1 p-1 bg-[#0b0f15] rounded-lg border border-white/10">
                          {QUALITY_BADGE_SIDE_OPTIONS.map(option => (
                            <button key={option.id} onClick={() => setQualityBadgesSide(option.id)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${qualityBadgesSide === option.id ? 'bg-[#141b26] text-white' : 'text-slate-400 hover:text-white'}`}>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-[#0b0f15]/80 p-2.5 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block">{providersLabel}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {VISIBLE_RATING_PROVIDER_OPTIONS.map(provider => (
                      <label key={provider.id} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] cursor-pointer select-none transition-colors ${activeRatingPreferences.includes(provider.id as RatingPreference) ? 'border-orange-500/60 bg-[#141b26] text-white' : 'border-white/10 bg-[#0b0f15] text-slate-400 hover:text-white'}`}>
                        <input type="checkbox" checked={activeRatingPreferences.includes(provider.id as RatingPreference)} onChange={() => toggleRatingPreference(provider.id as RatingPreference)} className="h-3 w-3 accent-orange-500" />
                        <span>{provider.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <div className="min-w-0 w-full flex flex-col h-full gap-5">
              <div className="flex-1 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_30px_80px_-70px_rgba(0,0,0,0.85)] w-full">
                <h3 className="text-lg font-[var(--font-display)] text-white">Preview Output</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Stateless dynamic layout generated via query parameters.
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-[#080b10]/90 p-3 min-h-[260px] flex items-center justify-center flex-col">

                  {previewUrl ? (
                    <div className="z-10 w-full flex flex-col items-center gap-8">
                      <div className={`relative shadow-2xl shadow-black ring-1 ring-white/10 rounded-2xl overflow-hidden ${previewType === 'poster'
                        ? 'aspect-[2/3] w-60'
                        : previewType === 'logo'
                          ? 'h-40 w-full max-w-lg'
                          : 'aspect-video w-full max-w-lg'
                        }`}>
                        <Image
                          key={previewUrl}
                          src={previewUrl}
                          alt="Preview"
                          unoptimized
                          fill
                          className={previewType === 'logo' ? 'object-contain' : 'object-cover'}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No preview available.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_25px_70px_-70px_rgba(0,0,0,0.8)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-[var(--font-display)] text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-orange-500" /> ERDB Config String
                  </h3>
                  <button
                    type="button"
                    onClick={toggleConfigStringVisibility}
                    disabled={!canGenerateConfig}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors ${canGenerateConfig ? 'border border-white/10 bg-[#0b0f15] text-slate-200 hover:bg-[#141b26]' : 'border border-white/5 bg-[#080b10] text-slate-600 cursor-not-allowed'}`}
                  >
                    {isConfigStringVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isConfigStringVisible ? 'HIDE' : 'SHOW'}</span>
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Base64url string containing API keys and all settings. Base URL is detected automatically from the current domain.
                </p>
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#080b10]/90 p-3 max-h-28 overflow-auto scrollbar-hidden">
                  <div className={`font-mono text-xs text-slate-300 break-all whitespace-pre-wrap pr-2 ${canGenerateConfig && !isConfigStringVisible ? 'select-none' : ''}`}>
                    {displayedConfigString || 'Add TMDB key and MDBList key to generate the config string.'}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyConfig}
                    disabled={!canGenerateConfig}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${canGenerateConfig ? (configCopied ? 'bg-green-500 text-white' : 'bg-orange-500 text-black hover:bg-orange-400') : 'bg-[#141b26] text-slate-500 cursor-not-allowed'}`}
                  >
                    {configCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>COPY STRING</span>
                      </>
                    )}
                  </button>
                </div>
                {!canGenerateConfig && (
                  <p className="mt-3 text-[11px] text-slate-500">
                    Add TMDB key and MDBList key to generate a valid config string.
                  </p>
                )}

              </div>
            </div>

            <div className="min-w-0 w-full flex flex-col h-full gap-3">
              <div id="proxy" className="flex-1 scroll-mt-16 rounded-[22px] border border-white/10 bg-white/[0.04] p-3 space-y-3 backdrop-blur-xl shadow-[0_30px_80px_-70px_rgba(0,0,0,0.85)]">
                <div>
                  <h3 className="text-base font-[var(--font-display)] text-white">Addon Proxy</h3>
                  <p className="text-xs text-slate-400">Paste a Stremio addon manifest to generate a new manifest and choose which image types to replace.</p>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0f15]/80 p-3">
                  <div className="text-[11px] font-semibold text-slate-400">ERDB parameters</div>
                  <p className="text-[11px] text-slate-500">
                    Use the configurator above for keys, language, ratings, layout, badges, and text.
                  </p>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Manifest URL</label>
                    <input
                      type="url"
                      value={proxyManifestUrl}
                      onChange={(e) => updateProxyManifestUrl(e.target.value)}
                      placeholder="https://addon.example.com/manifest.json"
                      className="w-full bg-[#080b10] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">Enabled Types</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PROXY_TYPES.map(type => (
                        <label key={`proxy-enabled-${type}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] cursor-pointer select-none transition-colors ${proxyEnabledTypes[type] ? 'border-orange-500/60 bg-[#141b26] text-white' : 'border-white/10 bg-[#0b0f15] text-slate-400 hover:text-white'}`}>
                          <input type="checkbox" checked={proxyEnabledTypes[type]} onChange={() => toggleProxyEnabledType(type)} className="h-3 w-3 accent-orange-500" />
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">Disabled types keep the original artwork.</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">Translate Meta</span>
                    <label className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] cursor-pointer select-none transition-colors ${proxyTranslateMeta ? 'border-orange-500/60 bg-[#141b26] text-white' : 'border-white/10 bg-[#0b0f15] text-slate-400 hover:text-white'}`}>
                      <input type="checkbox" checked={proxyTranslateMeta} onChange={toggleProxyTranslateMeta} className="h-3 w-3 accent-orange-500" />
                      <span>Translate Addon Content</span>
                    </label>
                    <div className="mt-1 text-[10px] text-slate-500">Uses selected language for titles, plots, and episodes.</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0b0f15]/80 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold text-slate-400">Generated Manifest</div>
                    <button
                      type="button"
                      onClick={toggleProxyUrlVisibility}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors border border-white/10 bg-[#0b0f15] text-slate-200 hover:bg-[#141b26]"
                    >
                      {isProxyUrlVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isProxyUrlVisible ? 'HIDE' : 'SHOW'}</span>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Use this URL in Stremio. It ends with manifest.json and has no query params.
                  </p>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-[#080b10]/90 p-4">
                    <div className={`font-mono text-xs text-slate-300 break-all ${!isProxyUrlVisible ? 'select-none' : ''}`}>
                      {displayedProxyUrl}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopyProxy}
                      disabled={!canGenerateProxy}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${canGenerateProxy ? (proxyCopied ? 'bg-green-500 text-white' : 'bg-orange-500 text-black hover:bg-orange-400') : 'bg-[#141b26] text-slate-500 cursor-not-allowed'}`}
                    >
                      {proxyCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Clipboard className="w-3.5 h-3.5" />
                          <span>COPY LINK</span>
                        </>
                      )}
                    </button>
                    <a
                        href={canGenerateProxy ? proxyUrl : undefined}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors ${canGenerateProxy ? 'border border-white/10 bg-[#0b0f15] text-slate-200 hover:bg-[#141b26]' : 'border border-white/5 bg-[#080b10] text-slate-600 pointer-events-none'}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  </div>
                  {!canGenerateProxy && (
                    <p className="mt-3 text-[11px] text-slate-500">
                      Add manifest URL and set TMDB/MDBList keys in the configurator to generate a valid link.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#080b10]/80 p-4 text-xs text-slate-500">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-200 font-semibold">Replace enabled types</div>
                      <div>Proxy rewrites enabled `meta.poster`, `meta.background`, `meta.logo` for both `catalog` and `meta` responses.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Documentation Section */}
        <section id="docs" className="scroll-mt-16 pb-20">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-[var(--font-display)] text-white">Developers</h2>
              <p className="text-slate-500">Stateless rendering for any media ID.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 bg-white/[0.04] border border-white/10 rounded-2xl space-y-3 hover:border-orange-500/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-orange-500" />
                </div>
                <h4 className="text-lg font-[var(--font-display)] text-white">Dynamic Rendering</h4>
                <p className="text-sm text-slate-400">No tokens needed. Pass parameters in the query string and let ERDB handle metadata and rendering.</p>
              </div>
              <div className="p-6 bg-white/[0.04] border border-white/10 rounded-2xl space-y-3 hover:border-blue-500/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="text-lg font-[var(--font-display)] text-white">Addon Friendly</h4>
                <p className="text-sm text-slate-400">Perfect for Stremio, Kodi or any media center addon. Use simple URL patterns for easy integration in your code.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-white/[0.04]">
                  <h3 className="text-lg font-[var(--font-display)] text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-orange-500" /> API Reference
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[560px] text-sm">
                    <thead>
                      <tr className="bg-white/[0.04] text-[10px] uppercase tracking-widest font-bold text-slate-500">
                        <th className="px-5 py-2.5">Parameter</th>
                        <th className="px-5 py-2.5">Values</th>
                        <th className="px-5 py-2.5">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">type <span className="text-slate-500">(path)</span></td>
                        <td className="px-5 py-2 text-slate-400 text-xs">poster, backdrop, logo</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">-</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">id <span className="text-slate-500">(path)</span></td>
                        <td className="px-5 py-2 text-slate-400 text-xs">IMDb, TMDB, Kitsu, etc.</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">-</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">ratings</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, myanimelist, anilist, kitsu (global fallback)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterRatings</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, myanimelist, anilist, kitsu (poster only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdropRatings</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, myanimelist, anilist, kitsu (backdrop only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">logoRatings</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">tmdb, mdblist, imdb, tomatoes, letterboxd, metacritic, trakt, myanimelist, anilist, kitsu (logo only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">all</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">lang</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">{supportedLanguages.map((language) => language.code).join(', ')}</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">en</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">streamBadges</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">auto, on, off (global fallback)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterStreamBadges</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">auto, on, off (poster only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdropStreamBadges</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">auto, on, off (backdrop only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">qualityBadgesSide</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">left, right (poster top-bottom only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">left</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterQualityBadgesPosition</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">auto, left, right (poster top/bottom only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">qualityBadgesStyle</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">glass, square, plain (global fallback)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterQualityBadgesStyle</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">glass, square, plain (poster only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdropQualityBadgesStyle</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">glass, square, plain (backdrop only)</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">glass</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">ratingStyle</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">glass, square, plain</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">glass (poster/backdrop), plain (logo)</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">imageText</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">original, clean, alternative</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">original (poster), clean (backdrop)</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterRatingsLayout</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">top, bottom, left, right, top-bottom, left-right</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">top-bottom</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">posterRatingsMaxPerSide</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">1-20</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">auto</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdropRatingsLayout</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">center, right, right-vertical</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">center</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">tmdbKey <span className="font-bold">(req)</span></td>
                        <td className="px-5 py-2 text-slate-400 text-xs">TMDB v3 API Key</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">-</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">mdblistKey <span className="font-bold">(req)</span></td>
                        <td className="px-5 py-2 text-slate-400 text-xs">MDBList.com API Key</td>
                        <td className="px-5 py-2 text-slate-500 text-xs">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-white/[0.04]">
                  <h3 className="text-lg font-[var(--font-display)] text-white flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-orange-500" /> Type Configs
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[680px] text-sm">
                    <thead>
                      <tr className="bg-white/[0.04] text-[10px] uppercase tracking-widest font-bold text-slate-500">
                        <th className="px-5 py-2.5">Type</th>
                        <th className="px-5 py-2.5">Config</th>
                        <th className="px-5 py-2.5">Layouts / Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">poster</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">
                          <div className="space-y-1">
                            <div>imageText</div>
                            <div>posterRatingsLayout</div>
                            <div>posterRatingsMaxPerSide</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-slate-400 text-xs">
                          <div className="space-y-1">
                            <div>original, clean, alternative</div>
                            <div>top, bottom, left, right, top-bottom, left-right</div>
                            <div>1-20 (auto if omitted)</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">backdrop</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">
                          <div className="space-y-1">
                            <div>imageText</div>
                            <div>backdropRatingsLayout</div>
                          </div>
                        </td>
                        <td className="px-5 py-2 text-slate-400 text-xs">
                          <div className="space-y-1">
                            <div>original, clean, alternative</div>
                            <div>center, right, right-vertical</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-mono text-orange-400 text-xs">logo</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">none (base params only)</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-5 pb-5 pt-3 text-[11px] text-slate-500">
                  Base params for all types: ratings (global fallback), lang, ratingStyle, tmdbKey, mdblistKey. Use posterRatings/backdropRatings/logoRatings to override per type.
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-white/[0.04]">
                  <h3 className="text-lg font-[var(--font-display)] text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 text-orange-500" /> ID Formats
                  </h3>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-white/[0.04] text-[10px] uppercase tracking-widest font-bold text-slate-500">
                        <th className="px-5 py-2.5">Source</th>
                        <th className="px-5 py-2.5">Format</th>
                        <th className="px-5 py-2.5">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="px-5 py-2 font-bold text-slate-300 text-xs">IMDb</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">tt + numbers</td>
                        <td className="px-5 py-2 font-mono text-orange-200/50 text-xs">tt0133093</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-bold text-slate-300 text-xs">TMDB</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">tmdb:id or tmdb:movie:id or tmdb:tv:id</td>
                        <td className="px-5 py-2 font-mono text-orange-200/50 text-xs">tmdb:movie:603, tmdb:tv:1399</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-bold text-slate-300 text-xs">Kitsu</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">kitsu:id</td>
                        <td className="px-5 py-2 font-mono text-orange-200/50 text-xs">kitsu:1</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-2 font-bold text-slate-300 text-xs">Anime</td>
                        <td className="px-5 py-2 text-slate-400 text-xs">provider:id</td>
                        <td className="px-5 py-2 font-mono text-orange-200/50 text-xs">anilist:123, mal:456</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 bg-[#080b10] border border-white/10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 blur-[80px] pointer-events-none" />

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Base Structure</h4>
                  <div className="p-4 bg-white/[0.04] border border-white/5 rounded-xl font-mono text-xs overflow-x-auto whitespace-nowrap pb-2">
                    <span className="text-slate-500">{baseUrl || 'http://localhost:3000'}</span>
                    <span className="text-white">/</span>
                    <span className="text-orange-500 font-bold">{'{type}'}</span>
                    <span className="text-white">/</span>
                    <span className="text-orange-500 font-bold">{'{id}'}</span>
                    <span className="text-white">.jpg?</span>
                    <span className="text-orange-400 font-bold">ratings</span>=<span className="text-slate-400 font-bold">{'{ratings}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-orange-400 font-bold">lang</span>=<span className="text-slate-400 font-bold">{'{lang}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-orange-400 font-bold">ratingStyle</span>=<span className="text-slate-400 font-bold">{'{style}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-orange-400 font-bold">imageText</span>=<span className="text-slate-400 font-bold">{'{text}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-orange-400 font-bold">posterRatingsLayout</span>=<span className="text-slate-400 font-bold">{'{layout}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-orange-400 font-bold">posterRatingsMaxPerSide</span>=<span className="text-slate-400 font-bold">{'{max}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-orange-400 font-bold">backdropRatingsLayout</span>=<span className="text-slate-400 font-bold">{'{bLayout}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-orange-400 font-bold">tmdbKey</span>=<span className="text-slate-400 font-bold">{'{tmdbKey}'}</span>
                    <span className="text-white">&</span>
                    <span className="text-orange-400 font-bold">mdblistKey</span>=<span className="text-slate-400 font-bold">{'{mdbKey}'}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-bold shrink-0">lang (optional):</span>
                      <span className="text-slate-400">All TMDB ISO 639-1 codes are supported (en, it, fr, es, de, etc.). Default: en.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-bold shrink-0">id (required):</span>
                      <span className="text-slate-400">IMDb ID (tt...), TMDB ID (tmdb:...), or Kitsu ID (kitsu:...).</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-bold shrink-0">tmdbKey (required):</span>
                      <span className="text-slate-400">Your TMDB v3 API Key.</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-bold shrink-0">mdblistKey (required):</span>
                      <span className="text-slate-400">Your MDBList API Key.</span>
                    </div>
                  </div>
                </div>

                <div className="mb-10 bg-orange-500/5 border border-orange-500/10 rounded-2xl md:rounded-3xl p-5 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/20 rounded-2xl">
                        <Bot className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-[var(--font-display)] text-white">AI Developer Prompt</h4>
                        <p className="text-xs text-slate-500">Copy this prompt to help an AI agent implement this API in your addon.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopyPrompt}
                        className={`mt-4 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-orange-500 text-black hover:bg-orange-400'}`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Clipboard className="w-4 h-4" />
                            <span>COPY PROMPT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0b0f15]/80 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-slate-400 leading-relaxed overflow-auto relative max-h-[340px]">
                    <div className="whitespace-pre-wrap">{`Act as an expert addon developer. I want to implement the ERDB Stateless API into my media center addon.

--- CONFIG INPUT ---
Add a single text field called "erdbConfig" (base64url). The user will paste it from the ERDB site after configuring there.
Do NOT hardcode API keys or base URL. Always use cfg.baseUrl from erdbConfig.

--- DECODE ---
Node/JS: const cfg = JSON.parse(Buffer.from(erdbConfig, 'base64url').toString('utf8'));

--- FULL API REFERENCE ---
Endpoint: GET /{type}/{id}.jpg?...queryParams

Parameter               | Values                                                              | Default
type (path)             | poster, backdrop, logo                                               | -
id (path)               | IMDb (tt...), TMDB (tmdb:id / tmdb:movie:id / tmdb:tv:id), Kitsu (kitsu:id), AniList, MAL          | -
ratings                 | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (global fallback)                                     |
posterRatings           | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (poster only)                                         |
backdropRatings         | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (backdrop only)                                       |
logoRatings             | tmdb, mdblist, imdb, tomatoes, tomatoesaudience, letterboxd,         | all
                        | metacritic, metacriticuser, trakt, rogerebert, myanimelist,          |
                        | anilist, kitsu (logo only)                                           |
lang                    | Any TMDB ISO 639-1 code (en, it, fr, es, de, ja, ko, etc.)            | en
streamBadges            | auto, on, off (global fallback)                                      | auto
posterStreamBadges      | auto, on, off (poster only)                                          | auto
backdropStreamBadges    | auto, on, off (backdrop only)                                        | auto
qualityBadgesSide       | left, right (poster top-bottom only)                                 | left
posterQualityBadgesPosition | auto, left, right (poster top/bottom only)                       | auto
qualityBadgesStyle      | glass, square, plain (global fallback)                               | glass
posterQualityBadgesStyle| glass, square, plain (poster only)                                   | glass
backdropQualityBadgesStyle| glass, square, plain (backdrop only)                               | glass
ratingStyle             | glass, square, plain                                                 | glass
imageText               | original, clean, alternative                                         | original
posterRatingsLayout     | top, bottom, left, right, top-bottom, left-right                     | top-bottom
posterRatingsMaxPerSide | Number (1-20)                                                        | auto
backdropRatingsLayout   | center, right, right-vertical                                        | center
tmdbKey (REQUIRED)      | Your TMDB v3 API Key                                                 | -
mdblistKey (REQUIRED)   | Your MDBList.com API Key                                             | -

TMDB NOTE: Always prefer tmdb:movie:id or tmdb:tv:id. Using bare tmdb:id can collide between movie and tv.

--- INTEGRATION REQUIREMENTS ---
1. Use ONLY the "erdbConfig" field (no modal and no extra settings panels).
2. Add toggles to enable/disable: poster, backdrop, logo.
3. If a type is disabled, keep the original artwork (do not call ERDB for that type).
4. Build ERDB URLs using the decoded config and inject them into both catalog and meta responses.

--- PER-TYPE SETTINGS ---
poster   -> ratingStyle = cfg.posterRatingStyle, imageText = cfg.posterImageText
backdrop -> ratingStyle = cfg.backdropRatingStyle, imageText = cfg.backdropImageText
logo     -> ratingStyle = cfg.logoRatingStyle (omit imageText)
Ratings providers can be set per-type via cfg.posterRatings / cfg.backdropRatings / cfg.logoRatings (fallback to cfg.ratings).
Quality badges style can be set per-type via cfg.posterQualityBadgesStyle / cfg.backdropQualityBadgesStyle (fallback to cfg.qualityBadgesStyle).

--- URL BUILD ---
const typeRatingStyle = type === 'poster' ? cfg.posterRatingStyle : type === 'backdrop' ? cfg.backdropRatingStyle : cfg.logoRatingStyle;
const typeImageText = type === 'backdrop' ? cfg.backdropImageText : cfg.posterImageText;
\${cfg.baseUrl}/\${type}/\${id}.jpg?tmdbKey=\${cfg.tmdbKey}&mdblistKey=\${cfg.mdblistKey}&ratings=\${cfg.ratings}&posterRatings=\${cfg.posterRatings}&backdropRatings=\${cfg.backdropRatings}&logoRatings=\${cfg.logoRatings}&lang=\${cfg.lang}&streamBadges=\${cfg.streamBadges}&posterStreamBadges=\${cfg.posterStreamBadges}&backdropStreamBadges=\${cfg.backdropStreamBadges}&qualityBadgesSide=\${cfg.qualityBadgesSide}&posterQualityBadgesPosition=\${cfg.posterQualityBadgesPosition}&qualityBadgesStyle=\${cfg.qualityBadgesStyle}&posterQualityBadgesStyle=\${cfg.posterQualityBadgesStyle}&backdropQualityBadgesStyle=\${cfg.backdropQualityBadgesStyle}&ratingStyle=\${typeRatingStyle}&imageText=\${typeImageText}&posterRatingsLayout=\${cfg.posterRatingsLayout}&posterRatingsMaxPerSide=\${cfg.posterRatingsMaxPerSide}&backdropRatingsLayout=\${cfg.backdropRatingsLayout}

Omit imageText when type=logo.

Skip any params that are undefined. Keep empty ratings/posterRatings/backdropRatings/logoRatings to disable providers.`}</div>
                </div>

                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Live Examples</h4>
                <pre className="text-xs font-mono text-slate-400 leading-6 space-y-1.5">
                  <div className="text-slate-600 font-bold">{'// Movie Poster (IMDb)'}</div>
                  <div className="text-orange-200/70 truncate bg-white/[0.04] p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/poster/tt0133093.jpg?ratings=imdb,tmdb&ratingStyle=plain`}</div>

                  <div className="text-slate-600 font-bold mt-4">{'// Backdrop (TMDB)'}</div>
                  <div className="text-orange-200/70 truncate bg-white/[0.04] p-3 rounded-lg border border-white/5">{`${baseUrl || 'http://localhost:3000'}/backdrop/tmdb:603.jpg?ratings=mdblist&backdropRatingsLayout=right-vertical`}</div>

                </pre>
              </div>
            </div>
          </div>
        </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 bg-[#080b10]">
        <div className="w-full mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Star className="w-4 h-4" />
            <span className="text-sm font-[var(--font-display)] tracking-tight text-white">ERDB Stateless Engine</span>
          </div>
          <p className="text-sm text-slate-500">
            (c) 2026 ERDB Project. Modern imagery for modern addons.
          </p>
        </div>
      </footer>
    </div>
    </div>
  );
}
