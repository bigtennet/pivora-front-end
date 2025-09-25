const { Users } = require('../models/users');
const { Reset_OTP } = require('../models/reset-otp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createOrUpdateOTP, createOrUpdateResetOTP, validateVerificationCode, generateReferralCode } = require('../utils/helpers');
const { Mail } = require('../middleware/mails');
require('dotenv').config();

const mail = new Mail();``


const Signup = async (req, res) => {
    const { fullName, email, password, referredBy, fundPassword } = req.body;

    try {
        // Check if it's phonenumber or email signup
        if (!email) {
            return res.status(400).json({ message: 'Email or phone number is required' });
        } 

        // Check if user already exists
        const existingUser = await Users.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        let referralCode;

        if (referredBy) {
            const referredUser = await Users.findOne({ referralCode: referredBy });
            if (!referredUser) {
                return res.status(400).json({ message: 'Invalid referral code' });
            }
            referralCode = await generateReferralCode();
            console.log('Referral Code:', referralCode);
        }

        // Hash password
        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await Users.create({
            password: hashedPassword,
            email: email.toLowerCase().trim(),
            fullName,
            referredBy,
            referralCode,
            fundPassword
        });

        console.log('New User Created:', newUser);
        const web_base_url = process.env.WEB_BASE_URL;

        // Send welcome email (don't block on this)
        mail.sendWelcomeMessage({ email, web_base_url }).catch(error => {
            console.error('Welcome email failed:', error);
        });

        return res.status(200).json({
            success: true,
            message: 'Welcome to Pivora Trading',
            email: newUser.email,
        });

    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await Users.findOne({ email: email.toLowerCase().trim() });

        // Check if user exists
        if (!user) return res.status(404).json({ success: false, message: 'Email Does not exist' });

        // Create OTP
        let newOtp = await createOrUpdateResetOTP(email.toLowerCase().trim());

        await mail.sendResetPassOTP({ email: email.toLowerCase().trim(), otp: newOtp });

        // send push notification to the user for reset password email
        // if (user?.expoPushToken) {
        //     sendPushNotification(user.expoPushToken, 'Reset Password', 'You have requested to reset your password. Please use the OTP to reset your password.');
        // }

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Purpose is to reset password.',
            email: user.email
        });
    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { otp, email, newPassword } = req.body;

        let reset_otp = (await Reset_OTP.find({ email: email.toLowerCase().trim(), otp: otp }));

        if (!reset_otp.length) return res.status(404).json({ status: false, message: 'Invalid code' });

        const current_reset_otp = reset_otp[0];

        if (!current_reset_otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        else if (current_reset_otp.expiredAt && current_reset_otp.expiredAt.getTime() < Date.now()) {
            await Reset_OTP.deleteOne({ _id: current_reset_otp._id });
            return res.status(400).json({ message: 'Invalid OTP (expired)' });
        }

        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(newPassword, salt);

        await Users.updateOne({ email: email }, { password: hashedPassword });

        await Reset_OTP.deleteMany({ email: email });

        return res.status(200).json({
            success: true,
            message: 'Password Successfully Updated',
            email: email
        });

    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


const loginUser = async (req, res) => {
    let { email, password } = req.body;

    try {
        // Normalize email
        const lowerCaseEmail = email ? email.toLowerCase().trim() : null;
        if (!lowerCaseEmail || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await Users.findOne({email: lowerCaseEmail});
        if (!user) {
            return res.status(403).json({ message: 'Invalid credentials' });
        }
        if (user.isSuspended) {
            return res.status(403).json({ message: 'Account suspended' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(403).json({ message: 'Invalid credentials' });
        }

        // Create the token
        const token = await jwt.sign({_id: user._id}, process.env.SECRET_KEY, {
            algorithm: "HS256",
        });

        // Respond with success
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email || null,
                isAdmin: user.isAdmin || false,
                isSuperAdmin: user.isSuperAdmin || false
            },
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

const verifyEmail = async (req, res) => {
    const user = req.user;

    if (user.emailVerified === true) return res.status(200).json({ message: 'EMail already verified' });

    if (req.method === 'GET') {
        try {
            let otp;
            otp = await createOrUpdateOTP(user.email);
            await mail.sendOTPEmail({ email: user.email, otp });

            res.status(200).json({ otp });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    } else if (req.method === 'POST') {
        try {
            const { otp } = req.body;
            if (!otp) {
                return res.status(400).json({ message: 'OTP is required' });
            }

            const [verificationStatus, verificationResponse] = await validateVerificationCode(
                email=user.email,
                code=otp
            );
            console.log('Verification Status:', verificationStatus);
            console.log('Verification Response:', verificationResponse);

            if (!verificationStatus) {
                return res.status(400).json({ message: verificationResponse });
            }

            await Users.findOneAndUpdate({ email: user.email }, { emailVerified: true });

            res.status(200).json({ message: 'Email verified successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Check if new password is different from current password
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Find user
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await Users.findByIdAndUpdate(userId, { password: hashedNewPassword });

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = { loginUser, Signup, forgotPassword, resetPassword, verifyEmail, changePassword };

