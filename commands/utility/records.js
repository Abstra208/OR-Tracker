const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('records')
        .setDescription('Search for or add a record to the database.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search for a record in the database.')
                .addStringOption(option => option.setName('record').setDescription('Record to search for.').setRequired(true)))

        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a record to the database.')
                .addStringOption(option => option.setName('record').setDescription('Record to add.').setRequired(true))),

    async execute(interaction) {
        const exampleEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Records Search')
            .setAuthor({ name: 'Records Tracker', iconURL: 'https://cdn.discordapp.com/app-icons/1294873348387635230/8874dd344c52f3bf66fccee74ab781f1.png', url: 'https://bots.abstra208.com/record-tracker' })
            .setDescription('This is a test embed for the records search command.')
            .setTimestamp();

        const addDescription = new ButtonBuilder()
            .setCustomId('addDescription')
            .setLabel('Add a description')
            .setStyle(ButtonStyle.Primary);

        const addRecord = new ButtonBuilder()
            .setCustomId('addRecord')
            .setLabel('Add a record')
            .setStyle(ButtonStyle.Primary);

        const addRow = new ActionRowBuilder()
            .addComponents(addDescription, addRecord);
        
        if (interaction.options.getSubcommand() === 'search') {
            const record = interaction.options.getString('record');
            await interaction.reply({ content: `Searching for records ${record}`, embeds: [exampleEmbed] });
        } else if (interaction.options.getSubcommand() === 'add') {
            const record = interaction.options.getString('record');
            await interaction.reply({ content: `Adding record called ${record}`, components: [addRow] });
        }
	},
};