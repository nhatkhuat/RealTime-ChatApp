using System;

namespace API.Services;

public class FileUpload
{
    public static async Task<string> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return string.Empty;

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return the filename only; callers can build a URL as needed.
        return uniqueFileName;
    }
}
