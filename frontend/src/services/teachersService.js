// Utilisation de l'instance axios centralisée
import axiosInstance from "./api/axios.config";

export const teachersService = {
  // Récupérer tous les professeurs (avec pagination & filtres)
  async getTeachers(params = {}) {
    try {
      const response = await axiosInstance.get("/teachers", { params });
      // Format attendu: { data: [...], meta: {...}, filters: {...} }
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des professeurs:", error);
      throw error;
    }
  },

  // Récupérer un professeur par UUID
  async getTeacher(uuid) {
    try {
      const response = await axiosInstance.get(`/teachers/${uuid}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du professeur:", error);
      throw error;
    }
  },

  // Créer un nouveau professeur
  async createTeacher(teacherData) {
    try {
      const response = await axiosInstance.post("/teachers", teacherData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du professeur:", error);
      throw error;
    }
  },

  // Mettre à jour un professeur
  async updateTeacher(uuid, teacherData) {
    try {
      const response = await axiosInstance.put(
        `/teachers/${uuid}`,
        teacherData,
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du professeur:", error);
      throw error;
    }
  },

  // Supprimer un professeur
  async deleteTeacher(uuid) {
    try {
      const response = await axiosInstance.delete(`/teachers/${uuid}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la suppression du professeur:", error);
      throw error;
    }
  },

  // Récupérer le nombre d'étudiants abonnés à un professeur
  async getTeacherStudentsCount(teacherUuid) {
    try {
      const response = await axiosInstance.get(
        `/teachers/${teacherUuid}/students-count`,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du nombre d'étudiants:",
        error,
      );
      return { count: 0 };
    }
  },

  // Récupérer les détails des revenus d'un professeur
  async getTeacherRevenueDetails(teacherUuid) {
    try {
      const response = await axiosInstance.get(
        `/teachers/${teacherUuid}/revenue-details`,
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails des revenus:",
        error,
      );
      throw error;
    }
  },
};
