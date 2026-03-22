using API.Services;

namespace API.Endpoints;

public static class FileEndpoint
{
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    private static readonly HashSet<string> AllowedDocumentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };

    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp"
    };

    private static readonly HashSet<string> AllowedDocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf",
        ".txt",
        ".docx"
    };

    public static RouteGroupBuilder MapFileEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/files").WithTags("files");

        group.MapPost("/upload", async (HttpContext httpContext) =>
        {
            if (!httpContext.Request.HasFormContentType)
            {
                return Results.BadRequest(new { message = "Invalid multipart form data." });
            }

            var form = await httpContext.Request.ReadFormAsync();
            var files = form.Files;
            if (files == null || files.Count == 0)
            {
                return Results.BadRequest(new { message = "No files provided." });
            }

            var uploadedFiles = new List<object>();

            foreach (var file in files)
            {
                if (file.Length == 0)
                {
                    return Results.BadRequest(new { message = "One of the files is empty." });
                }

                if (file.Length > MaxFileSize)
                {
                    return Results.BadRequest(new { message = $"File '{file.FileName}' exceeds 10MB limit." });
                }

                var contentType = file.ContentType?.Trim() ?? string.Empty;
                var extension = Path.GetExtension(file.FileName);
                var isImage = contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)
                    || (string.IsNullOrWhiteSpace(contentType) && AllowedImageExtensions.Contains(extension));
                var isDocument = AllowedDocumentTypes.Contains(contentType)
                    || (string.IsNullOrWhiteSpace(contentType) && AllowedDocumentExtensions.Contains(extension));

                // Some clipboard sources send octet-stream even for images/files.
                if (!isImage && !isDocument && contentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
                {
                    isImage = AllowedImageExtensions.Contains(extension);
                    isDocument = AllowedDocumentExtensions.Contains(extension);
                }

                if (!isImage && !isDocument)
                {
                    return Results.BadRequest(new { message = $"File type '{contentType}' is not allowed." });
                }

                var savedName = await FileUpload.UploadFile(file);
                if (string.IsNullOrWhiteSpace(savedName))
                {
                    return Results.BadRequest(new { message = "File upload failed." });
                }

                var fileUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}/uploads/{savedName}";
                uploadedFiles.Add(new
                {
                    url = fileUrl,
                    fileName = file.FileName,
                    contentType,
                    attachmentType = isImage ? "image" : "file"
                });
            }

            return Results.Ok(uploadedFiles);
        }).DisableAntiforgery().RequireAuthorization();

        return group;
    }
}
