using Shift.Application.Common.Interfaces;

namespace Shift.Tests;

// Testte storage'a gitmeden öngörülebilir URL döndüren sahte. Gerçek byte yok.
public class FakeFileStorage : IFileStorage
{
    public Task<FileUploadTarget> CreateUploadUrlAsync(string key, string contentType, CancellationToken ct)
        => Task.FromResult(new FileUploadTarget($"https://fake/upload/{key}", "PUT"));

    public Task<string> CreateDownloadUrlAsync(string key, CancellationToken ct)
        => Task.FromResult($"https://fake/download/{key}");
}
