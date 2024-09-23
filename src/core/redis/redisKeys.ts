export const getRedisKeys = (...strings: (string | number)[]) => {
  return strings.join(' ');
};
