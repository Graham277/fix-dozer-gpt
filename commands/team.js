const { SlashCommandBuilder } = require("discord.js");
const dayjs = require("dayjs");
const { Collection } = require("discord.js");
const axios = require("axios");
const Jimp = require("jimp");

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
    // const statsres = await axios.get(`https://api.statbotics.io/v2/team_year/${args[1]}/2023`);
    // const media = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${args[1]}/media/2023`, config);

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

    const msg = `Team ${teamNumber} is ${blueres.data.nickname} from ${blueres.data.city}, ${blueres.data.state_prov}, ${blueres.data.country}`;

    await interaction.editReply({
      content: msg,
      files: ["images/team.png"]
    });
    // await interaction.editReply("test");

  },
};
