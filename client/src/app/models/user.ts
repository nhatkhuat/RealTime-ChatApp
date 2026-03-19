export interface User {
    id: string;
    userName: string;
    fullName: string;
    profileImage: string;
    photoUrl: string;
    isOnline: boolean;
    connectionId: string;
    lastMessage: string;
    unreadCount: number;
    isTyping: boolean;
}