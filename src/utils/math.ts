export const calculateDistance = (width: number, height: number) => {
  return Math.hypot(width, height);
};

export const calculateNormalizedValue = ({
  max,
  value,
  min,
}: {
  max: number;
  value: number;
  min: number;
}) => {
  return Math.max(min, Math.min(value, max));
};

export const createRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * max) + min;
};
