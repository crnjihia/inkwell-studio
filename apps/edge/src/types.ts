export interface Env {
  ENVIRONMENT: string;
  EDGE_RATE_LIMIT_RPM: string;
  DOCUMENT_ROOM: DurableObjectNamespace;
  ORIGIN_URL?: string;
  DATABASE_URL?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ZONE_ID?: string;
}

export interface CollaboratorUser {
  userId: string;
  name: string;
  color: string;
  cursor?: {
    anchor: number;
    head: number;
  };
}

export interface RoomSessionState {
  documentId: string;
  connectedClients: number;
  lastFlushedAt: number;
  isDirty: boolean;
}
