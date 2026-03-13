export interface ApiResponse<T> {
    isSuccess: boolean;
    message: string;
    error: string;
    data: T;
}