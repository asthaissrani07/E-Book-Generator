/** Prepare an off-screen element so html2canvas can paint it (negative z-index often yields blank PDFs). */
export function prepareElementForPdfCapture(element: HTMLElement): () => void {
  const wrapper = element.parentElement as HTMLElement | null;
  const prevWrapperStyle = wrapper?.getAttribute('style') ?? '';
  const prevElementStyle = element.getAttribute('style') ?? '';

  if (wrapper) {
    wrapper.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:595px',
      'z-index:2147483646',
      'pointer-events:none',
      'overflow:visible',
      'transform:translateX(-200vw)',
      'opacity:1',
      'visibility:visible',
    ].join(';');
  }

  element.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'width:595px',
    'background:#fff',
  ].join(';');

  return () => {
    if (wrapper) {
      if (prevWrapperStyle) wrapper.setAttribute('style', prevWrapperStyle);
      else wrapper.removeAttribute('style');
    }
    if (prevElementStyle) element.setAttribute('style', prevElementStyle);
    else element.removeAttribute('style');
  };
}

/** Wait until images inside the export root have loaded (or time out). */
export function waitForExportImages(root: HTMLElement, timeoutMs = 12000): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));

  const pending = images.filter((img) => !img.complete || img.naturalWidth === 0);
  if (pending.length === 0) return Promise.resolve();

  return Promise.race([
    Promise.all(
      pending.map(
        (img) =>
          new Promise<void>((resolve) => {
            const done = () => resolve();
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          })
      )
    ).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

export async function waitForNextPaint(): Promise<void> {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}
