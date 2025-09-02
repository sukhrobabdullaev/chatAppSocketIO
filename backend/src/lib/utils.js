import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

  const isDev = process.env.NODE_ENV === "development";
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isDev ? false : true,
    // In dev, allow Lax so localhost:5173 -> 3000 can send cookie on WS upgrade
    // In prod, use None; Secure for cross-site setups behind HTTPS
    sameSite: isDev ? "lax" : "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};
