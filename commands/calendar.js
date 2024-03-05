const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
async function getEventsForCurrentWeek(apiKey) {
    const calendar = google.calendar({ version: 'v3', auth: apiKey });

    const today = new Date();
    const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

    const events = await calendar.events.list({
        calendarId: 'primary', // Change this to the desired calendar ID
        timeMin: firstDayOfWeek.toISOString(),
        timeMax: lastDayOfWeek.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
    });

    return events.data.items.map(event => event.summary);
}
const apiKey = 'YOUR_API_KEY';
getEventsForCurrentWeek(apiKey)
    .then(events => console.log(events))
    .catch(error => console.error('Error fetching events:', error));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('Fetches events for the current week'),

    async execute(interaction) {
        try {
            await interaction.deferReply(); // Acknowledge the command while fetching events

            const events = await getEventsForCurrentWeek();

            if (events.length > 0) {
                await interaction.editReply('Events for the current week:\n' + events.join('\n'));
            } else {
                await interaction.editReply('No events found for the current week.');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            await interaction.editReply('An error occurred while fetching events.');
        }
    },
};