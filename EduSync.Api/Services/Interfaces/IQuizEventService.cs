using System;
using System.Threading.Tasks;
using EduSync.Api.DTOs;

namespace EduSync.Api.Services.Interfaces
{
    /// <summary>
    /// Service for publishing quiz events to Azure Event Hub
    /// </summary>
    public interface IQuizEventService
    {
        /// <summary>
        /// Publishes a quiz start event
        /// </summary>
        /// <param name="eventData">Quiz start event data</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task PublishQuizStartEventAsync(QuizStartEventDto eventData);
        
        /// <summary>
        /// Publishes a quiz answer event
        /// </summary>
        /// <param name="eventData">Quiz answer event data</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task PublishQuizAnswerEventAsync(QuizAnswerEventDto eventData);
        
        /// <summary>
        /// Publishes a quiz submit event
        /// </summary>
        /// <param name="eventData">Quiz submit event data</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task PublishQuizSubmitEventAsync(QuizSubmitEventDto eventData);
    }
}

