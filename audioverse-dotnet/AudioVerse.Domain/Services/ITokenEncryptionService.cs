namespace AudioVerse.Domain.Services
{
    public interface ITokenEncryptionService
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
    }
}
