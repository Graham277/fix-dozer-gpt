// NOT DONE
const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const Canvas = require('@napi-rs/canvas');
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
    //co-operatition handshake later
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
      console.log(event)
      if(!event){
        return interaction.editReply("Team "+team+" has not been to any events yet!")
      }
    }
    if(match){
      match = (await axios.get(`https://www.thebluealliance.com/api/v3/match/${event}_${match}`, config)).data;
      
    } else {
      match = (await recentTeamMatch(team, event));
      
      if(!match){
        return interaction.editReply("Team "+team+" has not played a match at this event yet!")
      } else{
        match = match.match;
      }
    } 

    

    let msg;
    msg = "```ansi\n\u001b[2;31m\u001b[0m\u001b[1;2m\u001b[1;31m" + match.alliances.red.team_keys.map(team => team.slice(3)).join(" ") + "\u001b[0m\u001b[1;2m\u001b[0;2m\u001b[0;2m\u001b[1;2m vs\u001b[0m\u001b[0m\u001b[0m\u001b[0m \u001b[1;34m" + match.alliances.blue.team_keys.map(team => team.slice(3)).join(" ") + "\u001b[0m\u001b[0m\u001b[2;34m\u001b[0m\n```";
    // if(match.score_breakdown.blue.autoAmpNoteCount > 0 || match.score_breakdown.red.autoAmpNoteCount > 0){
    //   msg += `Auto Amp Note Points 🤮 (R-B): ${match.score_breakdown.red.autoAmpNotePoints} - ${match.score_breakdown.blue.autoAmpNotePoints}\n`;
    // }

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
    const ctx = canvas.getContext('2d');
    let background;
    if(match.winning_alliance == "red"){
      background = await Canvas.loadImage('images/red.png');
    } else if (match.winning_alliance == "blue"){
      background = await Canvas.loadImage('images/blue.png');
    } else {
      background = await Canvas.loadImage('images/redblue.png');
    }

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';

    // rp
    let redImages = [];
    let redCount = 0;

    if (match.score_breakdown.red.autoBonusAchieved) {
        redImages.push('images/redautorp.png');
        redCount++;
    }

    if (match.score_breakdown.red.coralBonusAchieved) {
        redImages.push('images/redcoralrp.png');
        redCount++;
    }

    if (match.score_breakdown.red.bargeBonusAchieved) {
        redImages.push('images/redbargerp.png');
        redCount++;
    }

    for (let i = 0; i < match.score_breakdown.red.rp - redCount; i++) {
        redImages.push('images/redtrophy.png');
    }
    
    let blueImages = [];
    let blueCount = 0;
    
    if (match.score_breakdown.blue.autoBonusAchieved) {
        blueImages.push('images/autorp.png');
        blueCount++;
    }
    if (match.score_breakdown.blue.coralBonusAchieved) {
        blueImages.push('images/coralrp.png');
        blueCount++;
    }

    if (match.score_breakdown.blue.bargeBonusAchieved) {
        blueImages.push('images/bargerp.png');
        blueCount++;
    }

    for (let i = 0; i < match.score_breakdown.blue.rp - blueCount; i++) {
        blueImages.push('images/bluetrophy.png');
    }
    

    for(let i = 0; i < blueImages.length; i++){
        blueImages[i] = await loadImage(blueImages[i]);
    }
    for(let i = 0; i < redImages.length; i++){
        redImages[i] = await loadImage(redImages[i]);
    }
    if (redImages.length > 0) renderImages(redImages, 295, 500);
    if (blueImages.length > 0) renderImages(blueImages, canvas.width-295, 500);

    async function loadImage(src) {
        return await Canvas.loadImage(src);
    }

    function renderImages(images, x, y) {
      const imageSize = 125; // Image size
      const spacing = 10; // Spacing between images
      const perRow = 3; // Maximum images per row
  
      for (let i = 0; i < images.length; i++) {
          const row = Math.floor(i / perRow); // Determine row number
          const col = i % perRow; // Determine column within the row
          const xPos = x - ((perRow * (imageSize + spacing)) / 2) + col * (imageSize + spacing);
          const yPos = y + row * (imageSize + spacing); // Shift rows downward
  
          ctx.drawImage(images[i], xPos, yPos, imageSize, imageSize);
      }
  }
  

    // Drawing text on the canvas
    ctx.fillStyle = '#ffffff';

    renderCenteredText(`${prettyCompLevel(match.comp_level)} ${(match.comp_level == "qm") ? `` : `${match.set_number}-`}${match.match_number}`, 60, (canvas.width - (ctx.measureText('Quals 7-7').width/2) )/2, 25, canvas.width * 0.8, canvas.height * 0.5);
    
    // Scores red blue
    renderCenteredText(match.alliances.red.score.toString(), 250, 775, 170, 400, 100);
    renderCenteredText(match.alliances.blue.score.toString(), 250, 1140, 170, 400, 100);
  
    ctx.fillStyle = '#000000';
    // titles
    renderCenteredText('Auto', 60, canvas.width/2, 330, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText('Teleop', 60, canvas.width/2, 550, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText('Endgame', 60, canvas.width/2, 845, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText('Penalty', 60, canvas.width/2, 920, canvas.width * 0.8, canvas.height * 0.5);
    // values
    renderCenteredText(match.score_breakdown.red.autoPoints.toString(), 60, canvas.width/2-300, 330, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.red.teleopPoints.toString(), 60, canvas.width/2-300, 550, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.red.endGameBargePoints.toString(), 60, canvas.width/2-300, 845, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.red.foulPoints.toString(), 60, canvas.width/2-300, 920, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.autoPoints.toString(), 60, canvas.width/2+300, 330, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.teleopPoints.toString(), 60, canvas.width/2+300, 550, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.endGameBargePoints.toString(), 60, canvas.width/2+300, 845, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.foulPoints.toString(), 60, canvas.width/2+300, 920, canvas.width * 0.8, canvas.height * 0.5);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';

    // titles
    renderCenteredText('Coral', 40, canvas.width/2, 405, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText('Leave', 40, canvas.width/2, 480, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText('Coral', 40, canvas.width/2, 630, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText('Processor', 40, canvas.width/2, 705, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText('Barge', 40, canvas.width/2, 780, canvas.width * 0.8, canvas.height * 0.5);
    // values
    renderCenteredText(match.score_breakdown.red.autoCoralPoints.toString(), 40, canvas.width/2-300, 405, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.red.autoMobilityPoints.toString(), 40, canvas.width/2-300, 480, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.red.teleopCoralPoints.toString(), 40, canvas.width/2-300, 630, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.red.wallAlgaeCount.toString(), 40, canvas.width/2-300, 705, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.red.netAlgaeCount.toString(), 40, canvas.width/2-300, 780, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.autoCoralPoints.toString(), 40, canvas.width/2+300, 405, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.autoMobilityPoints.toString(), 40, canvas.width/2+300, 480, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.teleopCoralPoints.toString(), 40, canvas.width/2+300, 630, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.wallAlgaeCount.toString(), 40, canvas.width/2+300, 705, canvas.width * 0.8, canvas.height * 0.5);
    renderCenteredText(match.score_breakdown.blue.netAlgaeCount.toString(), 40, canvas.width/2+300, 780, canvas.width * 0.8, canvas.height * 0.5);

    // Function to render text with centering and bounding
    function renderCenteredText(text, fontSize, x, y, maxWidth, maxHeight) {
        let currentFontSize = fontSize;
        let textWidth, textHeight;
        do {
            ctx.font = `${currentFontSize}px sans-serif`;
            textWidth = ctx.measureText(text).width;
            textHeight = currentFontSize;
            currentFontSize--;
        } while ((textWidth > maxWidth || textHeight > maxHeight) && currentFontSize > 0);

        const newX = x - textWidth / 2;
        const newY = y + textHeight / 2;

        ctx.fillText(text, newX, newY);
    }

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'match.png' });
    let embed = {
      color: 0xF79A2A,
      description: msg,
      // title: `__${prettyCompLevel(match.comp_level)} ${(match.comp_level == "qm") ? `` : `${match.set_number}-`}${match.match_number}__\n`,
      timestamp: dayjs.unix(match.actual_time).toISOString(),
      image: {
        url: `attachment://match.png`
      }

    }
    await interaction.editReply({ embeds: [embed], files: [attachment] });

    // interaction.editReply({embeds: [embed]});
    if(match.videos.length > 0){
      // fix later for other video sites
      interaction.followUp(`https://www.youtube.com/watch?v=${match.videos[0].key}`)
    }
  
    // only matches that have an actual time, meaning they've finished
    async function recentTeamMatch(team, event) {
      const response = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/event/${event}/matches`, config);
      const currentDate = dayjs();
      
      const validMatches = response.data.filter(match =>
          match.actual_time && dayjs(match.actual_time).diff(currentDate, 'milliseconds') <= 0
      );
  
      if (validMatches.length === 0) {
          console.log("No matches have occurred for team", team, "at event", event);
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
