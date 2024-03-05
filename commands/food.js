const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');
authorized_ids = ["616981104011771904"];
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("food")
  .setDescription("Gets the provided food/drink for the next meeting")
//   .addBooleanOption((option) =>
//     option.setName('week')
//     .setDescription('Return food for the next week')
//     .setRequired(false)
//   )
  .addStringOption((option) =>
    option.setName('lome-key')
    .setDescription('Update the lome planner for season')
    .setRequired(false)
  )
  .addStringOption((option) =>
    option.setName('date') 
    .setDescription('Get the food for a specific date (yyyy-mm-dd)')
    .setRequired(false)
  ),

  async execute(interaction) {
    await interaction.deferReply();

    if(interaction.options.getString("lome-key")){
        if(authorized_ids.includes(interaction.user.id)){
            let newKey = interaction.options.getString("lome-key");
            fs.writeFile("food.txt", newKey, (err) => {
                if (err) throw err;
                console.log('Data written to file');
            });
            interaction.editReply("Updated the lome key!");
            return;
        } else{
            interaction.editReply("You can't do that 🦀");
            return;
        }
    }

    let embed; 
    let lomeKey = fs.readFileSync("food.txt", "utf8");
    let week = interaction.options.getBoolean("week");
    
    const res = await axios.get(`https://grow.withlome.com/api/cards/${lomeKey}/votes`);

    // feb 1st 2024
    let meetDate;
    function findClosestUpcomingItem(items, fromDate) {
        let closestItem = null;
        let closestItemDate = Infinity;
    
        items.forEach(item => {
            const itemDate = new Date(item.section);
            if (itemDate > fromDate && itemDate < closestItemDate) {
                closestItem = item;
                closestItemDate = itemDate;
            }
        });
        meetDate = closestItemDate;
        return closestItem;
    }
    let date = interaction.options.getString("date") ? fromDate = new Date(interaction.options.getString("date")) : fromDate = new Date();
    
    // Find the closest upcoming food item
    const closestFoodItem = findClosestUpcomingItem(res.data.filter(item => item.icon === "plate"), date);
    const closestDessertDrinkItem = findClosestUpcomingItem(res.data.filter(item => item.icon === "ice-cream"), date);
    
    // Output the closest upcoming items and their contents
    interaction.editReply(`The food for the meeting <t:${dayjs(meetDate).add(1, 'day').subtract(1.5, 'hours').unix()}:R> is:\n🍔 - ${closestFoodItem.voters.map(voter => voter.custom_fields.answer.trim().toLowerCase()).join(", ")}\n🍦 - ${closestDessertDrinkItem.voters.map(voter => voter.custom_fields.answer.trim().toLowerCase()).join(", ")}`);
  },
};
