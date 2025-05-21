using Microsoft.EntityFrameworkCore;
using EduSync.Api.Models;

namespace EduSync.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Assessment> Assessments { get; set; }
        public DbSet<Result> Results { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure entity relationships and constraints

            // User entity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Course entity
            modelBuilder.Entity<Course>()
                .HasOne(c => c.Instructor)
                .WithMany()
                .HasForeignKey(c => c.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Assessment entity
            modelBuilder.Entity<Assessment>()
                .HasOne(a => a.Course)
                .WithMany(c => c.Assessments)
                .HasForeignKey(a => a.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            // Result entity
            modelBuilder.Entity<Result>()
                .HasOne(r => r.Assessment)
                .WithMany(a => a.Results)
                .HasForeignKey(r => r.AssessmentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Result>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Enrollment entity configuration with composite key and proper navigation properties
            modelBuilder.Entity<Enrollment>()
                .HasKey(e => new { e.StudentId, e.CourseId });

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            // Index for enrollment date for better query performance
            modelBuilder.Entity<Enrollment>()
                .HasIndex(e => e.EnrollmentDate);
        }
    }
}
