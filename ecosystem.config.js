module.exports = {
	apps: [
		{
			name: 'File Uploader',
			script: 'preload.js',

			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				PORT: 8000,
				NODE_ENV: 'development'
			},
			env_production: {
				PORT: 8000,
				NODE_ENV: 'production'
			}
		}
	],

	deploy: {
		production: {
			user: 'user',
			host: 'localhost',
			ref: 'origin/master',
			repo: 'git@github.com:vladvshka/file_sharing_service.git',
			path: '/home/user/nodeProjects/file_sharing_service',
			// TODO: add script restoring DB
			// "pre-setup" : "apt-get install git",
			'post-deploy':
				'npm install && pm2 reload ecosystem.config.js --env production'
		}
	}
};
