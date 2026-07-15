import api from "./axios";

/* ---------------- LESSONS ---------------- */

export const getLessons = async () => {
  const res = await api.get("/lessons");
  return res.data;
};

export const getLesson = async (lessonId: number) => {
  const res = await api.get(`/lessons/${lessonId}`);
  return res.data;
};

export const createLesson = async (title: string) => {
  const res = await api.post("/lessons", {
    title,
  });
  return res.data;
};

export const updateLesson = async (
  lessonId: number,
  title: string
) => {
  const res = await api.put(`/lessons/${lessonId}`, {
    title,
  });
  return res.data;
};

export const deleteLesson = async (lessonId: number) => {
  const res = await api.delete(`/lessons/${lessonId}`);
  return res.data;
};

/* ---------------- SECTIONS ---------------- */

export const getLessonSections = async (lessonId: number) => {
  const res = await api.get(`/lessons/${lessonId}/sections`);
  return res.data;
};

export const createSection = async (
  lessonId: number,
  data: {
    title: string;
    body_content: string;
    order_index?: number;
  }
) => {
  const res = await api.post(`/lessons/${lessonId}/sections`, data);
  return res.data;
};

export const getSection = async (
  lessonId: number,
  sectionId: number
) => {
  const res = await api.get(
    `/lessons/${lessonId}/sections/${sectionId}`
  );
  return res.data;
};

export const updateSection = async (
  lessonId: number,
  sectionId: number,
  data: {
    title?: string;
    body_content?: string;
    order_index?: number;
  }
) => {
  const res = await api.put(
    `/lessons/${lessonId}/sections/${sectionId}`,
    data
  );
  return res.data;
};

export const deleteSection = async (
  lessonId: number,
  sectionId: number
) => {
  const res = await api.delete(
    `/lessons/${lessonId}/sections/${sectionId}`
  );
  return res.data;
};

/* ---------------- PROGRESS ---------------- */

export const markSectionCompleted = async (sectionId: number) => {
  const res = await api.post("/progress", {
    section_id: sectionId,
  });
  return res.data;
};

export const getStudentProgress = async () => {
  const res = await api.get("/progress/me");
  return res.data;
};

export const getStudentsProgress = async (studentId?: number) => {
  const res = await api.get("/progress/students", {
    params: studentId ? { student_id: studentId } : undefined,
  });
  return res.data;
};

/* ---------------- UPLOAD IMAGE ---------------- */

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
