import api from "./axios.config";
import cacheService from "../cache.service";

const branchesService = {
  // Get all branches
  getAllBranches: async () => {
    try {
      return await cacheService.getBranches(async () => {
        const response = await api.get("/branches");
        return response.data;
      });
    } catch (error) {
      console.error("Error fetching branches:", error);
      throw error;
    }
  },

  // Get branches for a specific year level
  getBranchesForYear: async (yearLevel) => {
    try {
      const response = await api.get(`/branches/year/${yearLevel}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching branches for year:", error);
      throw error;
    }
  },

  // Get a specific branch
  getBranch: async (branchId) => {
    try {
      const response = await api.get(`/branches/${branchId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching branch:", error);
      throw error;
    }
  },
};

export default branchesService;
