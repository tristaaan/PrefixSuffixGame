export const randomString = (size:number): string => {
  if (size === 0) {
    throw new Error('Zero-length randomString is useless.');
  }
  const chars:string = ('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
  let objectId:string = '';
  for (let i = 0; i < size; i += 1) {
    objectId += chars[Math.floor(Math.random() * chars.length)];
  }

  return objectId;
};

export const randomArrayObject = (arr:string[]):string => {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const MIN_NAME_LENGTH = 3 as const;
export const MAX_NAME_LENGTH = 18 as const;

export const validPlayerName = (name:string) => {
  return name.length >= MIN_NAME_LENGTH && name.length <= MAX_NAME_LENGTH;
}