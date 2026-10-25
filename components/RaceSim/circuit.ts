export type Point = {
  x: number;
  y: number;
};

export type TrackSample = Point & {
  distance: number;
};

export type TrackCorner = {
  index: number;
  severity: number;
};

export type TrackSpeedPoint = {
  index: number;
  targetSpeed: number;
};

// "monza"
export const TRACK_POINTS: Point[] = [
  { x: 0.48, y: 0.86 },
  { x: 0.9, y: 0.78 },
  { x: 0.9, y: 0.5 },
  { x: 0.3, y: 0.7 },
  { x: 0.35, y: 0.4 },
  { x: 0.1, y: 0.3 },
  { x: 0.12, y: 0.78 },
];


export function sampleCircuit(stepsPerSegment = 20): TrackSample[] {
  const points = TRACK_POINTS;
  const samples: TrackSample[] = [];

  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];

    for (let step = 0; step < stepsPerSegment; step++) {
      const t = step / stepsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      const interpolate = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b +
          (-a + c) * t +
          (2 * a - 5 * b + 4 * c - d) * t2 +
          (-a + 3 * b - 3 * c + d) * t3);

      samples.push({
        x: interpolate(p0.x, p1.x, p2.x, p3.x),
        y: interpolate(p0.y, p1.y, p2.y, p3.y),
        distance: 0,
      });
    }
  }

  let distance = 0;

  for (let i = 0; i < samples.length; i++) {
    if (i > 0) {
      const dx = samples[i].x - samples[i - 1].x;
      const dy = samples[i].y - samples[i - 1].y;
      distance += Math.hypot(dx, dy);
    }

    samples[i].distance = distance;
  }

  return samples;
}

export function getCircuitLength(samples: TrackSample[]): number {
  if (samples.length < 2) return 0;

  const first = samples[0];
  const last = samples[samples.length - 1];

  return last.distance + Math.hypot(last.x - first.x, last.y - first.y);
}

export function getPointAtProgress(
  progress: number,
  samples: TrackSample[],
): Point {
  if (samples.length === 0) {
    return { x: 0, y: 0 };
  }

  const length = getCircuitLength(samples);

  if (length === 0) return samples[0];

  const distance = (((progress % 1) + 1) % 1) * length;

  if (distance === 0) return samples[0];

  let low = 0;
  let high = samples.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (samples[mid].distance < distance) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const nextIndex = low;
  const previousIndex = (nextIndex - 1 + samples.length) % samples.length;

  const previous = samples[previousIndex];
  const next = samples[nextIndex];

  const segmentStart = previous.distance;
  const segmentEnd = nextIndex === 0 ? length : next.distance;

  const segmentLength = segmentEnd - segmentStart;

  const t = segmentLength > 0 ? (distance - segmentStart) / segmentLength : 0;

  return {
    x: previous.x + (next.x - previous.x) * t,
    y: previous.y + (next.y - previous.y) * t,
  };
}

export function detectCorners(samples: TrackSample[]): TrackCorner[] {
  const corners: TrackCorner[] = [];

  for (let i = 0; i < samples.length; i++) {
    const previous = samples[(i - 1 + samples.length) % samples.length];
    const current = samples[i];
    const next = samples[(i + 1) % samples.length];

    const incoming = Math.atan2(current.y - previous.y, current.x - previous.x);

    const outgoing = Math.atan2(next.y - current.y, next.x - current.x);

    let angle = Math.abs(outgoing - incoming);

    if (angle > Math.PI) {
      angle = 2 * Math.PI - angle;
    }

    const severity = angle / Math.PI;

    if (severity > 0.015) {
      corners.push({
        index: i,
        severity,
      });
    }
  }

  return corners;
}

export function calculateTargetSpeeds(samples: TrackSample[]) {
  const count = samples.length;
  const speeds = new Array<number>(count);
  const maxSpeed = 0.14;
  const minSpeed = 0.022;
  const brakingRate = 0.001;

  for (let i = 0; i < count; i++) {
    const previous = samples[(i - 1 + count) % count];
    const current = samples[i];
    const next = samples[(i + 1) % count];

    const incoming = Math.atan2(current.y - previous.y, current.x - previous.x);

    const outgoing = Math.atan2(next.y - current.y, next.x - current.x);

    let angle = Math.abs(outgoing - incoming);

    if (angle > Math.PI) {
      angle = 2 * Math.PI - angle;
    }

    const severity = Math.min(1, angle / 0.5);

    speeds[i] = maxSpeed - severity * (maxSpeed - minSpeed);
  }

  // Apply braking limits before corners.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = count - 1; i >= 0; i--) {
      const nextIndex = (i + 1) % count;
      const distance = Math.hypot(
        samples[nextIndex].x - samples[i].x,
        samples[nextIndex].y - samples[i].y,
      );

      const reachableSpeed = Math.sqrt(
        speeds[nextIndex] ** 2 + 2 * brakingRate * distance,
      );

      speeds[i] = Math.min(speeds[i], reachableSpeed);
    }
  }

  return speeds;
}

