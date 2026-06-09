import api from './axiosInstance'; // use same axios instance as other api files

export const quizAPI = {
  generate: (topicName, subjectId, difficulty = 'medium') =>
    api.post('/quiz/generate', { topicName, subjectId, difficulty }),
  submit: (answers, questions) =>
    api.post('/quiz/submit', { answers, questions }),
};
