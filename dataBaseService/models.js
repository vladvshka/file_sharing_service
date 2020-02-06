import Sequelize from "sequelize";

export const UserModel = {
	login: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	password: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	email: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	isVerified: {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
	},
	sessionToken: {
		type: Sequelize.STRING,
		defaultValue: null,
	},
};
