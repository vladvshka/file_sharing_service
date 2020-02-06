import nodemailer from "nodemailer";
import { getEmailConfigs } from "../configs/nodeMailerConfigs";
import { logLine } from "../shared";

const parseMessage = (msg, token) => msg.replace(/{TOKEN}/g, token);

export const sendWelcomeEmail = async (email, token) => {
	const emailConfigs = getEmailConfigs();
	// create reusable transporter object using the default SMTP transport
	const transporter = nodemailer.createTransport(emailConfigs.transporter);

	const message = {
		from: emailConfigs.email, // емейл отправителя, может не совпадать с auth
		to: email,
		subject: emailConfigs.subject,
		text: parseMessage(emailConfigs.text, token), // текстовая версия письма
		html: parseMessage(emailConfigs.html, token), // HTML-версия письма
	};

	try {
		// send mail with defined transport object
		await transporter.sendMail(message);
	} catch (error) {
		logLine(error);
	}
};
