namespace API.Services;

public class FileUpload : IFileStorage
{
    public const long MaxUploadSize = 10 * 1024 * 1024;

    private static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    private static readonly HashSet<string> DocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".txt", ".docx"
    };

    private readonly string _uploadsFolder;

    public FileUpload(IWebHostEnvironment env)
    {
        _uploadsFolder = Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(_uploadsFolder);
    }

    public async Task<string?> SaveFileAsync(IFormFile file)
    {
        if (!IsAllowedAttachment(file, out _)) return null;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(_uploadsFolder, fileName);

        await using var stream = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 4096, useAsync: true);
        await file.CopyToAsync(stream);

        return fileName;
    }

    public static bool IsImageAttachment(IFormFile file) => IsAllowedAttachment(file, out var type) && type == "image";

    public static bool IsAllowedAttachment(IFormFile file, out string attachmentType)
    {
        attachmentType = string.Empty;

        if (file is null || file.Length == 0) return false;

        var contentType = file.ContentType?.Trim() ?? string.Empty;
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        var isImage = contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)
            || (contentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase) && ImageExtensions.Contains(extension))
            || (string.IsNullOrWhiteSpace(contentType) && ImageExtensions.Contains(extension));
        if (isImage)
        {
            attachmentType = "image";
            return true;
        }

        var isDocument = DocumentExtensions.Contains(extension)
            || contentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase)
            || contentType.Equals("text/plain", StringComparison.OrdinalIgnoreCase)
            || contentType.Equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document", StringComparison.OrdinalIgnoreCase)
            || (contentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase) && DocumentExtensions.Contains(extension));

        if (!isDocument) return false;

        attachmentType = "file";
        return true;
    }
}
