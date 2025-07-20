import React, { useState } from 'react';
import { FaRobot, FaCog, FaChartBar, FaFileAlt, FaBrain, FaQuestionCircle, FaCheckCircle, FaClock, FaRocket } from 'react-icons/fa';
import { MdAccessTime } from 'react-icons/md';
import type { DifficultyLevel, Question } from '../../../shared/types';
import { useTranslation } from 'react-i18next';

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

interface QuizConfigurationSectionProps {
  document?: DocumentAnalysis;
  onGenerateAndCreate: (questions: Question[], config: { topic: string; difficulty: DifficultyLevel; questionCount: number }) => void;
  isProcessing?: boolean;
  generateQuestionsFromDocument?: (
    difficulty: DifficultyLevel,
    questionCount: number
  ) => Promise<Question[]>;
}

export const QuizConfigurationSection: React.FC<QuizConfigurationSectionProps> = ({
  document,
  onGenerateAndCreate,
  isProcessing = false,
  generateQuestionsFromDocument
}) => {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  // Handle question count input changes
  const handleQuestionCountChange = (value: string) => {
    setQuestionCount(Number(value));
  };

  // Reset to default when leaving field empty
  const handleQuestionCountBlur = () => {
    if (questionCount === 0) {
      setQuestionCount(10);
    }
  };

  // Difficulty options matching the normal quiz generation
  const difficultyOptions = [
    {
      value: 'easy',
      title: t('easyTitle'),
      description: t('easyDescription'),
      details: t('easyDetails'),
      examples: t('easyExamples'),
      time: t('easyTime'),
      icon: FaCheckCircle,
      iconColor: 'text-green-500'
    },
    {
      value: 'medium',
      title: t('mediumTitle'),
      description: t('mediumDescription'),
      details: t('mediumDetails'),
      examples: t('mediumExamples'),
      time: t('mediumTime'),
      icon: FaClock,
      iconColor: 'text-yellow-500'
    },
    {
      value: 'hard',
      title: t('hardTitle'),
      description: t('hardDescription'),
      details: t('hardDetails'),
      examples: t('hardExamples'),
      time: t('hardTime'),
      icon: FaRocket,
      iconColor: 'text-red-500'
    }
  ];

  const handleGenerateAndCreate = async () => {
    if (!generateQuestionsFromDocument) {
      setError(t('Question generation function not available'));
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const questions = await generateQuestionsFromDocument(
        difficulty,
        questionCount
      );
      onGenerateAndCreate(questions, { topic: 'Document Content', difficulty, questionCount });
    } catch (error) {
      console.error('Question generation failed:', error);
      setError(error instanceof Error ? error.message : t('Failed to generate questions'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-[#4E342E]/10">
      <div className="flex items-center gap-3 mb-4">
        <FaBrain className="text-2xl text-[#10A3A2]" />
        <h3 className="text-xl font-bold text-[#4E342E]">
          {t('Quiz Configuration')}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Document Analysis Summary */}
        {document && (
          <div className="bg-[#F7E2C0] rounded-lg p-3 border border-[#4E342E]/10">
                          <h4 className="font-semibold text-[#4E342E] mb-2 flex items-center gap-2">
                <FaFileAlt className="text-[#8D6E63]" />
                {t('Document Analysis')}
              </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-[#6D4C41]">{t('Content Type:')}</span>
                <span className="ml-2 font-medium text-[#4E342E] capitalize">{document.contentType}</span>
              </div>
              <div>
                <span className="text-[#6D4C41]">{t('Difficulty:')}</span>
                <span className="ml-2 font-medium text-[#4E342E] capitalize">{document.difficultyLevel}</span>
              </div>
              <div>
                <span className="text-[#6D4C41]">{t('Word Count:')}</span>
                <span className="ml-2 font-medium text-[#4E342E]">{document.wordCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#6D4C41]">{t('Topics Found:')}</span>
                <span className="ml-2 font-medium text-[#4E342E]">{document.topics.length}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-[#6D4C41] flex items-start gap-1">
              <FaQuestionCircle className="text-[#8D6E63] mt-0.5 flex-shrink-0" />
              <span>{t('Questions will be generated from the entire document content, not filtered by specific topics.')}</span>
            </div>
          </div>
        )}

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
                    disabled={isProcessing || isGenerating}
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
            onChange={(e) => handleQuestionCountChange(e.target.value)}
            onBlur={handleQuestionCountBlur}
            min={1}
            max={30}
            className="w-full border border-[#4E342E]/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-[#10A3A2] focus:border-[#10A3A2]
                     text-base sm:text-lg min-h-[44px] sm:min-h-[48px] bg-[#FDF0DC] text-[#4E342E]"
            disabled={isProcessing || isGenerating}
          />
          <p className="text-[#6D4C41] text-sm mt-1">{t('Choose between 1-30 questions')}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-[#F4B46D]/20 border border-[#F4B46D] text-[#4E342E] px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleGenerateAndCreate}
            disabled={isProcessing || isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-[#10A3A2] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0D8A89] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <FaCog className="animate-spin" />
                {t('Generating Questions...')}
              </>
            ) : (
              <>
                <FaRobot />
                {t('Generate & Create Room')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 