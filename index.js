import express from 'express';
import path from 'path';
import WebSocket from 'ws';
import favicon from 'serve-favicon';
import session from 'express-session';
import sessionStoreConnector from 'connect-session-sequelize';

import { CONNECTION_ID, logLine } from './shared/index';
import { webSocketsWatcher } from './utils/webSocketsHelpers';
import { authRouter } from './routers/authRouter';
import { serviceRouter } from './routers/serviceRouter';
import { sequelize } from './dataBaseService/service';
import { getSessionConfigs } from './configs/sessionConfigs';

const webserver = express();
const port = 7180;

// Custom session store for express-session based on Sequilize.
const SequelizeStore = sessionStoreConnector(session.Store);
const sessionStore = new SequelizeStore({
	// connection / pool
	db: sequelize
});

// init WS-server
const wsServer = new WebSocket.Server({ port: 7181 });

// generate session options, sessionStore is used as store for sessions
const sessionOptions = getSessionConfigs(sessionStore);

/**
 * Every new client sends an ID. The connection is stored and handled by webSocketsWatcher.
 */
wsServer.on('connection', connection => {
	logLine('new client connected');

	connection.on('message', message => {
		logLine('message', message);

		const data = JSON.parse(message);

		if (data[CONNECTION_ID]) {
			const connectionId = data[CONNECTION_ID];
			logLine('connectionId from client: ', connectionId);

			webSocketsWatcher.addClient(connection, connectionId);
		}
	});
});

webserver
	.use(session(sessionOptions))
	.use(express.urlencoded({ extended: true }))
	.use(express.static(path.join(__dirname, 'public')))
	.use('/shared/', express.static(path.resolve(__dirname, 'shared')))
	// view engine setup
	.set('view engine', 'pug') // устанавливаем, что будет использоваться именно движок шаблонов pug
	.set('views', path.join(__dirname, 'views')) // задаём папку, в которой будут шаблоны
	.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
	// routers
	.use('/', authRouter)
	.use('/', serviceRouter)
	.use('*', (req, res) => {
		res.sendFile(path.join(__dirname, 'public', 'notFound.html'));
	});

webserver.listen(port, () =>
	logLine(`File uploader listening on port ${port}!`)
);
