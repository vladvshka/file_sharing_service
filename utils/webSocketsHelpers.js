import { logLine } from '../shared/index';

class WebSocketsWatcher {
	constructor() {
		this.clients = [];
	}

	addClient(connection, connectionId) {
		const client = {
			connection,
			connectionId,
			lastkeepalive: Date.now()
		};
		this.clients.push(client);
	}

	removeClient(connectionId) {
		const currentClients = this.clients;

		this.clients = currentClients.filter(
			client => client.connectionId !== connectionId
		);
	}

	closeConnection(connectionId) {
		const connection = this.getConnectionById(connectionId);
		connection.close(1000, 'Finished');
		this.removeClient(connectionId);

		logLine('connectionId closed from client: ', connectionId);
	}

	getConnectionById(connectionId) {
		let result = null;

		this.clients.forEach(client => {
			if (client.connectionId === connectionId) {
				client.lastkeepalive = Date.now();
				result = client.connection;
			}
		});

		return result;
	}
}

export const webSocketsWatcher = new WebSocketsWatcher();
