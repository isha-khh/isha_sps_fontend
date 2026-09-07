import {apiClient} from "@/lib/api-client.ts";
import type {getHealthResponse} from "@/types/sps-api.ts";





export const spsApi= {
      /**
   * 獲取系統版本環境與狀態
   * GET /api/health
   */
    async gethealth(): Promise<getHealthResponse>{
        try {
            const response =  await apiClient.get('/api/health')
            return response.data;
        }catch (error) {
            console.error("未知錯誤:", error);
            if (error instanceof Error) {
              console.error("API 錯誤 :", error.message);
            }
            throw error;
        }
    }
}
