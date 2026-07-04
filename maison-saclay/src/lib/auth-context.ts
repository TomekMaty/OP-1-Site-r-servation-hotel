import { createContext, useContext } from "react";

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  isLogged: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  isLogged: false,
});

export function useAuth() {
  return useContext(AuthContext);
}
