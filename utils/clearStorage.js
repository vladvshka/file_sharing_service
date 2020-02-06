const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;

const storagePath = path.join(__dirname, '../', 'public', 'storage.json');
const uploadsPath = path.join(__dirname, '../', 'uploads');

/**
 * Technical script to clear storage.json
 */
fs.readFile(storagePath, (err, data) => {
	if (err) {
		console.log('Error reading storage', err);
	} else {
		const storage = JSON.parse(data);
		storage.uploads = [];

		fs.writeFile(storagePath, JSON.stringify(storage), writeErr => {
			if (writeErr) {
				console.log('Error writing storage', writeErr);
			} else {
				console.log('Storage has been cleared!');
			}
		});
	}
});

/**
 * Technical script to clear uploads folder
 */
/* eslint-disable no-restricted-syntax */
fs.readdir(uploadsPath, async (err, files) => {
	if (err) console.log(err);
	for (const file of files) {
		if (file !== '.gitignore') {
			await fsp.unlink(path.join(uploadsPath, file), delErr => {
				if (delErr) console.log(delErr);
			});
		}
	}
});
