const { SlashCommandBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { recentEvent } = require("./tools.js");

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  headers: { 
    'X-TBA-Auth-Key': process.env.TBA
  }
};
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

    let eventKey = interaction.options.getString("event-key") || (await recentEvent(2200)).key;
    if(eventKey == null){
      return interaction.editReply("No events have started this year for team 2200");
    }
    
    
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
    if (res.data.length === 0) {
      return interaction.editReply("Alliance selection has not happened yet");
    }
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
                if(!allianceStatus){
                  allianceStatus = "";
                } else {
                  allianceStatus = `(${alliance.status.status})`;
                }
                console.log(allianceStatus);
        }
        embed.fields.push({ name: allianceStatus+" "+alliance.name, value: alliance.picks.map((alliance) => alliance.substring(3)).join(", ")+"\n", inline: true});
    })
    
    
    interaction.editReply({
        embeds: [embed],
    })
  },
};
