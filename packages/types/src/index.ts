export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Clip {
  id: string;
  userId: string;
  content: string;
  contentPreview: string;
  copiedAt: string;
  isFavorite: boolean;
  tags: string[];
  deviceName: string | null;
  synced: boolean;
  createdAt: string;
}

export interface SyncSession {
  id: string;
  userId: string;
  deviceId: string;
  lastSync: string;
}

export interface CreateClipRequest {
  content: string;
  deviceName?: string;
  tags?: string[];
}

export interface UpdateClipRequest {
  content?: string;
  isFavorite?: boolean;
  tags?: string[];
}

export interface SyncRequest {
  clips: CreateClipRequest[];
  deviceId: string;
}

export interface SyncResponse {
  synced: number;
  conflicts: Clip[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
