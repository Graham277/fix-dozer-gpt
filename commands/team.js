const { ButtonBuilder, ButtonStyle, ActionRowBuilder, SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const dayjs = require("dayjs");
const { Collection } = require("discord.js");
const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("team")
  .setDescription("Provides details about the given team (wip)")
  .addStringOption((option) =>
    option.setName('number')
    .setDescription('The team number')
    .setRequired(true)
  ),

  async execute(interaction) {
    await interaction.deferReply();
    let teamNumber = interaction.options.getString("number");

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      headers: { 
        'X-TBA-Auth-Key': process.env.TBA
      }
    };
    const blueres = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}`, config);
    const socials = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/social_media`, config);
    const awards = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/awards`, config);
    const media = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/media/${dayjs().year()}`, config);
    // const statsres = await axios.get(`https://api.statbotics.io/v2/team_year/${args[1]}/2023`);

    if(media.data[0]?.details?.base64Image == undefined){
      const image = await Jimp.read('images/purp.png');
      image.resize(16 * 25, 9 * 25);
      const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
      image.print(font, 0, 0, {
        text: teamNumber,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      },
      image.bitmap.width, image.bitmap.height);
      image.write('images/team.png');
    } else{
      const buffer = Buffer.from(media.data[0].details.base64Image, "base64");
      fs.writeFile("./images/team.png", buffer, (err) => {});
    }

    file = new AttachmentBuilder('./images/team.png');

    //filter awards for only award_type == 1
    let blueBanners = awards.data.filter(award => award.award_type == 1).length;
    let componentArr = [];
    let moreComponentArr = [];

    const emoji = {
      "facebook-profile": "1214356583891603537",
      "twitter-profile": "1214080856642297906",
      "youtube-channel": "1214080821628112948",
      "instagram-profile": "1214075388544819220",
      "github-profile": "1214356584969412668",
      "gitlab-profile": "1214356586038820924",
    }

    socials.data.forEach(social => {
      if(social.type == "periscope-profile") return;
      //console.log(social)

      let link = "";
      switch(social.type){
        case "facebook-profile":
          link = `https://www.facebook.com/${social.foreign_key}`;
          break;
        case "twitter-profile":
          link = `https://www.twitter.com/${social.foreign_key}`;
          break;
        case "youtube-channel":
          link = `https://www.youtube.com/${social.foreign_key}`;
          break;
        case "instagram-profile":
          link = `https://www.instagram.com/${social.foreign_key}`;
          break;
        case "github-profile":
          link = `https://www.github.com/${social.foreign_key}`;
          break;
        case "gitlab-profile":
          link = `https://www.gitlab.com/${social.foreign_key}`;
          break;
      }
      //console.log(link)

      let button = new ButtonBuilder()
        .setURL(link)
        .setStyle(ButtonStyle.Link)
        .setEmoji(emoji[social.type]);

      if(componentArr.length < 5){
        componentArr.push(button);
      } else {
        moreComponentArr.push(button);
      }
    });

    const teamEmbed = new EmbedBuilder()
      .setTitle(blueres.data.nickname)
      .setDescription(`from ${blueres.data.city}, ${blueres.data.state_prov}, ${blueres.data.country}`)
      .setThumbnail('attachment://team.png')
      .setColor("#F79A2A")
      .addFields(
        { name: "Rookie Year", value: `📆 ${blueres.data.rookie_year}`, inline: true },
        { name : "Blue Banners", value: `<:banner:1214362392222507029> ${blueBanners}`, inline: true },
      );
    if(blueres.data.website != null){
      teamEmbed.setURL(blueres.data.website.replace("///","//"))
    }

    const row = new ActionRowBuilder()
      .addComponents(componentArr);
    if(moreComponentArr.length > 0){
      const row2 = new ActionRowBuilder()
      .addComponents(moreComponentArr);
      interaction.editReply({ embeds: [teamEmbed], files: [file], components: [row, row2]});
    } else {
      interaction.editReply({ embeds: [teamEmbed], files: [file], components: [row]});
    }
  },
};
