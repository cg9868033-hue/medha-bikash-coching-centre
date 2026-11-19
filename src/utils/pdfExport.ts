import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Ensure web fonts (including Hind Siliguri Bengali) have finished loading
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const dataUrl = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2.5,
    cacheBust: true,
    backgroundColor: '#071426',
  });

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to render document image for PDF export.'));
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const imgRatio = img.width / img.height;
  let renderWidth = maxWidth;
  let renderHeight = renderWidth / imgRatio;

  if (renderHeight > maxHeight) {
    renderHeight = maxHeight;
    renderWidth = renderHeight * imgRatio;
  }

  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  pdf.addImage(dataUrl, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST');
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function printDocumentElement(): void {
  window.print();
}
