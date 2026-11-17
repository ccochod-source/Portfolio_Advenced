import { BACKDROP_SYMBOL_ASSETS } from "@/components/backdrop/assets";
import { AVATAR_MODEL_URL, AVATAR_POSTER_URL } from "@/components/three/avatar/clips";
import { CLOUD_PHOTO_URLS, heroSceneTextureUrlsForViewport, SKY_TEXTURE_URL } from "@/components/three/hero/constants";
import { HERO_MODE } from "@/lib/hero/mode";
import { HERO_VIDEO_ASSETS, heroVideoFormatForViewport } from "@/lib/hero/assets";

const ESTIMATED_ASSET_BYTES = 150 * 1024;
const QUIET_WINDOW_MS = 750;

type ProgressTask = {
  label: string;
  src?: string;
  weight: number;
  loaded: number;
  failed: boolean;
};

type ProgressTaskHandle = {
  setWeight(weight: number): void;
  update(bytes: number): void;
  complete(failed?: boolean): void;
};

type AssetLoadReportEntry = Pick<ProgressTask, "label" | "src" | "weight" | "loaded" | "failed">;

type AssetLoadSession = {
  progress(): number;
  done: Promise<void>;
  report(): AssetLoadReportEntry[];
};

let session: AssetLoadSession | null = null;
const heroVideoPromises = new Map<string, Promise<string | null>>();

function createProgressTracker() {
  const tasks: ProgressTask[] = [];
  let totalWeight = 0;
  let totalLoaded = 0;

  const add = (label: string, src?: string): ProgressTaskHandle => {
    const task: ProgressTask = { label, src, weight: ESTIMATED_ASSET_BYTES, loaded: 0, failed: false };
    tasks.push(task);
    totalWeight += task.weight;

    return {
      setWeight(weight) {
        if (!Number.isFinite(weight) || weight <= 0) return;
        const nextWeight = Math.max(weight, task.loaded);
        totalWeight += nextWeight - task.weight;
        task.weight = nextWeight;
      },
      update(bytes) {
        const nextLoaded = Math.max(task.loaded, Math.min(task.weight, bytes));
        totalLoaded += nextLoaded - task.loaded;
        task.loaded = nextLoaded;
      },
      complete(failed = false) {
        if (task.loaded < task.weight) {
          totalLoaded += task.weight - task.loaded;
          task.loaded = task.weight;
        }
        task.failed ||= failed;
      },
    };
  };

  return {
    add,
    progress() {
      return totalWeight > 0 ? Math.min(1, totalLoaded / totalWeight) : 0;
    },
    report() {
      return tasks.map(({ label, src, weight, loaded, failed }) => ({ label, src, weight, loaded, failed }));
    },
  };
}

function documentReady() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
}

