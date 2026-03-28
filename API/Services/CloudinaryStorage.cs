using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace API.Services;

public class CloudinaryStorage : IFileStorage
{

    private readonly Cloudinary _cloudinary;

    public CloudinaryStorage(IConfiguration config)
    {
        var acc = new Account(
            config["CloudinarySettings:CloudName"],
            config["CloudinarySettings:ApiKey"],
            config["CloudinarySettings:ApiSecret"]
        );
        _cloudinary = new Cloudinary(acc);
    }

    public async Task<string?> SaveFileAsync(IFormFile file)
    {
        if (!API.Common.FileUtil.IsAllowedAttachment(file, out var type)) return null;

        await using var stream = file.OpenReadStream();

        try
        {
            if (type == "image")
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "chatapp"
                };
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                if (uploadResult?.Error != null)
                {
                    throw new Exception($"Cloudinary upload error: {uploadResult.Error.Message}");
                }
                return uploadResult?.SecureUrl?.AbsoluteUri;
            }
            else
            {
                var uploadParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "chatapp"
                };
                var rawResult = await _cloudinary.UploadAsync(uploadParams);
                if (rawResult?.Error != null)
                {
                    throw new Exception($"Cloudinary raw upload error: {rawResult.Error.Message}");
                }
                return rawResult?.SecureUrl?.AbsoluteUri;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error uploading file to Cloudinary: {ex.Message}");
            throw;
        }
    }
}
