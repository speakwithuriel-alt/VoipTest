import React, { useState, useRef } from "react";
import "./App.css";

const WEBHOOK_URL = "https://uriel23151.app.n8n.cloud/webhook/5dcf01bd-935f-4232-a0a5-04b0e3067cda";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        setRecordedBlob(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Microphone access failed. Please allow microphone permission.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send recorded audio to webhook
  const sendRecording = async () => {
    if (!recordedBlob) {
      alert("No recording available to send!");
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append("file", recordedBlob, "recording.webm");

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to send audio to webhook");

      const responseBlob = await response.blob();
      const audioUrl = URL.createObjectURL(responseBlob);
      setAudioURL(audioUrl);

      // Auto play response
      const audio = new Audio(audioUrl);
      audio.play();

    } catch (error) {
      console.error("Error sending audio:", error);
      alert("Error sending or receiving audio from server.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="recorder-container">
      <h2>🎤 Voice Recorder</h2>

      <div className="controls">
        {!isRecording ? (
          <button className="record-btn" onClick={startRecording}>
            Start Recording
          </button>
        ) : (
          <button className="stop-btn" onClick={stopRecording}>
            Stop Recording
          </button>
        )}
      </div>

      {recordedBlob && (
        <div className="controls">
          <button
            className="send-btn"
            onClick={sendRecording}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send to Server"}
          </button>
        </div>
      )}

      {audioURL && (
        <div className="player">
          <h3>Response Audio:</h3>
          <audio controls src={audioURL}></audio>
        </div>
      )}
    </div>
  );
}
