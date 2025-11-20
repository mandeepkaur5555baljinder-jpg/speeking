export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface TopicCard {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: string;
  questions: string[];
}

// For Audio Visualization
export interface AudioBar {
  height: number;
}