export function calculateRacingLine(
  samples: TrackSample[],
  width: number,
  height: number,
): TrackSample[] {
  const count = samples.length;

  if (count < 3) return samples;

  const maxOffset = Math.min(width, height) * 0.020;
  const searchRadius = 5;
  const halfZone = Math.max(12, Math.round(count * 0.07));
  const minPeakAngle = 0.02;
  const minPeakDistance = 16;

  // Measure the signed turning angle at every sample.
  const angles = samples.map((current, i) => {
    const previous = samples[(i - 1 + count) % count];
    const next = samples[(i + 1) % count];

    const incomingX = (current.x - previous.x) * width;
    const incomingY = (current.y - previous.y) * height;
    const outgoingX = (next.x - current.x) * width;
    const outgoingY = (next.y - current.y) * height;

    return Math.atan2(
      incomingX * outgoingY - incomingY * outgoingX,
      incomingX * outgoingX + incomingY * outgoingY,
    );
  });

  // Find distinct local curvature peaks.
  const candidates: number[] = [];

  for (let i = 0; i < count; i++) {
    const magnitude = Math.abs(angles[i]);

    if (magnitude < minPeakAngle) continue;

    let isPeak = true;

    for (let offset = 1; offset <= searchRadius; offset++) {
      const before = (i - offset + count) % count;
      const after = (i + offset) % count;

      if (
        Math.abs(angles[before]) > magnitude ||
        Math.abs(angles[after]) > magnitude
      ) {
        isPeak = false;
        break;
      }
    }

    if (isPeak) candidates.push(i);
  }

  candidates.sort((a, b) => Math.abs(angles[b]) - Math.abs(angles[a]));

  const peaks: number[] = [];

  for (const candidate of candidates) {
    const tooClose = peaks.some((peak) => {
      const distance = Math.abs(candidate - peak);
      return Math.min(distance, count - distance) < minPeakDistance;
    });

    if (!tooClose) peaks.push(candidate);
  }

  // Blend each corner's offset into a continuous racing line.
  const offsets = new Array<number>(count).fill(0);
  const weights = new Array<number>(count).fill(0);

  for (const peak of peaks) {
    const turnDirection = Math.sign(angles[peak]);
    const strength = Math.min(1, Math.abs(angles[peak]) / 0.06);

    for (let delta = -halfZone; delta <= halfZone; delta++) {
      const index = (peak + delta + count) % count;
      const t = delta / halfZone;

      // Smoothly transitions from outside to apex to outside.
      const envelope = Math.pow(Math.cos((Math.PI / 2) * t), 2);
      const cornerShape = -Math.cos(Math.PI * t);

      const weight = envelope * strength;

      offsets[index] += turnDirection * maxOffset * cornerShape * weight;
      weights[index] += weight;
    }
  }

  for (let i = 0; i < count; i++) {
    if (weights[i] > 0) offsets[i] /= weights[i];
  }

  // Smooth neighboring offsets to reduce abrupt changes.
  for (let pass = 0; pass < 8; pass++) {
  const previousOffsets = [...offsets];

  for (let i = 0; i < count; i++) {
    const previous = previousOffsets[(i - 1 + count) % count];
    const current = previousOffsets[i];
    const next = previousOffsets[(i + 1) % count];

    offsets[i] =
      previous * 0.2 +
      current * 0.6 +
      next * 0.2;
  }
}

  return samples.map((sample, i) => {
    const previous = samples[(i - 1 + count) % count];
    const next = samples[(i + 1) % count];

    const dx = (next.x - previous.x) * width;
    const dy = (next.y - previous.y) * height;
    const length = Math.hypot(dx, dy) || 1;

    // Perpendicular to the direction of travel.
    const normalX = -dy / length;
    const normalY = dx / length;

    return {
      ...sample,
      x: sample.x + (normalX * offsets[i]) / width,
      y: sample.y + (normalY * offsets[i]) / height,
    };
  });
}
