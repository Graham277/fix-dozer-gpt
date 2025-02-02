const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { fetchFromGist } = require("./tools.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('Fetches the MM Rambotics calendar for the next week'),

    async execute(interaction) {
        await interaction.deferReply();
        interaction.editReply(await fetchFromGist("calendar"))
    },
};
