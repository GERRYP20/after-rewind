"use client";

import { useState, FormEvent } from "react";
import { Comment } from "@/lib/comments/comment.types";

interface CommentFormProps {
  eventId: string;
  onCommentAdded: (comment: Comment) => void;
}

export default function CommentForm({ eventId, onCommentAdded }: CommentFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar comentario");
      }

      const data = await res.json();
      const newComment: Comment = {
        id: data.id,
        eventId,
        userName: "Tú",
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      onCommentAdded(newComment);
      setText("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un comentario..."
          disabled={loading}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "14px 16px",
            backgroundColor: "#09090b",
            border: "1px solid #3f3f46",
            borderRadius: "12px",
            color: "white",
            fontSize: "14px",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#E0B046")}
          onBlur={(e) => (e.target.style.borderColor = "#3f3f46")}
        />
        <button
          type="submit"
          disabled={!text.trim() || loading}
          style={{
            alignSelf: "flex-end",
            padding: "10px 24px",
            borderRadius: "10px",
            backgroundColor: loading ? "#52525b" : "#E0B046",
            border: "none",
            color: loading ? "#a1a1aa" : "#09090b",
            fontSize: "13px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            if (!loading && text.trim()) {
              e.currentTarget.style.backgroundColor = "#c99a2e";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#E0B046";
            }
          }}
        >
          {loading ? "Enviando..." : "Comentar"}
        </button>
      </div>
    </form>
  );
}