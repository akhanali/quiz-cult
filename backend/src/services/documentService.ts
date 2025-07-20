import OpenAI from 'openai';
import { getOpenAIClient } from '../config/openai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface DocumentAnalysis {
  fileId: string;
  filename: string;
  topics: string[];
  contentType: string;
  difficultyLevel: string;
  wordCount: number;
  uploadedAt: Date;
  extractedText: string;
}

export class DocumentService {
  private openai: OpenAI;

  constructor() {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not available');
    }
    this.openai = client;
  }

  // Rough token estimation (1 token ≈ 4 characters for English text)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Get chunks of text that fit within token limits
  private getTextChunks(text: string, maxTokens: number, overlap: number = 1000): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      // Estimate how much text we can include
      const estimatedChars = maxTokens * 4;
      let end = Math.min(start + estimatedChars, text.length);
      
      // Adjust end to not break words
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + estimatedChars * 0.8) { // Only break at space if we're getting most of our target
          end = lastSpace;
        }
      }
      
      chunks.push(text.substring(start, end));
      
      // Move start position with overlap
      start = Math.max(start + 1, end - overlap);
      
      // Prevent infinite loop
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  async uploadAndProcessDocument(file: Buffer, filename: string): Promise<DocumentAnalysis> {
    try {
      console.log(`📄 Processing document: ${filename} (${file.length} bytes)`);

      // Extract text from document based on file type
      const extractedText = await this.extractTextFromDocument(file, filename);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document');
      }

      console.log(`✅ Text extracted: ${extractedText.length} characters (~${this.estimateTokens(extractedText)} tokens)`);

      // Generate a unique file ID for this session
      const fileId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Extract topics and analyze document using the extracted text
      const topics = await this.extractTopics(extractedText);
      const analysis = await this.analyzeDocument(extractedText);

      return {
        fileId,
        filename,
        topics,
        contentType: analysis.contentType,
        difficultyLevel: analysis.difficultyLevel,
        wordCount: analysis.wordCount,
        uploadedAt: new Date(),
        extractedText
      };

    } catch (error) {
      console.error('❌ Document processing failed:', error);
      throw new Error('Failed to process document');
    }
  }

  private async extractTextFromDocument(file: Buffer, filename: string): Promise<string> {
    const fileExtension = filename.split('.').pop()?.toLowerCase();

    try {
      switch (fileExtension) {
        case 'pdf':
          console.log('📄 Extracting text from PDF...');
          const pdfData = await pdfParse(file);
          return pdfData.text;

        case 'docx':
          console.log('📄 Extracting text from DOCX...');
          const docxResult = await mammoth.extractRawText({ buffer: file });
          return docxResult.value;

        case 'txt':
          console.log('📄 Extracting text from TXT...');
          return file.toString('utf-8');

        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      throw new Error(`Failed to extract text from ${fileExtension} file`);
    }
  }

  private async extractTopics(extractedText: string): Promise<string[]> {
    try {
      console.log('🔍 Extracting topics from document content...');

      // Use token-based limits instead of character limits
      // Reserve ~2000 tokens for the prompt, use ~8000 tokens for content
      const maxContentTokens = 8000;
      const maxContentChars = maxContentTokens * 4; // Rough estimate
      
      const contentForTopics = extractedText.substring(0, Math.min(maxContentChars, extractedText.length));
      const estimatedTokens = this.estimateTokens(contentForTopics);
      
      console.log(`📊 Topic extraction: ${contentForTopics.length} characters (~${estimatedTokens} tokens)`);

      const prompt = `Extract 5-10 main topics from this document content. Return as a JSON array of topic strings.

Document content (${contentForTopics.length} characters):
${contentForTopics}${extractedText.length > maxContentChars ? '...' : ''}

Return ONLY a JSON array like: ["Calculus", "Derivatives", "Integration"]`;

      console.log(`📝 Prompt length: ${prompt.length} characters (~${this.estimateTokens(prompt)} tokens)`);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in response');
      }

      // Clean the response and parse JSON
      const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
      const topics = JSON.parse(cleanContent);
      
      console.log(`✅ Extracted topics: ${topics.join(', ')}`);

      return Array.isArray(topics) ? topics : ['General'];
    } catch (error) {
      console.error('❌ Topic extraction failed:', error);
      return ['General'];
    }
  }

  private async analyzeDocument(extractedText: string): Promise<{
    contentType: string;
    difficultyLevel: string;
    wordCount: number;
  }> {
    try {
      console.log('📊 Analyzing document content...');

      // Use token-based limits instead of character limits
      // Reserve ~1500 tokens for the prompt, use ~6000 tokens for content
      const maxContentTokens = 6000;
      const maxContentChars = maxContentTokens * 4; // Rough estimate
      
      const contentForAnalysis = extractedText.substring(0, Math.min(maxContentChars, extractedText.length));
      const estimatedTokens = this.estimateTokens(contentForAnalysis);
      
      console.log(`📊 Document analysis: ${contentForAnalysis.length} characters (~${estimatedTokens} tokens)`);

      const prompt = `Analyze this document content and return JSON with:
{
  "contentType": "academic|technical|general|educational",
  "difficultyLevel": "easy|medium|hard",
  "wordCount": estimated_word_count
}

Document content (${contentForAnalysis.length} characters):
${contentForAnalysis}${extractedText.length > maxContentChars ? '...' : ''}

Return ONLY the JSON object.`;

      console.log(`📝 Prompt length: ${prompt.length} characters (~${this.estimateTokens(prompt)} tokens)`);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in response');
      }

      // Clean the response and parse JSON
      const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      
      console.log(`✅ Document analysis: ${analysis.contentType}, ${analysis.difficultyLevel}, ~${analysis.wordCount} words`);

      return {
        contentType: analysis.contentType || 'general',
        difficultyLevel: analysis.difficultyLevel || 'medium',
        wordCount: analysis.wordCount || extractedText.split(/\s+/).length
      };
    } catch (error) {
      console.error('❌ Document analysis failed:', error);
      return {
        contentType: 'general',
        difficultyLevel: 'medium',
        wordCount: extractedText.split(/\s+/).length
      };
    }
  }

  async generateQuestionsFromDocument(
    extractedText: string,
    difficulty: string,
    count: number,
    questionMode: 'document-only' | 'document-general' = 'document-only'
  ): Promise<any[]> {
    try {
      console.log(`🤖 Generating ${count} questions from document content (mode: ${questionMode})...`);

      // Use token-based limits and chunking for large documents
      const maxContentTokens = 15000; // Much larger for question generation
      const maxContentChars = maxContentTokens * 4; // Rough estimate
      
      let contentForQuestions: string;
      
      if (extractedText.length <= maxContentChars) {
        // Document fits in one request
        contentForQuestions = extractedText;
        console.log(`📊 Single chunk: ${contentForQuestions.length} characters (~${this.estimateTokens(contentForQuestions)} tokens)`);
      } else {
        // Document is too large, use chunking
        console.log(`📊 Document too large (${extractedText.length} chars), using chunking...`);
        const chunks = this.getTextChunks(extractedText, maxContentTokens, 2000);
        console.log(`📊 Using ${chunks.length} chunks for question generation`);
        
        // For now, use the first chunk. In the future, we could process multiple chunks
        contentForQuestions = chunks[0];
        console.log(`📊 Using first chunk: ${contentForQuestions.length} characters (~${this.estimateTokens(contentForQuestions)} tokens)`);
      }

      // Adjust prompt based on question mode
      let modeInstruction = '';
      if (questionMode === 'document-only') {
        modeInstruction = 'Questions must be based STRICTLY on the content above. Do not use any external knowledge.';
      } else {
        modeInstruction = 'Questions can be based on the content above plus general knowledge about the topic.';
      }

      const prompt = `Generate ${count} multiple choice questions with ${difficulty} difficulty from this document content:

${contentForQuestions}${extractedText.length > maxContentChars ? '...' : ''}

${modeInstruction}

Return ONLY a valid JSON array with this exact format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOption": "Option A",
    "timeLimit": 15
  }
]

Requirements:
- Each question must have exactly 4 options
- correctOption must match one of the options exactly
- Use appropriate time limits: easy=10-15s, medium=20-25s, hard=30-35s
- ${questionMode === 'document-only' ? 'Questions must be based STRICTLY on the provided content above' : 'Questions can include the provided content and general knowledge'}
- Ensure factual accuracy according to the provided content
- Generate questions from various parts of the provided content`;

      console.log(`📝 Prompt length: ${prompt.length} characters (~${this.estimateTokens(prompt)} tokens)`);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in response');
      }

      // Parse questions
      let questions: any[];
      try {
        const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
        questions = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('❌ Failed to parse questions:', parseError);
        throw new Error('Invalid question format received');
      }

      // Validate questions
      const validQuestions = questions.filter((q: any) => 
        q.text && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        q.correctOption &&
        q.options.includes(q.correctOption)
      );

      if (validQuestions.length === 0) {
        throw new Error('No valid questions generated');
      }

      console.log(`✅ Generated ${validQuestions.length} questions successfully`);

      return validQuestions.slice(0, count);
    } catch (error) {
      console.error('❌ Question generation failed:', error);
      throw error;
    }
  }

  // This method is no longer needed since we don't upload files to OpenAI
  async cleanupFile(fileId: string): Promise<void> {
    // No cleanup needed since we don't upload files to OpenAI
    console.log(`🗑️ Cleanup not needed for file: ${fileId}`);
  }
} 