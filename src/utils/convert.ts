export const convertDegreeToRadian = (angleInDegrees: number) => {
  return (Math.PI * angleInDegrees) / 180;
};

export const convertToPercent = (ratio: number) => {
  return ratio * 100;
};

export const convertToRatio = (percent: number) => {
  return percent / 100;
};
