// NOT DONE
const { SlashCommandBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
  .setName("match")
  .setDescription("Gets the data for a given match")
  .addStringOption((option) =>
    option.setName('event')
    .setDescription('Event the match is at (defaults to team 2200\'s closest event)')
    .setRequired(false)
  )
  .addStringOption((option) =>
    option.setName('match-key')
    .setDescription('Eg. qm1, sf4, f1m1 (defaults to latest 2200 match')
    .setRequired(false)
  ),
  

  async execute(interaction) {
    await interaction.deferReply();
    let event = interaction.options.getString("event") || await recentEventKey(2200);

    let team = interaction.options.getString("match-key") || await recentMatchKey(2200, event);

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        headers: { 
          'X-TBA-Auth-Key': process.env.TBA
        }
    };
    const res = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${year}/simple`, config);
      
    let msg = '';
    let dateSorted = res.data.sort((a, b) => {
        return new Date(a.start_date) - new Date(b.start_date);
    });
    dateSorted.forEach(event => {
        let startDate = new Date(event.start_date);
        let startRelative = time(startDate, 'R');
        let endDate = new Date(event.end_date);

        msg += "[**"+event.name+`**](<https://www.thebluealliance.com/event/${event.key}>)\n`+time(startDate)+"-"+time(endDate)+` (${time(startDate, 'R')})\n`+`${event.city}, ${event.state_prov}, ${event.country}\n\n`;
    });

    let yearStr = interaction.options.getString("year") ? year = "in "+interaction.options.getString("year") : "";
    const embed = {
      color: 0xF79A2A,
      description: msg,
      title: `Upcoming Events for Team ${team} ${yearStr}`,
    };
    
    
    interaction.editReply({
        embeds: [embed],
    })

    async function recentEventKey(team){
      const response = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${dayjs().year()}/simple`);
      const currentDate = dayjs();
      const closestEvent = response.data.reduce((closest, event) =>
        dayjs(event.start_date).diff(currentDate, 'milliseconds') >= 0 &&
        dayjs(event.start_date).diff(currentDate, 'milliseconds') < closest.difference
          ? { key: event.key, difference: dayjs(event.start_date).diff(currentDate, 'milliseconds') }
          : closest, { difference: Infinity });
      console.log("Closest event key to current date:", closestEvent.key);
      return closestEvent.key;
    }

    async function recentMatchKey(team, event){
      const response = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/event/${event}/matches/simple`);
      const currentDate = dayjs();
      const closestMatch = response.data.reduce((closest, match) =>
        dayjs(match.actual_time).diff(currentDate, 'milliseconds') >= 0 &&
        dayjs(match.actual_time).diff(currentDate, 'milliseconds') < closest.difference
          ? { key: match.key, difference: dayjs(match.actual_time).diff(currentDate, 'milliseconds') }
          : closest, { difference: Infinity });
      console.log("Closest match key to current date:", closestMatch.key);
      return closestMatch.key;
    }
    // function getLatestMatchData(teamKey) {
    //   let latestMatch = null;
    //   let latestMatchTime = 0;
    
    //   for (const match of matches) {
    //     if (match.alliances.blue.team_keys.includes(teamKey) || match.alliances.red.team_keys.includes(teamKey)) {
    //       if (match.time > latestMatchTime) {
    //         latestMatch = match;
    //         latestMatchTime = match.time;
    //       }
    //     }
    //   }
    
    //   return latestMatch;
    // }
  },
};
