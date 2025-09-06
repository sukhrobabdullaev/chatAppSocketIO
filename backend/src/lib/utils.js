import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

  const isDev = process.env.NODE_ENV === "development";
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isDev ? false : true,
    sameSite: isDev ? "lax" : "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};
