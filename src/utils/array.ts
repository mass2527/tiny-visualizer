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

export const groupBy = <T>(
  items: T[],
  groupingKeyCreator: (item: T) => string | undefined
) => {
  const groups: Record<string, T[]> = {};

  for (const item of items) {
    const groupingKey = groupingKeyCreator(item);
    if (!groupingKey) {
      continue;
    }

    if (groups[groupingKey]) {
      groups[groupingKey]?.push(item);
    } else {
      groups[groupingKey] = [item];
    }
  }

  return groups;
};

export const mergeItems = <T>(items: T[]) => {
  let result = {} as T;

  for (let i = 0; i < items.length; i++) {
    result = {
      ...result,
      ...items[i],
    };
  }

  return result;
};
