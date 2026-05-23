export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("access");
  return token && token !== "undefined" && token !== "null";
};

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
};