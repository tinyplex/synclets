const encodeMessage = (type: string, payload: any): string => {
  return JSON.stringify({type, payload});
};

const decodeMessage = (message: string): {type: string; payload: any} => {
  try {
    return JSON.parse(message);
  } catch (error) {
    throw new Error(`Failed to decode message: ${error.message}`);
  }
};
