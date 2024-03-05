const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');


module.exports = {
  data: new SlashCommandBuilder()
  .setName("watch")
  .setDescription("Gets links to ongoing FRC streams")
  .addStringOption((option) =>
    option.setName('event-key')
    .setDescription('If not provided will get current running events')
    .setRequired(false)
  ),

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
    let key = interaction.options.getString("event-key");

    const res = await axios.get(`https://www.thebluealliance.com/api/v3/events/${dayjs().year()}`, config);

    if(!key){
      // only return events that are currently running
      const currentDay = dayjs();
      let running = res.data.filter(event => {
        //console.log(event.start_date, event.end_date)
        const start = dayjs(event.start_date).subtract(1, 'day');
        const end = dayjs(event.end_date).add(1, 'day');
        return currentDay.isAfter(start) && currentDay.isBefore(end);
      });
      
      let msg = '';
      running.forEach(event => {
        if(!event.webcasts[0]){
          msg += `**${event.name}** (${event.key})`;
        } else{
          msg += `[**${event.name}**](<`+streamLink(event)+`>) (${event.key})`;
        }
        msg += ` ${event.city}, ${event.state_prov}, ${event.country}\n`;
      });

      embed = new EmbedBuilder()
        .setTitle(`Ongoing FRC Events`)
        .setDescription(msg)
        .setColor("#F79A2A");

      interaction.editReply({embeds: [embed]});
    } else {
      // get the event with the given key
      let event = res.data.find(event => event.key == key);
      msg = streamLink(event);

      interaction.editReply(msg);
    }

    

    // suffix of unix timestamp to force discord to not use cached embed
    function streamLink(event){
      if(event.webcasts[0].type == "twitch"){
        return `https://www.twitch.tv/${event.webcasts[0].channel}?${dayjs().unix()}`;
      } else if(event.webcasts[0].type == "youtube"){
        return `https://www.youtube.com/watch?v=${event.webcasts[0].channel}?${dayjs().unix()}`;
      } else {
        return `um no, im not supporting some goofy ah streaming site`;
      }
    }
  },
};
