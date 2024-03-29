const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("guide")
  .setDescription("Just the point guide table"),

  async execute(interaction) {
    interaction.reply({
        files: ["images/guide.png"]
    })
  },
};
