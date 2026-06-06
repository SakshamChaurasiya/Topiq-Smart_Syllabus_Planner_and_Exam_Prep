import api from './api';

export const syllabusService = {
  /** Upload syllabus PDF */
  upload: (subjectId, formData) =>
    api.post(`/syllabus/${subjectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** Get syllabus + topics for a subject */
  getBySubject: (subjectId) => api.get(`/syllabus/${subjectId}`),

  /** Update topic completion */
  updateTopic: (syllabusId, topicIndex, data) =>
    api.put(`/syllabus/${syllabusId}/topic/${topicIndex}`, data),

  /** Delete syllabus */
  delete: (syllabusId) => api.delete(`/syllabus/${syllabusId}`),

  /** Paste text as syllabus */
  pasteText: (subjectId, data) => api.post(`/syllabus/${subjectId}/text`, data),
};
