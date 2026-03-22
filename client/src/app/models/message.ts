export interface Message {
    id: number;
    senderId: string | null;
    receiverId: string | null;
    content: string | null;
    attachmentUrl?: string | null;
    attachmentType?: 'image' | 'file' | null;
    attachmentName?: string | null;
    createdDate: string;
    isRead: boolean;
}