const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');

const rest = new REST().setToken(token);

rest.delete(Routes.applicationCommand(clientId, '1298653399608197121'))
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);
// });