import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment Configuration for Quiz Cult Backend
 * Validates and provides access to environment variables
 */

export interface EnvironmentConfig {
  // Server configuration
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  
  // Firebase configuration
  firebaseDbUrl: string;
  firebaseServiceAccount?: string;
  googleApplicationCredentials?: string;
  
  // OpenAI configuration
  openaiApiKey?: string;
  
  // Optional configuration
  debug: boolean;
  rateLimit: number;
}

/**
 * Parse and validate environment variables
 */
const parseEnvironment = (): EnvironmentConfig => {
  return {
    // Server configuration
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    // Firebase configuration
    firebaseDbUrl: process.env.VITE_FIREBASE_DATABASE_URL || 'https://quiz-cult-default-rtdb.europe-west1.firebasedatabase.app',
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    
    // OpenAI configuration
    openaiApiKey: process.env.OPENAI_API_KEY,
    
    // Optional configuration
    debug: process.env.DEBUG === 'true',
    rateLimit: parseInt(process.env.RATE_LIMIT || '100', 10),
  };
};

/**
 * Validate environment configuration
 */
const validateEnvironment = (config: EnvironmentConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate Firebase configuration
  if (!config.firebaseDbUrl) {
    errors.push('VITE_FIREBASE_DATABASE_URL is required');
  }

  if (!config.firebaseServiceAccount && !config.googleApplicationCredentials) {
    errors.push('Firebase credentials required: set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS');
  }

  // Validate port
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    errors.push('PORT must be a valid number between 1 and 65535');
  }

  // Validate frontend URL
  try {
    new URL(config.frontendUrl);
  } catch {
    errors.push('FRONTEND_URL must be a valid URL');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Print environment configuration status
 */
const printEnvironmentStatus = (config: EnvironmentConfig) => {
  console.log('🔧 Environment Configuration:');
  console.log(`   Node Environment: ${config.nodeEnv}`);
  console.log(`   Server Port: ${config.port}`);
  console.log(`   Frontend URL: ${config.frontendUrl}`);
  console.log(`   Firebase DB URL: ${config.firebaseDbUrl}`);
  console.log(`   Firebase Credentials: ${config.firebaseServiceAccount ? '✅ Environment Variable' : config.googleApplicationCredentials ? '✅ File Path' : '❌ Missing'}`);
  console.log(`   OpenAI API Key: ${config.openaiApiKey ? '✅ Configured' : '⚠️ Not Set'}`);
  console.log(`   Debug Mode: ${config.debug ? 'ON' : 'OFF'}`);
  console.log(`   Rate Limit: ${config.rateLimit} requests/minute`);
};

/**
 * Print setup instructions for missing configuration
 */
const printSetupInstructions = (errors: string[]) => {
  console.log('\n❌ Environment Configuration Errors:');
  errors.forEach(error => console.log(`   - ${error}`));
  
  console.log('\n📝 Setup Instructions:');
  console.log('   1. Create a .env file in the backend/ directory');
  console.log('   2. Add the following variables:');
  console.log('');
  console.log('   # Firebase Configuration');
  console.log('   VITE_FIREBASE_DATABASE_URL=https://quiz-cult-default-rtdb.europe-west1.firebasedatabase.app');
  console.log('   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} # OR');
  console.log('   # GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json');
  console.log('');
  console.log('   # OpenAI Configuration (optional but recommended)');
  console.log('   OPENAI_API_KEY=sk-your-openai-api-key-here');
  console.log('');
  console.log('   # Server Configuration (optional)');
  console.log('   PORT=3001');
  console.log('   FRONTEND_URL=http://localhost:5173');
  console.log('   DEBUG=true');
  console.log('');
  console.log('🔥 Firebase Setup:');
  console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('   2. Click "Generate new private key"');
  console.log('   3. Either place the JSON file as serviceAccountKey.json OR');
  console.log('   4. Copy the JSON content to FIREBASE_SERVICE_ACCOUNT variable');
  console.log('');
  console.log('🤖 OpenAI Setup:');
  console.log('   1. Go to https://platform.openai.com/api-keys');
  console.log('   2. Create a new API key');
  console.log('   3. Copy the key (starts with sk-) to OPENAI_API_KEY');
};

// Parse and validate environment
export const env = parseEnvironment();
const validation = validateEnvironment(env);

// Print status
printEnvironmentStatus(env);

// Handle validation errors
if (!validation.valid) {
  printSetupInstructions(validation.errors);
  
  if (env.nodeEnv === 'production') {
    console.error('\n💥 Cannot start server in production with invalid configuration');
    process.exit(1);
  } else {
    console.warn('\n⚠️ Server will start with limited functionality');
  }
} else {
  console.log('\n✅ Environment configuration valid - ready to start server\n');
}

// Export configuration
export default env; 