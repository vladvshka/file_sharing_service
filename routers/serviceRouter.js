import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import progress from 'progress-stream';
import uuidv1 from 'uuid/v1';

import { CONNECTION_ID, PROGRESS, logLine } from '../shared/index';
import { webSocketsWatcher } from '../utils/webSocketsHelpers';
import { taskQueue, updateStorage } from '../utils/storageHelpers';

const fsp = fs.promises;
const serviceRouter = express.Router();

// define cutom multer storage and filename.
const multerStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, '../', 'uploads'));
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	}
});

// миддлварь для работы с multipart/form-data;
const upload = multer({ storage: multerStorage });
// fieldname === attachment, it must be the name of input type="file"
const attachment = upload.single('attachment');

serviceRouter.use((req, res, next) => {
	logLine(`In service Router: ${JSON.stringify(req.session, null, 2)}`);
	if (req.session.isAuthorized) {
		// req.session.cookie.expires = new Date(Date.now() + 1000000);

		// // TODO: issue of not refreshing cookie in browser
		// req.session.save(err => {
		// 	if (err) {
		// 		res.status(500).render('authForm', {
		// 			signIn: true,
		// 			internalError: JSON.stringify(err.message)
		// 		});
		// 	}

		// 	next();
		// });
		next();
	} else {
		res.redirect(302, '/sign-in/unauthorized');
	}
});

// Use progress->multer bundle to handle uploads.
serviceRouter.post('/upload', (req, res) => {
	const bodyProgress = progress();
	const fileLength = +req.headers['content-length']; // берём длину всего тела запроса

	let connection = null;
	const connectionId = req.query[CONNECTION_ID];

	if (!connectionId) {
		res.status(400).send(
			'Request headers are incomplete. CONNECTION_ID is missing.'
		);
	}

	bodyProgress.on('progress', info => {
		const msg = JSON.stringify({
			[PROGRESS]: info.transferred / fileLength
		});

		connection = webSocketsWatcher.getConnectionById(connectionId);

		if (!!connection) {
			connection.send(msg);
		} else {
			logLine('Error finding connection: ', connectionId);
		}
	});

	// req -> progress -> multer
	req.pipe(bodyProgress);
	bodyProgress.headers = req.headers;

	/**
	 * Starts, when uploading progress is over.
	 */
	attachment(bodyProgress, res, err => {
		if (err) {
			res.status(500);
		}

		const fileId = uuidv1();

		const fileData = {
			fileId,
			comment: bodyProgress.body.comment || '',
			fileName: bodyProgress.file.filename
		};

		updateStorage(fileData);

		/**
		 * Starts, when storage updating progress is over or failed.
		 */
		taskQueue
			.on('done', id => {
				if (id === fileId) {
					logLine("Client's file is uploaded and stored.");

					webSocketsWatcher.closeConnection(connectionId);

					res.redirect(302, '/history');
				}
			})
			.on('error', id => {
				if (id === fileId) {
					logLine("Client's file saving error!");

					webSocketsWatcher.closeConnection(connectionId);

					res.redirect(302, '/history');
				}
			});
	});
});

serviceRouter.get('/', async (req, res) => {
	res.render('main');
});

// With uploads history
serviceRouter.get('/history', async (req, res) => {
	logLine('In history req.session: ', req.session);

	const storageJson = await fsp.readFile(
		path.join(__dirname, '../', 'public', 'storage.json'),
		'utf8'
	);

	const { uploads } = JSON.parse(storageJson);

	res.render('main', { shouldShowHistory: true, uploads });
});

// Download of file initiated ftom the client
serviceRouter.get('/download/:downloadId', async (req, res) => {
	const storageJson = await fsp.readFile(
		path.join(__dirname, '../', 'public', 'storage.json'),
		'utf8'
	);

	const { uploads } = JSON.parse(storageJson);
	const { downloadId } = req.params;

	const { fileName } = uploads.find(file => file.fileId === downloadId);

	logLine('Client is downloading: ', fileName);

	const file = path.resolve(__dirname, '../', 'uploads', fileName);

	if (!file) {
		res.status(500).send('Sorry, this file has dissapeared!');
	} else {
		res.setHeader('Content-Disposition', 'attachment');
		res.download(file, fileName);
	}
});

// Wrong URLs' handler
serviceRouter.get('*', (req, res) => {
	res.render('authForm', { signIn: true });
});

export { serviceRouter };
