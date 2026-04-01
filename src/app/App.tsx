import { useCallback, useEffect, useRef, useState } from "react";
import { Login } from "./components/Login";
import { SoundBoard } from "./components/SoundBoard";
import { VoiceChat } from "./components/VoiceChat";
import "./index.css";

type Sound = {
  id: number;
  name: string;
  filename: string;
  uploaded_by: string;
};
type WsEvent =
  | { type: "play"; sound: string; from: string }
  | { type: "system"; text: string };

export function App() {
  const wsRef = useRef<WebSocket | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [name, setName] = useState<string | null>(() =>
    localStorage.getItem("name"),
  );
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [voiceToken, setVoiceToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string>("");

  const fetchSounds = useCallback(() => {
    fetch("/api/sounds")
      .then((r) => r.json())
      .then(setSounds);
  }, []);

  useEffect(() => {
    if (!token) return;

    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }).then(
      (r) => {
        if (!r.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("name");
          setToken(null);
          setName(null);
          return;
        }
        return r.json().then((data) => setName(data.name));
      },
    );
  }, [token]);

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  useEffect(() => {
    if (!token) return;

    const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${wsProto}://${window.location.host}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data: WsEvent = JSON.parse(event.data);

      if (data.type === "play") {
        const audio = new Audio(`/sounds/${data.sound}`);
        audio.play();
        setLog((prev) => [...prev, `${data.from} played ${data.sound}`]);
      } else if (data.type === "system") {
        setLog((prev) => [...prev, data.text]);
      }
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const handleLogin = (newToken: string, userName: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("name", userName);
    setToken(newToken);
    setName(userName);
  };

  const handleLogout = () => {
    if (token) {
      fetch("/api/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    wsRef.current?.close();
    setToken(null);
    setName(null);
    setLog([]);
  };

  const handleJoinVoice = async () => {
    try {
      const res = await fetch("/api/voice/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room: "main" }),
      });
      if (!res.ok) {
        console.error("Voice token failed:", res.status, await res.text());
        return;
      }
      const data = await res.json();
      setVoiceToken(data.token);
      setLivekitUrl(data.livekitUrl);
    } catch (err) {
      console.error("Voice join error:", err);
    }
  };

  const handleLeaveVoice = () => {
    setVoiceToken(null);
  };

  const handlePlaySound = (filename: string) => {
    wsRef.current?.send(JSON.stringify({ type: "play", sound: filename }));
  };

  const handleAddSound = async (soundName: string, file: File) => {
    const formData = new FormData();
    formData.append("name", soundName);
    formData.append("file", file);

    const res = await fetch("/api/sounds", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const updated = await res.json();
      setSounds(updated);
    }
  };

  const handleDeleteSound = async (id: number) => {
    const res = await fetch(`/api/sounds/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const updated = await res.json();
      setSounds(updated);
    }
  };

  if (!token || !name) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sound Chat</h1>
        <div className="user-info">
          <span>{name}</span>
          <button onClick={handleLogout} className="logout-button">
            Log out
          </button>
        </div>
      </header>
      {voiceToken ? (
        <VoiceChat
          token={voiceToken}
          livekitUrl={livekitUrl}
          onLeave={handleLeaveVoice}
        />
      ) : (
        <button className="join-voice-button" onClick={handleJoinVoice}>
          Join Voice
        </button>
      )}
      <SoundBoard
        sounds={sounds}
        currentUser={name}
        onPlay={handlePlaySound}
        onAdd={handleAddSound}
        onDelete={handleDeleteSound}
      />
      <div className="log">
        {log.map((entry, i) => (
          <div key={i} className="log-entry">
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
