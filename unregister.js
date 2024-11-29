const { REST, Routes } = require('discord.js');

const config = require('./config.js');

const token = config.discordToken
const clientid = config.discordGuildId

const rest = new REST().setToken(token);

rest.delete(Routes.applicationCommand(clientid, '1310435241340571730'))
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);
// });