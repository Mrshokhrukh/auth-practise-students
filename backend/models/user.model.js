import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		lastLogin: {
			type: Date,
			default: Date.now,
		},

		// resetPasswordToken: String,
		// resetPasswordExpiresAt: Date,
		// verificationToken: String,
		// verificationTokenExpiresAt: Date,
	},
	{ timestamps: true }
);

userSchema.pre('save', function (next) {
	this.lastLogin = new Date()

	next()
})

export const User = mongoose.model("AllUsers", userSchema);
