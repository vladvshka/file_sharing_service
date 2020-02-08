import { SESSION_SECRET } from './keys';

export const getSessionConfigs = sessionStore => ({
	secret: SESSION_SECRET,
	resave: false, // Forces the session to be saved back to the session store, even if the session was never modified during the request.
	/**
	 * Forces a session that is "uninitialized" to be saved to the store.
	 * A session is uninitialized when it is new but not modified.
	 * Choosing false is useful for implementing login sessions, reducing server storage usage
	 */
	saveUninitialized: false,
	cookie: { maxAge: 1000 * 30 },
	name: 'session',
	store: sessionStore,
	rolling: true
});
