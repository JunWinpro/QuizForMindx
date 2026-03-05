import React from "react";

interface DueCardsBadgeProps {
  count: number;
  size?: "sm" | "md";
}

/**
 * DueCardsBadge
 * Badge đỏ hiển thị số từ cần ôn hôm nay.
 * Dùng trên Navbar và DeckCard.
 */
export default function DueCardsBadge({ count, size = "md" }: DueCardsBadgeProps) {
  if (count <= 0) return null;

  const isSmall = size === "sm";

  return (
    <span
      title={`${count} từ cần ôn hôm nay`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: isSmall ? 16 : 20,
        height:   isSmall ? 16 : 20,
        padding:  isSmall ? "0 4px" : "0 6px",
        borderRadius: 99,
        background: "#FF6B6B",
        color: "white",
        fontSize: isSmall ? 10 : 11,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}