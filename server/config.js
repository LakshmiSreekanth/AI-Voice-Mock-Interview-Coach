require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'intervai_jwt_secret_key_prod_2026',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODELS: [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest'
  ]
};
