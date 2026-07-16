import api from "./api";

export const systemService = {
  async resetData(): Promise<boolean> {
    const response = await api.post<boolean>("/system/reset-data");
    return response.data;
  },
};
