/**
 * ChatComposer — text + file input bar at the bottom of /chat.
 * Integrates ModeKnob (left) + SendKnob (right) + textarea (center).
 * Based on prototype V6 from KLERIO_BRONZE_BULLE_LIBRE.html
 * DEBUG MODE ACTIVE
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { ModeKnob } from "./ModeKnob";
import { SendKnob } from "./SendKnob";
import type { ChatMode } from "@/types/klerio";
import { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_SEND } from "@/types/klerio";

export interface ComposerSubmitPayload {
  text: string;
  files: File[];
  mode: ChatMode;
}

interface ChatComposerProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onSubmit: (payload: ComposerSubmitPayload) => void;
  /** Disable the composer while a response is streaming */
  disabled?: boolean;
}

export function ChatComposer({
  mode,
  onModeChange,
  onSubmit,
  disabled = false,
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const canSend = !disabled && (text.trim().length > 0 || files.length > 0);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSubmit({ text: text.trim(), files, mode });
    setText("");
    setFiles([]);
    setFileError(null);
  }, [canSend, text, files, mode, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileError(null);
      const selected = Array.from(e.target.files ?? []);
      if (selected.length + files.length > MAX_FILES_PER_SEND) {
        setFileError(`Maximum ${MAX_FILES_PER_SEND} fichiers par envoi.`);
        return;
      }
      const tooLarge = selected.find((f) => f.size > MAX_FILE_SIZE_BYTES);
      if (tooLarge) {
        setFileError(`Fichier trop volumineux (max 20 Mo) : ${tooLarge.name}`);
        return;
      }
      setFiles((prev) => [...prev, ...selected]);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [files.length],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div
      role="group"
      aria-label="Zone de composition"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "10px 12px",
        background: "oklch(0.32 0.075 49)",
        borderTop: "1px solid oklch(0.45 0.075 49)",
        flexShrink: 0,
      }}
    >
      {/* File list */}
      {files.length > 0 && (
        <ul
          aria-label="Fichiers joints"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {files.map((f, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "oklch(0.28 0.075 49)",
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 12,
                color: "#fff3df",
              }}
            >
              {f.name}
              <button
                type="button"
                aria-label={`Retirer ${f.name}`}
                onClick={() => removeFile(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e0c6aa",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Error message */}
      {fileError && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: "#e07070" }}>
          {fileError}
        </p>
      )}

      {/* Input row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <ModeKnob mode={mode} onChange={onModeChange} />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            mode === "voice"
              ? "Mode vocal — appuyez sur Envoyer pour parler…"
              : mode === "memory"
                ? "Cherchez dans vos documents…"
                : "Écrivez un message… (Entrée pour envoyer)"
          }
          aria-label="Message à envoyer"
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            background: "oklch(0.28 0.075 49)",
            border: "1px solid oklch(0.50 0.075 49)",
            borderRadius: 12,
            padding: "10px 14px",
            color: "#fff3df",
            fontSize: 15,
            lineHeight: 1.5,
            outline: "none",
            fontFamily: "inherit",
            overflowY: "hidden",
            minHeight: 44,
          }}
        />

        {/* Attach file */}
        <label
          htmlFor="composer-file-input"
          title="Joindre des fichiers (max 20 Mo × 10)"
          style={{
            cursor: "pointer",
            fontSize: 20,
            color: "#cd7f32",
            lineHeight: 1,
            paddingBottom: 12,
            userSelect: "none",
          }}
          aria-label="Joindre des fichiers"
        >
          📎
          <input
            id="composer-file-input"
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.docx,.xlsx,.txt,.json,.csv"
            onChange={handleFileChange}
            disabled={disabled}
            style={{ display: "none" }}
          />
        </label>

        <div style={{ paddingBottom: 12 }}>
          <SendKnob onSend={handleSend} disabled={!canSend} />
        </div>
      </div>
    </div>
  );
}
