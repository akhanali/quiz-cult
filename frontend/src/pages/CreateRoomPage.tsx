import { useState, useEffect } from 'react';
import { createRoom } from '../api/createRoom';
import type { Question } from '../../../shared/types';
import { useNavigate, Link } from 'react-router-dom';
import { presenceManager } from '../api/presenceManager';
import { validateTopic } from '../services/questionGeneration';
import { FaCheckCircle, FaClock, FaRocket, FaRobot, FaFileAlt, FaCheck, FaBook, FaBullseye, FaHome, FaQuestionCircle } from 'react-icons/fa';
import { MdAccessTime } from 'react-icons/md';
import type { DifficultyLevel } from '../../../shared/types';
import quizDojoLogo from '/logo-lockup.png';
import { useTranslation } from 'react-i18next';
import { trackQuizEvent, trackEngagement } from '../utils/analytics';
import { DocumentUploader } from '../components/DocumentUploader';
import { QuizConfigurationSection } from '../components/QuizConfigurationSection';

// Document analysis interface
interface DocumentAnalysis {
  fileId: string;
  filename: string;
  topics: string[];
  contentType: string;
  difficultyLevel: string;
  wordCount: number;
  uploadedAt: Date;
  extractedText: string;
}

export default function CreateRoomPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Form state
  const [nickname, setNickname] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Document upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [showDocumentSection, setShowDocumentSection] = useState(false);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  
  // Toggle between regular quiz and document-based quiz
  const [isDocumentMode, setIsDocumentMode] = useState(false);

  // Question preview state
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);
  const [questionConfig, setQuestionConfig] = useState<any>(null);

  // Handle count input change - allow deletion
  const handleCountChange = (value: string) => {
    setQuestionCount(Number(value));
  };

  // Reset to default when leaving field empty
  const handleCountBlur = () => {
    if (questionCount === 0) {
      setQuestionCount(10);
    }
  };

  // Document upload handlers
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessingDocument(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setDocumentAnalysis(result.documentAnalysis);
        setShowDocumentSection(true);
        setIsDocumentMode(true);
        
        // Auto-suggest first topic if no topic is set
        if (!topic && result.documentAnalysis.topics.length > 0) {
          setTopic(result.documentAnalysis.topics[0]);
        }
      } else {
        throw new Error(result.error || 'Document processing failed');
      }
    } catch (error) {
      console.error('Document upload failed:', error);
      setError(error instanceof Error ? error.message : 'Document upload failed');
      setUploadedFile(null);
    } finally {
      setIsProcessingDocument(false);
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setDocumentAnalysis(null);
    setShowDocumentSection(false);
    setIsDocumentMode(false);
  };



  // Generate questions from document
  const generateQuestionsFromDocument = async (
    difficulty: DifficultyLevel,
    questionCount: number
  ): Promise<Question[]> => {
    if (!documentAnalysis) {
      throw new Error('No document analysis available');
    }

    try {
      const response = await fetch('/api/documents/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: documentAnalysis.fileId,
          difficulty,
          count: questionCount,
          extractedText: documentAnalysis.extractedText
        }),
      });

      const result = await response.json();

      if (result.success) {
        return result.questions;
      } else {
        throw new Error(result.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Question generation failed:', error);
      throw error;
    }
  };

  // Handle document-based quiz creation
  const handleDocumentQuizCreation = async (
    questions: Question[],
    config: { topic: string; difficulty: DifficultyLevel; questionCount: number }
  ) => {
    if (!nickname.trim()) {
      alert(t('Please enter a nickname'));
      return;
    }

    setIsLoading(true);
    try {
      // Create a meaningful topic name from extracted topics
      let topicName = 'Document Quiz';
      if (documentAnalysis && documentAnalysis.topics.length > 0) {
        if (documentAnalysis.topics.length <= 3) {
          topicName = documentAnalysis.topics.join(', ');
        } else {
          topicName = `${documentAnalysis.topics.slice(0, 2).join(', ')} and ${documentAnalysis.topics.length - 2} more topics`;
        }
      }

      // Use the regular createRoom API
      const roomData = await createRoom(
        nickname,
        topicName,
        config.difficulty,
        config.questionCount
      );

      navigate(`/lobby/${roomData.roomId}`, { 
        state: { 
          nickname,
          isHost: true
        } 
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      alert(t('Failed to create room'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document question generation (for "Generate Questions" button)
  const handleDocumentQuestionGeneration = async (
    questions: Question[],
    config: { topic: string; difficulty: DifficultyLevel; questionCount: number }
  ) => {
    // For now, just show the questions in a preview
    setGeneratedQuestions(questions);
    setQuestionConfig(config);
    setShowQuestionPreview(true);
  };

  // Real-time topic validation
  const handleTopicChange = (value: string) => {
    setTopic(value);
    // setTopicError(''); // This state was removed, so this line is removed
    
    if (value.trim().length > 0) {
      const validation = validateTopic(value);
      // if (!validation.valid) { // This state was removed, so this line is removed
      //   setTopicError(validation.suggestion || t('Invalid topic'));
      // }
    }
  };

  const handleCreate = async (customization?: any) => {
    // Clear previous states
    setError('');
    // setGenerationStatus(''); // This state was removed, so this line is removed
    
    // Validate inputs
    if (!nickname.trim()) {
      setError(t('Please enter your nickname'));
      return;
    }
    
    if (!topic.trim()) {
      setError(t('Please enter a quiz topic'));
      return;
    }

    // Validate topic
    // const topicValidation = validateTopic(topic); // This state was removed, so this line is removed
    // if (!topicValidation.valid) { // This state was removed, so this line is removed
    //   setError(topicValidation.suggestion || t('Please choose a valid topic'));
    //   return;
    // }
    
    // Validate question count
    if (questionCount < 1 || questionCount > 30) {
      setError(t('Number of questions must be between 1 and 30'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      let roomData;

      // Check if we have a document to process
      if (documentAnalysis && uploadedFile) {
        // Generate questions from document
        // setGenerationStatus(t('Generating questions from document...')); // This state was removed, so this line is removed
        
        const response = await fetch('/api/documents/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: documentAnalysis.fileId,
            difficulty: customization?.difficulty || difficulty,
            count: customization?.questionCount || questionCount,
            extractedText: documentAnalysis.extractedText,
            questionMode: 'document-only' // Always use document-only mode
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // Create room with document-based questions
          roomData = await createRoom(
            nickname,
            'Document Content', // Use generic topic name for document-based quizzes
            customization?.difficulty || difficulty as DifficultyLevel,
            customization?.questionCount || questionCount
          );
          
          // setGenerationStatus(t('Successfully generated {{count}} questions from document!', { // This state was removed, so this line is removed
          //   count: result.questions.length
          // }));
        } else {
          throw new Error(result.error || 'Failed to generate questions from document');
        }
      } else {
        // Use regular topic-based generation
        // setGenerationStatus(t('Creating {{count}} {{difficulty}} questions...', { // This state was removed, so this line is removed
        //   count: questionCount, 
        //   difficulty: difficulty 
        // }));
      
      // Track room creation event
      trackQuizEvent.roomCreated(topic, difficulty as DifficultyLevel, questionCount);
      trackEngagement.buttonClick('create_room', 'create_room_page');

        roomData = await createRoom(nickname, topic, difficulty as DifficultyLevel, questionCount);
      
      // Show success message with generation result
      if (roomData.aiGenerated) {
          // setGenerationStatus(t('Successfully generated {{count}} AI questions about "{{topic}}"!', { // This state was removed, so this line is removed
          //   count: questionCount,
          //   topic: topic
          // }));
      } else {
        if (roomData.fallbackReason) {
            // setGenerationStatus(t('Created {{count}} questions ({{reason}})', { // This state was removed, so this line is removed
            //   count: questionCount,
            //   reason: roomData.fallbackReason
            // }));
        } else {
            // setGenerationStatus(t('Created {{count}} questions successfully', { // This state was removed, so this line is removed
            //   count: questionCount
            // }));
          }
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
      setError(error instanceof Error ? error.message : t('Failed to create room. Please try again.'));
      // setGenerationStatus(''); // This state was removed, so this line is removed
    } finally {
      setIsLoading(false);
    }
  };

  const difficultyOptions = [
    {
      value: 'easy',
      icon: FaCheckCircle,
      iconColor: 'text-[#10A3A2]',
      title: t('easyTitle'),
      description: t('easyDescription'),
      details: t('easyDetails'),
      examples: t('easyExamples'),
      time: t('easyTime')
    },
    {
      value: 'medium',
      icon: FaClock,
      iconColor: 'text-[#F6D35B]',
      title: t('mediumTitle'),
      description: t('mediumDescription'),
      details: t('mediumDetails'),
      examples: t('mediumExamples'),
      time: t('mediumTime')
    },
    {
      value: 'hard',
      icon: FaRocket,
      iconColor: 'text-[#F4B46D]',
      title: t('hardTitle'),
      description: t('hardDescription'),
      details: t('hardDetails'),
      examples: t('hardExamples'),
      time: t('hardTime')
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDF0DC] py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-6">
            <img
              src={quizDojoLogo}
              alt="Quiz Dojo logo"
              className="h-12 sm:h-16 lg:h-20 w-auto"
            />
            <span className="dojo-title ml-3 text-3xl sm:text-4xl font-bold text-[#4E342E]" style={{ fontFamily: 'Baloo 2, cursive' }}>Quiz Dojo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-center text-[#4E342E]">{t('createRoom')}</h2>
        </div>
        
        {/* Error Messages */}
        {error && (
          <div className="bg-[#F4B46D]/20 border border-[#F4B46D] text-[#4E342E] px-3 sm:px-4 py-3 rounded mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-[#4E342E]/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#4E342E] flex items-center gap-2">
                {isDocumentMode ? (
                  <>
                    <FaFileAlt className="text-[#10A3A2]" />
                    Document-Based Quiz
                  </>
                ) : (
                  <>
                    <FaBook className="text-[#10A3A2]" />
                    Regular Quiz
                  </>
                )}
              </h3>
              <p className="text-sm text-[#6D4C41] mt-1">
                {isDocumentMode 
                  ? 'Generate questions from your uploaded document'
                  : 'Create questions on any topic you choose'
                }
              </p>
            </div>
            <button
              onClick={() => {
                setIsDocumentMode(!isDocumentMode);
                if (!isDocumentMode) {
                  // Switching to document mode - clear any existing document data
                  setUploadedFile(null);
                  setDocumentAnalysis(null);
                  setShowDocumentSection(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: isDocumentMode ? '#10A3A2' : '#F7E2C0',
                color: isDocumentMode ? 'white' : '#4E342E',
                border: isDocumentMode ? 'none' : '2px solid #4E342E'
              }}
            >
              {isDocumentMode ? (
                <>
                  <FaBook />
                  Document Mode
                </>
              ) : (
                <>
                  <FaFileAlt />
                  Switch to Document
                </>
              )}
            </button>
          </div>
        </div>

        {/* Document Upload Section - Only show in document mode */}
        {isDocumentMode && (
          <div className="space-y-6">
            {/* Document Processing Limits Information */}
            <div className="bg-[#F7E2C0] rounded-xl p-4 sm:p-6 border border-[#4E342E]/10">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <FaQuestionCircle className="w-5 h-5 text-[#8D6E63]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#4E342E] mb-2">
                    Document Processing Limits
                  </h3>
                  <div className="text-sm text-[#6D4C41] space-y-1">
                    <p>• <strong>File Size:</strong> Up to 50MB</p>
                    <p>• <strong>Supported Formats:</strong> PDF, DOCX, TXT</p>
                    <p>• <strong>Processing Coverage:</strong> We analyze up to ~4,000 words from your document</p>
                    <p>• <strong>Large Documents:</strong> We analyze the beginning portion</p>
                    <p>• <strong>Small Documents:</strong> We process the entire document</p>
                    <p>• <strong>Question Limit:</strong> Generate 1-30 questions per quiz</p>
                  </div>
                </div>
              </div>
            </div>

            <DocumentUploader
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
              uploadedFile={uploadedFile}
              isProcessing={isProcessingDocument}
              supportedTypes={['pdf', 'docx', 'txt']}
              maxSize={50 * 1024 * 1024} // 50MB
            />

            {/* Document Analysis Results */}
            {showDocumentSection && documentAnalysis && (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-[#4E342E]/10">
                <h3 className="text-lg font-semibold text-[#4E342E] mb-4 flex items-center gap-2">
                  <FaFileAlt className="text-[#10A3A2]" />
                  Document Analysis Results
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#F7E2C0] rounded-lg p-3 border border-[#4E342E]/10">
                    <div className="text-sm text-[#6D4C41]">Document Type</div>
                    <div className="font-medium text-[#4E342E] capitalize">{documentAnalysis.contentType}</div>
                  </div>
                  <div className="bg-[#F7E2C0] rounded-lg p-3 border border-[#4E342E]/10">
                    <div className="text-sm text-[#6D4C41]">Difficulty Level</div>
                    <div className="font-medium text-[#4E342E] capitalize">{documentAnalysis.difficultyLevel}</div>
                  </div>
                </div>

                <div className="bg-[#F7E2C0] rounded-lg p-3 mb-4 border border-[#4E342E]/10">
                  <div className="text-sm text-[#6D4C41]">Processing Coverage</div>
                  <div className="font-medium text-[#4E342E]">
                    Analyzed ~{Math.round(documentAnalysis.wordCount)} words from your document
                  </div>
                </div>

                <div className="bg-[#F7E2C0] rounded-lg p-3 border border-[#4E342E]/10">
                  <div className="text-sm text-[#6D4C41] mb-2">Extracted Topics</div>
                  <div className="flex flex-wrap gap-2">
                    {documentAnalysis.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="bg-[#8D6E63] text-white text-xs px-2 py-1 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Configuration Section */}
            {isDocumentMode && showDocumentSection && documentAnalysis && (
              <div className="mb-6">
                {/* Nickname Input for Document Mode */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-[#4E342E]/10">
                  <label className="block text-sm font-medium text-[#4E342E] mb-2">{t('nickname')}</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={t('Enter your nickname')}
                    className="w-full px-3 py-2 border border-[#4E342E]/30 rounded-lg focus:ring-2 focus:ring-[#10A3A2] focus:border-transparent bg-[#FDF0DC] text-[#4E342E] placeholder-[#6D4C41]/60"
                  />
                </div>
                
                <QuizConfigurationSection
                  document={documentAnalysis}
                  onGenerateAndCreate={handleDocumentQuizCreation}
                  isProcessing={isLoading}
                  generateQuestionsFromDocument={generateQuestionsFromDocument}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Regular Quiz Form - Only show when not in document mode */}
        {!isDocumentMode && (
        <div className="bg-[#F7E2C0] rounded-xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6 border border-[#4E342E]/20">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4E342E] mb-2">{t('nickname')}</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('Enter your nickname')}
                className="w-full border border-[#4E342E]/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-[#10A3A2] focus:border-[#10A3A2]
                         text-base sm:text-lg min-h-[44px] sm:min-h-[48px] bg-[#FDF0DC] text-[#4E342E] placeholder-[#6D4C41]/60"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4E342E] mb-2">{t('quizTopic')}</label>
              <input
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder={t('e.g., Science, History, Sports, Movies')}
                className={`w-full border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-[#10A3A2] focus:border-[#10A3A2]
                          text-base sm:text-lg min-h-[44px] sm:min-h-[48px] bg-[#FDF0DC] text-[#4E342E] placeholder-[#6D4C41]/60`}
                disabled={isLoading}
              />
              {/* This error message was removed, so it's removed from the JSX */}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-[#4E342E] mb-3 sm:mb-4">{t('difficulty')}</label>
            <div className="space-y-3">
              {difficultyOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all ${
                    difficulty === option.value
                      ? 'border-[#10A3A2] bg-[#10A3A2]/10'
                      : 'border-[#4E342E]/30 hover:border-[#4E342E]/50 bg-[#FDF0DC]'
                  }`}
                  onClick={() => setDifficulty(option.value as DifficultyLevel)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={difficulty === option.value}
                      onChange={() => setDifficulty(option.value as DifficultyLevel)}
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
                        <strong>{t('Examples:')}</strong> {option.examples}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-[#4E342E] mb-2">{t('numberOfQuestions')}</label>
            <input
              type="number"
              value={questionCount}
              onChange={(e) => handleCountChange(e.target.value)}
              onBlur={handleCountBlur}
              min={1}
              max={30}
              className="w-full border border-[#4E342E]/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-[#10A3A2] focus:border-[#10A3A2]
                       text-base sm:text-lg min-h-[44px] sm:min-h-[48px] bg-[#FDF0DC] text-[#4E342E]"
              disabled={isLoading}
            />
            <p className="text-[#6D4C41] text-sm mt-1">{t('Choose between 1-30 questions')}</p>
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
            disabled={isLoading || false} // topicError state was removed, so this line is simplified
          >
            {isLoading 
              ? t('Creating Room...') 
              : t('Create Quiz')
            }
          </button>

          {/* Information Footer */}
          <div className="text-center text-[#6D4C41] text-xs sm:text-sm">
            <p className="flex items-center justify-center">
              <FaBook className="mr-2" />
              {t('Create engaging quiz questions on any topic you choose!')}
            </p>
          </div>
        </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 text-[#6D4C41] hover:text-[#4E342E] 
                     transition-colors duration-300 font-medium text-sm sm:text-base py-2 px-4 rounded-lg hover:bg-[#F7E2C0]/50"
          >
            <FaHome className="text-base sm:text-lg" />
            <span>{t('backToHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}