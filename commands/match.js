// NOT DONE
const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const Canvas = require('@napi-rs/canvas');

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  headers: { 
    'X-TBA-Auth-Key': process.env.TBA
  }
};

module.exports = {
  data: new SlashCommandBuilder()
  .setName("match")
  .setDescription("Gets the data for a given match")
  .addSubcommand(subcommand =>
		subcommand
			.setName('2200')
			.setDescription('Get the latest match 2200 played in')
  )
  .addSubcommand(subcommand =>
		subcommand
			.setName('team')
			.setDescription('Get the last match a team played in')
			.addStringOption(option => 
        option.setName('team').setDescription('The team number to get the latest match for').setRequired(true)
      )
  )
	.addSubcommand(subcommand =>
		subcommand
			.setName('specific')
			.setDescription('Get the data for a specific match')
      .addStringOption((option) =>
        option.setName('event')
        .setDescription('Event the match is at (defaults to team 2200\'s closest event)')
        .setRequired(false)
      )
      .addStringOption((option) =>
        option.setName('match-key')
        .setDescription('Eg. qm1, sf4, f1m1 (defaults to latest 2200 match)')
        .setRequired(false)
      )
  ),
  

  async execute(interaction) {
    await interaction.deferReply();

    // console.log(interaction.options.getSubcommand());
    let event = interaction.options.getString("event") 
    let match = interaction.options.getString("match-key");
    let team = interaction.options.getString("team");
    if(!team){
      team = 2200;
    }
    if(!event){
      event = (await recentEvent(team)).key;
      if(!event){
        return interaction.editReply("Team "+team+" has not been to any events yet!")
      }
    }
    if (!match) {
      match = (await recentTeamMatch(team, event));
      
      if(!match){
        return interaction.editReply("Team "+team+" has not played a match at this event yet!")
      } else{
        match = match.match;
      }
    } 

    let msg;
    // let content = "";

    msg = `${match.alliances.red.team_keys.map(team => team.slice(3)).join(", ")} vs ${match.alliances.blue.team_keys.map(team => team.slice(3)).join(", ")}\n`;
    if(match.winning_alliance == "red"){
      msg += `**${match.alliances.red.score}** - ${match.alliances.blue.score}\n`;
    } else {
      msg += `${match.alliances.red.score} - **${match.alliances.blue.score}**\n`;
    }
    
    
    console.log(team, event, match);
    let embed = {
      color: 0xF79A2A,
      description: msg,
      title: `__${prettyCompLevel(match.comp_level)} ${(match.comp_level == "qm") ? `` : `${match.set_number}-`}${match.match_number}__\n`,
      timestamp: dayjs.unix(match.actual_time).toISOString(),
    }

    function prettyCompLevel(level) {
      switch(level){
        case "qm":
          return "Quals";
        case "ef":
          return "Eighths";
        case "qf":
          return "Quarters";
        case "sf":
          return "Semis";
        case "f":
          return "Finals";
      }
    }

    const canvas = Canvas.createCanvas(1920, 965);
		const context = canvas.getContext('2d');
    const background = await Canvas.loadImage('images/redblue.png');
    
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    context.strokeRect(0, 0, canvas.width, canvas.height);

    context.font = '60px sans-serif';
    context.fillStyle = '#ffffff';

    context.fillText(`test`, canvas.width / 2.5, canvas.height /17);

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'match.png' });

    interaction.editReply({ files: [attachment] });

    // interaction.editReply({embeds: [embed]});
    if(match.videos.length > 0){
      // fix later for other video sites
      interaction.followUp(`https://www.youtube.com/watch?v=${match.videos[0].key}`)
    }
    

    // interaction.editReply({
    //     embeds: [embed],
    // })

    // ensure event has started, don't return future events
    async function recentEvent(team) {
      const response = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${dayjs().year()}/simple`, config);
      const currentDate = dayjs();
      
      const startedEvents = response.data.filter(event =>
          dayjs(event.start_date).diff(currentDate, 'milliseconds') <= 0
      );
  
      if (startedEvents.length === 0) {
          console.log("No events have started for team", team);
          return null;
      }
  
      const closestEvent = startedEvents.reduce((closest, event) =>
          dayjs(event.start_date).diff(currentDate, 'milliseconds') < closest.difference
              ? { key: event.key, difference: dayjs(event.start_date).diff(currentDate, 'milliseconds') }
              : closest, { difference: Infinity });
  
      // console.log("Closest event key to current date:", closestEvent.key);
      return closestEvent;
    }
  
    // only matches that have an actual time, meaning they've finished
    async function recentTeamMatch(team, event) {
      const response = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/event/${event}/matches`, config);
      const currentDate = dayjs();
      
      const validMatches = response.data.filter(match =>
          match.actual_time && dayjs(match.actual_time).diff(currentDate, 'milliseconds') <= 0
      );
  
      if (validMatches.length === 0) {
          // console.log("No matches have occurred for team", team, "at event", event);
          return null;
      }
  
      const closestMatch = validMatches.reduce((closest, match) => {
        const matchDifference = dayjs(match.actual_time).diff(currentDate, 'milliseconds');
        if (Math.abs(matchDifference) < Math.abs(closest.difference)) {
            return { match: match, difference: matchDifference };
        } else {
            return closest;
        }
    }, { difference: Infinity });
  
      // console.log("Closest match key to current date:", closestMatch.key);
      return closestMatch;
    }
  
  },
};
