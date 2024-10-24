const fs = require('node:fs');
const { apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId } = require('../../config.json');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { log } = require('node:console');
const { secureHeapUsed } = require('node:crypto');
const { permission } = require('node:process');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, child, update, remove } = require('firebase/database');

const firebaseConfig = {
    apiKey: apiKey,
    authDomain: authDomain,
    databaseURL: databaseURL,
    projectId: projectId,
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId,
    appId: appId
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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
                .setName('tools')
                .setDescription('Multiple tools to manage the database.')),

    generateRandomId: () => {
        return crypto.randomBytes(16).toString('hex');
    },

    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'records') {
            if (interaction.options.getSubcommand() === 'search') {
                await this.search(interaction);
            } else if (interaction.options.getSubcommand() === 'tools') {
                await this.tools(interaction);
            }
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === "searchRecord") {
                await this.search(interaction);
            } else if (interaction.customId === "addRecord") {
                await this.tools(interaction);
            } else if (interaction.customId === "modifyRecord") {
                await this.tools(interaction);
            } else if (interaction.customId === "ChangeTitle" || interaction.customId === "ChangeDescription") {
                await this.tools(interaction);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === "addRecordModal") {
                await this.tools(interaction);
            } else if (interaction.customId === "editRecordModal") {
                await this.tools(interaction);
            } else if (interaction.customId === "deleteRecordModal") {
                await this.tools(interaction);
            } else if (interaction.customId === "searchRecordModal") {
                await this.search(interaction);
            } else if (interaction.customId === "AddTitleModal" || interaction.customId === "AddDescriptionModal") {
                await this.tools(interaction);
            }
        } else if (interaction.isStringSelectMenu()) {
            await this.tools(interaction);
        }
    },
    async search(interaction) {
        const Recordsnapshot = await get(child(ref(db), '/records'));
        const records = Recordsnapshot.val();
        Permissionsnapshot = await get(child(ref(db), '/permission'));
        const permission = Permissionsnapshot.val();

        if (interaction.isChatInputCommand()) {
            const record = interaction.options.getString('record');
            const SearchEmbed = new EmbedBuilder()
                .setColor(0x4fcf6d)
                .setTitle(`<:medal:1295467247971602492> Results for records`)
                .setDescription(`Here are the results for record called: ${record}.`)
                .setTimestamp()
                .setFooter({ text: 'Records Tracker' });

            let recordsFound = [];
            for (const [key, value] of Object.entries(records)) {
                Name = value.name.toLowerCase()
                if (Name.includes(record)) {
                    recordsFound.push(key);
                }
            }
            if (recordsFound.length > 0) {
                for (const key of recordsFound) {
                    const value = records[key];
                    SearchEmbed.addFields({ name: value.name, value: value.description + '\n' + key });
                }
            } else {
                SearchEmbed.addFields({ name: 'No records found.', value: 'Try searching with another term.' });
            }
            await interaction.reply({ embeds: [SearchEmbed] });
        } else if (interaction.isButton()) {
            log(interaction);
        }
    },
    async tools(interaction) {
        const Recordsnapshot = await get(child(ref(db), '/records'));
        const records = Recordsnapshot.val();
        Permissionsnapshot = await get(child(ref(db), '/permission'));
        const permission = Permissionsnapshot.val();

        const ToolsEmbed = new EmbedBuilder()
            .setColor(0x4fcf6d)
            .setTitle(`<:medal:1295467247971602492> Tools for records`)
            .setFields({ name: 'Tools:', value: 'Select a tool from the dropdown menu below.' })
            .setTimestamp()
            .setFooter({ text: 'Records Tracker' });

        const ToolsSelect = new StringSelectMenuBuilder()
            .setCustomId("toolsSelect")
            .setPlaceholder("Select a tool")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("Add a record")
                    .setValue("addRecord")
                    .setDescription("Add a record to the database."),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Search for a record")
                    .setValue("searchRecord")
                    .setDescription("Search for a record in the database."),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Edit a record")
                    .setValue("editRecord")
                    .setDescription("Edit a record in the database."),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Delete a record")
                    .setValue("deleteRecord")
                    .setDescription("Delete a record from the database."),
                new StringSelectMenuOptionBuilder()
                    .setLabel("List your records")
                    .setValue("listRecords")
                    .setDescription("List your records in the database."),
            );

        const ToolsRow = new ActionRowBuilder().addComponents(ToolsSelect);

        const addRecordModal = new ModalBuilder()
            .setCustomId("addRecordModal")
            .setTitle("Add a record")
                addRecordModal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("name")
                            .setLabel("Name")
                            .setPlaceholder("Enter the name of the record.")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("description")
                            .setLabel("Description")
                            .setPlaceholder("Enter the description of the record.")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                );

        const searchRecordModal = new ModalBuilder()
            .setCustomId("searchRecordModal")
            .setTitle("Search for a record")
                searchRecordModal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("name")
                            .setLabel("Name")
                            .setPlaceholder("Enter the name of the record.")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short),
                    ),
                );

        const deleteRecordModal = new ModalBuilder()
            .setCustomId("deleteRecordModal")
            .setTitle("Delete a record")
                deleteRecordModal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("id")
                            .setLabel("ID")
                            .setPlaceholder("Enter the name of the record.")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short),
                    ),
                );

        const editRecordModal = new ModalBuilder()
            .setCustomId("editRecordModal")
            .setTitle("Edit a record")
                editRecordModal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("id")
                            .setLabel("ID")
                            .setPlaceholder("Enter the name of the record.")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short),
                    ),
                );

        const ListEmbed = new EmbedBuilder()
            .setColor(0x4fcf6d)
            .setTitle(`<:medal:1295467247971602492> List of records`)
            .setDescription(`Here is a list of all the records registered by you.\nThey are listed below using the format: Name, Description, ID.`)
            .setTimestamp()
            .setFooter({ text: 'Records Tracker' });
        
        if (interaction.isChatInputCommand()) {
            if (interaction.options.getSubcommand() === 'tools') {
                if (permission.admin.includes(interaction.user.id)) {
                    ToolsSelect.addOptions(
                        new StringSelectMenuOptionBuilder()
                        .setLabel("Export records")
                        .setValue("exportRecords")
                        .setDescription("Export all records from the database."),
                    );
                }
                await interaction.reply({ embeds: [ToolsEmbed], components: [ToolsRow] });
            }
        } else if (interaction.isButton()) {
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
            const AddTitleModal = new ModalBuilder()
                .setCustomId("AddTitleModal")
                .setTitle("My Modal")
                    AddTitleModal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId("title")
                                .setLabel("Title")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                    );
            if (interaction.customId === "ChangeTitle") {
                await interaction.showModal(AddTitleModal);
            }
            if (interaction.customId === "ChangeDescription") {
                await interaction.showModal(AddDescriptionModal);
            }
            if (interaction.customId === "addRecord") {
                const UploadEmbed = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`<:medal:1295467247971602492> Add a record`)
                    .setDescription(`Adding record to database...`)
                    .setTimestamp()
                    .setFooter({ text: 'Records Tracker' });
                await interaction.update({ embeds: [UploadEmbed], components: [] });
                const name = interaction.message.embeds[0].fields[0].value;
                const description = interaction.message.embeds[0].fields[1].value;
                const id = this.generateRandomId();
                await set(ref(db, 'records/' + id), {
                    name: name,
                    description: description,
                    owner: interaction.user.id
                });
                UploadEmbed.setDescription(`Record ${name} has been added to the database with ID:\n${id}.`);
                await interaction.editReply({ embeds: [UploadEmbed], components: [] });
            }
            if (interaction.customId === "modifyRecord"){
                const EditEmbed = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`<:medal:1295467247971602492> Edit a record`)
                    .setDescription(`Editing the record in the database...`)
                    .setTimestamp()
                    .setFooter({ text: 'Records Tracker' });
                await interaction.update({ embeds: [EditEmbed], components: [] });
                const name = interaction.message.embeds[0].fields[0].value;
                const description = interaction.message.embeds[0].fields[1].value;
                const id = interaction.message.embeds[0].footer.text;
                await update(ref(db, 'records/' + id), {
                    name: name,
                    description: description,
                    owner: interaction.user.id
                });
                EditEmbed.setDescription(`Record ${name} (${id}) has been edited in the database.`);
                await interaction.editReply({ embeds: [EditEmbed], components: [] });
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === "AddTitleModal") {
                let title = interaction.fields.getTextInputValue("title");
                const embed = EmbedBuilder.from(interaction.message.embeds[0]);
                embed.data.fields[0].value = title;
                const row = ActionRowBuilder.from(interaction.message.components[0]);
                await interaction.update({ embeds: [embed], components: [row] });
            }
            if (interaction.customId === "AddDescriptionModal") {
                let description = interaction.fields.getTextInputValue("description");
                description = description.replace(/\n/g, ' ');
                const embed = EmbedBuilder.from(interaction.message.embeds[0]);
                embed.data.fields[1].value = description;
                const row = ActionRowBuilder.from(interaction.message.components[0]);
                await interaction.update({ embeds: [embed], components: [row] });
            }
            if (interaction.customId === "addRecordModal") {
                const name = interaction.fields.getTextInputValue("name");
                const description = interaction.fields.getTextInputValue("description");
                const AddEmbedModal = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`<:medal:1295467247971602492> Add a record`)
                    .setFields(
                        { name: 'Name:', value: name },
                        { name: 'Description:', value: description }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Records Tracker' });
           
                const ChangeTitle = new ButtonBuilder()
                    .setCustomId("ChangeTitle")
                    .setLabel("Modify the title")
                    .setStyle(ButtonStyle.Primary);            
    
                const ChangeDescription = new ButtonBuilder()
                    .setCustomId("ChangeDescription")
                    .setLabel("Modify the description")
                    .setStyle(ButtonStyle.Primary);
        
                const UploadRecord = new ButtonBuilder()
                    .setCustomId("addRecord")
                    .setLabel('Add the record')
                    .setStyle(ButtonStyle.Primary)
        
                const addRowModal = new ActionRowBuilder()
                    .addComponents(ChangeTitle, ChangeDescription, UploadRecord);
    
                await interaction.reply({ embeds: [AddEmbedModal], components: [addRowModal], ephemeral: true });
            }
            if (interaction.customId === "editRecordModal") {
                const id = interaction.fields.getTextInputValue("id");
                record = records[id]
                const EditEmbedModal = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`<:medal:1295467247971602492> Edit a record`)
                    .setFields(
                        { name: 'Name:', value: record.name },
                        { name: 'Description:', value: record.description }
                    )
                    .setTimestamp()
                    .setFooter({ text: id });

                const ChangeTitle = new ButtonBuilder()
                    .setCustomId("ChangeTitle")
                    .setLabel("Modify the title")
                    .setStyle(ButtonStyle.Primary);
                
                const ChangeDescription = new ButtonBuilder()
                    .setCustomId("ChangeDescription")
                    .setLabel("Modify the description")
                    .setStyle(ButtonStyle.Primary);
        
                const UploadRecord = new ButtonBuilder()
                    .setCustomId("modifyRecord")
                    .setLabel('Modify the record')
                    .setStyle(ButtonStyle.Primary)
        
                const addRowModal = new ActionRowBuilder()
                    .addComponents(ChangeTitle, ChangeDescription, UploadRecord);

                await interaction.reply({ embeds: [EditEmbedModal], components: [addRowModal], ephemeral: true });
            }
            if (interaction.customId === "deleteRecordModal") {
                const id = interaction.fields.getTextInputValue("id");
    
                const DeleteEmbedModal = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`<:medal:1295467247971602492> Delete a record`)
                    .setDescription(`Deleting record from database...`)
                    .setTimestamp()
                    .setFooter({ text: 'Records Tracker' });
    
                await interaction.reply({ embeds: [DeleteEmbedModal], ephemeral: true });
                if (records === null) {
                    DeleteEmbedModal.setDescription(`No record with id: *${id}* was found.`);
                    await interaction.editReply({ embeds: [DeleteEmbedModal], ephemeral: true });
                } else {
                    DeleteEmbedModal.setDescription(`Record ${record.name} (${id}) has been deleted from the database.`);
                    await remove(ref(db, 'records/' + id));
                    await interaction.editReply({ embeds: [DeleteEmbedModal], ephemeral: true });
                }
            }
            if (interaction.customId === "searchRecordModal") {
                const name = interaction.fields.getTextInputValue("name");
                const snapshot = await get(child(ref(db), '/records'));
                const records = snapshot.val();
                let recordsFound = [];
                for (const [key, value] of Object.entries(records)) {
                    if (value.name.includes(name)) {
                        recordsFound.push(key);
                    }
                }
                const SearchEmbed = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`<:medal:1295467247971602492> Results for records`)
                    .setDescription(`Here are the results for record called: ${name}.`)
                    .setTimestamp()
                    .setFooter({ text: 'Records Tracker' });
                if (recordsFound.length > 0) {
                    for (const key of recordsFound) {
                        const value = records[key];
                        SearchEmbed.addFields({ name: value.name, value: value.description + '\n' + key });
                    }
                } else {
                    SearchEmbed.addFields({ name: 'No records found.', value: 'Try searching with another term.' });
                }
                await interaction.reply({ embeds: [SearchEmbed], ephemeral: true });
            }
        } else if (interaction.isStringSelectMenu()) {
            const selectedValue = interaction.values[0];
            if (selectedValue === "addRecord"){
                await interaction.showModal(addRecordModal);
            }
            if (selectedValue === "searchRecord"){
                await interaction.showModal(searchRecordModal);
            }
            if (selectedValue === "editRecord"){
                await interaction.showModal(editRecordModal);
            }
            if (selectedValue === "deleteRecord"){
                await interaction.showModal(deleteRecordModal);
            }
            if (selectedValue === "listRecords"){
                const snapshot = await get(child(ref(db), '/records'));
                const records = snapshot.val();
                let recordsFound = [];
                for (const [key, value] of Object.entries(records)) {
                    if (value.owner === interaction.user.id) {
                        recordsFound.push(key);
                    }
                }
                if (recordsFound.length > 0) {
                    for (const key of recordsFound) {
                        const value = records[key];
                        ListEmbed.addFields({ name: value.name, value: value.description + '\n' + key });
                    }
                } else {
                    ListEmbed.addFields({ name: 'No records found.', value: 'Try searching with another term.' });
                }
                await interaction.reply({ embeds: [ListEmbed], ephemeral: true });
            }
            if (selectedValue === "exportRecords"){
                const snapshot = await get(child(ref(db), '/permission'));
                const permission = snapshot.val();
                const admin = permission.admin;
                if (admin.includes(interaction.user.id)) {
                    const snapshot = await get(child(ref(db), '/records'));
                    const records = snapshot.val();
                    fs.mkdirSync('./temp', { recursive: true });
                    fs.writeFileSync('./temp/records.json', JSON.stringify(records, null, 2));
                    await interaction.reply({ content: "Records have been exported.", files: ['./temp/records.json'], ephemeral: true });
                    fs.rmSync('./temp', { recursive: true });
                } else {
                    await interaction.reply({ content: "You do not have permission to export the records.", ephemeral: true });
                }
            }
        }
    }
};