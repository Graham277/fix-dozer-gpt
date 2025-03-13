const { SlashCommandBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
  .setName("events")
  .setDescription("Gets the upcoming and past events for a team")
  .addStringOption((option) =>
    option.setName('team')
    .setDescription('Team number (defaults to 2200)')
    .setRequired(false)
  )
  .addStringOption((option) =>
    option.setName('year')
    .setDescription('The year (defaults to current year)')
    .setRequired(false)
  ),

  async execute(interaction) {
    await interaction.deferReply();

    let team = interaction.options.getString("team") || 2200;
    let year = interaction.options.getString("year") || dayjs().year();

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        headers: { 
          'X-TBA-Auth-Key': process.env.TBA
        }
    };
    let res;
    try {
      res = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${year}/simple`, config);
    } catch (err) {
      if (err.response?.data?.Error) {
        if (err.response.data.Error === "Invalid endpoint") {
          return interaction.editReply("Invalid year");
        }
        return interaction.editReply(err.response.data.Error.substring(3));
      } else {
        return interaction.editReply("An error occurred");
      }
    }

    let msg = '';
    let dateSorted = res.data.sort((a, b) => {
        return new Date(a.start_date) - new Date(b.start_date);
    });

    dateSorted.forEach(event => {
        let startDate = new Date(event.start_date);
        let endDate = new Date(event.end_date);

        // Add 12 hours
        startDate.setHours(startDate.getHours() + 12);
        endDate.setHours(endDate.getHours() + 24);
        msg += `[**${event.name}**](<https://www.thebluealliance.com/event/${event.key}>) (${event.key})\n` +
               `${time(startDate)} - ${time(endDate)} (${time(startDate, 'R')})\n` +
               `${event.city}, ${event.state_prov}, ${event.country}\n\n`;
    });

    let yearStr = interaction.options.getString("year") ? `in ${interaction.options.getString("year")}` : "";
    const embed = {
      color: 0xF79A2A,
      description: msg,
      title: `Season Events for Team ${team} ${yearStr}`,
    };
    
    interaction.editReply({
        embeds: [embed],
    });
  },
};
