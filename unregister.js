const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');

const rest = new REST().setToken(token);

const commandId = '1295187396350054463'; // Remplacez par l'ID de la commande que vous souhaitez désenregistrer

(async () => {
    try {
        console.log(`Started deleting application (/) command with ID ${commandId}.`);

        await rest.delete(
            Routes.applicationCommand(clientId, commandId)
        );

        console.log(`Successfully deleted application (/) command with ID ${commandId}.`);
    } catch (error) {
        console.error(error);
    }
})();