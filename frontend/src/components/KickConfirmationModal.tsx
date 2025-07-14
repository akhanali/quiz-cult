import { FaExclamationTriangle, FaTimes, FaUserSlash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface KickConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  playerName: string;
  isLoading?: boolean;
}

export default function KickConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  playerName,
  isLoading = false
}: KickConfirmationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-red-600 text-lg" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {t('Kick Player')}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            {t('Are you sure you want to kick')} <span className="font-semibold text-gray-900">{playerName}</span> {t('from the room?')}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <FaUserSlash className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">
                {t('This action cannot be undone. The player will be immediately removed from the room.')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('Kicking...')}</span>
              </>
            ) : (
              <>
                <FaUserSlash className="text-sm" />
                <span>{t('Kick Player')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 