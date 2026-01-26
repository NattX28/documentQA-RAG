import axios from "axios";

export const getErrorMessage = (error: unknown): string | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
};
