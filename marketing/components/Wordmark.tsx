// Shiftle wordmark — "Shiftle" TEK kesintisiz akış (boşluksuz), fontun kendi kerningi.
//
// GEÇİCİ hali: `.font-brand` sınıfı (globals.css) marka fontu bağlanana kadar Plus Jakarta
// Sans'a düşer; sıkı tracking (-0.02em) sınıfta. Marka fontu (Switzer) `next/font/local`
// ile --font-brand'e bağlanınca bu span otomatik onu kullanır — kod değişmez.
//
// Sonraki cila (brief §1.2): "Shiftle"yi outline SVG path olarak dondur → "i" noktası ayrı
// <path> olur, amber (#f59e0b) boyanır; kerning fonttan bağımsız birebir sabitlenir. O gelince
// bu <span> outline SVG ile değişecek. Şimdilik i-noktası amber DEĞİL (elle bölme kerningi
// bozup "Sh|ftle" boşluğu açıyordu — brief'in uyardığı tuzak).
export default function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-brand font-extrabold ${className}`}>Shiftle</span>;
}
