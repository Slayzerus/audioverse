import { apiClient } from "./audioverseApiClient";

export interface MicrophoneAssignmentDto {
  id: number;
  userId: number;
  microphoneId: string;
  color: string;
  slot: number;
  assignedAt: string;
}

export interface CreateMicrophoneAssignmentRequest {
  userId: number;
  microphoneId: string;
  color: string;
  slot: number;
}

export interface UpdateMicrophoneAssignmentRequest {
  color: string;
  slot: number;
}

export const getMicrophoneAssignments = async (): Promise<MicrophoneAssignmentDto[]> => {
  const { data } = await apiClient.get("/api/user/microphone-assignments");
  return data;
};

export const createMicrophoneAssignment = async (req: CreateMicrophoneAssignmentRequest): Promise<MicrophoneAssignmentDto> => {
  const { data } = await apiClient.post("/api/user/microphone-assignments", req);
  return data;
};

export const updateMicrophoneAssignment = async (id: number, req: UpdateMicrophoneAssignmentRequest): Promise<MicrophoneAssignmentDto> => {
  const { data } = await apiClient.put(`/api/user/microphone-assignments/${id}`, req);
  return data;
};

/** @internal */
export const deleteMicrophoneAssignment = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/user/microphone-assignments/${id}`);
};
