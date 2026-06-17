const flagMap: Record<string, string> = {
  // --- Các ngôn ngữ bạn đã có ---
  en: '🇬🇧', vi: '🇻🇳', ja: '🇯🇵', fr: '🇫🇷',
  de: '🇩🇪', zh: '🇨🇳', ko: '🇰🇷', es: '🇪🇸',

  // --- Châu Á & Đông Nam Á ---
  th: '🇹🇭', // Thái Lan
  id: '🇮🇩', // Indonesia
  ms: '🇲🇾', // Malaysia
  my: '🇲🇲', // Myanmar
  ph: '🇵🇭', // Philippines
  sg: '🇸🇬', // Singapore
  km: '🇰🇭', // Campuchia
  lo: '🇱🇦', // Lào
  in: '🇮🇳', // Ấn Độ
  tw: '🇹🇼', // Đài Loan
  hk: '🇭🇰', // Hồng Kông
  mn: '🇲🇳', // Mông Cổ

  // --- Châu Âu ---
  it: '🇮🇹', // Ý
  ru: '🇷🇺', // Nga
  pt: '🇵🇹', // Bồ Đào Nha
  nl: '🇳🇱', // Hà Lan
  pl: '🇵🇱', // Ba Lan
  tr: '🇹🇷', // Thổ Nhĩ Kỳ
  sv: '🇸🇪', // Thụy Điển
  no: '🇳🇴', // Na Uy
  fi: '🇫🇮', // Phần Lan
  da: '🇩🇰', // Đan Mạch
  uk: '🇺🇦', // Ukraine
  el: '🇬🇷', // Hy Lạp
  cs: '🇨🇿', // Séc
  ro: '🇷🇴', // Romania
  hu: '🇭🇺', // Hungary
  be: '🇧🇪', // Bỉ
  ch: '🇨🇭', // Thụy Sĩ
  at: '🇦🇹', // Áo
  ie: '🇮🇪', // Ireland

  // --- Châu Mỹ ---
  us: '🇺🇸', // Mỹ (Nếu bạn muốn tách biệt với tiếng Anh Anh 'en')
  ca: '🇨🇦', // Canada
  mx: '🇲🇽', // Mexico
  br: '🇧🇷', // Brazil
  ar: '🇦🇷', // Argentina
  co: '🇨🇴', // Colombia
  cl: '🇨🇱', // Chile
  pe: '🇵🇪', // Peru

  // --- Châu Úc ---
  au: '🇦🇺', // Úc
  nz: '🇳🇿', // New Zealand

  // --- Trung Đông & Châu Phi ---
  ar_AE: '🇦🇪', // UAE (Tiếng Ả Rập)
  sa: '🇸🇦', // Ả Rập Xê Út
  il: '🇮🇱', // Israel
  za: '🇿🇦', // Nam Phi
  eg: '🇪🇬', // Ai Cập
  ng: '🇳🇬', // Nigeria
};


interface DueVocabItemProps {
  term: string;
  languageCode: string;
  languageName: string;
  memoryStrength: number;
}

export default function DueVocabItem({ term, languageCode, languageName, memoryStrength }: DueVocabItemProps) {
  const strengthColor =
    memoryStrength > 0.7 ? 'var(--color-ok)' : memoryStrength > 0.4 ? 'var(--color-warn)' : 'var(--color-bad)';

  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
      {/* Flag circle */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{ background: 'var(--color-card-2)' }}
      >
        {flagMap[languageCode] ?? '🌐'}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--color-ink)] text-sm truncate">{term}</p>
        <p className="text-[var(--color-ink-3)] text-xs">{languageName}</p>
      </div>

      {/* Memory strength bar */}
      <div className="w-16 h-1.5 bg-[var(--color-line)] rounded-full overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.round(memoryStrength * 100)}%`,
            background: strengthColor,
          }}
        />
      </div>
    </div>
  );
}
