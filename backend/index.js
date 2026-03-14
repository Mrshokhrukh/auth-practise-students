import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import { verifyToken } from "./middleware/verifyToken.js";
import { User } from "./models/user.model.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2000;
const __dirname = path.resolve();

app.use(cors({ credentials: true, origin: ['http://localhost:5173', 'http://localhost:3000'] }));

app.use(express.json());
app.use(cookieParser());

app.use('/health', (req, res) => {
	res.json({
		date: new Date().toLocaleTimeString(),
		message: "Server is running"
	})
})

app.get('/documentation', (req, res) => {
	const baseUrl = `${req.protocol}://${req.get('host')}`;

	res.json({
		title: "MERN AUTH API Documentation",
		version: "1.0.0",
		generatedAt: new Date().toISOString(),
		baseUrl,
		authentication: {
			type: "Cookie-based JWT",
			cookieName: "token",
			howItWorks: "After successful signup/login, backend sets token cookie. Protected routes read req.cookies.token.",
			frontendRequirement: "Send requests with credentials (axios: withCredentials=true, fetch: credentials='include').",
		},
		endpoints: [
			{
				name: "Health Check",
				method: "GET",
				path: "/health",
				authRequired: false,
				description: "Checks if server is running.",
				successResponse: {
					status: 200,
					body: {
						date: "HH:MM:SS",
						message: "Server is running",
					},
				},
			},
			{
				name: "Signup",
				method: "POST",
				path: "/api/auth/signup",
				authRequired: false,
				description: "Creates a new user and sets auth cookie.",
				requestBody: {
					email: "string",
					password: "string",
					name: "string",
				},
				successResponse: {
					status: 201,
					body: {
						success: true,
						message: "User created successfully",
						user: "User object",
					},
				},
				errorResponses: [
					{ status: 400, body: { success: false, message: "User already exists" } },
					{ status: 405, body: { success: false, message: "All fields are required | other error" } },
				],
			},
			{
				name: "Login",
				method: "POST",
				path: "/api/auth/login",
				authRequired: false,
				description: "Authenticates user, sets auth cookie, and returns user data.",
				requestBody: {
					email: "string",
					password: "string",
				},
				successResponse: {
					status: 200,
					body: {
						success: true,
						message: "Logged in successfully",
						user: {
							token: "jwt token string",
							password: "undefined",
							otherFields: "...user fields",
						},
					},
				},
				errorResponses: [
					{ status: 400, body: { success: false, message: "Invalid credentials | other error" } },
				],
			},
			{
				name: "Logout",
				method: "POST",
				path: "/api/auth/logout",
				authRequired: false,
				description: "Clears token cookie.",
				successResponse: {
					status: 200,
					body: { success: true, message: "Logged out successfully" },
				},
			},
			{
				name: "Check Auth",
				method: "GET",
				path: "/api/auth/check-auth",
				authRequired: true,
				description: "Returns authenticated user using cookie token.",
				successResponse: {
					status: 200,
					body: {
						success: true,
						user: "User object without password",
					},
				},
				errorResponses: [
					{ status: 401, body: { success: false, message: "Unauthorized - no token provided | invalid token" } },
					{ status: 400, body: { success: false, message: "User not found | other error" } },
				],
			},
			{
				name: "Forgot Password",
				method: "POST",
				path: "/api/auth/forgot-password",
				authRequired: false,
				description: "Finds user by email and replaces password with new hashed password.",
				requestBody: {
					email: "string",
					newPassword: "string",
				},
				successResponse: {
					status: 200,
					body: { success: true, message: "Password successfully changed" },
				},
				errorResponses: [
					{ status: 400, body: { success: false, message: "User not found | other error" } },
				],
			},
			{
				name: "Reset Password",
				method: "POST",
				path: "/api/auth/reset-password/:token",
				authRequired: false,
				description: "Resets password by reset token (if valid and not expired).",
				requestParams: { token: "string" },
				requestBody: { password: "string" },
				successResponse: {
					status: 200,
					body: { success: true, message: "Password reset successful" },
				},
				errorResponses: [
					{ status: 400, body: { success: false, message: "Invalid or expired reset token | other error" } },
				],
			},
			{
				name: "My Profile",
				method: "GET",
				path: "/api/profile",
				authRequired: true,
				description: "Returns logged-in user's basic profile data from cookie token.",
				successResponse: {
					status: 200,
					body: {
						email: "string",
						name: "string",
						lastLogin: "date",
						createdAt: "date",
					},
				},
				errorResponses: [
					{ status: 401, body: { message: "user not found" } },
					{ status: 404, body: { message: "Athicatication is required" } },
					{ status: 400, body: "auth error" },
				],
			},
		],
		notes: {
			disabledRoutes: [
				{
					path: "/api/auth/verify-email",
					reason: "Route exists in controller but is commented out in auth.route.js",
				},
			],
		},
	});
});

app.use("/api/auth", authRoutes);
app.use('/api/profile', verifyToken, async (req, res) => {

	try {
		const userId = req.userId;

		if (!userId) {
			return res.status(404).json({ message: "Athicatication is required" })
		}

		const user = await User.findById(userId)

		if (!user) {
			return res.status(401).json({ message: "user not found" })
		}

		const { email, name, lastLogin, createdAt } = user;

		res.send({ email, name, lastLogin, createdAt });

	} catch (error) {
		res.status(400).send("auth error")
	}


})

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.listen(PORT, () => {
	connectDB();
	console.log("Server is running on port: ", PORT);
});
