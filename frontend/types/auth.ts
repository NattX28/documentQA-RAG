import { User } from ".";

export type LoginResponse = {
  result: {
    token: string;
    user: User;
  };
};
