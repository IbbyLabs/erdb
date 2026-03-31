'use client';

import {
  Check,
  ChevronRight,
  Clipboard,
  ExternalLink,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';

import {
  METADATA_TRANSLATION_MODE_OPTIONS,
  type MetadataTranslationMode,
} from '@/lib/metadataTranslation';
import type { ConfiguratorExperienceMode } from '@/lib/configuratorPresets';

export type CurrentSetupItem = {
  label: string;
  value: string;
};

export function ConfiguratorSupportPanels({
  stickyPreviewEnabled,
  isAddonProxyOpen,
  isCurrentSetupOpen,
  isQuickActionsOpen,
  onToggleAddonProxy,
  onToggleCurrentSetup,
  onToggleQuickActions,
  proxyManifestUrl,
  onChangeProxyManifestUrl,
  proxyTranslateMeta,
  onToggleProxyTranslateMeta,
  experienceMode,
  proxyTranslateMetaMode,
  onSelectProxyTranslateMetaMode,
  proxyDebugMetaTranslation,
  onToggleProxyDebugMetaTranslation,
  displayedProxyUrl,
  proxyUrl,
  baseUrl,
  canGenerateProxy,
  proxyCopied,
  onCopyProxy,
  showProxyUrl,
  onToggleShowProxyUrl,
  currentSetupItems,
  onJumpToCenter,
  onJumpToExport,
  onFocusPreview,
}: {
  stickyPreviewEnabled: boolean;
  isAddonProxyOpen: boolean;
  isCurrentSetupOpen: boolean;
  isQuickActionsOpen: boolean;
  onToggleAddonProxy: () => void;
  onToggleCurrentSetup: () => void;
  onToggleQuickActions: () => void;
  proxyManifestUrl: string;
  onChangeProxyManifestUrl: (value: string) => void;
  proxyTranslateMeta: boolean;
  onToggleProxyTranslateMeta: (value: boolean) => void;
  experienceMode: ConfiguratorExperienceMode;
  proxyTranslateMetaMode: MetadataTranslationMode;
  onSelectProxyTranslateMetaMode: (value: MetadataTranslationMode) => void;
  proxyDebugMetaTranslation: boolean;
  onToggleProxyDebugMetaTranslation: (value: boolean) => void;
  displayedProxyUrl: string;
  proxyUrl: string;
  baseUrl: string;
  canGenerateProxy: boolean;
  proxyCopied: boolean;
  onCopyProxy: () => void;
  showProxyUrl: boolean;
  onToggleShowProxyUrl: () => void;
  currentSetupItems: CurrentSetupItem[];
  onJumpToCenter: () => void;
  onJumpToExport: () => void;
  onFocusPreview: () => void;
}) {
  return (
    <div id="proxy" className="space-y-3 scroll-mt-24">
      <div
        className={
          stickyPreviewEnabled
            ? 'xl:sticky xl:top-[var(--workspace-sticky-top)] xl:z-10 xl:max-h-[calc(100vh-var(--workspace-sticky-top)-20px)] xl:overflow-auto'
            : ''
        }
      >
        <div className="space-y-3">
          <div className="xrdb-panel xrdb-panel-form rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <button
              type="button"
              onClick={onToggleAddonProxy}
              className="xrdb-panel-head flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="xrdb-panel-eyebrow font-mono">Proxy</p>
                <h3 className="xrdb-panel-title text-white">Proxy Manifest</h3>
                <p className="xrdb-panel-copy text-zinc-400">
                  Paste a Stremio addon manifest here. XRDB will generate a proxy manifest that carries the current configurator settings into artwork output.
                </p>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isAddonProxyOpen ? 'rotate-90 text-violet-300' : ''}`} />
            </button>
            <div className="xrdb-accordion-body" data-open={isAddonProxyOpen}>
              <div className="xrdb-accordion-inner">
                <div className="space-y-3 mt-3">
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3">
                    <div className="text-[11px] font-semibold text-zinc-400">XRDB settings</div>
                    <p className="text-[11px] leading-5 text-zinc-500">
                      Use the configurator for keys, language, ratings, layout, badges, and text.
                    </p>
                    <p className="text-[11px] leading-5 text-zinc-500">
                      A plain addon manifest URL will not apply the settings configured here by itself. Use the generated XRDB proxy manifest below if those settings should drive addon artwork.
                    </p>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 block mb-1">Manifest URL</label>
                      <input
                        type="url"
                        value={proxyManifestUrl}
                        onChange={(event) => onChangeProxyManifestUrl(event.target.value)}
                        placeholder="https://addon.example.com/manifest.json"
                        className="w-full min-w-0 bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-violet-500/50 outline-none"
                      />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={proxyTranslateMeta}
                          onChange={(event) => onToggleProxyTranslateMeta(event.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black accent-violet-500"
                        />
                        <span className="space-y-1">
                          <span className="block text-[11px] font-semibold text-zinc-200">Translate metadata in the proxy</span>
                          <span className="block text-[11px] leading-5 text-zinc-500">
                            Preserve good addon text by default, then backfill localized TMDB text. Anime native IDs can bridge through anime mapping plus AniList or Kitsu when TMDB is weak.
                          </span>
                        </span>
                      </label>

                      {proxyTranslateMeta && experienceMode === 'advanced' ? (
                        <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-3">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Merge mode</div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {METADATA_TRANSLATION_MODE_OPTIONS.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => onSelectProxyTranslateMetaMode(option.id)}
                                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                    proxyTranslateMetaMode === option.id
                                      ? 'border-violet-500/60 bg-zinc-800 text-white'
                                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                              {METADATA_TRANSLATION_MODE_OPTIONS.find((option) => option.id === proxyTranslateMetaMode)?.description}
                            </p>
                          </div>

                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={proxyDebugMetaTranslation}
                              onChange={(event) => onToggleProxyDebugMetaTranslation(event.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black accent-violet-500"
                            />
                            <span className="space-y-1">
                              <span className="block text-[11px] font-semibold text-zinc-200">Attach debug provenance</span>
                              <span className="block text-[11px] leading-5 text-zinc-500">
                                Adds a `_xrdbMetaTranslation` object to proxied meta items so you can see which fields came from the source addon, TMDB, AniList, or Kitsu.
                              </span>
                            </span>
                          </label>
                        </div>
                      ) : null}

                      {proxyTranslateMeta && experienceMode === 'simple' ? (
                        <div className="rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-3 text-[11px] leading-5 text-zinc-500">
                          Simple mode keeps proxy translation on with the safe defaults from the preset.
                          Switch to advanced mode if you want to change merge mode or attach debug provenance.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="xrdb-panel-head">
                      <div>
                        <p className="xrdb-panel-eyebrow font-mono">Export</p>
                        <h3 className="text-xl font-semibold text-white">Generated Manifest</h3>
                        <p className="mt-2 text-sm text-zinc-400">
                          Use this URL in Stremio. It ends with manifest.json and has no query params.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/70 p-4 overflow-hidden">
                      <div className={`font-mono text-xs text-zinc-300 break-all${!showProxyUrl && proxyUrl ? ' select-none' : ''}`}>
                        {displayedProxyUrl || `${baseUrl || 'https://xrdb.example.com'}/proxy/{config}/manifest.json`}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={onCopyProxy}
                        disabled={!canGenerateProxy}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${canGenerateProxy ? (proxyCopied ? 'bg-green-500 text-white' : 'bg-violet-500 text-white hover:bg-violet-400') : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
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
                      <button
                        type="button"
                        onClick={onToggleShowProxyUrl}
                        disabled={!canGenerateProxy}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${canGenerateProxy ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 hover:text-white border border-violet-500/30' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'}`}
                        aria-label={showProxyUrl ? 'Hide proxy URL' : 'Show proxy URL'}
                      >
                        {showProxyUrl ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showProxyUrl ? 'HIDE' : 'SHOW'}</span>
                      </button>
                      <a
                        href={canGenerateProxy ? proxyUrl : undefined}
                        target="_blank"
                        rel="noreferrer"
                        className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors ${canGenerateProxy ? 'border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800' : 'border border-white/5 bg-zinc-950 text-zinc-600 pointer-events-none'}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </a>
                    </div>
                    {!canGenerateProxy ? (
                      <p className="mt-3 text-[11px] text-zinc-500">
                        Add manifest URL, TMDB key and MDBList key to generate a valid link.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-xs text-zinc-500">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <Zap className="w-4 h-4 text-violet-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-zinc-200 font-semibold">Route addon artwork through XRDB</div>
                        <div>Proxy routes `meta.poster`, `meta.background`, and `meta.logo` through XRDB for both `catalog` and `meta` responses using the active configurator settings above.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xrdb-panel xrdb-panel-preview rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <button
              type="button"
              onClick={onToggleCurrentSetup}
              className="xrdb-panel-head flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="xrdb-panel-eyebrow font-mono">Support</p>
                <h3 className="text-lg font-semibold text-white">Current Setup</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  A compact snapshot of the active output so the right rail stays useful while the configurator keeps scrolling.
                </p>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isCurrentSetupOpen ? 'rotate-90 text-violet-300' : ''}`} />
            </button>
            <div className="xrdb-accordion-body" data-open={isCurrentSetupOpen}>
              <div className="xrdb-accordion-inner">
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {currentSetupItems.map((item) => (
                    <div key={item.label} className="min-w-0 rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{item.label}</div>
                      <div className="mt-1 min-w-0 break-words text-sm font-semibold leading-5 text-white">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="xrdb-panel xrdb-panel-preview rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
            <button
              type="button"
              onClick={onToggleQuickActions}
              className="xrdb-panel-head flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <p className="xrdb-panel-eyebrow font-mono">Support</p>
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isQuickActionsOpen ? 'rotate-90 text-violet-300' : ''}`} />
            </button>
            <div className="xrdb-accordion-body" data-open={isQuickActionsOpen}>
              <div className="xrdb-accordion-inner">
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={onJumpToCenter}
                    className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition-colors hover:text-white"
                  >
                    Jump to center
                  </button>
                  <button
                    type="button"
                    onClick={onJumpToExport}
                    className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition-colors hover:text-white"
                  >
                    Jump to export
                  </button>
                  <button
                    type="button"
                    onClick={onFocusPreview}
                    className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition-colors hover:text-white"
                  >
                    Focus preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
