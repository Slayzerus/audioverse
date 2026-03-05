


// Temporary implementation: returns empty array to avoid errors
export const getUserAuditLogs = (_params: Record<string, string | number | undefined>) => {
  return Promise.resolve([]);
};

export const getAllAuditLogs = (_params?: Record<string, string | number | undefined>) => {
  return Promise.resolve([]);
};

export default {
  getUserAuditLogs,
  getAllAuditLogs,
};
