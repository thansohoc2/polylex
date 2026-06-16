import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇬🇧' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flagEmoji: '🇻🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文（简体）', flagEmoji: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文（繁體）', flagEmoji: '🇹🇼' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flagEmoji: '🇰🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flagEmoji: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flagEmoji: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flagEmoji: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, flagEmoji: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flagEmoji: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flagEmoji: '🇧🇩' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flagEmoji: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flagEmoji: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flagEmoji: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flagEmoji: '🇸🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flagEmoji: '🇩🇰' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flagEmoji: '🇳🇴' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flagEmoji: '🇫🇮' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flagEmoji: '🇬🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flagEmoji: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flagEmoji: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flagEmoji: '🇷🇴' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', flagEmoji: '🇹🇭' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flagEmoji: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flagEmoji: '🇲🇾' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flagEmoji: '🇺🇦' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true, flagEmoji: '🇮🇱' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true, flagEmoji: '🇮🇷' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flagEmoji: '🇰🇪' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flagEmoji: '🇵🇭' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true, flagEmoji: '🇵🇰' },
];

async function main() {
  console.log('🌱 Starting seed...');

  for (const lang of LANGUAGES) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {
        name: lang.name,
        nativeName: lang.nativeName,
        flagEmoji: lang.flagEmoji,
        rtl: lang.rtl ?? false,
      },
      create: {
        code: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
        flagEmoji: lang.flagEmoji,
        rtl: lang.rtl ?? false,
        isActive: true,
      },
    });
    console.log(`  ✓ Language: ${lang.name} (${lang.code})`);
  }

  console.log(`✅ Seeded ${LANGUAGES.length} languages`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
