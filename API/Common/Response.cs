using System;

namespace API.Common;

public class Response<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public string? Message { get; set; }
    public Response(bool isSuccess, T? data, string? error, string? message)
    {
        IsSuccess = isSuccess;
        Data = data;
        Error = error;
        Message = message;
    }

    public static Response<T> Success(T data, string? message = null)
    {
        return new Response<T>(true, data, null, message);
    }

    public static Response<T> Failure(string message)
    {
        return new Response<T>(false, default, message, null);
    }

}
