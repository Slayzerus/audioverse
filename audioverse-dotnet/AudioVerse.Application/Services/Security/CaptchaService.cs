using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Identity;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.Text;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Entities.Auth;

namespace AudioVerse.Application.Services.Security
{
    public class CaptchaService : ICaptchaService
    {
        private readonly IUserSecurityRepository _securityRepo;
        private readonly IPasswordHasher<UserProfile> _passwordHasher;

        private static readonly List<(string question, string answer)> SecurityQuestions = new()
        {
            ("Co jest stolic? Wielkiej Brytanii?", "Londyn"),
            ("Jaka jest stolic? Polski?", "Warszawa"),
            ("Co jest stolic? Francji?", "Pary?"),
            ("Jaka jest najwi?ksza planeta w Uk?adzie S?onecznym?", "Jowisz"),
            ("Ile wynosi 5 + 3?", "8"),
            ("Jaki jest kolor trawy?", "Zielony"),
            ("Ile boków ma sze?ciok?t?", "6"),
            ("Czy woda musi by? gor?ca aby gotowa??", "Tak"),
            ("Ile nóg ma ptak?", "2"),
            ("Jakie jest przeciwie?stwo bieli?", "Czarny")
        };

        private static readonly List<string> ImageObjects = new()
        {
            "Samochód", "Pies", "Kot", "Dom", "Drzewo",
            "Komputer", "Telefon", "Kwiat", "Ptak", "Ryba"
        };

        public CaptchaService(IUserSecurityRepository securityRepo, IPasswordHasher<UserProfile> passwordHasher)
        {
            _securityRepo = securityRepo;
            _passwordHasher = passwordHasher;
        }

        public async Task<Captcha> GenerateCaptchaAsync(int captchaType, string? ipAddress = null)
        {
            var captcha = new Captcha
            {
                CaptchaType = captchaType,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                IpAddress = ipAddress,
                IsUsed = false
            };

            switch (captchaType)
            {
                case 1:
                    GenerateQuestionAnswer(captcha);
                    break;
                case 2:
                    GenerateReverseString(captcha);
                    break;
                case 3:
                    GenerateImageQuestion(captcha);
                    break;
                case 4:
                    GenerateMathProblem(captcha);
                    break;
                case 5:
                    GenerateImageSelection(captcha);
                    break;
                case 6:
                    GenerateImageRegionSelection(captcha);
                    break;
                case 7:
                    GeneratePuzzleMatching(captcha);
                    break;
                case 8:
                    GenerateAudioQuestion(captcha);
                    break;
                default:
                    GenerateQuestionAnswer(captcha);
                    break;
            }

            await _securityRepo.SaveCaptchaAsync(captcha);
            return captcha;
        }

