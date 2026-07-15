export interface ActivityLog {
  id: string;
  userFullName: string;
  action: string;
  entityName: string;
  entityId?: string;
  description?: string;
  timestamp: string;
}
