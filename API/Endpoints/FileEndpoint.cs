using API.Services;

namespace API.Endpoints;

public static class FileEndpoint
{
    public static RouteGroupBuilder MapFileEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/files").WithTags("files");

        group.MapPost("/upload", async (HttpContext httpContext, IFileStorage fileStorage) =>
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

            var uploadedFiles = new List<object>(files.Count);

            foreach (var file in files)
            {
                if (file.Length > FileUpload.MaxUploadSize)
                    return Results.BadRequest(new { message = $"File '{file.FileName}' exceeds 10MB limit." });

                if (!FileUpload.IsAllowedAttachment(file, out var attachmentType))
                    return Results.BadRequest(new { message = $"File type '{file.ContentType}' is not allowed." });

                var savedName = await fileStorage.SaveFileAsync(file);
                if (string.IsNullOrWhiteSpace(savedName)) return Results.BadRequest(new { message = "File upload failed." });

                uploadedFiles.Add(new
                {
                    url = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}/uploads/{savedName}",
                    fileName = file.FileName,
                    contentType = file.ContentType,
                    attachmentType
                });
            }

            return Results.Ok(uploadedFiles);
        }).DisableAntiforgery().RequireAuthorization();

        return group;
    }
}
