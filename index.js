const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const records = require('./commands/utility/records');
const { getApp } = require('firebase/app');
const { getDatabase, set, ref } = require('firebase/database');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const config = require('./config.js');

const token = config.discordToken;

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	console.log(`Serving ${readyClient.guilds.cache.size} servers`);
	const activities = [
		{ name: 'ortracker.app', type: ActivityType.Watching },
		{ name: '/records', type: ActivityType.Listening }
	];
	let activityIndex = 0;

	setInterval(() => {
		readyClient.user.setPresence({
			activities: [activities[activityIndex]],
			status: 'dnd'
		});
		activityIndex = (activityIndex + 1) % activities.length;
	}, 6000);
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()){
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	};
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.commandName = 'records'){
		if (interaction.isButton()) {
			await records.execute(interaction);
		} else if (interaction.isModalSubmit()) {
			await records.execute(interaction);
		} else if (interaction.isStringSelectMenu()) {
			await records.execute(interaction);
		}
	}
});
client.on('guildCreate', async guild => {
	const app = getApp();
	const db = getDatabase(app);
	await set(ref(db, '/info'), {
		'servers': client.guilds.cache.size
	});
});
client.on('guildDelete', async guild => {
	const app = getApp();
	const db = getDatabase(app);
	await set(ref(db, '/info'), {
		'servers': client.guilds.cache.size
	});
});
client.on('guildMemberAdd', async member => {
	const targetGuildId = '1246657656270356541';
	const roleId = '1246657656270356542';

	try {
		if (member.guild.id === targetGuildId) {
			const role = member.guild.roles.cache.get(roleId);
			if (role) {
				await member.roles.add(role);
				console.log(`Assigned role ${role.name} to user ${member.user.tag}`);
			} else {
				console.error(`Role with ID ${roleId} not found in guild ${targetGuildId}`);
			}
		}
	} catch (error) {
		console.error(error);
	}
});

client.login(token);