const fs = require('node:fs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, client, time, TimestampStyles, User } = require('discord.js');
const { AttachmentBuilder } = require('discord.js');
const crypto = require('crypto');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, child, update, remove } = require('firebase/database');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

const config = require('../../config.js');

const firebaseConfig = {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    databaseURL: config.firebaseDatabaseUrl,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.firebaseMessagingSenderId,
    appId: config.firebaseAppId
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
                .setDescription('Provide links and informations to help you get started with the bot.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription("Look into a user's profile.")
                .addUserOption(option => option.setName('user').setDescription('User to get the profile.').setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Look into the record of a user.')
                .addUserOption(option => option.setName('user').setDescription('User to get the record.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get informations about a record.')
                .addStringOption(option => option.setName('id').setDescription('ID from record to get.').setRequired(true))),


    generateRandomId: () => {
        return crypto.randomBytes(16).toString('hex');
    },

    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const badges = (await get(child(ref(db), 'users/' + interaction.user.id + '/badges'))).val();

            // Add beta badge to user **REMOVE WHEN BETA IS OVER**
            if (!badges.includes('beta')) {
                badges.push('beta');
            }
            await update(ref(db, 'users/' + interaction.user.id), {
                username: interaction.user.tag,
                avatar: interaction.user.displayAvatarURL(),
                id: interaction.user.id,
                badges: badges
            });

            if (interaction.commandName === 'records') {
                if (interaction.options.getSubcommand() === 'search') {
                    await this.search(interaction);
                } else if (interaction.options.getSubcommand() === 'tools') {
                    await this.tools(interaction);
                } else if (interaction.options.getSubcommand() === 'register') {
                    await this.register(interaction);
                } else if (interaction.options.getSubcommand() === 'help') {
                    await this.help(interaction);
                } else if (interaction.options.getSubcommand() === 'profile') {
                    await this.profile(interaction);
                } else if (interaction.options.getSubcommand() === 'user') {
                    await this.user(interaction);
                } else if (interaction.options.getSubcommand() === 'info') {
                    await this.info(interaction);
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
            .setTitle('Help for Records')
            .setDescription('Here are some useful links and information to help you get started with the bot.')
            .setTimestamp()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })
            .addFields(
                { name: '/record search', value: 'Search for records in the database.', inline: true },
                { name: '/record user', value: 'View the records of a user.', inline: true },
                { name: '/record tools', value: 'Access various tools to manage the database.', inline: true },
                { name: '/record register', value: 'Register a new record or update an existing one.', inline: true },
                { name: '/record help', value: 'Get links and information to help you get started with the bot.', inline: true },
                { name: '/record profile', value: "View a user's profile.", inline: true },
            );
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

        if (interaction.isChatInputCommand()) {
            const record = interaction.options.getString('record').toLowerCase();
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
        const Permissionsnapshot = await get(child(ref(db), '/permission'));
        const permission = Permissionsnapshot.val();

        const ToolsEmbed = new EmbedBuilder()
            .setColor(0x4fcf6d)
            .setTitle(`Tools for records`)
            .setDescription(`Here are some tools to manage the database.`)
            .setFields(
                { name: 'Register a record', value: 'Register a record to the database.', inline: true },
                { name: 'Edit a record', value: 'Edit a record in the database.', inline: true },
                { name: 'Delete a record', value: 'Delete a record from the database.', inline: true },
                { name: 'List your records', value: 'List your records in the database.', inline: true },
                { name: 'List all records', value: 'List all records in the database.', inline: true },
            )
            .setTimestamp()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })

        const ToolsSelect = new StringSelectMenuBuilder()
            .setCustomId("toolsSelect")
            .setPlaceholder("Select a tool")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("Register a record")
                    .setValue("addRecord")
                    .setDescription("Register a record to the database."),
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
                new StringSelectMenuOptionBuilder()
                    .setLabel("List all records")
                    .setValue("listAllRecords")
                    .setDescription("List all records in the database."),
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
                if (permission.admin.includes(interaction.user.id)) {
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
                } else {
                    await interaction.reply({ content: "You do not have permission to add records.", ephemeral: true });
                }
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
                    description: description
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
                const record = records[id];

                if (record.owner !== interaction.user.id) {
                    if (!permission.admin.includes(interaction.user.id)) {
                        await interaction.reply({ content: "You do not have permission to edit this record.", ephemeral: true });
                        return;
                    }
                }

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
                    .setLabel('Apply changes')
                    .setStyle(ButtonStyle.Success)
        
                const addRowModal = new ActionRowBuilder()
                    .addComponents(ChangeTitle, ChangeDescription, UploadRecord);

                await interaction.reply({ embeds: [EditEmbedModal], components: [addRowModal], ephemeral: true });
            }
            if (interaction.customId === "deleteRecordModal") {
                const id = interaction.fields.getTextInputValue("id");

                if (!permission.admin.includes(interaction.user.id)) {
                    if (records[id].owner !== interaction.user.id) {
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
                    } else {
                        await interaction.reply({ content: "You do not have permission to delete this record.", ephemeral: true });
                    }
                } else {
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
            }
        } else if (interaction.isStringSelectMenu) {
            if (interaction.customId === "listAllRecords"){
                const ListEmbed = new EmbedBuilder()
                    .setColor(0x4fcf6d)
                    .setTitle(`List all records`)
                    .setDescription(`To list all records, go to (ortracker.app)[https://ortracker.app/records].`)
                    .setTimestamp()
                    .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })

                await interaction.reply({ embeds: ListEmbed, ephemeral: true });
            }
            if (interaction.customId === "exportRecords"){
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
    },
    async profile(interaction) {
        if (interaction.isChatInputCommand()) {
            GlobalFonts.registerFromPath(path.join(__dirname, 'assets', 'fonts', 'Bold.ttf'), 'Bold');
            GlobalFonts.registerFromPath(path.join(__dirname, 'assets', 'fonts', 'SemiBold.ttf'), 'Semi');
            const canvas = createCanvas(700, 250);
            const ctx = canvas.getContext('2d');
            const background = await loadImage(path.join(__dirname, 'assets', 'background.png'));

            const user = interaction.options.getUser('user') || interaction.user;
            const userfetch = await interaction.client.users.fetch(user.id);
            const records = (await get(child(ref(db), '/records'))).val();
            const userrecords = [];
            for (const [key, value] of Object.entries(records)) {
                if (value.owner === user.id) {
                    userrecords.push(key);
                }
            }

            const badges = (await get(child(ref(db), 'users/' + userfetch.id + '/badges'))).val();
            await update(ref(db, 'users/' + userfetch.id), {
                username: userfetch.tag,
                avatar: userfetch.displayAvatarURL(),
                id: userfetch.id,
                badges: badges
            });

            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            ctx.font = `48px Bold`;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(userfetch.username.charAt(0).toUpperCase() + userfetch.username.slice(1), canvas.width / 2.5, canvas.height / 3.5);
            ctx.font = `28px Semi`;
            ctx.fillText(`ID: ${user.id}`, canvas.width / 2.5, canvas.height / 2.2);
            ctx.fillText(`Records: ${userrecords.length}`, canvas.width / 2.5, canvas.height / 1.8);
            // Draw user avatar as a circle
            const avatar = await loadImage(userfetch.displayAvatarURL({ format: 'png', size: 512 }));
            ctx.save();
            ctx.beginPath();
            ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 25, 25, 200, 200);
            ctx.restore();

            const userSnapshot = await get(child(ref(db), `users/${userfetch.id}`));
            const userSnapshotVal = userSnapshot.val();
            if (userSnapshot.exists()) {
                if (userSnapshotVal.badges && userSnapshotVal.badges.includes('beta')) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.beginPath();
                    ctx.moveTo(125 + 10, 180);
                    ctx.lineTo(125 + 100 - 10, 180);
                    ctx.quadraticCurveTo(125 + 100, 180, 125 + 100, 180 + 10);
                    ctx.lineTo(125 + 100, 180 + 50 - 10);
                    ctx.quadraticCurveTo(125 + 100, 180 + 50, 125 + 100 - 10, 180 + 50);
                    ctx.lineTo(125 + 10, 180 + 50);
                    ctx.quadraticCurveTo(125, 180 + 50, 125, 180 + 50 - 10);
                    ctx.lineTo(125, 180 + 10);
                    ctx.quadraticCurveTo(125, 180, 125 + 10, 180);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(0, 0, 255, 0.65)';
                    ctx.fill();
                    ctx.font = '30px Bold';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('Beta', 145, 215);
                    ctx.restore();
                }
            }

            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile-image.png' });

            const ProfileEmbed = new EmbedBuilder()
                .setColor(0x4fcf6d)
                .setTitle(`Profile of ${user.tag}`)
                .setThumbnail(userfetch.displayAvatarURL())
                .addFields(
                    { name: 'Username:', value: userfetch.username, inline: true },
                    { name: 'ID:', value: user.id, inline: true },
                    { name: 'Records:', value: userrecords.length.toString(), inline: true },
                )
                .setImage('attachment://profile-image.png')
                .setTimestamp()
                .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL()})

            ProfileEmbed.addFields({ name: 'Want to see more?', value: `[${userfetch.username}'s profil on ortracker.app](https://ortracker.app/user/${userfetch.id})` })
            await interaction.reply({ embeds: [ProfileEmbed], files: [attachment] });
        }
    },
    async user(interaction) {
        const user = interaction.options.getUser('user');
        const userfetch = await interaction.client.users.fetch(user.id);
        const records = (await get(child(ref(db), '/records'))).val();
        const userrecords = [];
        for (const [key, value] of Object.entries(records)) {
            if (value.owner === user.id) {
                userrecords.push(key);
            }
        }

        const UserEmbed = new EmbedBuilder()
            .setColor(0x4fcf6d)
            .setTitle(`Records of ${user.tag}`)
            .setThumbnail(userfetch.displayAvatarURL())
            .setTimestamp()
            .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL()})

        if (userrecords.length > 0) {
            for (const key of userrecords) {
                const value = records[key];
                UserEmbed.addFields({ name: value.name, value: value.description + '\n' + key });
            }
        }
        UserEmbed.addFields({ name: 'Want to see more?', value: `[${userfetch.username}'s profil on ortracker.app](https://ortracker.app/user/${userfetch.id})` });
        await interaction.reply({ embeds: [UserEmbed] });
    },
    async info(interaction) {
        const id = interaction.options.getString('id');
        const snapshotRecord = await get(child(ref(db), '/records/' + id));
        if (!snapshotRecord.exists()) {
            await interaction.reply({ content: `No record with id: *${id}* was found.`, ephemeral: true });
        } else {
            const record = snapshotRecord.val();
            const snapshotUser = await get(child(ref(db), '/users/' + record.owner));
            const user = snapshotUser.val();
            const owner = await interaction.client.users.fetch(user.id);

            if (record.link === undefined) {
                await update(ref(db, 'records/' + id), {
                    link: 'No proof provided.'
                });
                record.link = 'No proof provided.';
            }

            const InfoEmbed = new EmbedBuilder()
                .setColor(0x4fcf6d)
                .setTitle(`Record ${record.name}`)
                .addFields(
                    { name: 'Name:', value: record.name, inline: true },
                    { name: 'Owner:', value: `<@!${owner.id}>`, inline: true },
                    { name: 'Description:', value: record.description },
                    { name: 'Proof:', value: record.link },
                    { name: 'ID:', value: id },
                    { name: 'Didn\'t find what you were looking for?', value: `[See more on ortracker.app](https://ortracker.app/records/${id})` }
                )
                .setThumbnail(owner.displayAvatarURL())
                .setTimestamp()
                .setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL() })

            await interaction.reply({ embeds: [InfoEmbed] });
        }
    }
};