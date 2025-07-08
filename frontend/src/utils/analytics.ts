// Analytics utility for tracking user interactions and unique users
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Generate a unique anonymous user ID
const generateUserId = (): string => {
  const storedId = localStorage.getItem('quiz_dojo_user_id');
  if (storedId) {
    return storedId;
  }
  
  const newId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  localStorage.setItem('quiz_dojo_user_id', newId);
  return newId;
};

// Get or create session ID
const getSessionId = (): string => {
  const storedSessionId = sessionStorage.getItem('quiz_dojo_session_id');
  if (storedSessionId) {
    return storedSessionId;
  }
  
  const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  sessionStorage.setItem('quiz_dojo_session_id', newSessionId);
  return newSessionId;
};

// Track page view
export const trackPageView = (page: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const userId = generateUserId();
    const sessionId = getSessionId();
    
    window.gtag('config', 'G-24XN0CK5HB', {
      page_title: page,
      page_location: window.location.href,
      custom_map: {
        'custom_user_id': userId,
        'custom_session_id': sessionId
      }
    });
    
    // Track custom event for page view
    window.gtag('event', 'page_view', {
      event_category: 'engagement',
      event_label: page,
      custom_user_id: userId,
      custom_session_id: sessionId
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventCategory: string,
  eventLabel?: string,
  eventValue?: number,
  customParameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const userId = generateUserId();
    const sessionId = getSessionId();
    
    window.gtag('event', eventName, {
      event_category: eventCategory,
      event_label: eventLabel,
      value: eventValue,
      custom_user_id: userId,
      custom_session_id: sessionId,
      ...customParameters
    });
  }
};

// Track quiz-specific events
export const trackQuizEvent = {
  // Room creation
  roomCreated: (topic: string, difficulty: string, questionCount: number) => {
    trackEvent('room_created', 'quiz', topic, questionCount, {
      difficulty,
      question_count: questionCount
    });
  },
  
  // Room joined
  roomJoined: (roomCode: string) => {
    trackEvent('room_joined', 'quiz', roomCode);
  },
  
  // Quiz started
  quizStarted: (roomCode: string, playerCount: number) => {
    trackEvent('quiz_started', 'quiz', roomCode, playerCount, {
      player_count: playerCount
    });
  },
  
  // Quiz completed
  quizCompleted: (roomCode: string, playerCount: number, questionsAnswered: number) => {
    trackEvent('quiz_completed', 'quiz', roomCode, questionsAnswered, {
      player_count: playerCount,
      questions_answered: questionsAnswered
    });
  },
  
  // Question answered
  questionAnswered: (isCorrect: boolean, timeUsed: number) => {
    trackEvent('question_answered', 'quiz', isCorrect ? 'correct' : 'incorrect', timeUsed, {
      is_correct: isCorrect,
      time_used: timeUsed
    });
  },
  
  // Language changed
  languageChanged: (language: string) => {
    trackEvent('language_changed', 'settings', language);
  },
  
  // User session
  sessionStart: () => {
    const userId = generateUserId();
    const sessionId = getSessionId();
    
    trackEvent('session_start', 'engagement', 'new_session', undefined, {
      user_id: userId,
      session_id: sessionId,
      timestamp: Date.now()
    });
  },
  
  sessionEnd: (duration: number) => {
    trackEvent('session_end', 'engagement', 'session_end', duration, {
      session_duration: duration
    });
  }
};

// Track user engagement
export const trackEngagement = {
  // Time spent on page
  timeOnPage: (page: string, duration: number) => {
    trackEvent('time_on_page', 'engagement', page, duration, {
      page_name: page,
      duration_seconds: duration
    });
  },
  
  // Button clicks
  buttonClick: (buttonName: string, page: string) => {
    trackEvent('button_click', 'engagement', buttonName, undefined, {
      button_name: buttonName,
      page: page
    });
  },
  
  // Feature usage
  featureUsed: (featureName: string) => {
    trackEvent('feature_used', 'engagement', featureName);
  }
};

// Initialize analytics tracking
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined') {
    // Track session start
    trackQuizEvent.sessionStart();
    
    // Track page view for current page
    const currentPage = window.location.pathname || '/';
    trackPageView(currentPage);
    
    // Set up session end tracking
    window.addEventListener('beforeunload', () => {
      const sessionStart = sessionStorage.getItem('quiz_dojo_session_start');
      if (sessionStart) {
        const duration = Date.now() - parseInt(sessionStart);
        trackQuizEvent.sessionEnd(duration);
      }
    });
    
    // Store session start time
    sessionStorage.setItem('quiz_dojo_session_start', Date.now().toString());
  }
};

// Get current user ID (for debugging)
export const getCurrentUserId = (): string => {
  return generateUserId();
};

// Get current session ID (for debugging)
export const getCurrentSessionId = (): string => {
  return getSessionId();
};

export default {
  trackPageView,
  trackEvent,
  trackQuizEvent,
  trackEngagement,
  initializeAnalytics,
  getCurrentUserId,
  getCurrentSessionId
}; 