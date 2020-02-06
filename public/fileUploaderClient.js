import { CONNECTION_ID, PROGRESS, logLine } from '../shared/index';

(async () => {
	// TODO: move id generation to server. Make another req after GET of the main page.
	const uuidv4 = () => {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
			(
				c ^
				(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
			).toString(16)
		);
	};

	let connection = null;

	const updateProgressBar = progress => {
		const myBar = document.getElementById('myBar');
		const width = Math.round(progress * 100);

		if (width <= 100) {
			myBar.style.width = width + '%';

			document.getElementById('barLabel').innerHTML = width + '%';
		}
	};

	const establishWebSocketConnection = () => {
		const connectionId = uuidv4();
		const url = `ws://${window.location.hostname}:7181/`;
		/**
		 * Web socket protocol supports text and binary data.
		 * In terms of Javascript, text refers to as a string, while binary data is represented like ArrayBuffer.
		 */
		connection = new WebSocket(url);

		connection.onopen = () => {
			const connectionMsg = JSON.stringify({
				[CONNECTION_ID]: connectionId
			});

			logLine('Client connectionMsg: ', connectionMsg);
			connection.send(connectionMsg);
		};

		connection.onmessage = msg => {
			logLine('клиентом получено сообщение от сервера: ' + msg.data);
			const data = JSON.parse(msg.data);

			if (data[PROGRESS]) {
				const progress = data[PROGRESS];
				updateProgressBar(progress);
			}
		};

		connection.onerror = error => {
			logLine('WebSocket error:', error);
		};

		connection.onclose = event => {
			logLine(
				`соединение с сервером закрыто: ${event.code}, ${event.reason}`
			);
			connection = null;
		};

		return connectionId;
	};

	const handleUpload = async e => {
		e.preventDefault();
		e.stopPropagation();

		const form = document.getElementById('form');

		const formData = new FormData(form);
		const connectionId = establishWebSocketConnection();

		// File attachment and connectionId is a must!
		if (!connectionId || formData.get('attachment').size === 0) {
			return;
		}

		const url = encodeURI(`/upload/?CONNECTION_ID=${connectionId}`);

		const myProgress = document.getElementById('myProgress');
		myProgress.style.visibility = 'visible';

		try {
			const response = await fetch(url, {
				method: 'POST',
				body: formData
			});

			// Have to handle redirect manually, as default POST handler has been rewritten by handleUpload.
			window.location = response.url;
		} catch (error) {
			console.error('error', error);
		}
	};

	document.getElementById('form').addEventListener('submit', handleUpload);
})();
