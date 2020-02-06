import crypto from "crypto";
import { logLine } from "../shared";
import { SALT } from "../configs/keys";

export const encryptionService = {
	encryptPassword(password) {
		return new Promise((resolve, reject) => {
			crypto.scrypt(password, SALT, 64, (err, derivedKey) => {
				if (err) {
					logLine(`encryptPassword rejected with error: ${err}`);
					reject(err);
				}

				logLine("derivedKey: ", derivedKey.toString("hex"));
				// derivedKey - Buffer
				resolve(derivedKey.toString("hex"));
			});
		});
	},

	async verifyPassword(newPassword, passwordFromDb) {
		const encPwd = await this.encryptPassword(newPassword);
		return encPwd === passwordFromDb;
	},

	generateToken() {
		return new Promise((resolve, reject) => {
			// have to keep buf length under DB's sessionToken attribute length limits
			crypto.randomBytes(16, (err, buf) => {
				if (err) {
					logLine(`encryptPassword rejected with error: ${err}`);
					reject(err);
				}

				logLine("buf: ", buf.toString("hex"));
				resolve(buf.toString("hex"));
			});
		});
	},
};
