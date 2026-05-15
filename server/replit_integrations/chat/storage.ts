// Note: This is a stub implementation for the chat feature
// The actual database tables (conversations, messages) are not implemented yet

interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
}

interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

// In-memory storage (temporary until database tables are added)
const conversationsStore = new Map<number, Conversation>();
const messagesStore = new Map<number, Message>();
let nextConvId = 1;
let nextMsgId = 1;

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    return conversationsStore.get(id);
  },

  async getAllConversations() {
    return Array.from(conversationsStore.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async createConversation(title: string) {
    const conversation: Conversation = {
      id: nextConvId++,
      title,
      createdAt: new Date(),
    };
    conversationsStore.set(conversation.id, conversation);
    return conversation;
  },

  async deleteConversation(id: number) {
    // Delete all messages for this conversation
    for (const [msgId, msg] of Array.from(messagesStore.entries())) {
      if (msg.conversationId === id) {
        messagesStore.delete(msgId);
      }
    }
    conversationsStore.delete(id);
  },

  async getMessagesByConversation(conversationId: number) {
    return Array.from(messagesStore.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  async createMessage(conversationId: number, role: string, content: string) {
    const message: Message = {
      id: nextMsgId++,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };
    messagesStore.set(message.id, message);
    return message;
  },
};

