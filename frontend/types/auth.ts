import { User } from ".";

export interface LoginResponse {
  result: {
    token: string;
    user: User;
  };
}

export interface RegisterResponse {
  result: {
    token: string;
    user: User;
  };
}
