import React from "react";

interface CaptchaComponentProps {
  challenge: string;
  type: number;
  onAnswer: (answer: string) => void;
  answer: string;
  media?: string;
  mediaType?: string;
}

const CaptchaComponent: React.FC<CaptchaComponentProps> = ({ challenge, type: _type, onAnswer, answer, media, mediaType }) => {
  // Recognizing challenge from base64 media in challenge string (e.g. "Pytanie:|data:image/png;base64,...")
  let parsedChallenge = challenge;
  let parsedMedia: string | undefined = media;
  let parsedMediaType: string | undefined = mediaType;
  if (!media && challenge && challenge.includes('|')) {
    const [text, mediaStr] = challenge.split('|');
    parsedChallenge = text;
    if (mediaStr?.startsWith('data:image')) {
      parsedMedia = mediaStr;
      parsedMediaType = 'image';
    } else if (mediaStr?.startsWith('data:audio')) {
      parsedMedia = mediaStr;
      parsedMediaType = 'audio';
    }
  }
  return (
    <div style={{ margin: "16px 0" }}>
      {/* Challenge text always on top */}
      <div style={{ color: "#fff", fontWeight: 500, marginBottom: 8 }}>{parsedChallenge}</div>
      {/* Media if present */}
      {parsedMediaType === 'audio' && parsedMedia && (
        <audio controls src={parsedMedia} style={{ display: "block", margin: "0 auto 12px" }} />
      )}
      {parsedMediaType === 'image' && parsedMedia && (
        <img src={parsedMedia} alt="captcha" style={{ display: "block", margin: "0 auto 12px", maxWidth: 240, maxHeight: 120, border: "2px solid #fff", borderRadius: 8 }} />
      )}
      {/* Pole odpowiedzi */}
      <input
        type="text"
        value={answer}
        onChange={e => onAnswer(e.target.value)}
        placeholder={parsedMediaType === 'audio' ? "Przepisz dźwięk lub liczbę" : parsedMediaType === 'image' ? "Wpisz odpowiedź z obrazka lub regionu" : "Wpisz odpowiedź"}
        style={{ fontSize: 18, width: 220 }}
      />
    </div>
  );
};

export default CaptchaComponent;
