const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("nobluebanners")
  .setDescription("🤨"),

  async execute(interaction) {
    interaction.reply({
        files: ["images/nobluebanners.png"]
    })
  },
};
