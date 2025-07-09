import React from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(true);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close modal with escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F6D35B] to-[#F4B46D] p-4 sm:p-6 border-b-2 border-[#4E342E]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#4E342E]">
                {t('Help us improve Quiz Dojo!')}
              </h2>
              <p className="text-sm sm:text-base text-[#6D4C41] mt-1">
                {t('Your feedback helps us create the best quiz experience')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#4E342E] hover:text-[#6D4C41] transition-colors duration-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
              aria-label={t('Close feedback form')}
            >
              <FaTimes className="text-xl sm:text-2xl" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <FaSpinner className="text-3xl text-[#10A3A2] animate-spin mx-auto mb-4" />
              <p className="text-[#6D4C41]">{t('Loading feedback form...')}</p>
            </div>
          </div>
        )}

        {/* Google Form Iframe */}
        <div className="relative">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSddFhnsRX06b8lCes4hJqT-1pehzsJz1ED80sGiCFEeH58hdQ/viewform?embedded=true"
            width="100%"
            height="600"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            onLoad={handleIframeLoad}
            className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            title="Quiz Dojo Feedback Form"
          >
            {t('Loading feedback form...')}
          </iframe>
        </div>

        {/* Footer */}
        <div className="bg-[#F7E2C0] p-4 border-t-2 border-[#4E342E]">
          <p className="text-sm text-[#6D4C41] text-center">
            {t('Thank you for helping us improve Quiz Dojo!')}
          </p>
        </div>
      </div>
    </div>
  );
} 