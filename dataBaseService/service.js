import Sequelize from 'sequelize';

import { UserModel } from './models';
import { logLine } from '../shared';
import { dbConfigs } from '../configs/dbConfigs';

const { Op } = Sequelize;

const sequelize = new Sequelize(
	dbConfigs.TABLE,
	dbConfigs.USER,
	dbConfigs.PASSWORD,
	{
		host: 'localhost',
		dialect: 'mysql',
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000
		}
	}
);

// The table name is automatically pluralized.
const User = sequelize.define('user', UserModel);

sequelize
	.sync() // Sequelize automatically creates/upd all tables according to model definitions
	.then(() => {
		console.log(
			'Connection to database has been established successfully.'
		);
	})
	.catch(err => {
		console.error('Unable to connect to database:', err);
	});

export { sequelize };

export const dbService = {
	createUser: async (login, password, email, sessionToken) => {
		try {
			const newRequest = await User.create({
				login,
				password,
				email,
				sessionToken
			});

			logLine(`newRequest added: ${JSON.stringify(newRequest)}`);

			return true;
		} catch (error) {
			logLine(`newRequest addition error: ${JSON.stringify(error)}`);

			throw error;
		}
	},

	findUserByLogin: async login => {
		try {
			const user = await User.findOne({
				where: {
					login
				}
			});

			logLine(`user found: ${JSON.stringify(user)}`);

			return user;
		} catch (error) {
			logLine(`user finding error: ${error}`);

			throw error;
		}
	},

	checkEmailAndLogin: async (login, email) => {
		try {
			const user = await User.findOne({
				where: {
					[Op.or]: [{ login }, { email }]
				}
			});

			logLine(`checkEmailAndLogin: ${JSON.stringify(user)}`);

			return !!user;
		} catch (error) {
			logLine(`user finding error: ${error}`);
			throw error;
		}
	},

	verifyEmailByToken: async token => {
		try {
			const user = await User.findOne({
				where: {
					sessionToken: token
				}
			});

			if (user && !user.isVerified) {
				logLine(`user found: ${JSON.stringify(user)}`);

				await User.update(
					{
						isVerified: true
					},
					{
						where: {
							sessionToken: token
						}
					}
				);

				return 0;
			}
			if (user && user.isVerified) {
				return 1;
			}

			throw new Error("User doen't exist!");
		} catch (error) {
			logLine(`user finding error: ${error}`);
			throw error;
		}
	}
};
