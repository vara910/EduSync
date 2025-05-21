using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using EduSync.Api.Services.Interfaces;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

namespace EduSync.Api.Services
{
    /// <summary>
    /// Implements local file system operations for course materials
    /// </summary>
    public class LocalBlobStorageService : IBlobStorageService
    {
        private readonly string? _courseMaterialsPath;
        private readonly string? _tempUploadsPath;
        private readonly ILogger<LocalBlobStorageService> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly bool _isLocalStorageConfigured;
        private readonly string _baseUrl;
        
        /// <summary>
        /// Initializes a new instance of the LocalBlobStorageService
        /// </summary>
        /// <param name="configuration">Application configuration</param>
        /// <param name="logger">Logger instance</param>
        /// <param name="webHostEnvironment">Web host environment</param>
        public LocalBlobStorageService(
            IConfiguration configuration,
            ILogger<LocalBlobStorageService> logger,
            IWebHostEnvironment webHostEnvironment)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _webHostEnvironment = webHostEnvironment ?? throw new ArgumentNullException(nameof(webHostEnvironment));
            
            // Read configuration values with default fallbacks
            _courseMaterialsPath = configuration["Storage:Local:CourseMaterialsPath"] ?? 
                Path.Combine(_webHostEnvironment.ContentRootPath, "CourseMaterials");
            _tempUploadsPath = configuration["Storage:Local:TempUploadsPath"] ?? 
                Path.Combine(_webHostEnvironment.ContentRootPath, "TempUploads");
            
            // Set base URL for file access
            _baseUrl = $"{_webHostEnvironment.ContentRootPath}/coursematerials";
            
            // Check if local storage is properly configured
            _isLocalStorageConfigured = !string.IsNullOrEmpty(_courseMaterialsPath) && !string.IsNullOrEmpty(_tempUploadsPath);
            
            if (!_isLocalStorageConfigured)
            {
                _logger.LogWarning("Local storage paths not properly configured. Using default paths: CourseMaterials: {CourseMaterialsPath}, TempUploads: {TempUploadsPath}", 
                    _courseMaterialsPath, _tempUploadsPath);
            }
            else
            {
                try
                {
                    // Ensure directories exist
                    if (_courseMaterialsPath != null && !Directory.Exists(_courseMaterialsPath))
                    {
                        Directory.CreateDirectory(_courseMaterialsPath);
                    }
                    
                    if (_tempUploadsPath != null && !Directory.Exists(_tempUploadsPath))
                    {
                        Directory.CreateDirectory(_tempUploadsPath);
                    }
                    
                    _logger.LogInformation("Local storage directories initialized successfully");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error initializing local storage directories");
                    _isLocalStorageConfigured = false;
                }
            }
        }
        
        /// <summary>
        /// Upload a file from an IFormFile
        /// </summary>
        public async Task<string> UploadFileAsync(Guid courseId, IFormFile file, string? fileName = null)
        {
            _logger.LogInformation("Uploading file for course {CourseId}", courseId);
            
            if (file == null)
            {
                _logger.LogError("File cannot be null for upload");
                throw new ArgumentNullException(nameof(file));
            }
            
            using var stream = file.OpenReadStream();
            return await UploadFileAsync(
                courseId,
                stream,
                fileName ?? file.FileName,
                file.ContentType);
        }
        