        public async Task<bool> ValidateCaptchaAsync(int captchaId, string userAnswer)
        {
            var captcha = await _securityRepo.GetCaptchaByIdAsync(captchaId);
            if (captcha == null || captcha.IsUsed || captcha.ExpiresAt < DateTime.UtcNow)
                return false;

            var tempUser = new UserProfile { Id = 0 };
            var result = _passwordHasher.VerifyHashedPassword(tempUser, captcha.Answer, userAnswer.Trim().ToLower());

            if (result == PasswordVerificationResult.Success)
            {
                captcha.IsUsed = true;
                await _securityRepo.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task<Captcha?> GetCaptchaAsync(int captchaId)
        {
            return await _securityRepo.GetCaptchaByIdAsync(captchaId);
        }

        #region Type 1: Question Answer
        private void GenerateQuestionAnswer(Captcha captcha)
        {
            var random = new Random();
            var selectedQuestion = SecurityQuestions[random.Next(SecurityQuestions.Count)];

            captcha.Challenge = selectedQuestion.question;
            var tempUser = new UserProfile { Id = 0 };
            captcha.Answer = _passwordHasher.HashPassword(tempUser, selectedQuestion.answer.ToLower());
        }
        #endregion

        #region Type 2: Reverse String
        private void GenerateReverseString(Captcha captcha)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            string randomString = new string(Enumerable.Range(0, 8)
                .Select(_ => chars[random.Next(chars.Length)])
                .ToArray());

            string reversed = new string(randomString.Reverse().ToArray());
            
            byte[] imageData = GenerateTextImage($"Przepisz w odwrotnej kolejnosci:\n{randomString}", 550, 220);
            captcha.Challenge = $"Przepisz w odwrotnej kolejnosci:|{Convert.ToBase64String(imageData)}";
            
            var tempUser = new UserProfile { Id = 0 };
            captcha.Answer = _passwordHasher.HashPassword(tempUser, reversed.ToLower());
        }
        #endregion

        #region Type 3: Image Question
        private void GenerateImageQuestion(Captcha captcha)
        {
            var random = new Random();
            var correctObject = ImageObjects[random.Next(ImageObjects.Count)];
            
            byte[] imageData = GenerateSimpleImage(correctObject, 300, 200);
            captcha.Challenge = $"Zidentyfikuj obiekt na obrazku:|{Convert.ToBase64String(imageData)}";

            var tempUser = new UserProfile { Id = 0 };
            captcha.Answer = _passwordHasher.HashPassword(tempUser, correctObject.ToLower());
        }

        private byte[] GenerateSimpleImage(string text, int width, int height)
        {
            using (var bitmap = new Bitmap(width, height))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.White);
                    graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                    
                    var random = new Random();
                    
                    // Losowe kszta?ty jako ozdoby
                    for (int i = 0; i < 15; i++)
                    {
                        using (var pen = new Pen(GetRandomLightColor(), 2))
                        {
                            int x1 = random.Next(width);
                            int y1 = random.Next(height);
                            int x2 = random.Next(width);
                            int y2 = random.Next(height);
                            graphics.DrawLine(pen, x1, y1, x2, y2);
                        }
                    }

                    // G?ówny tekst/obiekt
                    using (var font = new Font("Arial", 32, FontStyle.Bold))
                    {
                        var textSize = graphics.MeasureString(text, font);
                        float x = (width - textSize.Width) / 2;
                        float y = (height - textSize.Height) / 2;
                        
                        using (var brush = new SolidBrush(Color.DarkBlue))
                        {
                            graphics.DrawString(text, font, brush, x, y);
                        }
                    }

                    using (var ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
        }

        private byte[] GenerateTextImage(string text, int width, int height)
        {
            using (var bitmap = new Bitmap(width, height))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.LightYellow);
                    graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;

                    using (var font = new Font("Courier New", 16, FontStyle.Bold))
                    {
                        var textSize = graphics.MeasureString(text, font);
                        float x = Math.Max(15, (width - textSize.Width) / 2);
                        float y = Math.Max(15, (height - textSize.Height) / 2);
                        
                        using (var brush = new SolidBrush(Color.DarkRed))
                        {
                            graphics.DrawString(text, font, brush, x, y);
                        }
                    }

                    using (var ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
        }

        private Color GetRandomLightColor()
        {
            var random = new Random();
            return Color.FromArgb(random.Next(150, 220), random.Next(150, 220), random.Next(150, 220));
        }
        #endregion

        #region Type 4: Math Problem
        private void GenerateMathProblem(Captcha captcha)
        {
            var random = new Random();
            int a = random.Next(1, 20);
            int b = random.Next(1, 20);
            int operation = random.Next(0, 3);

            int result = operation switch
            {
                0 => a + b,
                1 => a - b,
                2 => a * b,
                _ => a + b
            };

            string operatorStr = operation switch
            {
                0 => "+",
                1 => "-",
                2 => "×",
                _ => "+"
            };

            byte[] imageData = GenerateMathImage($"{a} {operatorStr} {b} = ?", 350, 150);
            captcha.Challenge = $"Rozwi?? zadanie matematyczne:|{Convert.ToBase64String(imageData)}";

            var tempUser = new UserProfile { Id = 0 };
            captcha.Answer = _passwordHasher.HashPassword(tempUser, result.ToString());
        }

        private byte[] GenerateMathImage(string expression, int width, int height)
        {
            using (var bitmap = new Bitmap(width, height))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.LightBlue);
                    graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                    
                    using (var font = new Font("Arial", 36, FontStyle.Bold))
                    {
                        var textSize = graphics.MeasureString(expression, font);
                        float x = (width - textSize.Width) / 2;
                        float y = (height - textSize.Height) / 2;
                        
                        using (var brush = new SolidBrush(Color.DarkBlue))
                        {
                            graphics.DrawString(expression, font, brush, x, y);
                        }
                    }

                    using (var ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
        }
        #endregion

        #region Type 5: Image Selection
        private void GenerateImageSelection(Captcha captcha)
        {
            var random = new Random();
            var targetCategory = new[] { "samochody", "psy", "koty", "kwiaty", "ptaki" }[random.Next(5)];
            string answer = GenerateImageSelectionAnswer();

            byte[] imageData = GenerateMultipleImagesGrid(targetCategory, 450, 300);
            captcha.Challenge = $"Zaznacz wszystkie obrazki zawieraj?ce {targetCategory} (np. 1,3,5):|{Convert.ToBase64String(imageData)}";

            var tempUser = new UserProfile { Id = 0 };
            captcha.Answer = _passwordHasher.HashPassword(tempUser, answer);
        }

        private string GenerateImageSelectionAnswer()
        {
            var random = new Random();
            var selected = new List<int>();
            for (int i = 1; i <= 6; i++)
            {
                if (random.Next(2) == 0)
                    selected.Add(i);
            }
            return string.Join(",", selected.Count > 0 ? selected : new List<int> { 1, 3 });
        }

        private byte[] GenerateMultipleImagesGrid(string category, int width, int height)
        {
            using (var bitmap = new Bitmap(width, height))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.WhiteSmoke);
                    graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                    
                    int cols = 3, rows = 2;
                    int boxWidth = width / cols;
                    int boxHeight = height / rows;
                    var random = new Random();

                    for (int i = 0; i < rows; i++)
                    {
                        for (int j = 0; j < cols; j++)
                        {
                            int x = j * boxWidth;
                            int y = i * boxHeight;
                            int num = (i * cols) + j + 1;

                            // Ramka
                            graphics.DrawRectangle(Pens.DarkGray, x, y, boxWidth, boxHeight);

                            // Numer
                            using (var font = new Font("Arial", 16, FontStyle.Bold))
                            {
                                graphics.DrawString(num.ToString(), font, Brushes.Black, x + 5, y + 5);
                            }

                            // Losowe kolorowe kwadraty
                            if (random.Next(2) == 0)
                            {
                                var color = GetRandomLightColor();
                                using (var brush = new SolidBrush(color))
                                {
                                    graphics.FillRectangle(brush, x + 20, y + 40, 60, 60);
                                }
                                graphics.DrawRectangle(Pens.Black, x + 20, y + 40, 60, 60);
                            }
                            else
                            {
                                using (var font = new Font("Arial", 12))
                                {
                                    graphics.DrawString(category, font, Brushes.Blue, x + 10, y + 60);
                                }
                            }
                        }
                    }

                    using (var ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
        }
        #endregion

        #region Type 6: Image Region Selection
        private void GenerateImageRegionSelection(Captcha captcha)
        {
            var random = new Random();
            int clickX = random.Next(100, 300);
            int clickY = random.Next(100, 250);

            byte[] imageData = GenerateRegionImage("Kliknij na czerwony kwadrat", 400, 300, clickX, clickY);
            captcha.Challenge = $"Zaznacz okre?lony region (wpisz: x,y):|{Convert.ToBase64String(imageData)}";

            var tempUser = new UserProfile { Id = 0 };
            captcha.Answer = _passwordHasher.HashPassword(tempUser, $"{clickX},{clickY}");
        }

        private byte[] GenerateRegionImage(string instruction, int width, int height, int targetX, int targetY)
        {
            using (var bitmap = new Bitmap(width, height))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.LightGreen);
                    graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;

                    // Instrukcja
                    using (var font = new Font("Arial", 12, FontStyle.Bold))
                    {
                        graphics.DrawString(instruction, font, Brushes.DarkGreen, 10, 10);
                    }

                    // Losowe elementy
                    var random = new Random();
                    for (int i = 0; i < 5; i++)
                    {
                        graphics.DrawEllipse(Pens.Gray, random.Next(width - 40), random.Next(80, height - 40), 40, 40);
                    }

                    // Element docelowy
                    graphics.DrawRectangle(new Pen(Color.Red, 4), targetX - 30, targetY - 30, 60, 60);
                    using (var font = new Font("Arial", 14, FontStyle.Bold))
                    {
                        graphics.DrawString("?", font, Brushes.Red, targetX - 10, targetY - 5);
                    }

                    using (var ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
        }
        #endregion

        #region Type 7: Puzzle Matching
        private void GeneratePuzzleMatching(Captcha captcha)
        {
            var random = new Random();
            int correctOption = random.Next(1, 4);

            byte[] imageData = GeneratePuzzleImage(correctOption, 600, 250);
            captcha.Challenge = $"Wska? brakuj?cy element puzzla (1, 2 lub 3):|{Convert.ToBase64String(imageData)}";

            var tempUser = new UserProfile { Id = 0 };
            captcha.Answer = _passwordHasher.HashPassword(tempUser, correctOption.ToString());
        }

        private byte[] GeneratePuzzleImage(int correctOption, int width, int height)
        {
            using (var bitmap = new Bitmap(width, height))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.Beige);
                    graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;

                    // G?ówny puzzle
                    using (var brush = new SolidBrush(Color.YellowGreen))
                    {
                        graphics.FillRectangle(brush, 15, 40, 120, 120);
                    }
                    graphics.DrawRectangle(Pens.Black, 15, 40, 120, 120);
                    
                    using (var font = new Font("Arial", 16, FontStyle.Bold))
                    {
                        graphics.DrawString("PUZZLE", font, Brushes.White, 35, 85);
                    }

                    // Opcje
                    int boxWidth = 70;
                    int boxHeight = 70;
                    int[] xPositions = { 170, 265, 360 };

                    for (int i = 1; i <= 3; i++)
                    {
                        var brush = i == correctOption ? Brushes.LimeGreen : Brushes.LightCoral;
                        graphics.FillRectangle(brush, xPositions[i - 1], 75, boxWidth, boxHeight);
                        graphics.DrawRectangle(new Pen(Color.Black, 2), xPositions[i - 1], 75, boxWidth, boxHeight);

                        using (var font = new Font("Arial", 16, FontStyle.Bold))
                        {
                            graphics.DrawString(i.ToString(), font, Brushes.Black, xPositions[i - 1] + 23, 100);
                        }
                    }

                    using (var ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
        }
        #endregion

        #region Type 8: Audio Question
        private void GenerateAudioQuestion(Captcha captcha)
        {
            try
            {
                // ?cie?ka do plików audio
                string captchaAudioPath = Path.Combine(Directory.GetCurrentDirectory(), "Captcha");
                
                if (!Directory.Exists(captchaAudioPath))
                {
                    captchaAudioPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Captcha");
                }

                // Pobierz wszystkie pliki audio
                var audioFiles = Directory.GetFiles(captchaAudioPath, "*.mp3")
                    .Union(Directory.GetFiles(captchaAudioPath, "*.wav"))
                    .Union(Directory.GetFiles(captchaAudioPath, "*.ogg"))
                    .ToList();

                if (audioFiles.Count == 0)
                {
                    // Fallback: generuj losow? liczb? je?li brak plików
                    var random = new Random();
                    string numbers = string.Join("", Enumerable.Range(0, 4).Select(_ => random.Next(0, 10)));
                    byte[] imageData = GenerateAudioImagePlaceholder($"Pos?uchaj liczby: {numbers}", 350, 150);
                    captcha.Challenge = $"Pos?uchaj i wpisz liczb?:|{Convert.ToBase64String(imageData)}";
                    
                    var tempUser = new UserProfile { Id = 0 };
                    captcha.Answer = _passwordHasher.HashPassword(tempUser, numbers);
                    return;
                }

                // Losuj plik
                var random2 = new Random();
                string selectedAudioPath = audioFiles[random2.Next(audioFiles.Count)];
                
                // Nazwa pliku to odpowied? (bez rozszerzenia)
                string correctAnswer = Path.GetFileNameWithoutExtension(selectedAudioPath);
                
                // Wczytaj plik audio
                byte[] audioData = File.ReadAllBytes(selectedAudioPath);
                string audioBase64 = Convert.ToBase64String(audioData);
                
                // Pobierz mimeType na podstawie rozszerzenia
                string extension = Path.GetExtension(selectedAudioPath).ToLower();
                string mimeType = extension switch
                {
                    ".mp3" => "audio/mpeg",
                    ".wav" => "audio/wav",
                    ".ogg" => "audio/ogg",
                    _ => "audio/mpeg"
                };

                captcha.Challenge = $"Pos?uchaj liczby i wpisz j?:|data:{mimeType};base64,{audioBase64}";

                var tempUser2 = new UserProfile { Id = 0 };
                captcha.Answer = _passwordHasher.HashPassword(tempUser2, correctAnswer);
            }
            catch (Exception ex) when (ex is not OutOfMemoryException) {
                // Fallback na wypadek b??du generacji audio
                var random = new Random();
                string numbers = string.Join("", Enumerable.Range(0, 4).Select(_ => random.Next(0, 10)));
                byte[] imageData = GenerateAudioImagePlaceholder($"Pos?uchaj liczby: {numbers}", 350, 150);
                captcha.Challenge = $"Pos?uchaj i wpisz liczb?:|{Convert.ToBase64String(imageData)}";
                
                var tempUser = new UserProfile { Id = 0 };
                captcha.Answer = _passwordHasher.HashPassword(tempUser, numbers);
            }
        }

        private byte[] GenerateAudioImagePlaceholder(string text, int width, int height)
        {
            using (var bitmap = new Bitmap(width, height))
            {
                using (var graphics = Graphics.FromImage(bitmap))
                {
                    graphics.Clear(Color.LavenderBlush);
                    graphics.SmoothingMode = SmoothingMode.AntiAlias;

                    // Ikona g?o?nika (proste reprezentacja)
                    graphics.DrawEllipse(Pens.Purple, 60, 40, 50, 50);
                    graphics.DrawEllipse(Pens.Purple, 75, 55, 80, 80);

                    using (var font = new Font("Arial", 14, FontStyle.Bold))
                    {
                        graphics.DrawString("?? AUDIO", font, Brushes.Purple, 50, 20);
                        graphics.DrawString(text, font, Brushes.Black, 20, 130);
                    }

                    using (var ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
        }
        #endregion
    }
}
