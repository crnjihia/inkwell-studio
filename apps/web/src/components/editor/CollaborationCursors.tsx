"use client";

import React from "react";
import type { UserPresence } from "@/lib/yjs-provider";
import { Users, Wifi, WifiOff } from "lucide-react";

interface CollaborationCursorsProps {
  activeUsers: UserPresence[];
  isConnected: boolean;
  currentUserId?: string;
  language: "en" | "sw";
}

export function CollaborationCursors({
  activeUsers,
  isConnected,
  currentUserId,
  language,
}: CollaborationCursorsProps) {
  const isSwahili = language === "sw";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-2">
      {/* WebSocket connection status indicator */}
      <div
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
          isConnected
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60"
        }`}
        title={
          isConnected
            ? isSwahili
              ? "Umeunganishwa na DocumentRoom Durable Object"
              : "Connected to DocumentRoom Durable Object"
            : isSwahili
              ? "Mawasiliano yanakatika, unahariri bila mtandao"
              : "Reconnecting, editing offline"
        }
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="hidden sm:inline">
              {isSwahili ? "Mbashara" : "Live"}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 animate-pulse" />
            <span className="hidden sm:inline">
              {isSwahili ? "Bila Mtandao" : "Offline"}
            </span>
          </>
        )}
      </div>

      {/* Collaborator Avatars */}
      <div className="flex -space-x-1.5 overflow-hidden">
        {activeUsers.slice(0, 5).map((user, idx) => {
          const isSelf = user.userId === currentUserId;
          return (
            <div
              key={`${user.userId}-${idx}`}
              className="relative inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs ring-2 ring-white dark:ring-zinc-950"
              style={{ backgroundColor: user.color || "#4f46e5" }}
              title={`${user.name} ${isSelf ? "(You)" : ""}`}
            >
              {getInitials(user.name)}
              {isSelf && (
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-zinc-950" />
              )}
            </div>
          );
        })}

        {activeUsers.length > 5 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-950">
            +{activeUsers.length - 5}
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        <Users className="h-3.5 w-3.5" />
        <span>
          {activeUsers.length} {isSwahili ? "wanashirikiana" : "collaborating"}
        </span>
      </div>
    </div>
  );
}
