import axiosInstance from './axiosInstance';

export const syllabusAPI = {
  uploadFile:  (formData) => axiosInstance.post('/syllabus/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  submitText:  (data)     => axiosInstance.post('/syllabus/text', data),
  analyze:     (id, data) => axiosInstance.post(`/syllabus/${id}/analyze`, data, { timeout: 120000 }),
  getBySubject:(subjectId)=> axiosInstance.get(`/syllabus/${subjectId}`),
  markTopic:   (syllabusId, topicId, isCompleted) =>
    axiosInstance.put(`/syllabus/${syllabusId}/topic/${topicId}/complete`, { isCompleted }),
  uploadPYQ:   (syllabusId, formData) =>
    axiosInstance.post(`/syllabus/${syllabusId}/pyq-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
  generateFlashcards: (syllabusId) =>
    axiosInstance.post(`/syllabus/${syllabusId}/flashcards/generate`, {}, { timeout: 120000 }),
  getFlashcards: (syllabusId) =>
    axiosInstance.get(`/syllabus/${syllabusId}/flashcards`),
  shareFlashcards: (setId, shareTitle) =>
    axiosInstance.post(`/flashcards/${setId}/share`, { shareTitle }),
  getPublicCheatNote: (shareToken) =>
    axiosInstance.get(`/public/cheatnote/${shareToken}`),
};
