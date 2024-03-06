const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs').promises;
const Jimp = require('jimp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('Fetches the MM Rambotics calendar for the current month')
        .addBooleanOption((option) =>
            option.setName('force')
                .setDescription('Force a new fetch of the calendar')
                .setRequired(false)
        ),

    async execute(interaction) {
        async function fetchAndCropImage() {
            try {
                const response = await axios.get(`https://api.screenshotone.com/take?access_key=${process.env.SCREENSHOT_API_KEY}&url=https%3A%2F%2Fwww.mmrambotics.com%2Fcalendar&full_page=false&viewport_width=1500&viewport_height=1400&device_scale_factor=1&format=jpg&image_quality=100&delay=5&timeout=20`, {
                    responseType: 'arraybuffer' 
                });
                
                const image = await Jimp.read(response.data);
                
                const cropWidth = 750;
                const cropHeight = 1100;
                const cropX = (image.bitmap.width - cropWidth) / 2;
                const cropY = (image.bitmap.height - cropHeight) / 2 + 50;
                image.crop(cropX, cropY, cropWidth, cropHeight);
                
                await image.writeAsync('./images/calendar.png');
            } catch (error) {
                console.error('Error fetching or cropping image:', error.message);
            }
        }

        async function isImageDateStale() {
            try {
                const imageDate = await fs.readFile('./images/image_date.txt', 'utf-8');
                const currentDate = new Date();
                const lastFetchedDate = new Date(imageDate);
                const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                return lastFetchedDate < oneWeekAgo || interaction.options.getBoolean('force');
            } catch (error) {
                console.error('Error reading image date file:', error.message);
                return true; 
            }
        }

        // super simple ! dont look above :)
        await interaction.deferReply();
        
        if (await isImageDateStale() || interaction.options.getBoolean('force')) {
            await fetchAndCropImage();
            await fs.writeFile('./images/image_date.txt', new Date().toISOString(), 'utf-8');
        }

        interaction.editReply({ files: ["./images/calendar.png"] });
    },
};
