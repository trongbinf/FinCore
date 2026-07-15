import api from "./api";
import { ActivityLog } from "@/types/log";

export const logService = {
  async getActivityLogs(): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[]>("/activitylog");
    return response.data;
  },
};
