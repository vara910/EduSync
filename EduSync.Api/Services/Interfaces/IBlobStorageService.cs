using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace EduSync.Api.Services.Interfaces
{
    /// <summary>
    /// Interface for blob storage operations for course materials
    /// </summary>
    public interface IBlobStorageService
    {
        /// <summary>
        /// Uploads a file to blob storage for a specific course
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="file">The file to upload</param>
        /// <param name="fileName">Optional custom file name. If not provided, the original file name will be used</param>
        /// <returns>URL to access the uploaded file</returns>
        Task<string> UploadFileAsync(Guid courseId, IFormFile file, string? fileName = null);
        
        /// <summary>
        /// Uploads a file from a stream to blob storage for a specific course
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="fileStream">The stream containing the file data</param>
        /// <param name="fileName">The name to give the file</param>
        /// <param name="contentType">The content type of the file</param>
        /// <returns>URL to access the uploaded file</returns>
        Task<string> UploadFileAsync(Guid courseId, Stream fileStream, string fileName, string contentType);
        
        /// <summary>
        /// Downloads a file from blob storage
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="fileName">The name of the file to download</param>
        /// <returns>The file as a stream along with content type and file name</returns>
        Task<(Stream FileStream, string ContentType, string FileName)> DownloadFileAsync(Guid courseId, string fileName);
        
        /// <summary>
        /// Lists all files for a specific course
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <returns>List of file details including name, size, URL, and last modified date</returns>
        Task<IEnumerable<BlobFileInfo>> ListFilesAsync(Guid courseId);
        
        /// <summary>
        /// Deletes a file from blob storage
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="fileName">The name of the file to delete</param>
        /// <returns>True if deletion was successful</returns>
        Task<bool> DeleteFileAsync(Guid courseId, string fileName);
        
        /// <summary>
        /// Generates a Shared Access Signature (SAS) URL for a file
        /// </summary>
        /// <param name="courseId">The ID of the course</param>
        /// <param name="fileName">The name of the file</param>
        /// <param name="expiryTime">How long the URL should be valid for</param>
        /// <returns>SAS URL for secure access to the file</returns>
        Task<string> GenerateSasUrlAsync(Guid courseId, string fileName, TimeSpan expiryTime);
    }
    
    /// <summary>
    /// Represents file information from blob storage
    /// </summary>
    public class BlobFileInfo
    {
        /// <summary>
        /// The name of the file
        /// </summary>
        public string FileName { get; set; } = string.Empty;
        
        /// <summary>
        /// The size of the file in bytes
        /// </summary>
        public long Size { get; set; }
        
        /// <summary>
        /// The content type of the file
        /// </summary>
        public string ContentType { get; set; } = string.Empty;
        
        /// <summary>
        /// The URL to access the file
        /// </summary>
        public string Url { get; set; } = string.Empty;
        
        /// <summary>
        /// When the file was last modified
        /// </summary>
        public DateTimeOffset LastModified { get; set; }
    }
}

