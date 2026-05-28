export const passwordSchemaText =
  "Password must be at least 8 characters and include one uppercase letter, one number, and one special character";

export const isStrongPassword = (password: string) =>
  password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
