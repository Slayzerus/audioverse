import apiUser from '../scripts/api/apiUser';

// NOTE: Functions generateCaptcha, validateCaptcha must be implemented in apiUser or a separate service if backend supports them
// Below are example calls, adjust to actual endpoints

export const generateCaptcha = async (captchaType: number) => {
  return apiUser.generateCaptcha(captchaType);
};

export const validateCaptcha = apiUser.validateCaptcha;

export const login = async (data: { username: string; password: string }) => {
  return apiUser.loginUser(data);
};

export default {
  generateCaptcha,
  validateCaptcha,
  login,
};
