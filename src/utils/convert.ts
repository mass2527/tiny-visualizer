import invariant from "tiny-invariant";

export const convertDegreeToRadian = (angleInDegrees: number) => {
  return (Math.PI * angleInDegrees) / 180;
};

export const convertToPercent = (ratio: number) => {
  return ratio * 100;
};

export const convertToRatio = (percent: number) => {
  return percent / 100;
};

export const convertHslToHex = (hsl: string) => {
  const matched = hsl.match(/\d+(\.\d+)?/g);
  invariant(matched);

  const [h, s, l] = matched.map(Number);
  invariant(
    typeof h === "number" && typeof s === "number" && typeof l === "number"
  );

  const hDecimal = l / 100;
  const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);

    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
