import api from "./axios";

export const loginApi = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const registerApi = async (
  email: string,
  password: string,
  displayName: string
) => {
  const res = await api.post("/auth/register", {
    email,
    password,
    displayName,
  });

  return res.data;
};