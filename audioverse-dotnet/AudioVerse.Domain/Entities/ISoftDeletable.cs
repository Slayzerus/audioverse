namespace AudioVerse.Domain.Entities;

/// <summary>Marks entities supporting soft delete (logical deletion).</summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
    int? DeletedByUserId { get; set; }
}
