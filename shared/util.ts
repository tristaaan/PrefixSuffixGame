export const randomString = (size:number): string => {
  if (size === 0) {
    throw new Error('Zero-length randomString is useless.');
  }
  const chars:string = ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    + 'abcdefghijklmnopqrstuvwxyz'
    + '0123456789');
  let objectId:string = '';
  for (let i = 0; i < size; i += 1) {
    objectId += chars[Math.floor(Math.random() * 256) % chars.length];
  }

  return objectId;
};

export const randomArrayObject = (arr:string[]):string => {
  return arr[Math.floor(Math.random() * arr.length)];
}
