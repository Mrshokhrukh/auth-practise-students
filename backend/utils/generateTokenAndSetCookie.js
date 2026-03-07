import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
	const token = jwt.sign({ userId }, 'my-testing-jwt', {
		expiresIn: "7d",
	});

	res.cookie("token", token, {
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 kun
	});

	return token;
};
