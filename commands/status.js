const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");


module.exports = {
  data: new SlashCommandBuilder()
  .setName("status")
  .setDescription("Gets status of TBA, Statbotics and the Official First API"),

  async execute(interaction) {
    await interaction.deferReply();

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      headers: { 
        'X-TBA-Auth-Key': process.env.TBA
      }
    };
    let embed; 
    let msg = `**The Blue Alliance**\n`;

    await axios.get(`https://www.thebluealliance.com/api/v3/status`, config)
        .then(res => {
            if (res.status !== 500 && res.status !== 404) {
                msg += `Status: ${(res.status == 200) ? "Online!" : res.status}\n`;
                msg += `Is Datafeed Working: ${(res.data.is_datafeed_down == false) ? ":white_check_mark:\n" : ":x:\n"}`;
                msg += `Down Events: ${res.data.down_events.join(", ")}\n`;
            } else {
                msg += `Status: ${res}\n`;
            }
        })
        .catch(error => {
            if (error.response) {
                msg += `Status: ${error.response.status}\n`;
            } else{
                msg += `Weird TBA Error: ${error}\n`;
            }
        });
        
    msg += '\n**Statbotics**\n'
    
    await axios.get(`https://www.statbotics.io/event/api?rand=${dayjs().unix()}`)
        .then(res => {
            msg += `Status: ${res.status}\n`;
        })
        .catch(error => {
            if (error.response) {
                msg += `Status: ${error.response.status}\n`;
            } else{
                msg += `Weird Statbotics Error: ${error}\n`;
            }
        });

    msg += '\n**Official First API**\n'

    await axios.get(`https://frc-api.firstinspires.org/v3.0?rand=${dayjs().unix()}`)
        .then(res => {
            if (res.data.status) {
                msg += `Status: ${res.data.status}\n`;
            } else {
                msg += `Status: ${res.status}\n`;
            }
        })
        .catch(error => {
            if (error.response) {
                msg += `Status: ${error.response.status}\n`;
            } else{
                msg += `Weird First Error: ${error}\n`;
            }
        });

    embed = new EmbedBuilder()
        .setTitle(`Status Checker`)
        .setDescription(msg)
        .setColor("#F79A2A");

    interaction.editReply({embeds: [embed]});
  },
};
