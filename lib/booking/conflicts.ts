import { normalizeTimeHHMM, timeToMinutes } from "@/lib/format/date";

export type OccupiedInterval = {
  stylistId: string;
  startTime: string;
  reservedDurationMinutes: number;
};

function normalizeInterval(item: OccupiedInterval): OccupiedInterval {
  return {
    ...item,
    startTime: normalizeTimeHHMM(item.startTime),
  };
}

function intervalEnd(item: OccupiedInterval) {
  return timeToMinutes(item.startTime) + item.reservedDurationMinutes;
}

/** Half-open overlap: [start, start + duration). Same stylist only. */
export function intervalsOverlap(
  a: OccupiedInterval,
  b: OccupiedInterval,
) {
  const left = normalizeInterval(a);
  const right = normalizeInterval(b);
  if (left.stylistId !== right.stylistId) return false;
  const aStart = timeToMinutes(left.startTime);
  const bStart = timeToMinutes(right.startTime);
  return aStart < intervalEnd(right) && bStart < intervalEnd(left);
}

export function findConflicts(
  candidate: OccupiedInterval,
  occupied: OccupiedInterval[],
) {
  return occupied.filter((item) => intervalsOverlap(candidate, item));
}

export function findDraftLineConflicts(lines: OccupiedInterval[]) {
  const conflicts: Array<[number, number]> = [];
  for (let i = 0; i < lines.length; i += 1) {
    for (let j = i + 1; j < lines.length; j += 1) {
      if (intervalsOverlap(lines[i], lines[j])) {
        conflicts.push([i, j]);
      }
    }
  }
  return conflicts;
}
