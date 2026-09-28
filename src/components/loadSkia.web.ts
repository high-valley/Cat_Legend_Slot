import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// Resolved at module load, before the router can rewrite the URL: canvaskit.wasm is served next to the page.
const pageBase = new URL('./', window.location.href).href;

let loading: Promise<void> | null = null;

/** WebではSkiaの本体(CanvasKit, wasm)をページと同じ場所から読み込んでから描画する */
export function loadSkia(): Promise<void> {
  loading ??= LoadSkiaWeb({ locateFile: (file: string) => `${pageBase}${file}` });
  return loading;
}

loadSkia().catch(() => {});
