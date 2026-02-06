export interface ExtractedColors {
  colors: string[];
  suggestedPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function distance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

/**
 * Extracts dominant colors from a base64 image using k-means clustering.
 * Runs entirely on client side using a canvas element.
 */
export async function extractColorsFromImage(
  base64Image: string,
  k: number = 5
): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels: [number, number, number][] = [];

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;
        // Skip near-white and near-black
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 15 && g < 15 && b < 15) continue;

        pixels.push([r, g, b]);
      }

      if (pixels.length < k) {
        // Not enough pixels, return defaults
        resolve({
          colors: ["#4f46e5", "#8b5cf6", "#10b981", "#f8fafc", "#1e293b"],
          suggestedPalette: {
            primary: "#4f46e5",
            secondary: "#8b5cf6",
            accent: "#10b981",
            background: "#f8fafc",
            text: "#1e293b",
          },
        });
        return;
      }

      // K-means clustering
      // Initialize centroids by picking evenly spaced pixels
      const step = Math.floor(pixels.length / k);
      let centroids: [number, number, number][] = Array.from(
        { length: k },
        (_, i) => [...pixels[i * step]] as [number, number, number]
      );

      const maxIterations = 20;
      for (let iter = 0; iter < maxIterations; iter++) {
        // Assign pixels to nearest centroid
        const clusters: [number, number, number][][] = Array.from(
          { length: k },
          () => []
        );

        for (const pixel of pixels) {
          let minDist = Infinity;
          let closest = 0;
          for (let c = 0; c < k; c++) {
            const d = distance(pixel, centroids[c]);
            if (d < minDist) {
              minDist = d;
              closest = c;
            }
          }
          clusters[closest].push(pixel);
        }

        // Recalculate centroids
        let converged = true;
        const newCentroids: [number, number, number][] = centroids.map(
          (centroid, i) => {
            const cluster = clusters[i];
            if (cluster.length === 0) return centroid;

            const avg: [number, number, number] = [
              cluster.reduce((s, p) => s + p[0], 0) / cluster.length,
              cluster.reduce((s, p) => s + p[1], 0) / cluster.length,
              cluster.reduce((s, p) => s + p[2], 0) / cluster.length,
            ];

            if (distance(avg, centroid) > 1) converged = false;
            return avg;
          }
        );

        centroids = newCentroids;
        if (converged) break;
      }

      // Sort by cluster size (count assignments)
      const clusterSizes: { color: [number, number, number]; count: number }[] =
        [];
      for (const pixel of pixels) {
        let minDist = Infinity;
        let closest = 0;
        for (let c = 0; c < k; c++) {
          const d = distance(pixel, centroids[c]);
          if (d < minDist) {
            minDist = d;
            closest = c;
          }
        }
        if (!clusterSizes[closest]) {
          clusterSizes[closest] = { color: centroids[closest], count: 0 };
        }
        clusterSizes[closest].count++;
      }

      // Fill any missing clusters
      for (let i = 0; i < k; i++) {
        if (!clusterSizes[i]) {
          clusterSizes[i] = { color: centroids[i], count: 0 };
        }
      }

      const sorted = clusterSizes
        .filter(Boolean)
        .sort((a, b) => b.count - a.count);

      const colors = sorted.map((c) =>
        rgbToHex(c.color[0], c.color[1], c.color[2])
      );

      // Suggest palette based on luminance
      const withLum = colors.map((hex) => {
        const [r, g, b] = hexToRgb(hex);
        return { hex, lum: luminance(r, g, b) };
      });

      // Sort by luminance for background/text selection
      const byLum = [...withLum].sort((a, b) => a.lum - b.lum);

      resolve({
        colors,
        suggestedPalette: {
          primary: colors[0] || "#4f46e5",
          secondary: colors[1] || "#8b5cf6",
          accent: colors[2] || "#10b981",
          background: byLum[byLum.length - 1]?.hex || "#f8fafc",
          text: byLum[0]?.hex || "#1e293b",
        },
      });
    };

    img.src = base64Image.startsWith("data:")
      ? base64Image
      : `data:image/png;base64,${base64Image}`;
  });
}
