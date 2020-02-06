import EventEmitter from 'events';
import path from 'path';
import fs from 'fs';

import { logLine } from '../shared/index';

const storageName = 'storage.json';

class TaskQueue extends EventEmitter {
	constructor() {
		super();
		this.queue = [];
		this.isTaskRunning = false;
	}

	addTask(task) {
		this.queue.push(task);
		this.runNextTask();
	}

	runNextTask() {
		logLine('this.isTaskRunning', this.isTaskRunning);

		if (!this.isTaskRunning) {
			if (this.queue.length > 0) {
				const firstTask = this.queue.shift();
				const taskPromise = firstTask();
				this.isTaskRunning = true;

				return taskPromise
					.then(id => {
						logLine('Task succeed');
						this.isTaskRunning = false;
						this.emit('done', id);
						this.runNextTask();
					})
					.catch(err => {
						logLine('Task error: ', err);
						this.isTaskRunning = false;
						this.emit('error');
						this.runNextTask();
					});
			}
		}
		return Promise.resolve();
	}
}

export const taskQueue = new TaskQueue();

/**
 * Storage is a single-for-all-users JSON file. That means:
 * 1) We should update it asynchronously, as it's not a util
 * 2) The file is accessed by many users so it's update must be managed in precedence of incoming requests one-by-one
 * 3) As it's JSON, it can't be appended
 */
export const updateStorage = newFileData => {
	logLine('in updateStorage');

	const task = () =>
		new Promise((resolve, reject) => {
			const storagePath = path.join(
				__dirname,
				'../',
				'public',
				storageName
			);

			fs.readFile(storagePath, (readErr, data) => {
				if (readErr) {
					logLine('Error reading storage', readErr);
					reject(readErr);
				}

				const storage = JSON.parse(data);
				logLine('storage', storage);
				storage.uploads.push(newFileData);

				fs.writeFile(storagePath, JSON.stringify(storage), writeErr => {
					if (writeErr) {
						logLine('Error writing storage', writeErr);
						reject(writeErr);
					}

					logLine('Storage has been updated!');
					resolve(newFileData.fileId);
				});
			});
		});

	taskQueue.addTask(task);
};