function decodeImage(image: HTMLImageElement) {
  if (typeof image.decode === "function") return Promise.resolve().then(() => image.decode());
  if (image.complete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

function pageAssetUrls() {
  const urls = new Set<string>(Object.values(BACKDROP_SYMBOL_ASSETS));
  const pathname = window.location.pathname.replace(/^\/(?:fr|en)(?=\/|$)/, "") || "/";
  const home = pathname === "/";
  const avatarPage = pathname === "/lab/avatar";
  const heroLab = pathname === "/lab/hero";
  const posterLab = pathname === "/lab/poster";
  const portrait = window.matchMedia("(max-aspect-ratio: 1/1)").matches;

  if (home) {
    urls.add(AVATAR_MODEL_URL);
    urls.add(AVATAR_POSTER_URL);
    if (HERO_MODE === "video") {
      const asset = HERO_VIDEO_ASSETS[heroVideoFormatForViewport()];
      urls.add(asset.poster);
    } else {
      heroSceneTextureUrlsForViewport(portrait).forEach((url) => urls.add(url));
    }

    document.querySelectorAll<HTMLElement>("[data-gallery-assets]").forEach((element) => {
      element.dataset.galleryAssets?.split(/\s+/).filter(Boolean).forEach((url) => urls.add(url));
    });
  }

  if (avatarPage) {
    urls.add(AVATAR_MODEL_URL);
    urls.add(AVATAR_POSTER_URL);
  }
  if (heroLab) {
    urls.add(AVATAR_MODEL_URL);
    urls.add(AVATAR_POSTER_URL);
    heroSceneTextureUrlsForViewport(portrait).forEach((url) => urls.add(url));
  }
  if (posterLab) {
    urls.add(AVATAR_MODEL_URL);
    urls.add(AVATAR_POSTER_URL);
    urls.add(SKY_TEXTURE_URL);
    urls.add(CLOUD_PHOTO_URLS[0]);
  }

  return [...urls];
}

export function startSiteAssetLoad(): { progress(): number; done: Promise<void> } {
  if (session) return session;
  if (typeof window === "undefined") return { progress: () => 0, done: Promise.resolve() };

  const tracker = createProgressTracker();
  const imageSources = new WeakMap<HTMLImageElement, string>();
  const heroSource =
    HERO_MODE === "video" &&
    (window.location.pathname.replace(/^\/(?:fr|en)(?=\/|$)/, "") || "/") === "/"
      ? HERO_VIDEO_ASSETS[heroVideoFormatForViewport()].video
      : null;
  let pending = 0;
  let quietTimer = 0;
  let resolved = false;
  let resolveDone = () => {};
  const homePage = (window.location.pathname.replace(/^\/(?:fr|en)(?=\/|$)/, "") || "/") === "/";
  let galleryAssetsReady = !homePage;
  if (homePage) pending += 1;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const scheduleCompletion = () => {
    if (resolved || pending > 0) return;
    window.clearTimeout(quietTimer);
    quietTimer = window.setTimeout(() => {
      if (resolved || pending > 0) return;
      resolved = true;
      observer.disconnect();
      resolveDone();
    }, QUIET_WINDOW_MS);
  };

  const trackPromise = (label: string, promise: Promise<unknown>, src?: string) => {
    const task = tracker.add(label, src);
    pending += 1;
    void promise
      .catch(() => {
        task.complete(true);
      })
      .then(() => {
        task.complete();
        pending -= 1;
        scheduleCompletion();
      });
  };

  const fetchAsset = async (src: string, label: string, createUrl = false): Promise<string | null> => {
    const task = tracker.add(label, src);
    pending += 1;
    let failed = false;
    let objectUrl: string | null = null;
    try {
      const response = await fetch(src, { cache: "force-cache" });
      if (!response.ok) throw new Error(`Asset request failed (${response.status}): ${src}`);
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > 0) task.setWeight(contentLength);
      const chunks: ArrayBuffer[] = [];
      let loaded = 0;
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          if (!value) continue;
          loaded += value.byteLength;
          task.update(loaded);
          if (createUrl) {
            const chunk = new ArrayBuffer(value.byteLength);
            new Uint8Array(chunk).set(value);
            chunks.push(chunk);
          }
        }
      } else {
        const buffer = await response.arrayBuffer();
        loaded = buffer.byteLength;
        task.setWeight(contentLength || loaded);
        task.update(loaded);
        if (createUrl) chunks.push(buffer);
      }
      if (createUrl) {
        const type = response.headers.get("content-type") || "video/mp4";
        objectUrl = URL.createObjectURL(new Blob(chunks, { type }));
      }
    } catch {
      failed = true;
    } finally {
      task.complete(failed);
      pending -= 1;
      scheduleCompletion();
    }
    return objectUrl;
  };

  const trackedAssetUrls = new Set<string>();
  const trackAssetUrl = (url: string) => {
    if (url === heroSource || trackedAssetUrls.has(url)) return;
    trackedAssetUrls.add(url);
    void fetchAsset(url, "page asset");
  };

  const scanPageAssets = (node?: Node) => {
    if (node && !(node instanceof Element) && !(node instanceof DocumentFragment)) return;
    const scope = node instanceof Element || node instanceof DocumentFragment ? node : document;
    const elements: HTMLElement[] = [];
    if (scope instanceof HTMLElement && scope.matches("[data-gallery-assets]")) elements.push(scope);
    scope.querySelectorAll<HTMLElement>("[data-gallery-assets]").forEach((element) => elements.push(element));
    if (!elements.length) return;

    elements.forEach((element) => {
      element.dataset.galleryAssets?.split(/\s+/).filter(Boolean).forEach(trackAssetUrl);
    });
    if (!galleryAssetsReady) {
      galleryAssetsReady = true;
      pending -= 1;
      scheduleCompletion();
    }
  };

  const addImage = (image: HTMLImageElement) => {
    image.loading = "eager";
    const src = image.currentSrc || image.src;
    if (!src || imageSources.get(image) === src) return;
    imageSources.set(image, src);
    trackPromise("image decode", decodeImage(image), src);
  };

  const scanImages = (node?: Node) => {
    if (node instanceof HTMLImageElement) {
      addImage(node);
      return;
    }
    const scope = node instanceof Element ? node : document;
    scope.querySelectorAll("img").forEach((image) => addImage(image));
  };

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "attributes") {
        scanImages(record.target);
        if (record.attributeName === "data-gallery-assets") scanPageAssets(record.target);
      } else {
        record.addedNodes.forEach((node) => {
          scanImages(node);
          scanPageAssets(node);
        });
      }
    });
  });

  trackPromise("document ready", documentReady());
  if (document.fonts) trackPromise("document fonts", document.fonts.ready);
  scanImages();
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["src", "srcset", "data-gallery-assets"],
    childList: true,
    subtree: true,
  });

  const urls = pageAssetUrls();
  urls.forEach(trackAssetUrl);
  scanPageAssets();
  if (heroSource) {
    const heroPromise = fetchAsset(heroSource, "hero video", true);
    heroVideoPromises.set(heroSource, heroPromise);
  }

  scheduleCompletion();
  session = {
    progress: tracker.progress,
    done,
    report: tracker.report,
  };
  return session;
}

export function getPreloadedHeroVideo(src: string): Promise<string | null> {
  return heroVideoPromises.get(src) ?? Promise.resolve(null);
}

export function getSiteAssetLoadReport(): AssetLoadReportEntry[] {
  return session?.report() ?? [];
}
