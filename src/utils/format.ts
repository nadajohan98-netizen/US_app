// Formatting helpers extracted from HomeSection.

/**
 * Formats a number of seconds as MM:SS.
 */
export const formatDuration = (sec: number): string => {
  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
