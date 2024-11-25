const fs = require('node:fs');
const { apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId } = require('../../config.json');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, client, time, TimestampStyles } = require('discord.js');
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
                .setDescription('Multiple tools to manage the database.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('register')
                .setDescription('Register a new record or update one. (Admin verification is required)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Provide links and informations to help you get started with the bot.'),),

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
            } else if (interaction.options.getSubcommand() === 'register') {
                await this.register(interaction);
            } else if (interaction.options.getSubcommand() === 'help') {
                await this.help(interaction);
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
            } else if (interaction.customId === 'registerrecord' || interaction.customId === 'updaterecord') {
                await this.register(interaction);
            } else if (interaction.customId === 'Racceptregister' || interaction.customId === 'Rdeclineregister') {
                await this.register(interaction);
            } else if (interaction.customId === 'Uacceptregister' || interaction.customId === 'Udeclineregister') {
                await this.register(interaction);
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
            } else if (interaction.customId === 'registerModal' || interaction.customId === 'updateModal' || interaction.customId === 'acceptmodalupdate' || interaction.customId === 'declinemodalupdate') {
                await this.register(interaction);
            }
        } else if (interaction.isStringSelectMenu()) {
            await this.tools(interaction);
        }
    },
    async help(interaction) {
        const HelpEmbed = new EmbedBuilder()
            .setColor(0x4fcf6d)
            .setTitle(`Help for records`)
            .setDescription(`Here are some useful links and informations to help you get started with the bot.`)
            .setTimestamp()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
            .addFields(
                { name: '/record search', value: 'Search for a record in the database.', inline: true },
                { name: '/record tools', value: 'Multiple tools to manage the database.', inline: true },
                { name: '/record register', value: 'Register a new record or update one. (Admin verification is required)', inline: true },
                { name: '/record help', value: 'Provide links and informations to help you get started with the bot.' },
            )
        const WebsiteButton = new ButtonBuilder()
            .setLabel('OR Tracker Website')
            .setStyle(ButtonStyle.Link)
            .setURL("https://ortracker.app")
        const DiscordButton = new ButtonBuilder()
            .setLabel('OR Tracker Discord')
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.gg/qHt6dKqTJ3")
        const Helprow = new ActionRowBuilder().addComponents(WebsiteButton, DiscordButton);
        await interaction.reply({ embeds: [HelpEmbed], components: [Helprow] });
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
                .setTitle(`Results for records`)
                .setDescription(`Here are the results for record called: ${record}.`)
                .setTimestamp()
                .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })

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
            .setTitle(`Tools for records`)
            .setFields({ name: 'Tools:', value: 'Select a tool from the dropdown menu below.' })
            .setTimestamp()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })

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
            .setTitle(`List of records`)
            .setDescription(`Here is a list of all the records registered by you.\nThey are listed below using the format: Name, Description, ID.`)
            .setTimestamp()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
        
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
                    .setTitle(`Add a record`)
                    .setDescription(`Adding record to database...`)
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
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
                    .setTitle(`Edit a record`)
                    .setDescription(`Editing the record in the database...`)
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
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
                    .setTitle(`Add a record`)
                    .setFields(
                        { name: 'Name:', value: name },
                        { name: 'Description:', value: description }
                    )
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
           
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
                    .setTitle(`Edit a record`)
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
                    .setTitle(`Delete a record`)
                    .setDescription(`Deleting record from database...`)
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
    
                await interaction.reply({ embeds: [DeleteEmbedModal], ephemeral: true });
                if (records === null) {
                    DeleteEmbedModal.setDescription(`No record with id: *${id}* was found.`);
                    await interaction.editReply({ embeds: [DeleteEmbedModal], ephemeral: true });
                } else {
                    DeleteEmbedModal.setDescription(`Record ${records[id].name} (${id}) has been deleted from the database.`);
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
                    .setTitle(`Results for records`)
                    .setDescription(`Here are the results for record called: ${name}.`)
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
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
    },
    async register(interaction) {
        const records = (await get(child(ref(db), '/records'))).val();
        const awaitRegistration = (await get(child(ref(db), '/awaitRegistration'))).val();
        const awaitUpdate = (await get(child(ref(db), '/awaitUpdate'))).val();
        const registerEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
            .setColor(0x4fcf6d)
            .setTitle(`Register or update a record`)
            .setDescription(`Click on one of the button below to register or update a record.`)
            .setTimestamp()

        const registerButton = new ButtonBuilder()
            .setCustomId("registerrecord")
            .setLabel('Register a new record')
            .setStyle(ButtonStyle.Primary)

        const updateButton = new ButtonBuilder()
            .setCustomId('updaterecord')
            .setLabel('Update a new record')
            .setStyle(ButtonStyle.Primary)

        const registerRow = new ActionRowBuilder().addComponents(
            registerButton, updateButton
        )

        const registerModal = new ModalBuilder()
            .setCustomId("registerModal")
            .setTitle("Register a record")
                registerModal.addComponents(
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
                            .setRequired(true),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("link")
                            .setLabel("Verification Link")
                            .setPlaceholder("Enter a link to verify the record. (Youtube, Twitch, etc.)")
                            .setStyle(TextInputStyle.Short),
                    ),
                );

        const updateModal = new ModalBuilder()
            .setCustomId("updateModal")
            .setTitle("Update a record")
                updateModal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("id")
                            .setLabel("ID")
                            .setPlaceholder('Enter the ID of the record.')
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("reason")
                            .setLabel("Update reason")
                            .setPlaceholder("Enter how we could update the record.")
                            .setStyle(TextInputStyle.Paragraph),
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("link")
                            .setLabel("Verification Link")
                            .setPlaceholder("Enter any proof needed to verify the update. (Youtube, Twitch, etc.)")
                            .setStyle(TextInputStyle.Short),
                    ),
                );

        const ThreadEmbed = new EmbedBuilder()
            .setColor(0x4fcf6d)
            .setTitle(`Thread created`)
            .setDescription(`A thread has been created for you to discuss the record.`)
            .setTimestamp()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })

        const RaccepteregisterButton = new ButtonBuilder()
            .setCustomId("Racceptregister")
            .setLabel('Accept the record')
            .setStyle(ButtonStyle.Success)

        const RdeclineregisterButton = new ButtonBuilder()
            .setCustomId('Rdeclineregister')
            .setLabel('Decline the record')
            .setStyle(ButtonStyle.Danger)

        const UacceptregisterButton = new ButtonBuilder()
            .setCustomId("Uacceptregister")
            .setLabel('Accept the record')
            .setStyle(ButtonStyle.Success)
            
        const UdeclineregisterButton = new ButtonBuilder()
            .setCustomId('Udeclineregister')
            .setLabel('Decline the record')
            .setStyle(ButtonStyle.Danger)

        const OptionregisterRow = new ActionRowBuilder().addComponents(RaccepteregisterButton, RdeclineregisterButton);
        const OptionupdateRow = new ActionRowBuilder().addComponents(UacceptregisterButton, UdeclineregisterButton);

        if (interaction.isChatInputCommand()) {
            await interaction.reply({ embeds: [registerEmbed], components: [registerRow] })
        } else if (interaction.isButton()) {
            if (interaction.customId === 'registerrecord') {
                await interaction.showModal(registerModal);
            } else if (interaction.customId === 'updaterecord') {
                await interaction.showModal(updateModal);
            } else if (interaction.customId === 'Racceptregister') {
                const id = interaction.message.embeds[0].fields[4].value;
                const record = awaitRegistration[id];
                const owner = record.person;
                const user = await interaction.client.users.fetch(owner);
                const ThreadId = await interaction.channelId;
                const thread = await interaction.client.channels.fetch(ThreadId);
                const date = new Date();

                await set(ref(db, 'records/' + id), {
                    name: record.name,
                    description: record.description,
                    link: record.link,
                    owner: record.person,
                    creation: time(date)
                });

                const acceptEmbed = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`Record Accepted`)
                    .setDescription(`One of your records has been accepted.`)
                    .addFields(
                        { name: 'Record:', value: record.name },
                        { name: 'Description:', value: record.description },
                        { name: 'ID:', value: id },
                        { name: 'Date:', value: time(date) }
                    )
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
                
                const serverlink = new ButtonBuilder()
                    .setLabel('OR Tracker server')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://discord.gg/qHt6dKqTJ3");

                const websitelink = new ButtonBuilder()
                    .setLabel('OR Tracker Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://ortracker.app");
                
                const userrow = new ActionRowBuilder().addComponents(serverlink, websitelink);

                await remove(ref(db, 'awaitRegistration/' + id));
                await user.send({ embeds: [acceptEmbed], components: [userrow] });
                await interaction.update({ content: `Record ${record.name} has been accepted. This thread will get deleted in 5 seconds`, embeds: [], components: [] });
                await new Promise(resolve => setTimeout(resolve, 5000));
                await thread.delete();
            } else if (interaction.customId === 'Rdeclineregister') {
                const id = interaction.message.embeds[0].fields[4].value;
                const record = awaitRegistration[id];
                const owner = record.person;
                const user = await interaction.client.users.fetch(owner);
                const ThreadId = await interaction.channelId;
                const thread = await interaction.client.channels.fetch(ThreadId);
                const date = new Date();

                const declineEmbed = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`Record declined`)
                    .setDescription(`One of your records has been declined.\nIf you have any questions, please contact an admin.`)
                    .addFields(
                        { name: 'Record:', value: record.name },
                        { name: 'ID:', value: id },
                        { name: 'Date:', value: time(date) }
                    )
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
                
                const serverlink = new ButtonBuilder()
                    .setLabel('OR Tracker server')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://discord.gg/qHt6dKqTJ3");

                const websitelink = new ButtonBuilder()
                    .setLabel('OR Tracker Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://ortracker.app");
                
                const userrow = new ActionRowBuilder().addComponents(serverlink, websitelink);
                
                await user.send({ embeds: [declineEmbed], components: [userrow] });
                await interaction.update({ content: `Record ${record.name} has been declined. This thread will get deleted in 5 seconds`, embeds: [], components: [] });
                await remove(ref(db, 'awaitRegistration/' + id));
                await new Promise(resolve => setTimeout(resolve, 5000));
                await thread.delete();
            } else if (interaction.customId === 'Uacceptregister') {
                const id = interaction.message.embeds[0].fields[5].value;

                const AcceptModalUpdate = new ModalBuilder()
                    .setCustomId("acceptmodalupdate")
                    .setTitle("Update a record")
                        AcceptModalUpdate.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("name")
                                    .setLabel("Update the name")
                                    .setPlaceholder("Enter the new name of the record from the update reason.")
                                    .setStyle(TextInputStyle.Short)
                                    .setValue(records[id].name),
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("description")
                                    .setLabel("Update the description")
                                    .setPlaceholder("Enter the new description of the record from the update reason.")
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setValue(records[id].description),
                            ),
                        );

                await interaction.showModal(AcceptModalUpdate);

            } else if (interaction.customId === "Udeclineregister") {
                const id = interaction.message.embeds[0].fields[5].value;
                
                const DeclineModalUpdate = new ModalBuilder()
                    .setCustomId("declinemodalupdate")
                    .setTitle("Update a record")
                        DeclineModalUpdate.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("reason")
                                    .setLabel("Decline reason")
                                    .setPlaceholder("Enter the reason for declining the update.")
                                    .setStyle(TextInputStyle.Paragraph),
                            ),
                        );

                await interaction.showModal(DeclineModalUpdate);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'registerModal') {
                const name = interaction.fields.getTextInputValue("name");
                const description = interaction.fields.getTextInputValue('description');
                const link = interaction.fields.getTextInputValue('link');
                const id = this.generateRandomId();
                const channelID = '1299763314816974929';
                const channel = await interaction.client.channels.fetch(channelID);
                await set(ref(db, 'awaitRegistration/' + id), {
                    name: name,
                    description: description,
                    link: link,
                    person: interaction.user.id
                });
                ThreadEmbed.addFields(
                    { name: 'Record:', value: name },
                    { name: 'Description:', value: description },
                    { name: 'Link:', value: link },
                    { name: 'Person', value: `<@!${interaction.user.id}>` },
                    { name: 'ID:', value: id }
                );
                channel.threads.create({
                    name: `Creation of record ${name}`,
                    autoArchiveDuration: 60,
                    reason: `Verification for record ${name} with ID: ${id}.`,
                    message: { content: `New record ${name} is waiting review by an admin`, embeds: [ThreadEmbed], components: [OptionregisterRow] }
                });
                await interaction.reply({ content: `Thank you for your submission. Record ${name} has been added to the verification list for admin review. This process may take up to two business days.`, ephemeral: true });
            } else if (interaction.customId === 'updateModal') {
                const id = interaction.fields.getTextInputValue("id");
                const reason = interaction.fields.getTextInputValue('reason');
                const link = interaction.fields.getTextInputValue('link');
                const channelID = '1299763314816974929';
                const channel = await interaction.client.channels.fetch(channelID);
                if (records.hasOwnProperty(id)) {
                    await set(ref(db, 'awaitUpdate/' + id), {
                        reason: reason,
                        person: interaction.user.id,
                        link: link
                    });
                    ThreadEmbed.addFields(
                        { name: 'Record:', value: records[id].name },
                        { name: 'Description:', value: records[id].description },
                        { name: 'Owner', value: `<@!${records[id].owner}>` },
                        { name: 'Update reason', value: `${reason}` },
                        { name: 'Person', value: `<@!${interaction.user.id}>` },
                        { name: 'ID:', value: id }
                    );
                    channel.threads.create({
                        name: `Update of record ${records[id].name}`,
                        autoArchiveDuration: 60,
                        reason: `Update for record ${records[id].name} with ID: ${id}.`,
                        message: { content: `Record ${records[id].name} is waiting review by an admin`, embeds: [ThreadEmbed], components: [OptionupdateRow] }
                    });
                    await interaction.reply({ content: `Thank you for your submission. Record with id: ${id} has been added to the verification list for admin review. This process may take up to two business days.`, ephemeral: true });
                } else {
                    await interaction.reply({ content: `We couldn't find a record with the ID ${id}. Please check the ID and try again.`, ephemeral: true });
                }
            } else if (interaction.customId === 'acceptmodalupdate') {
                const name = interaction.fields.getTextInputValue("name");
                const description = interaction.fields.getTextInputValue('description');
                const id = interaction.message.embeds[0].fields[5].value;
                const ThreadId = await interaction.channelId;
                const thread = await interaction.client.channels.fetch(ThreadId);
                const record = awaitUpdate[id];
                const owner = record.person;
                const user = await interaction.client.users.fetch(owner);

                await update(ref(db, 'records/' + id), {
                    name: name,
                    description: description
                });

                await remove(ref(db, 'awaitUpdate/' + id));
                await interaction.update({ content: `Update to ${records[id].name} has been accepted. This thread will get deleted in 5 seconds`, embeds: [], components: [] });
                await new Promise(resolve => setTimeout(resolve, 5000));

                const date = new Date();
                const updatedrecord = (await get(child(ref(db), '/records/' + id))).val();

                const acceptEmbed = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`Record Accepted`)
                    .setDescription(`One of your records has been accepted.`)
                    .addFields(
                        { name: 'Record:', value: updatedrecord.name },
                        { name: 'Description:', value: updatedrecord.description },
                        { name: 'ID:', value: id },
                        { name: 'Date:', value: time(date) }
                    )
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })

                const serverlink = new ButtonBuilder()
                    .setLabel('OR Tracker server')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://discord.gg/qHt6dKqTJ3");

                const websitelink = new ButtonBuilder()
                    .setLabel('OR Tracker Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://ortracker.app");
                
                const userrow = new ActionRowBuilder().addComponents(serverlink, websitelink);

                await user.send({ embeds: [acceptEmbed], components: [userrow] });
                await thread.delete();
            } else if (interaction.customId === 'declinemodalupdate') {
                const reason = interaction.fields.getTextInputValue('reason');
                const id = interaction.message.embeds[0].fields[5].value;
                const ThreadId = await interaction.channelId;
                const thread = await interaction.client.channels.fetch(ThreadId);
                const record = awaitUpdate[id];
                const owner = record.person;
                const user = await interaction.client.users.fetch(owner);
                
                await remove(ref(db, 'awaitUpdate/' + id));
                await interaction.update({ content: `Update to ${records[id].name} has been declined. This thread will get deleted in 5 seconds`, embeds: [], components: [] });
                await new Promise(resolve => setTimeout(resolve, 5000));

                const date = new Date();

                const declineEmbed = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`Update declined`)
                    .setDescription(`One of your update has been declined.\nIf you have any questions, please contact an admin.`)
                    .addFields(
                        { name: 'Record:', value: records[id].name },
                        { name: 'Update reason:', value: record.reason },
                        { name: 'Decline reason:', value: reason },
                        { name: 'ID:', value: id },
                        { name: 'Date:', value: time(date) }
                    )
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })

                const serverlink = new ButtonBuilder()
                    .setLabel('OR Tracker server')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://discord.gg/qHt6dKqTJ3");

                const websitelink = new ButtonBuilder()
                    .setLabel('OR Tracker Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://ortracker.app");
                
                const userrow = new ActionRowBuilder().addComponents(serverlink, websitelink);

                await user.send({ embeds: [declineEmbed], components: [userrow] });
                await thread.delete();
            }
        }
    }
};