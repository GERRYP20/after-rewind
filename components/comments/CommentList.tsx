"use client";

import { Comment } from "@/lib/comments/comment.types";

interface CommentListProps {
  comments: Comment[];
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: "#52525b",
        }}
      >
        <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>💬</span>
        <p style={{ margin: 0, fontSize: "14px" }}>Aún no hay comentarios. Sé el primero en opinar.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {comments.map((comment) => (
        <div
          key={comment.id}
          style={{
            backgroundColor: "#09090b",
            border: "1px solid #27272a",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                color: "#E0B046",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {comment.userName}
            </span>
            <span
              style={{
                color: "#52525b",
                fontSize: "11px",
              }}
            >
              {formatDate(comment.createdAt || "")}
            </span>
          </div>
          <p
            style={{
              color: "#e4e4e7",
              fontSize: "14px",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {comment.text}
          </p>
        </div>
      ))}
    </div>
  );
}