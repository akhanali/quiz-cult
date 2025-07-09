import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';
import { trackQuizEvent } from '../utils/analytics';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('lng', languageCode);
    setIsOpen(false);
    
    // Track language change event
    trackQuizEvent.languageChanged(languageCode);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg 
                   border border-gray-200 hover:bg-white/90 transition-all duration-200 
                   shadow-sm hover:shadow-md text-gray-700 hover:text-gray-900"
        aria-label="Switch language"
      >
        <FaGlobe className="text-sm" />
        <span className="text-sm font-medium">{currentLanguage.flag}</span>
        <FaChevronDown className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 
                        py-1 min-w-[140px] z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-150
                         ${i18n.language === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
            >
              <span className="mr-2">{language.flag}</span>
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 