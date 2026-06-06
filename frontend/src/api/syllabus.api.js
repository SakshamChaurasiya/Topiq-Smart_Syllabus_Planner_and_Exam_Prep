import axiosInstance from './axiosInstance';

export const syllabusAPI = {
  uploadFile:  (formData) => axiosInstance.post('/syllabus/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  submitText:  (data)     => axiosInstance.post('/syllabus/text', data),
  analyze:     (id)       => axiosInstance.post(`/syllabus/${id}/analyze`),
  getBySubject:(subjectId)=> axiosInstance.get(`/syllabus/${subjectId}`),
  markTopic:   (syllabusId, topicId, isCompleted) =>
    axiosInstance.put(`/syllabus/${syllabusId}/topic/${topicId}/complete`, { isCompleted }),
};
