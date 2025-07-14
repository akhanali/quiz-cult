import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';
import { trackQuizEvent } from '../utils/analytics';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'Eng', flag: '🇺🇸' },
    { code: 'ru', name: 'Рус', flag: '🇷🇺' },
    { code: 'fr', name: 'Fra', flag: '🇫🇷' },
    { code: 'kz', name: 'Қаз', flag: '🇰🇿' },
    { code: 'es', name: 'Esp', flag: '🇪🇸' }
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
        className="flex items-center space-x-2 bg-[#F7E2C0] hover:bg-[#F4B46D] px-3 py-2 rounded-lg 
                   border-2 border-[#10A3A2] hover:border-[#05717B] transition-all duration-200 
                   shadow-lg hover:shadow-xl text-[#4E342E] hover:text-[#4E342E] transform 
                   backdrop-blur-sm"
        aria-label="Switch language"
      >
        <FaGlobe className="text-sm text-[#10A3A2]" />
        <span className="text-sm font-medium">{currentLanguage.flag}</span>
        <FaChevronDown className={`text-xs text-[#10A3A2] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-[#F7E2C0] rounded-lg shadow-xl border-2 border-[#10A3A2] 
                        py-1 min-w-[120px] z-50 backdrop-blur-sm">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full text-left px-3 py-2 text-xs transition-all duration-150 hover:bg-[#F4B46D] 
                        first:rounded-t-md last:rounded-b-md
                         ${i18n.language === language.code 
                           ? 'bg-[#10A3A2] text-white font-semibold' 
                           : 'text-[#4E342E] hover:text-[#4E342E]'}`}
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