import { useRef, useState } from "react";

type Sound = { id: number; name: string; filename: string; uploaded_by: string };

type Props = {
  sounds: Sound[];
  currentUser: string;
  onPlay: (filename: string) => void;
  onAdd: (name: string, file: File) => void;
  onDelete: (id: number) => void;
};

export const SoundBoard = (props: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="sound-grid">
        {props.sounds.map((sound) => (
          <div key={sound.id} className="sound-card">
            <button
              className="sound-button"
              onClick={() => props.onPlay(sound.filename)}
            >
              {sound.name}
            </button>
            <div className="sound-meta">
              <span className="sound-author">by {sound.uploaded_by}</span>
              {sound.uploaded_by === props.currentUser && (
                <button
                  className="sound-delete"
                  onClick={() => props.onDelete(sound.id)}
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <form
          className="add-sound-form"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = (formData.get("name") as string).trim();
            const file = fileRef.current?.files?.[0];
            if (name && file) {
              props.onAdd(name, file);
              setAdding(false);
            }
          }}
        >
          <input type="text" name="name" placeholder="Sound name" required autoFocus />
          <input ref={fileRef} type="file" accept=".mp3,.wav,.ogg" required />
          <div className="add-sound-actions">
            <button type="submit">Upload</button>
            <button type="button" className="cancel-button" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-sound-button" onClick={() => setAdding(true)}>
          + Add Sound
        </button>
      )}
    </div>
  );
};
