require("@babel/register")({
	ignore: [/(node_modules)/],
	presets: [
		[
			"@babel/preset-env",
			{
				targets: {
					node: "10.12", // код будет запускаться под Node.js версии 10 и позже
				},
			},
		],
	],
});

require("./index");
require("./utils/webSocketsHelpers");
require("./utils/storageHelpers");
require("./dataBaseService/service");
require("./dataBaseService/models");
