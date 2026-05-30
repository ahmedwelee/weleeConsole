export const ROOM_CODE_LENGTH = 4;

const ROOM_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const normalizeRoomCode = (value: string): string => {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
};

export const generateRoomCode = (): string => {
  let code = '';

  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    const characterIndex = Math.floor(Math.random() * ROOM_CODE_CHARACTERS.length);
    code += ROOM_CODE_CHARACTERS[characterIndex];
  }

  return code;
};
