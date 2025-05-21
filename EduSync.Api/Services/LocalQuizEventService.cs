using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using EduSync.Api.DTOs;
using EduSync.Api.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EduSync.Api.Services
{
    /// <summary>
    /// Implementation of IQuizEventService using local file system for event logging
    /// </summary>
    public class LocalQuizEventService : IQuizEventService
    {
        private readonly ILogger<LocalQuizEventService> _logger;
        private readonly string _eventsDirectory;
        
        /// <summary>
        /// Initializes a new instance of the LocalQuizEventService
        /// </summary>
        /// <param name="configuration">Application configuration</param>
        /// <param name="logger">Logger instance</param>
        public LocalQuizEventService(
            IConfiguration configuration,
            ILogger<LocalQuizEventService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            
            // Get the events directory from configuration or use a default
            _eventsDirectory = configuration["Storage:Local:EventsPath"] ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Events");
            
            // Ensure the events directory exists
            EnsureEventDirectoryExists();
        }
        
        private void EnsureEventDirectoryExists()
        {
            try
            {
                if (!Directory.Exists(_eventsDirectory))
                {
                    Directory.CreateDirectory(_eventsDirectory);
                    _logger.LogInformation("Created events directory at {Directory}", _eventsDirectory);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create events directory at {Directory}", _eventsDirectory);
            }
        }
        
        /// <inheritdoc/>
        public async Task PublishQuizStartEventAsync(QuizStartEventDto eventData)
        {
            await LogEventToFileAsync(eventData);
        }
        
        /// <inheritdoc/>
        public async Task PublishQuizAnswerEventAsync(QuizAnswerEventDto eventData)
        {
            await LogEventToFileAsync(eventData);
        }
        
        /// <inheritdoc/>
        public async Task PublishQuizSubmitEventAsync(QuizSubmitEventDto eventData)
        {
            await LogEventToFileAsync(eventData);
        }
        
        /// <summary>
        /// Logs an event to a local file
        /// </summary>
        /// <typeparam name="T">Type of event</typeparam>
        /// <param name="eventData">The event data to log</param>
        private async Task LogEventToFileAsync<T>(T eventData) where T : QuizEventDto
        {
            if (eventData == null)
            {
                _logger.LogWarning("Event data is null. Nothing to log.");
                return;
            }
            
            try
            {
                // Create a directory structure: Events/EventType/CourseId/
                string eventTypeDir = Path.Combine(_eventsDirectory, eventData.EventType);
                string courseDir = Path.Combine(eventTypeDir, eventData.CourseId.ToString());
                
                // Ensure directories exist
                if (!Directory.Exists(eventTypeDir))
                    Directory.CreateDirectory(eventTypeDir);
                
                if (!Directory.Exists(courseDir))
                    Directory.CreateDirectory(courseDir);
                
                // Create a unique filename with timestamp and student ID
                string timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss_fff");
                string fileName = $"{timestamp}_{eventData.StudentId}_{eventData.AssessmentId}.json";
                string filePath = Path.Combine(courseDir, fileName);
                
                // Serialize the event data to JSON
                string eventJson = JsonSerializer.Serialize(eventData, new JsonSerializerOptions 
                { 
                    WriteIndented = true 
                });
                
                // Write to file
                await File.WriteAllTextAsync(filePath, eventJson);
                
                _logger.LogInformation("Quiz event of type {EventType} logged successfully to {FilePath}", 
                    eventData.EventType, filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log quiz event of type {EventType}", eventData.EventType);
                // Don't rethrow the exception to prevent disrupting the user experience
                // The failed event will be logged but the app will continue functioning
            }
        }
    }
}

