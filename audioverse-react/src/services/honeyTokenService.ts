import apiUser from '../scripts/api/apiUser';

// NOTE: Functions createHoneyToken, getTriggeredHoneyTokens must be implemented in apiAdmin if backend supports them
// Below are example calls, adjust to actual endpoints

export const createHoneyToken = async (data: Record<string, unknown>) => {
  return apiUser.createHoneyToken(data);
};

export const getHoneyTokens = async () => {
  return apiUser.getHoneyTokens();
};

export const getTriggeredHoneyTokens = async () => {
  return apiUser.getTriggeredHoneyTokens();
};

export default {
  createHoneyToken,
  getTriggeredHoneyTokens,
};
