using AudioVerse.Domain.Entities.Dmx;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IDmxRepository.
/// Handles DMX scenes and sequences.
/// </summary>
public class DmxRepositoryEF : IDmxRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<DmxRepositoryEF> _logger;

    public DmxRepositoryEF(AudioVerseDbContext dbContext, ILogger<DmxRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    // ????????????????????????????????????????????????????????????
    //  SCENES
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> SaveSceneAsync(DmxScene scene)
    {
        scene.CreatedAt = DateTime.UtcNow;
        _dbContext.DmxScenes.Add(scene);
        await _dbContext.SaveChangesAsync();
        return scene.Id;
    }

    /// <inheritdoc />
    public async Task<DmxScene?> GetSceneByIdAsync(int id)
    {
        return await _dbContext.DmxScenes.FindAsync(id);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<DmxScene>> GetAllScenesAsync()
    {
        return await _dbContext.DmxScenes
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> UpdateSceneAsync(DmxScene scene)
    {
        var existing = await _dbContext.DmxScenes.FindAsync(scene.Id);
        if (existing == null) return false;

        existing.Name = scene.Name;
        existing.Description = scene.Description;
        existing.ChannelValuesJson = scene.ChannelValuesJson;
        existing.DurationMs = scene.DurationMs;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteSceneAsync(int id)
    {
        var scene = await _dbContext.DmxScenes.FindAsync(id);
        if (scene == null) return false;

        _dbContext.DmxScenes.Remove(scene);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("DMX scene {Id} deleted", id);
        return true;
    }

    /// <inheritdoc />
    public async Task<DmxScene?> GetSceneByNameAsync(string name)
    {
        return await _dbContext.DmxScenes
            .FirstOrDefaultAsync(s => s.Name == name);
    }

    // ????????????????????????????????????????????????????????????
    //  SEQUENCES
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> SaveSequenceAsync(DmxSceneSequence sequence)
    {
        _dbContext.DmxSceneSequences.Add(sequence);
        await _dbContext.SaveChangesAsync();
        return sequence.Id;
    }

    /// <inheritdoc />
    public async Task<DmxSceneSequence?> GetSequenceByIdAsync(int id)
    {
        return await _dbContext.DmxSceneSequences
            .Include(s => s.Steps.OrderBy(st => st.Order))
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<DmxSceneSequence>> GetAllSequencesAsync()
    {
        return await _dbContext.DmxSceneSequences
            .Include(s => s.Steps)
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> UpdateSequenceAsync(DmxSceneSequence sequence)
    {
        var existing = await _dbContext.DmxSceneSequences.FindAsync(sequence.Id);
        if (existing == null) return false;

        existing.Name = sequence.Name;
        existing.Loop = sequence.Loop;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteSequenceAsync(int id)
    {
        var sequence = await _dbContext.DmxSceneSequences
            .Include(s => s.Steps)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sequence == null) return false;

        _dbContext.DmxSceneSteps.RemoveRange(sequence.Steps);
        _dbContext.DmxSceneSequences.Remove(sequence);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("DMX sequence {Id} deleted", id);
        return true;
    }

    // ????????????????????????????????????????????????????????????
    //  SEQUENCE STEPS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> AddSequenceStepAsync(DmxSceneStep step)
    {
        _dbContext.DmxSceneSteps.Add(step);
        await _dbContext.SaveChangesAsync();
        return step.Id;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<DmxSceneStep>> GetSequenceStepsAsync(int sequenceId)
    {
        return await _dbContext.DmxSceneSteps
            .Where(s => s.SequenceId == sequenceId)
            .OrderBy(s => s.Order)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> RemoveSequenceStepAsync(int stepId)
    {
        var step = await _dbContext.DmxSceneSteps.FindAsync(stepId);
        if (step == null) return false;

        _dbContext.DmxSceneSteps.Remove(step);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> ReorderSequenceStepsAsync(int sequenceId, IEnumerable<int> stepIdsInOrder)
    {
        var steps = await _dbContext.DmxSceneSteps
            .Where(s => s.SequenceId == sequenceId)
            .ToListAsync();

        var order = 0;
        foreach (var stepId in stepIdsInOrder)
        {
            var step = steps.FirstOrDefault(s => s.Id == stepId);
            if (step != null)
            {
                step.Order = order++;
            }
        }

        await _dbContext.SaveChangesAsync();
        return true;
    }
}
