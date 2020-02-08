import express from 'express';
import multer from 'multer';

import { dbService } from '../dataBaseService/service';
import { encryptionService } from '../utils/encryptionService';
import { sendWelcomeEmail } from '../utils/emailService';
import { DB_CODES } from '../configs/dbCodes';
import { logLine } from '../shared/index';

const authRouter = express.Router();
const upload = multer();

authRouter.use((req, res, next) => {
	logLine(`In auth Router: ${JSON.stringify(req.session, null, 2)}`);
	next();
});

authRouter.get('/sign-up', (req, res) => {
	res.render('authForm', { signUp: true });
});

authRouter.get('/sign-in/unauthorized', (req, res) => {
	res.status(403).render('authForm', { signIn: true, unauthorized: true });
});

authRouter.get('/sign-in/:token', async (req, res) => {
	const { token } = req.params;
	try {
		// verify user's email if previously generated token is valid.
		const result = await dbService.verifyEmailByToken(token);
		logLine(`result: ${result}`);

		switch (result) {
			case DB_CODES.SUCCESS:
				res.status(200).render('authForm', {
					signIn: true,
					emailVerified: true
				});
				break;
			case DB_CODES.DOUBLE_VERIFY:
				res.status(401).render('authForm', {
					signIn: true,
					alreadyVerified: true
				});
				break;
			default:
				break;
		}
	} catch (error) {
		res.status(500).send(JSON.stringify(error.message));
	}
});

authRouter.get('/sign-in', (req, res) => {
	res.render('authForm', { signIn: true });
});

authRouter.post('/sign-up', upload.none(), async (req, res) => {
	logLine('Sign-Up: ', req.body);
	const { login, password, email } = req.body;
	// mb as route's middleware validateSignUpData(res, req.body);

	try {
		const userAlreadyExists = await dbService.checkEmailAndLogin(
			login,
			email
		);

		if (userAlreadyExists) {
			res.status(400).render('authForm', {
				signUp: true,
				userExists: true
			});
		} else {
			const encPwd = await encryptionService.encryptPassword(password);
			const token = await encryptionService.generateToken();

			await dbService.createUser(login, encPwd, email, token);
			await sendWelcomeEmail(email, token);

			// REMOVE
			// res.status(200).json({ session: token });
			res.status(200).render('authForm', {
				signIn: true,
				accountCreated: true
			});
		}
	} catch (error) {
		res.status(500).send(JSON.stringify(error.message));
	}
});

authRouter.post('/sign-in', upload.none(), async (req, res) => {
	logLine('Sign-In: ', req.body);
	const { login, password } = req.body;

	try {
		const user = await dbService.findUserByLogin(login);

		if (user) {
			const passwordFromDb = user.password;
			const isEmailVerified = user.isVerified;
			const isPwdConfirmed = await encryptionService.verifyPassword(
				password,
				passwordFromDb
			);

			if (isPwdConfirmed) {
				if (isEmailVerified) {
					// Successful authorization
					req.session.isAuthorized = true;

					// Save session from store to DB explicitly to have actual session state after the redirection.
					req.session.save(err => {
						if (err) {
							res.status(500).render('authForm', {
								signIn: true,
								internalError: JSON.stringify(err.message)
							});
						}

						res.redirect(302, '../');
					});
				} else {
					res.status(403).render('authForm', {
						signIn: true,
						verifyEmail: true
					});
				}
			} else {
				res.status(404).render('authForm', {
					signIn: true,
					noUser: true
				});
			}
		} else {
			res.status(404).render('authForm', { signIn: true, noUser: true });
		}
	} catch (error) {
		res.status(500).send(JSON.stringify(error.message));
	}
});

export { authRouter };
