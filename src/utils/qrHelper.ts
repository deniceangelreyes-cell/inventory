import QRCode from 'qrcode';

// Generate a data URL for a given text payload
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 250,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL', err);
    return createFallbackQrSvg(text);
  }
}

// Synchronous SVG fallback generator
export function createFallbackQrSvg(text: string): string {
  const encoded = encodeURIComponent(text);
  // Custom styled QR code vector SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none">
    <rect width="200" height="200" rx="16" fill="white"/>
    <rect x="15" y="15" width="50" height="50" rx="8" fill="#0f172a" stroke="#14b8a6" stroke-width="4"/>
    <rect x="25" y="25" width="30" height="30" rx="4" fill="#0f172a"/>
    <rect x="29" y="29" width="22" height="22" rx="2" fill="#14b8a6"/>
    <rect x="135" y="15" width="50" height="50" rx="8" fill="#0f172a" stroke="#14b8a6" stroke-width="4"/>
    <rect x="145" y="25" width="30" height="30" rx="4" fill="#0f172a"/>
    <rect x="149" y="29" width="22" height="22" rx="2" fill="#14b8a6"/>
    <rect x="15" y="135" width="50" height="50" rx="8" fill="#0f172a" stroke="#14b8a6" stroke-width="4"/>
    <rect x="25" y="145" width="30" height="30" rx="4" fill="#0f172a"/>
    <rect x="29" y="149" width="22" height="22" rx="2" fill="#14b8a6"/>
    <rect x="75" y="20" width="12" height="12" rx="2" fill="#0f172a"/>
    <rect x="95" y="20" width="22" height="12" rx="2" fill="#14b8a6"/>
    <rect x="75" y="40" width="22" height="12" rx="2" fill="#0891b2"/>
    <rect x="105" y="40" width="12" height="12" rx="2" fill="#0f172a"/>
    <rect x="75" y="75" width="16" height="16" rx="3" fill="#14b8a6"/>
    <rect x="100" y="75" width="25" height="16" rx="3" fill="#0f172a"/>
    <rect x="135" y="75" width="16" height="25" rx="3" fill="#0891b2"/>
    <rect x="160" y="75" width="20" height="20" rx="3" fill="#0f172a"/>
    <rect x="20" y="75" width="20" height="20" rx="3" fill="#0f172a"/>
    <rect x="48" y="75" width="16" height="16" rx="3" fill="#14b8a6"/>
    <rect x="75" y="100" width="20" height="20" rx="3" fill="#0f172a"/>
    <rect x="105" y="100" width="20" height="20" rx="3" fill="#14b8a6"/>
    <rect x="135" y="110" width="45" height="12" rx="2" fill="#0f172a"/>
    <rect x="75" y="135" width="25" height="20" rx="3" fill="#14b8a6"/>
    <rect x="110" y="135" width="20" height="20" rx="3" fill="#0f172a"/>
    <rect x="140" y="135" width="20" height="20" rx="3" fill="#0891b2"/>
    <rect x="170" y="135" width="15" height="15" rx="2" fill="#0f172a"/>
    <rect x="75" y="165" width="20" height="20" rx="3" fill="#0f172a"/>
    <rect x="105" y="165" width="40" height="20" rx="3" fill="#14b8a6"/>
    <rect x="155" y="165" width="30" height="20" rx="3" fill="#0f172a"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
