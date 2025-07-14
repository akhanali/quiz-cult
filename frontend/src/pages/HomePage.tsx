import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { presenceManager } from '../api/presenceManager';
import { 
  FaPlus, 
  FaUserFriends, 
  FaRobot, 
  FaChartLine, 
  FaClock, 
  FaTrophy,
  FaGamepad,
  FaLightbulb,
  FaCrown,
  FaUsers,
  FaRocket,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { IoSparklesSharp } from 'react-icons/io5';
import { MdQuiz, MdAccessTime } from 'react-icons/md';
import quizDojoLogo from '/logo-lockup.png';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();
  // Clear any existing disconnect handlers when returning to home page
  useEffect(() => {
    presenceManager.clearDisconnectHandlers();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF0DC]">
      {/* Hero Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={quizDojoLogo} 
                alt="Quiz Dojo" 
                className="h-12 sm:h-16 lg:h-20 w-auto"
              />
              <span className="dojo-title ml-3 text-3xl sm:text-4xl font-bold text-[#4E342E]" style={{ fontFamily: 'Baloo 2' }}>Quiz Dojo</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl text-[#6D4C41] mb-2 px-4">
              {t('welcome')}
            </p>
            <p className="text-base sm:text-lg text-[#6D4C41] max-w-2xl mx-auto px-4">
              {t('Create custom quizzes on any topic, compete with friends in real-time, and track your performance with detailed analytics', 'Create custom quizzes on any topic, compete with friends in real-time, and track your performance with detailed analytics')}
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4">
            <Link 
              to="/create-room" 
              className="group bg-[#10A3A2] hover:bg-[#05717B] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl 
                         shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 
                         flex items-center justify-center space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold
                         min-h-[48px] sm:min-h-[56px]"
            >
              <FaPlus className="text-lg sm:text-xl group-hover:rotate-90 transition-transform duration-300" />
              <span>{t('createRoom')}</span>
            </Link>
            
            <Link 
              to="/join-room" 
              className="group bg-[#F7E2C0] text-[#4E342E] border-2 border-[#10A3A2] px-6 sm:px-8 py-3 sm:py-4 rounded-xl 
                         shadow-lg hover:shadow-xl hover:bg-[#F4B46D] transform hover:scale-105 
                         transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold
                         min-h-[48px] sm:min-h-[56px]"
            >
              <FaUserFriends className="text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300" />
              <span>{t('joinRoom')}</span>
            </Link>
          </div>

          {/* How to Play Section */}
          <div className="bg-[#F7E2C0] rounded-2xl shadow-xl p-6 sm:p-8 mb-12 sm:mb-16 mx-4 border border-[#4E342E]/20">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center mb-4">
                <MdQuiz className="text-3xl sm:text-4xl text-[#10A3A2] mr-2" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#4E342E]">{t('How to Play')}</h2>
              </div>
              <p className="text-base sm:text-lg text-[#6D4C41] max-w-2xl mx-auto">
                {t('Get started with Quiz Dojo in just a few simple steps')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
              {/* For Hosts */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-[#4E342E]/10">
                <div className="flex items-center mb-4">
                  <div className="bg-[#F4B46D]/20 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <FaCrown className="text-2xl text-[#F4B46D]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#4E342E]">{t('For Hosts')}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="bg-[#F4B46D] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">1</span>
                    <p className="text-[#6D4C41]">{t('Create a room with your chosen topic and difficulty level')}</p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-[#F4B46D] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">2</span>
                    <p className="text-[#6D4C41]">{t('Share the 6-digit room code with your friends')}</p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-[#F4B46D] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">3</span>
                    <p className="text-[#6D4C41]">{t('Start the quiz and manage the game flow')}</p>
                  </div>
                </div>
              </div>

              {/* For Players */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-[#4E342E]/10">
                <div className="flex items-center mb-4">
                  <div className="bg-[#10A3A2]/20 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <FaUsers className="text-2xl text-[#10A3A2]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#4E342E]">{t('For Players')}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="bg-[#10A3A2] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">1</span>
                    <p className="text-[#6D4C41]">{t('Get a room code from the quiz host')}</p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-[#10A3A2] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">2</span>
                    <p className="text-[#6D4C41]">{t('Join the room with your chosen nickname')}</p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-[#10A3A2] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">3</span>
                    <p className="text-[#6D4C41]">{t('Answer questions quickly for higher scores')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Rules */}
            <div className="mt-8 sm:mt-10 bg-white rounded-xl p-6 shadow-lg border border-[#4E342E]/10">
              <div className="flex items-center mb-4">
                <div className="bg-[#05717B]/20 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <FaRocket className="text-2xl text-[#05717B]" />
                </div>
                <h3 className="text-xl font-bold text-[#4E342E]">{t('Game Rules')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-[#05717B]/10 rounded-lg p-4 mb-3">
                    <MdAccessTime className="text-2xl text-[#05717B] mx-auto mb-2" />
                    <h4 className="font-semibold text-[#4E342E] mb-2">{t('Time-Based Scoring')}</h4>
                    <p className="text-sm text-[#6D4C41]">{t('Faster answers earn more points. Speed matters!')}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-[#F4B46D]/10 rounded-lg p-4 mb-3">
                    <FaCheckCircle className="text-2xl text-[#F4B46D] mx-auto mb-2" />
                    <h4 className="font-semibold text-[#4E342E] mb-2">{t('Difficulty Levels')}</h4>
                    <p className="text-sm text-[#6D4C41]">{t('Easy (10-20s), Medium (21-30s), Hard (35s+)')}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-[#10A3A2]/10 rounded-lg p-4 mb-3">
                    <FaTrophy className="text-2xl text-[#10A3A2] mx-auto mb-2" />
                    <h4 className="font-semibold text-[#4E342E] mb-2">{t('Live Leaderboards')}</h4>
                    <p className="text-sm text-[#6D4C41]">{t('See real-time scores and compete with friends')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 px-4">
            <div className="bg-[#F7E2C0] rounded-xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow duration-300 border border-[#4E342E]/20">
              <div className="bg-[#10A3A2]/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaRobot className="text-2xl sm:text-3xl text-[#10A3A2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#4E342E] mb-2">{t('AI-Powered')}</h3>
              <p className="text-sm sm:text-base text-[#6D4C41]">
                {t('Generate unique questions on any topic using advanced AI technology')}
              </p>
            </div>

            <div className="bg-[#F7E2C0] rounded-xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow duration-300 border border-[#4E342E]/20">
              <div className="bg-[#10A3A2]/30 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaGamepad className="text-2xl sm:text-3xl text-[#10A3A2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#4E342E] mb-2">{t('Real-Time')}</h3>
              <p className="text-sm sm:text-base text-[#6D4C41]">
                {t('Compete with friends in live multiplayer quiz sessions')}
              </p>
            </div>

            <div className="bg-[#F7E2C0] rounded-xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow duration-300 border border-[#4E342E]/20">
              <div className="bg-[#05717B]/30 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaLightbulb className="text-2xl sm:text-3xl text-[#05717B]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#4E342E] mb-2">{t('Smart Difficulty', 'Smart Difficulty')}</h3>
              <p className="text-sm sm:text-base text-[#6D4C41]">
                {t('Choose from Easy, Medium, or Hard difficulty levels')}
              </p>
            </div>

            <div className="bg-[#F7E2C0] rounded-xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow duration-300 border border-[#4E342E]/20">
              <div className="bg-[#05717B]/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaChartLine className="text-2xl sm:text-3xl text-[#05717B]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#4E342E] mb-2">{t('Analytics', 'Analytics')}</h3>
              <p className="text-sm sm:text-base text-[#6D4C41]">
                {t('Track performance with detailed stats and leaderboards')}
              </p>
            </div>
          </div>

          {/* Key Benefits Section */}
          <div className="bg-[#F7E2C0] rounded-2xl shadow-xl p-6 sm:p-8 mb-8 sm:mb-12 mx-4 border border-[#4E342E]/20">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center mb-4">
                <IoSparklesSharp className="text-3xl sm:text-4xl text-[#F4B46D] mr-2" />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#4E342E]">{t('Why Choose Quiz Dojo?')}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="bg-[#10A3A2]/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaClock className="text-3xl sm:text-4xl text-[#10A3A2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#4E342E] mb-3">{t('Host Control', 'Host Control')}</h3>
                <p className="text-sm sm:text-base text-[#6D4C41]">
                  {t('Full control over quiz pacing with mid-game scoreboards and dynamic timing')}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-[#05717B]/30 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTrophy className="text-3xl sm:text-4xl text-[#05717B]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#4E342E] mb-3">{t('Competitive', 'Competitive')}</h3>
                <p className="text-sm sm:text-base text-[#6D4C41]">
                  {t('Time-based scoring system with live leaderboards and celebration animations')}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-[#10A3A2]/30 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUserFriends className="text-3xl sm:text-4xl text-[#10A3A2]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#4E342E] mb-3">{t('Social', 'Social')}</h3>
                <p className="text-sm sm:text-base text-[#6D4C41]">
                  {t('Easy room sharing with codes, multiplayer support, and engaging gameplay')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="text-center px-4">
            <div className="bg-[#4E342E] text-[#FDF0DC] rounded-xl p-4 sm:p-6 inline-block">
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <FaRobot className="text-[#10A3A2]" />
                  <span>{t('AI Questions', 'AI Questions')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaGamepad className="text-[#F6D35B]" />
                  <span>{t('Real-time Play', 'Real-time Play')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaChartLine className="text-[#F4B46D]" />
                  <span>{t('Performance Tracking', 'Performance Tracking')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaTrophy className="text-[#F6D35B]" />
                  <span>{t('Competitive Scoring', 'Competitive Scoring')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}