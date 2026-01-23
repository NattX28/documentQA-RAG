interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}
