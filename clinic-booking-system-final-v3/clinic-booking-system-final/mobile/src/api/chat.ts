import { apiClient } from './client';

export const chatApi = {
  async askChatbot(question: string): Promise<string> {
    try {
      const response = await apiClient.post<string>('/chat/ask', question, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      return String(response.data || '');
    } catch (error) {
      console.error('Chatbot API error:', error);
      throw error;
    }
  },
};
