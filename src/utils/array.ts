export const removeLastItem = <T>(array: T[]) => {
  return array.slice(0, array.length - 1);
};

export const replaceNthItem = <T>({
  array,
  item,
  index,
}: {
  array: T[];
  item: T;
  index: number;
}) => {
  const newArray = [...array];
  newArray[index] = item;
  return newArray;
};

export const setLastItem = <T>(array: T[], item: T) => {
  const arrayWithoutLastItem = removeLastItem(array);
  return [...arrayWithoutLastItem, item];
};
