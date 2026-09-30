"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechLanguage } from "@/lib/types";
import { api } from "@/lib/api";

const MAX_RECORDING_MS = 28_000;

function joinTranscript(base: string, next: string): string {
  const a = base.trim();
  const b = next.trim();
  if (!a) return b;
  if (!b) return a;
  if (a.toLowerCase().endsWith(b.toLowerCase())) return a;
  if (b.toLowerCase().startsWith(a.toLowerCase())) return b;
  return `${a} ${b}`;
}

function preferredMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function baseMime(mime: string): string {
  return mime.split(";")[0]?.trim() || "audio/webm";
}

export function useSpeechRecognition(language: SpeechLanguage) {
  const [transcript, setTranscriptState] = useState("");
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");

  const languageRef = useRef(language);
  const transcriptRef = useRef("");
  const sessionBaseRef = useRef("");
  const listeningRef = useRef(false);
  const transcribingRef = useRef(false);
  const epochRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef("");
  const timerRef = useRef<number | null>(null);
  const stopPromiseRef = useRef<Promise<string> | null>(null);
  const discardRef = useRef(false);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const ok =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";
    setSupported(ok);
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const applyTranscript = useCallback((value: string) => {
    transcriptRef.current = value;
    sessionBaseRef.current = value;
    setTranscriptState(value);
  }, []);

  const stop = useCallback(
    (options?: { discard?: boolean }) => {
      if (options?.discard) discardRef.current = true;
      if (stopPromiseRef.current) return stopPromiseRef.current;

      const recorder = recorderRef.current;
      const discard = options?.discard ?? false;

      if (!recorder || recorder.state === "inactive") {
        discardRef.current = false;
        listeningRef.current = false;
        setListening(false);
        clearTimer();
        releaseStream();
        return Promise.resolve(transcriptRef.current);
      }

      const promise = new Promise<string>((resolve) => {
        recorder.onstop = () => {
          stopPromiseRef.current = null;
          recorderRef.current = null;
          listeningRef.current = false;
          setListening(false);
          clearTimer();
          releaseStream();

          const chunks = chunksRef.current;
          chunksRef.current = [];

          if (discard || discardRef.current) {
            discardRef.current = false;
            resolve(transcriptRef.current);
            return;
          }

          const mime = baseMime(mimeRef.current || "audio/webm");
          const blob = new Blob(chunks, { type: mime });
          if (blob.size < 800) {
            setError("Didn't catch that. Speak a little longer, then tap mic off.");
            resolve(transcriptRef.current);
            return;
          }

          transcribingRef.current = true;
          setTranscribing(true);
          setError("");

          const file = new File([blob], `speech.${extensionFor(mime)}`, {
            type: mime,
          });

          api
            .transcribe(file, languageRef.current)
            .then((result) => {
              if (discardRef.current) {
                discardRef.current = false;
                resolve(transcriptRef.current);
                return;
              }
              const next = joinTranscript(
                sessionBaseRef.current,
                result.transcript,
              );
              applyTranscript(next);
              resolve(next);
            })
            .catch((err: unknown) => {
              const message =
                err instanceof Error ? err.message : "Couldn't transcribe speech";
              setError(message);
              resolve(transcriptRef.current);
            })
            .finally(() => {
              transcribingRef.current = false;
              setTranscribing(false);
            });
        };

        try {
          recorder.stop();
        } catch {
          stopPromiseRef.current = null;
          listeningRef.current = false;
          setListening(false);
          clearTimer();
          releaseStream();
          resolve(transcriptRef.current);
        }
      });

      stopPromiseRef.current = promise;
      return promise;
    },
    [applyTranscript, clearTimer, releaseStream],
  );

  const start = useCallback(
    async (options?: { fresh?: boolean }) => {
      if (!supported || transcribingRef.current) return;

      const epoch = ++epochRef.current;
      if (listeningRef.current) {
        await stop({ discard: true });
      }
      if (epoch !== epochRef.current) return;

      const fresh = options?.fresh ?? false;
      if (fresh) {
        applyTranscript("");
        sessionBaseRef.current = "";
      } else {
        sessionBaseRef.current = transcriptRef.current;
      }

      setError("");

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
      } catch {
        setError("Allow microphone access to speak a lead.");
        return;
      }

      if (epoch !== epochRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const mime = preferredMime();
      let recorder: MediaRecorder;
      try {
        recorder = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);
      } catch {
        stream.getTracks().forEach((track) => track.stop());
        setError("This browser can't record audio. Type the lead instead.");
        return;
      }

      mimeRef.current = recorder.mimeType || mime || "audio/webm";
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      try {
        recorder.start(250);
      } catch {
        recorder.start();
      }
      listeningRef.current = true;
      setListening(true);

      timerRef.current = window.setTimeout(() => {
        void stop();
      }, MAX_RECORDING_MS);
    },
    [applyTranscript, stop, supported],
  );

  const setTranscript = useCallback(
    (value?: string) => {
      if (value === undefined) {
        applyTranscript("");
        return;
      }
      applyTranscript(value);
    },
    [applyTranscript],
  );

  const clearError = useCallback(() => setError(""), []);

  useEffect(() => {
    return () => {
      epochRef.current += 1;
      clearTimer();
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        try {
          recorder.stop();
        } catch {
          // ignore
        }
      }
      releaseStream();
    };
  }, [clearTimer, releaseStream]);

  return {
    transcript,
    listening,
    transcribing,
    supported,
    error,
    clearError,
    start,
    stop,
    setTranscript,
  };
}
