import { useCallback, useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
  type LocalAudioTrack,
} from "livekit-client";

type Props = {
  token: string;
  livekitUrl: string;
  onLeave: () => void;
};

export const VoiceChat = (props: Props) => {
  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);

  const updateParticipants = useCallback((room: Room) => {
    const names = Array.from(room.remoteParticipants.values()).map(
      (p) => p.identity
    );
    setParticipants(names);
  }, []);

  useEffect(() => {
    const room = new Room();
    roomRef.current = room;

    room.on(RoomEvent.ParticipantConnected, () => updateParticipants(room));
    room.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(room));

    room.on(
      RoomEvent.TrackSubscribed,
      (track, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.id = `audio-${track.sid}`;
          document.body.appendChild(el);
        }
      }
    );

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((el) => el.remove());
    });

    room
      .connect(props.livekitUrl, props.token)
      .then(async () => {
        setConnected(true);
        updateParticipants(room);
        const track = await createLocalAudioTrack();
        localTrackRef.current = track;
        await room.localParticipant.publishTrack(track);
      })
      .catch((err) => {
        console.error("Failed to connect to voice:", err);
      });

    return () => {
      localTrackRef.current?.stop();
      room.disconnect();
    };
  }, [props.livekitUrl, props.token, updateParticipants]);

  const toggleMute = () => {
    const track = localTrackRef.current;
    if (!track) return;
    if (muted) {
      track.unmute();
    } else {
      track.mute();
    }
    setMuted(!muted);
  };

  return (
    <div className="voice-chat">
      <div className="voice-header">
        <span className="voice-status">
          {connected ? `Voice (${participants.length + 1})` : "Connecting..."}
        </span>
        <div className="voice-controls">
          <button
            className={`voice-button ${muted ? "voice-muted" : ""}`}
            onClick={toggleMute}
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          <button className="voice-button voice-leave" onClick={props.onLeave}>
            Leave
          </button>
        </div>
      </div>
      {participants.length > 0 && (
        <div className="voice-participants">
          {participants.map((name) => (
            <span key={name} className="voice-participant">
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
