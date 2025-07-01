import { useState } from 'react';
import { createRoom } from '../api/createRoom';
import { useNavigate } from 'react-router-dom';
import { presenceManager } from '../api/presenceManager';
import { validateTopic } from '../services/questionGeneration';
import { isOpenAIAvailable } from '../lib/openai';
import type { DifficultyLevel } from '../../../shared/types';
import { FaCheckCircle, FaClock, FaRocket, FaRobot, FaFileAlt, FaCheck, FaBook, FaBullseye } from 'react-icons/fa';
import { MdAccessTime } from 'react-icons/md';

export default function CreateRoomPage() {
  const [nickname, setNickname] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [count, setCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationStatus, setGenerationStatus] = useState('');
  const [topicError, setTopicError] = useState('');

  const navigate = useNavigate();

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
    
    if (count < 1 || count > 20) {
      setError('Number of questions must be between 1 and 20');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Show appropriate generation status
      if (isOpenAIAvailable) {
        setGenerationStatus(`Generating ${count} ${difficulty} questions about "${topic}"...`);
      } else {
        setGenerationStatus(`Creating ${count} ${difficulty} questions (using sample questions)...`);
      }
      
      const roomData = await createRoom(nickname, topic, difficulty, count);
      
      // Show success message with generation result
      if (roomData.aiGenerated) {
        setGenerationStatus(`Successfully generated ${count} AI questions about "${topic}"!`);
      } else {
        if (roomData.fallbackReason) {
          setGenerationStatus(`Using sample questions (${roomData.fallbackReason})`);
        } else {
          setGenerationStatus(`Created ${count} questions using samples`);
        }
      }
      
      localStorage.setItem("userId", roomData.playerId);
      
      // Set up onDisconnect for the host immediately after room creation
      presenceManager.setupDisconnectCleanup(roomData.roomId, roomData.playerId, true);
      
      // Short delay to show success message, then navigate
      setTimeout(() => {
        navigate(`/room/${roomData.roomId}`);
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
      value: 'easy' as DifficultyLevel,
      icon: FaCheckCircle,
      iconColor: 'text-green-600',
      title: 'Easy',
      description: 'Basic recall or recognition',
      details: 'Answerable with little to no thinking. No calculations, minimal reading.',
      examples: 'Naming a capital city, identifying a color, simple true/false',
      time: '10–20 seconds'
    },
    {
      value: 'medium' as DifficultyLevel,
      icon: FaClock,
      iconColor: 'text-yellow-600',
      title: 'Medium',
      description: 'Understanding and light reasoning',
      details: 'Might involve basic calculations or comparisons. Moderate reading or decision-making.',
      examples: 'Choosing the correct formula, interpreting a small graph, simple logic',
      time: '21–30 seconds'
    },
    {
      value: 'hard' as DifficultyLevel,
      icon: FaRocket,
      iconColor: 'text-red-600',
      title: 'Hard',
      description: 'Critical thinking and domain knowledge',
      details: 'Could involve reading a passage, analyzing data, or solving multi-step problems.',
      examples: 'Solving math problems with multiple operations, interpreting research results',
      time: '35+ seconds'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-center">Create a Quiz Room</h2>
        
        {/* AI Status Banner */}
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${isOpenAIAvailable 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-start sm:items-center">
            {isOpenAIAvailable ? (
              <FaRobot className="text-base sm:text-lg mr-2 mt-0.5 sm:mt-0 flex-shrink-0" />
            ) : (
              <FaFileAlt className="text-base sm:text-lg mr-2 mt-0.5 sm:mt-0 flex-shrink-0" />
            )}
            <span className="font-medium text-sm sm:text-base">
              {isOpenAIAvailable 
                ? 'AI Question Generation Active - Create questions about any topic!' 
                : 'AI Unavailable - Using sample questions (see SETUP_OPENAI.md to enable AI)'
              }
            </span>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-3 rounded mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Generation Status */}
        {generationStatus && (
          <div className={`px-3 sm:px-4 py-3 rounded mb-4 sm:mb-6 text-center font-medium text-sm sm:text-base ${
            generationStatus.includes('Successfully generated') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : generationStatus.includes('Using sample questions')
              ? 'bg-yellow-100 border border-yellow-400 text-yellow-700'
              : 'bg-blue-100 border border-blue-400 text-blue-700'
          }`}>
            {generationStatus}
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Nickname</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-base sm:text-lg min-h-[44px] sm:min-h-[48px]"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Topic {isOpenAIAvailable && <span className="text-blue-600">(Any subject you want!)</span>}
              </label>
              <input
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder={isOpenAIAvailable 
                  ? "e.g., Space Science, Ancient Rome, Marine Biology, JavaScript" 
                  : "e.g., Science, History, Sports, Movies"
                }
                className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          text-base sm:text-lg min-h-[44px] sm:min-h-[48px] ${
                  topicError ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              />
              {topicError && (
                <p className="text-red-600 text-sm mt-1">{topicError}</p>
              )}
              {isOpenAIAvailable && topic.trim() && !topicError && (
                <p className="text-green-600 text-sm mt-1 flex items-center">
                  <FaCheck className="mr-1" />
                  Great topic choice! AI will generate custom questions.
                </p>
              )}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4">Difficulty Level</label>
            <div className="space-y-3">
              {difficultyOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all ${
                    difficulty === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setDifficulty(option.value)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={difficulty === option.value}
                      onChange={() => setDifficulty(option.value)}
                      className="mt-1 mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      disabled={isLoading}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div className="flex items-center mb-1 sm:mb-0">
                          <option.icon className={`text-lg sm:text-xl mr-2 ${option.iconColor}`} />
                          <span className="font-semibold text-base sm:text-lg">{option.title}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 flex items-center">
                          <MdAccessTime className="mr-1" />
                          {option.time}
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium mb-1 text-sm sm:text-base">{option.description}</p>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2">{option.details}</p>
                      <p className="text-gray-500 text-xs">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              min={1}
              max={20}
              className="w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       text-base sm:text-lg min-h-[44px] sm:min-h-[48px]"
              disabled={isLoading}
            />
            <p className="text-gray-500 text-sm mt-1">Choose between 1-20 questions</p>
          </div>

          {/* Create Button */}
          <button 
            onClick={handleCreate} 
            className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors
                       min-h-[48px] sm:min-h-[56px] ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isLoading || !!topicError}
          >
            {isLoading 
              ? (isOpenAIAvailable ? 'Generating Questions...' : 'Creating Room...') 
              : (isOpenAIAvailable ? 'Generate AI Quiz' : 'Create Quiz')
            }
          </button>

          {/* Information Footer */}
          <div className="text-center text-gray-500 text-xs sm:text-sm">
            {isOpenAIAvailable ? (
              <p className="flex items-center justify-center">
                <FaBullseye className="mr-2" />
                AI will create unique questions tailored to your topic and difficulty level
              </p>
            ) : (
              <p className="flex items-center justify-center">
                <FaBook className="mr-2" />
                Using high-quality sample questions. Enable AI in SETUP_OPENAI.md for unlimited topics!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
