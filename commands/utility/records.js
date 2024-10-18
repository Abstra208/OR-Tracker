const fs = require('node:fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { log } = require('node:console');

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
                .addStringOption(option => option.setName('record').setDescription('Record to add.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test subcommand.')),

    async execute(interaction) {
        records = fs.readFileSync('./records.json');
        recordsObj = JSON.parse(records);
        const record = interaction.options.getString('record');
        const SearchEmbed = new EmbedBuilder()
            .setColor(0x4fcf6d)
            .setTitle(`<:medal:1295467247971602492> Results for records`)
            .setDescription(`Here are the results for record called: ${record}.`)
            .setTimestamp()
            .setFooter({ text: 'Records Tracker' });
        
        const AddEmbed = new EmbedBuilder()
            .setColor(0x4fcf6d)
            .setTitle(`<:medal:1295467247971602492> Add a record`)
            .setFields({ name: 'Name:', value: record })
            .setTimestamp()
            .setFooter({ text: 'Records Tracker' });

        const addDescription = new ButtonBuilder()
            .setCustomId("addDescription")
            .setLabel("Add a description")
            .setStyle(ButtonStyle.Primary);

        const addRecord = new ButtonBuilder()
            .setCustomId("addRecord")
            .setLabel('Add a record')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const addRow = new ActionRowBuilder()
            .addComponents(addDescription, addRecord);

        if (interaction.isChatInputCommand()){
            if (interaction.options.getSubcommand() === 'search') {
                for (const [key, value] of Object.entries(recordsObj)) {
                    if (key.includes(record)) {
                        log(`Found record: ${key}`);
                        SearchEmbed.addFields({ name: key, value: value.description });
                    } else {
                        log(`No record found for: ${key}`);
                    }
                }
                await interaction.reply({ embeds: [SearchEmbed] });
            } else if (interaction.options.getSubcommand() === 'add') {
                await interaction.reply({ embeds: [AddEmbed] , components: [addRow], ephemeral: true });
            } else if (interaction.options.getSubcommand() === 'test') {
                await interaction.reply({ content: 'Testing subcommand.' });
            }
        };
    },
    async handleButtonInteraction(interaction) {
        if (interaction.customId === "addDescription") {
            const AddDescriptionModal = new ModalBuilder()
                .setCustomId("AddDescriptionModal")
                .setTitle("My Modal")
                    AddDescriptionModal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId("description")
                                .setLabel("Description")
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        ),
                    );
            await interaction.showModal(AddDescriptionModal);
        }
        if (interaction.customId === "addRecord") {
            await interaction.update({ content: "Adding record to the database...", embeds: [], components: [] });
            const name = interaction.message.embeds[0].fields[0].value;
            let description = interaction.message.embeds[0].fields[1].value;
            const owner = interaction.user;
            records = fs.readFileSync('./records.json');
            recordsObj = JSON.parse(records);
            recordsObj[name] = { description: description, owner: owner.id };
            fs.writeFileSync('./records.json', JSON.stringify(recordsObj, null, 2));
            log(`Record '${name}' has been added to the database with a description of '${description}' by '${owner}'.`);
            await interaction.editReply({ content: `Record **${name}** has been added to the database.`, embeds: [], components: [] });
        }
    },
    async handleModalSubmit(interaction) {
        if (interaction.customId === "AddDescriptionModal") {
            let description = interaction.fields.getTextInputValue("description");
            description = description.replace(/\n/g, ' ');
            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            if (embed.data.fields.length < 2) {
                embed.addFields({ name: "Description", value: description });
            } else {
                embed.data.fields[1].value = description;
            }
            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[1].setDisabled(false);
            await interaction.update({ embeds: [embed], components: [row] });
		}
    }
};