// Shiftle wordmark — "Shiftle" TEK kesintisiz akış (boşluksuz), fontun kendi kerningi.
// Pazarlama marketing/components/Wordmark.tsx ile birebir (amber i-noktası YOK — elle bölme
// kerningi bozup "Sh|ftle" açtığı için). Panelde eski "Shiftle." amber-nokta biçiminin yerini
// alır → site↔panel marka birliği.
//
// `.font-brand` sınıfı (globals.css) marka fontu (Switzer) bağlanana kadar panelin yüklü
// Jakarta'sına düşer; sıkı tracking sınıfta. Switzer --font-brand'e bağlanınca kod değişmez.
export default function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-brand font-extrabold ${className}`}>Shiftle</span>;
}
