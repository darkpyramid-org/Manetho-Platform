"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Layers, MapPin } from "lucide-react";
import type {
  Artifact,
  Museum,
  MuseumFloor,
} from "@/types/museum";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Interactive museum floor plan (spec §14).
 *
 * Room and object coordinates use Manetho's own 0–1000 plan
 * space, deliberately decoupled from any geo coordinate
 * system: the same plan can be rendered as SVG (here),
 * GeoJSON for indoor positioning, or BLE/UWB beacons later
 * without changing the stored data.
 */
export function MuseumFloorPlan({
  museum,
  artifacts,
  initialFloorLevel,
  onArtifactSelect,
}: {
  museum: Museum;
  artifacts: Artifact[];
  initialFloorLevel?: number;
  onArtifactSelect?: (artifactId: string) => void;
}) {
  const t = useTranslations("museums");
  const levels = museum.floors.map((floor) => floor.level);
  const [level, setLevel] = useState(
    initialFloorLevel ?? levels[0] ?? 0,
  );
  const [showRooms, setShowRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const floor: MuseumFloor | undefined = useMemo(
    () => museum.floors.find((entry) => entry.level === level),
    [museum.floors, level],
  );

  // Objects are placed at the centre of the room that holds them.
  const markers = useMemo(() => {
    if (!floor) return [];
    const roomIds = new Set(floor.rooms.map((room) => room.id));
    return artifacts
      .filter((artifact) =>
        artifact.locationRoomId
          ? roomIds.has(artifact.locationRoomId)
          : false,
      )
      .map((artifact) => {
        const room = floor.rooms.find(
          (entry) => entry.id === artifact.locationRoomId,
        );
        if (!room) return null;
        return {
          artifact,
          x: room.x + room.width / 2,
          y: room.y + room.height / 2,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [artifacts, floor]);

  const roomArtifacts = useMemo(() => {
    if (!selectedRoomId) return [];
    return artifacts.filter(
      (artifact) => artifact.locationRoomId === selectedRoomId,
    );
  }, [artifacts, selectedRoomId]);

  if (!floor) {
    return (
      <p className="text-sm text-sandstone/70">
        {t("noObjects")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {museum.floors.length > 1 ? (
          <div
            role="group"
            aria-label={t("selectFloor")}
            className="inline-flex rounded-md border border-ash p-0.5"
          >
            {museum.floors.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setLevel(entry.level);
                  setSelectedRoomId(null);
                }}
                aria-pressed={entry.level === level}
                className={cn(
                  "rounded px-3 py-1.5 text-xs transition-colors",
                  entry.level === level
                    ? "bg-gold text-obsidian font-medium"
                    : "text-sandstone hover:text-papyrus",
                )}
              >
                {entry.name}
              </button>
            ))}
          </div>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          aria-pressed={showRooms}
          onClick={() => setShowRooms((value) => !value)}
          className="gap-1.5"
        >
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {t("showRooms")}
        </Button>
      </div>

      {/* Plan */}
      <div className="relative overflow-hidden rounded-lg border border-ash/70 bg-obsidian">
        <svg
          viewBox={`0 0 ${floor.planWidth} ${floor.planHeight}`}
          className="h-auto w-full touch-manipulation"
          role="img"
          aria-label={`${museum.name} — ${floor.name}`}
        >
          <defs>
            <pattern
              id="plan-grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M50 0H0V50"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect
            width={floor.planWidth}
            height={floor.planHeight}
            fill="url(#plan-grid)"
          />

          {/* Rooms */}
          {floor.rooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const isAccessible = room.accessibility;
            return (
              <g key={room.id}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  rx={6}
                  fill={isSelected ? "rgba(201,162,39,0.16)" : "rgba(30,30,40,0.85)"}
                  stroke={
                    isSelected
                      ? "#c9a227"
                      : isAccessible
                        ? "rgba(201,185,155,0.28)"
                        : "rgba(196,69,62,0.4)"
                  }
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  className="cursor-pointer transition-colors"
                  onClick={() =>
                    setSelectedRoomId(isSelected ? null : room.id)
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={`${room.name}${isAccessible ? "" : " — not step-free"}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedRoomId(isSelected ? null : room.id);
                    }
                  }}
                />
                {showRooms ? (
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + 16}
                    textAnchor="middle"
                    fill="#c9b99b"
                    fillOpacity="0.75"
                    fontSize="13"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {room.name.length > 34
                      ? `${room.name.slice(0, 33)}…`
                      : room.name}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Theme zones */}
          {floor.zones.map((zone) => (
            <polygon
              key={zone.id}
              points={zone.polygon
                .map((point) => `${point.x},${point.y}`)
                .join(" ")}
              fill="rgba(201,162,39,0.05)"
              stroke="rgba(201,162,39,0.35)"
              strokeDasharray="8 6"
              strokeWidth="1.5"
              className="pointer-events-none"
            />
          ))}

          {/* Object markers */}
          {markers.map(({ artifact, x, y }) => (
            <g
              key={artifact.id}
              className="cursor-pointer"
              onClick={() => onArtifactSelect?.(artifact.id)}
              role="button"
              tabIndex={0}
              aria-label={artifact.name}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onArtifactSelect?.(artifact.id);
                }
              }}
            >
              <circle
                cx={x}
                cy={y}
                r={13}
                fill="rgba(9,9,13,0.9)"
                stroke="#c9a227"
                strokeWidth="1.6"
              />
              <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                fontSize="13"
                fill="#c9a227"
                className="pointer-events-none select-none"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {artifact.inventoryNumber.replace(/[^0-9]/g, "").slice(-2) ||
                  "•"}
              </text>
            </g>
          ))}
        </svg>

        <p className="absolute bottom-2 end-3 rounded bg-obsidian/80 px-2 py-1 text-[0.65rem] text-sandstone/60">
          0–1000 plan space · {floor.name}
        </p>
      </div>

      {/* Selected room contents */}
      {selectedRoomId ? (
        <div className="rounded-lg border border-gold/30 bg-charcoal p-4">
          <h3 className="flex items-center gap-2 font-display text-base text-papyrus">
            <MapPin className="h-4 w-4 text-gold" aria-hidden="true" />
            {floor.rooms.find((room) => room.id === selectedRoomId)?.name}
          </h3>
          {roomArtifacts.length === 0 ? (
            <p className="mt-2 text-sm text-sandstone/70">
              {t("noObjects")}
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {roomArtifacts.map((artifact) => (
                <li key={artifact.id}>
                  <Badge tone="neutral">{artifact.name}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}