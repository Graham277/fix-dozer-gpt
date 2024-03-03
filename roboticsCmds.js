const axios = require('axios');
const { MessageAttachment } = require('discord.js');
const Jimp = require('jimp');
const dotenv = require("dotenv");
dotenv.config();


async function roboticCmd(message) {
    if(message.content.startsWith('!team')){
    args = message.content.split(" ");
    console.log(args.length)
    if(args.length == 2){
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            headers: { 
              'X-TBA-Auth-Key': process.env.TBA
            }
          };

    try {
        const blueres = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${args[1]}`, config);
        const statsres = await axios.get(`https://api.statbotics.io/v2/team_year/${args[1]}/2023`);
        const media = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${args[1]}/media/2023`, config);

        const image = await Jimp.read('images/purp.png');
        image.resize(16*25, 9*25);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
        image.print(font, 0, 0, {
        text: args[1],
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE},
        image.bitmap.width, image.bitmap.height);
        image.write('images/team.png');

        const msg = `Team ${args[1]} is ${blueres.data.nickname} from ${blueres.data.city}, ${blueres.data.state_prov}, ${blueres.data.country}`;

        await message.reply({
            content: msg,
            files: ["images/team.png"]
        })

    } catch (error) {
        console.log(error);
        return null;
    }
    }
    }

    //new cmd
}

module.exports = roboticCmd;
