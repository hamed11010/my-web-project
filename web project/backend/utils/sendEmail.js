import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
    console.log('Attempting to send email with:');
    console.log(`  Service: ${process.env.EMAIL_SERVICE}`);
    console.log(`  User: ${process.env.EMAIL_USERNAME}`);
    console.log(`  Password length: ${(process.env.EMAIL_PASSWORD || '').length}`); // Log length for security

    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    console.log('Nodemailer Transporter created.');
    console.log(transporter);

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Coffee House App'}" <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail; 