import { apiClient } from "./audioverseApiClient";

// Public config endpoints (no auth required)
export const getKaraokeScoringConfig = async () => {
  const { data } = await apiClient.get("/api/admin/config/karaoke-scoring");
  return data;
};

export default {
  getKaraokeScoringConfig,
};