        /// <summary>
        /// Upload a file from a stream
        /// </summary>
        public async Task<string> UploadFileAsync(Guid courseId, Stream fileStream, string fileName, string contentType)
        {
            _logger.LogInformation("Uploading file {FileName} for course {CourseId}", fileName, courseId);
            
            // Validate input parameters
            if (fileStream == null)
            {
                _logger.LogError("File stream cannot be null for upload");
                throw new ArgumentNullException(nameof(fileStream));
            }
            
            if (string.IsNullOrEmpty(fileName))
            {
                _logger.LogError("File name cannot be empty for upload");
                throw new ArgumentException("File name cannot be null or empty", nameof(fileName));
            }
            
            // Check if local storage is configured
            if (!_isLocalStorageConfigured)
            {
                _logger.LogError("Local storage not configured. Cannot upload file. Make sure Storage:Local:CourseMaterialsPath is set in appsettings.json");
                throw new InvalidOperationException("Local storage service is not properly configured");
            }
            
            try
            {
                // Create course directory if it doesn't exist
                if (_courseMaterialsPath == null)
                {
                    throw new InvalidOperationException("Course materials path is not configured");
                }
                
                string courseDirectory = Path.Combine(_courseMaterialsPath, courseId.ToString());
                if (!Directory.Exists(courseDirectory))
                {
                    Directory.CreateDirectory(courseDirectory);
                }
                
                // Create the file path
                string filePath = Path.Combine(courseDirectory, fileName);
                
                // Save the file
                using (var fileStream2 = new FileStream(filePath, FileMode.Create))
                {
                    await fileStream.CopyToAsync(fileStream2);
                }
                
                // Save content type in a metadata file
                string metadataPath = Path.Combine(courseDirectory, $"{fileName}.metadata");
                File.WriteAllText(metadataPath, contentType);
                
                _logger.LogInformation("File {FileName} uploaded successfully for course {CourseId}", fileName, courseId);
                
                // Return a "URL" that can be used to access the file
                return $"file://{filePath.Replace("\\", "/")}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName} for course {CourseId}", fileName, courseId);
                throw;
            }
        }
        
        /// <summary>
        /// Download a file
        /// </summary>
        public async Task<(Stream FileStream, string ContentType, string FileName)> DownloadFileAsync(Guid courseId, string fileName)
        {
            _logger.LogInformation("Downloading file {FileName} for course {CourseId}", fileName, courseId);
            
            // Check if local storage is configured
            if (!_isLocalStorageConfigured)
            {
                _logger.LogError("Local storage not configured. Cannot download file. Make sure Storage:Local:CourseMaterialsPath is set in appsettings.json");
                throw new InvalidOperationException("Local storage service is not properly configured");
            }
            
            try
            {
                // Get the file path
                if (_courseMaterialsPath == null)
                {
                    throw new InvalidOperationException("Course materials path is not configured");
                }
                
                string courseDirectory = Path.Combine(_courseMaterialsPath, courseId.ToString());
                string filePath = Path.Combine(courseDirectory, fileName);
                
                // Check if the file exists
                if (!File.Exists(filePath))
                {
                    _logger.LogWarning("File {FileName} not found for course {CourseId}", fileName, courseId);
                    throw new FileNotFoundException($"File {fileName} not found for course {courseId}");
                }
                
                // Get the content type from metadata file
                string contentType = "application/octet-stream"; // Default
                string metadataPath = Path.Combine(courseDirectory, $"{fileName}.metadata");
                if (File.Exists(metadataPath))
                {
                    contentType = await File.ReadAllTextAsync(metadataPath);
                }
                
                // Read file into memory stream
                var memoryStream = new MemoryStream();
                using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                {
                    await fileStream.CopyToAsync(memoryStream);
                }
                memoryStream.Position = 0; // Reset position for reading
                
                _logger.LogInformation("File {FileName} downloaded successfully for course {CourseId}", fileName, courseId);
                return (memoryStream, contentType, fileName);
            }
            catch (FileNotFoundException)
            {
                // Re-throw file not found exceptions
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file {FileName} for course {CourseId}", fileName, courseId);
                throw;
            }
        }
        
        /// <summary>
        /// List all files for a course
        /// </summary>
        public async Task<IEnumerable<BlobFileInfo>> ListFilesAsync(Guid courseId)
        {
            _logger.LogInformation("Listing files for course {CourseId}", courseId);
            
            // Check if local storage is configured
            if (!_isLocalStorageConfigured)
            {
                _logger.LogError("Local storage not configured. Cannot list files. Make sure Storage:Local:CourseMaterialsPath is set in appsettings.json");
                throw new InvalidOperationException("Local storage service is not properly configured");
            }
            
            try
            {
                if (_courseMaterialsPath == null)
                {
                    throw new InvalidOperationException("Course materials path is not configured");
                }
                
                string courseDirectory = Path.Combine(_courseMaterialsPath, courseId.ToString());
                
                // Create the directory if it doesn't exist
                if (!Directory.Exists(courseDirectory))
                {
                    Directory.CreateDirectory(courseDirectory);
                    return new List<BlobFileInfo>(); // Return empty list for new directory
                }
                
                // Get all files in the directory
                var result = new List<BlobFileInfo>();
                var files = Directory.GetFiles(courseDirectory);
                
                foreach (var file in files)
                {
                    // Skip metadata files
                    if (file.EndsWith(".metadata"))
                    {
                        continue;
                    }
                    
                    var fileInfo = new FileInfo(file);
                    string fileName = Path.GetFileName(file);
                    
                    // Get content type from metadata if available
                    string contentType = "application/octet-stream"; // Default
                    string metadataPath = Path.Combine(courseDirectory, $"{fileName}.metadata");
                    if (File.Exists(metadataPath))
                    {
                        contentType = await File.ReadAllTextAsync(metadataPath);
                    }
                    
                    result.Add(new BlobFileInfo
                    {
                        FileName = fileName,
                        Size = fileInfo.Length,
                        ContentType = contentType,
                        Url = $"file://{file.Replace("\\", "/")}",
                        LastModified = fileInfo.LastWriteTimeUtc
                    });
                }
                
                _logger.LogInformation("Listed {Count} files for course {CourseId}", result.Count, courseId);
                return await Task.FromResult(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing files for course {CourseId}", courseId);
                throw;
            }
        }
        
        /// <summary>
        /// Delete a file
        /// </summary>
        public async Task<bool> DeleteFileAsync(Guid courseId, string fileName)
        {
            _logger.LogInformation("Deleting file {FileName} for course {CourseId}", fileName, courseId);
            
            // Check if local storage is configured
            if (!_isLocalStorageConfigured)
            {
                _logger.LogError("Local storage not configured. Cannot delete file. Make sure Storage:Local:CourseMaterialsPath is set in appsettings.json");
                throw new InvalidOperationException("Local storage service is not properly configured");
            }
            
            try
            {
                // Get the file path
                if (_courseMaterialsPath == null)
                {
                    throw new InvalidOperationException("Course materials path is not configured");
                }
                
                string courseDirectory = Path.Combine(_courseMaterialsPath, courseId.ToString());
                string filePath = Path.Combine(courseDirectory, fileName);
                string metadataPath = Path.Combine(courseDirectory, $"{fileName}.metadata");
                
                // Check if the file exists
                if (!File.Exists(filePath))
                {
                    _logger.LogWarning("File {FileName} not found for deletion for course {CourseId}", fileName, courseId);
                    return false;
                }
                
                // Delete the file
                File.Delete(filePath);
                
                // Delete metadata file if it exists
                if (File.Exists(metadataPath))
                {
                    File.Delete(metadataPath);
                }
                
                _logger.LogInformation("File {FileName} deleted successfully for course {CourseId}", fileName, courseId);
                return await Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FileName} for course {CourseId}", fileName, courseId);
                throw;
            }
        }
        
        /// <summary>
        /// Generate a "URL" for a file (local implementation doesn't use SAS tokens)
        /// </summary>
        public async Task<string> GenerateSasUrlAsync(Guid courseId, string fileName, TimeSpan expiryTime)
        {
            _logger.LogInformation("Generating URL for file {FileName} for course {CourseId}", fileName, courseId);
            
            // Check if local storage is configured
            if (!_isLocalStorageConfigured)
            {
                _logger.LogError("Local storage not configured. Cannot generate URL. Make sure Storage:Local:CourseMaterialsPath is set in appsettings.json");
                throw new InvalidOperationException("Local storage service is not properly configured");
            }
            
            try
            {
                // Get the file path
                if (_courseMaterialsPath == null)
                {
                    throw new InvalidOperationException("Course materials path is not configured");
                }
                
                string courseDirectory = Path.Combine(_courseMaterialsPath, courseId.ToString());
                string filePath = Path.Combine(courseDirectory, fileName);
                
                // Check if the file exists
                if (!File.Exists(filePath))
                {
                    _logger.LogWarning("File {FileName} not found for generating URL for course {CourseId}", fileName, courseId);
                    throw new FileNotFoundException($"File {fileName} not found for course {courseId}");
                }
                
                // In a local environment, we don't need SAS tokens.
                // Just return a direct file path that can be used for access
                string fileUrl = $"file://{filePath.Replace("\\", "/")}";
                
                _logger.LogInformation("Generated URL for file {FileName} for course {CourseId}", fileName, courseId);
                return await Task.FromResult(fileUrl);
            }
            catch (FileNotFoundException)
            {
                // Re-throw file not found exceptions
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating URL for file {FileName} for course {CourseId}", fileName, courseId);
                throw;
            }
        }
    }
}
