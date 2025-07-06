import { useState } from 'react';
import { createRoom } from '../api/createRoom';
import { useNavigate, Link } from 'react-router-dom';
import { presenceManager } from '../api/presenceManager';
import { validateTopic } from '../services/questionGeneration';
import { FaCheckCircle, FaClock, FaRocket, FaRobot, FaFileAlt, FaCheck, FaBook, FaBullseye, FaHome } from 'react-icons/fa';
import { MdAccessTime } from 'react-icons/md';
import type { DifficultyLevel } from '../../../shared/types';
import quizDojoLogo from '../assets/quiz-dojo-simple-logo.png';

export default function CreateRoomPage() {
  const [nickname, setNickname] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const [topicError, setTopicError] = useState('');

  const navigate = useNavigate();

  // Handle count input change - allow deletion
  const handleCountChange = (value: string) => {
    setCount(value);
  };

  // Reset to default when leaving field empty
  const handleCountBlur = () => {
    if (count === '') {
      setCount('5');
    }
  };

  // Real-time topic validation
  const handleTopicChange = (value: string) => {
    setTopic(value);
    setTopicError('');
    
    if (value.trim().length > 0) {
      const validation = validateTopic(value);
      if (!validation.valid) {
        setTopicError(validation.suggestion || 'Invalid topic');
      }
    }
  };

  const handleCreate = async () => {
    // Clear previous states
    setError('');
    setGenerationStatus('');
    
    // Validate inputs
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }
    
    if (!topic.trim()) {
      setError('Please enter a quiz topic');
      return;
    }

    // Validate topic
    const topicValidation = validateTopic(topic);
    if (!topicValidation.valid) {
      setError(topicValidation.suggestion || 'Please choose a valid topic');
      return;
    }
    
    const questionCount = Number(count);
    if (questionCount < 1 || questionCount > 50) {
      setError('Number of questions must be between 1 and 50');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Show appropriate generation status
      setGenerationStatus(`Creating ${questionCount} ${difficulty} questions...`);
      
      const roomData = await createRoom(nickname, topic, difficulty as DifficultyLevel, questionCount);
      
      // Show success message with generation result
      if (roomData.aiGenerated) {
        setGenerationStatus(`Successfully generated ${questionCount} AI questions about "${topic}"!`);
      } else {
        if (roomData.fallbackReason) {
          setGenerationStatus(`Created ${questionCount} questions (${roomData.fallbackReason})`);
        } else {
          setGenerationStatus(`Created ${questionCount} questions successfully`);
        }
      }
      
      localStorage.setItem("userId", roomData.playerId);
      
      // Set up onDisconnect for the host immediately after room creation
      presenceManager.setupDisconnectCleanup(roomData.roomId, roomData.playerId, true);
      
      // Short delay to show success message, then navigate
      setTimeout(() => {
        navigate(`/lobby/${roomData.roomId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error instanceof Error ? error.message : 'Failed to create room. Please try again.');
      setGenerationStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  const difficultyOptions = [
    {
      value: 'easy',
      icon: FaCheckCircle,
      iconColor: 'text-[#10A3A2]',
      title: 'Easy',
      description: 'Basic recall or recognition',
      details: 'Answerable with little to no thinking. No calculations, minimal reading.',
      examples: 'Naming a capital city, identifying a color, simple true/false',
      time: '10–20 seconds'
    },
    {
      value: 'medium',
      icon: FaClock,
      iconColor: 'text-[#F6D35B]',
      title: 'Medium',
      description: 'Understanding and light reasoning',
      details: 'Might involve basic calculations or comparisons. Moderate reading or decision-making.',
      examples: 'Choosing the correct formula, interpreting a small graph, simple logic',
      time: '21–30 seconds'
    },
    {
      value: 'hard',
      icon: FaRocket,
      iconColor: 'text-[#F4B46D]',
      title: 'Hard',
      description: 'Critical thinking and domain knowledge',
      details: 'Could involve reading a passage, analyzing data, or solving multi-step problems.',
      examples: 'Solving math problems with multiple operations, interpreting research results',
      time: '35+ seconds'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDF0DC] py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={quizDojoLogo} 
              alt="Logo" 
              className="h-10 sm:h-12 w-auto"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-center text-[#4E342E]">Create a Quiz Room</h2>
        </div>
        
        {/* Error Messages */}
        {error && (
          <div className="bg-[#F4B46D]/20 border border-[#F4B46D] text-[#4E342E] px-3 sm:px-4 py-3 rounded mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Generation Status */}
        {generationStatus && (
          <div className={`px-3 sm:px-4 py-3 rounded mb-4 sm:mb-6 text-center font-medium text-sm sm:text-base ${
            generationStatus.includes('Successfully generated') 
              ? 'bg-[#10A3A2]/20 border border-[#10A3A2] text-[#4E342E]'
              : generationStatus.includes('Created')
              ? 'bg-[#F6D35B]/20 border border-[#F6D35B] text-[#4E342E]'
              : 'bg-[#05717B]/20 border border-[#05717B] text-[#4E342E]'
          }`}>
            {generationStatus}
          </div>
        )}
        
        <div className="bg-[#F7E2C0] rounded-xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6 border border-[#4E342E]/20">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4E342E] mb-2">Your Nickname</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full border border-[#4E342E]/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-[#10A3A2] focus:border-[#10A3A2]
                         text-base sm:text-lg min-h-[44px] sm:min-h-[48px] bg-[#FDF0DC] text-[#4E342E] placeholder-[#6D4C41]/60"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4E342E] mb-2">
                Quiz Topic
              </label>
              <input
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder="e.g., Science, History, Sports, Movies"
                className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-[#10A3A2] focus:border-[#10A3A2]
                          text-base sm:text-lg min-h-[44px] sm:min-h-[48px] bg-[#FDF0DC] text-[#4E342E] placeholder-[#6D4C41]/60 ${
                  topicError ? 'border-[#F4B46D]' : 'border-[#4E342E]/30'
                }`}
                disabled={isLoading}
              />
              {topicError && (
                <p className="text-[#F4B46D] text-sm mt-1">{topicError}</p>
              )}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-[#4E342E] mb-3 sm:mb-4">Difficulty Level</label>
            <div className="space-y-3">
              {difficultyOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all ${
                    difficulty === option.value
                      ? 'border-[#10A3A2] bg-[#10A3A2]/10'
                      : 'border-[#4E342E]/30 hover:border-[#4E342E]/50 bg-[#FDF0DC]'
                  }`}
                  onClick={() => setDifficulty(option.value)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={difficulty === option.value}
                      onChange={() => setDifficulty(option.value)}
                      className="mt-1 mr-3 w-4 h-4 sm:w-5 sm:h-5 text-[#10A3A2] focus:ring-[#10A3A2]"
                      disabled={isLoading}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div className="flex items-center mb-1 sm:mb-0">
                          <option.icon className={`text-lg sm:text-xl mr-2 ${option.iconColor}`} />
                          <span className="font-semibold text-base sm:text-lg text-[#4E342E]">{option.title}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-[#6D4C41] flex items-center">
                          <MdAccessTime className="mr-1" />
                          {option.time}
                        </span>
                      </div>
                      <p className="text-[#4E342E] font-medium mb-1 text-sm sm:text-base">{option.description}</p>
                      <p className="text-[#6D4C41] text-xs sm:text-sm mb-2">{option.details}</p>
                      <p className="text-[#6D4C41]/80 text-xs">
                        <strong>Examples:</strong> {option.examples}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-[#4E342E] mb-2">Number of Questions</label>
            <input
              type="number"
              value={count}
              onChange={(e) => handleCountChange(e.target.value)}
              onBlur={handleCountBlur}
              min={1}
              max={20}
              className="w-full border border-[#4E342E]/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-[#10A3A2] focus:border-[#10A3A2]
                       text-base sm:text-lg min-h-[44px] sm:min-h-[48px] bg-[#FDF0DC] text-[#4E342E]"
              disabled={isLoading}
            />
            <p className="text-[#6D4C41] text-sm mt-1">Choose between 1-50 questions</p>
          </div>

          {/* Create Button */}
          <button 
            onClick={handleCreate} 
            className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors
                       min-h-[48px] sm:min-h-[56px] ${
              isLoading 
                ? 'bg-[#6D4C41] cursor-not-allowed' 
                : 'bg-[#10A3A2] hover:bg-[#05717B]'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isLoading || !!topicError}
          >
            {isLoading 
              ? 'Creating Room...' 
              : 'Create Quiz'
            }
          </button>

          {/* Information Footer */}
          <div className="text-center text-[#6D4C41] text-xs sm:text-sm">
            <p className="flex items-center justify-center">
              <FaBook className="mr-2" />
              Create engaging quiz questions on any topic you choose!
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 text-[#6D4C41] hover:text-[#4E342E] 
                     transition-colors duration-300 font-medium text-sm sm:text-base py-2 px-4 rounded-lg hover:bg-[#F7E2C0]/50"
          >
            <FaHome className="text-base sm:text-lg" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}