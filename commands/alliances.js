const { SlashCommandBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
  .setName("alliances")
  .setDescription("Gets the alliances formed at an event")
  .addStringOption((option) =>
    option.setName('event-key')
    .setDescription('Event key to get data for (defaults to 2200\'s most recent)')
    .setRequired(false)
  ),

  async execute(interaction) {
    await interaction.deferReply();

    let eventKey = interaction.options.getString("event-key") || "2024ausc";

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        headers: { 
          'X-TBA-Auth-Key': process.env.TBA
        }
    };
    
    let res;
    try{
      res = await axios.get(`https://www.thebluealliance.com/api/v3/event/${eventKey}/alliances`, config);
    } catch (err) {
      if(err.response.data.Error){
        return interaction.editReply(err.response.data.Error);
      } else {
        return interaction.editReply("An error occured");
      }
    }

    let embed = {
      color: 0xF79A2A,
      description: "",
      title: `Alliances at ${eventKey}`,
      fields: [],
    };

    res.data.forEach((alliance) => {
        let allianceStatus = "";
        switch(alliance.status.status){
            case "won":
                allianceStatus = "🥇";
                break;
            case "eliminated":
                allianceStatus = "🪦";
                break;
            case "playing":
                allianceStatus = "🟢";
                break;
            default:
                allianceStatus = `(${alliance.status.status})`;
                console.log(allianceStatus);
        }
        embed.fields.push({ name: allianceStatus+" "+alliance.name, value: alliance.picks.map((alliance) => alliance.substring(3)).join(", ")+"\n", inline: true});
    })
    
    
    interaction.editReply({
        embeds: [embed],
    })
  },
};
