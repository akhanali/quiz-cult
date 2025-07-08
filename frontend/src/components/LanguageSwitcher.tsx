import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lng', lng);
  };

  return (
    <div className="flex items-center space-x-1 text-sm opacity-80">
      <FaGlobe className="text-[#6D4C41] mr-1" style={{ fontSize: '1rem' }} />
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-0.5 rounded border bg-transparent transition-colors duration-200
          ${i18n.language === 'en'
            ? 'border-[#10A3A2] text-[#10A3A2] bg-[#10A3A2]/10 font-semibold'
            : 'border-[#BCAAA4] text-[#6D4C41] hover:border-[#10A3A2] hover:text-[#10A3A2]'}
        `}
        style={{ minWidth: 28 }}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-[#BCAAA4]">|</span>
      <button
        onClick={() => changeLanguage('ru')}
        className={`px-2 py-0.5 rounded border bg-transparent transition-colors duration-200
          ${i18n.language === 'ru'
            ? 'border-[#10A3A2] text-[#10A3A2] bg-[#10A3A2]/10 font-semibold'
            : 'border-[#BCAAA4] text-[#6D4C41] hover:border-[#10A3A2] hover:text-[#10A3A2]'}
        `}
        style={{ minWidth: 28 }}
        aria-label="Switch to Russian"
      >
        RU
      </button>
    </div>
  );
} 