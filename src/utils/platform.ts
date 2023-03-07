const platform =
  window.navigator?.userAgentData?.platform ||
  window.navigator?.platform ||
  "unknown";

const testPlatform = (regex: RegExp) => regex.test(platform);

const isMac = () => testPlatform(/^mac/i);

export const isWithPlatformMetaKey = (event: {
  metaKey: boolean;
  ctrlKey: boolean;
}) => (isMac() ? event.metaKey : event.ctrlKey);
