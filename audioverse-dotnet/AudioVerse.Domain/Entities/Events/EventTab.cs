namespace AudioVerse.Domain.Entities.Events
{
    /// <summary>
    /// Tab (zakładka) widoczna na stronie eventu.
    /// Organizator może kontrolować które taby widzą uczestnicy, a które goście.
    /// </summary>
    public class EventTab
    {
        public int Id { get; set; }
        public int EventId { get; set; }

        /// <summary>Nazwa taba wyświetlana w UI (np. "Harmonogram", "Menu", "Zdjęcia").</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Klucz identyfikujący typ taba (np. "schedule", "menu", "photos", "custom").</summary>
        public string Key { get; set; } = string.Empty;

        /// <summary>Ikona taba (emoji lub nazwa ikony).</summary>
        public string? Icon { get; set; }

        /// <summary>Kolejność wyświetlania (niższe = wcześniej).</summary>
        public int SortOrder { get; set; }

        /// <summary>Czy tab jest widoczny dla organizatora.</summary>
        public bool VisibleOrganizer { get; set; } = true;

        /// <summary>Czy tab jest widoczny dla uczestników eventu.</summary>
        public bool VisibleParticipant { get; set; } = true;

        /// <summary>Czy tab jest widoczny dla gości (niezalogowani / bez RSVP).</summary>
        public bool VisibleGuest { get; set; }

        /// <summary>Czy tab jest aktywny (soft-disable bez usuwania).</summary>
        public bool IsEnabled { get; set; } = true;
    }
}
