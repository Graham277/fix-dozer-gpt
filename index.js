const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();
const { Client, Collection, Events, GatewayIntentBits, ActivityType} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
    // GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] urmom is ${filePath} and missing da needed "data" shit or "execute" property.`
    );
  }
} 
// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (c) => {
  console.log(`*hacker voice* I'm in! Codename: ${c.user.tag}`);
  client.user.setPresence({ 
    activities: [{ 
        name: 'Beating 2056 in Endgame', 
        type: ActivityType.Custom, 
    }], 
    status: 'online' 
});
});


client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  // dont allow outside dozer-commands in 2200 server
  if(interaction.guildId == "949124190638833674" && interaction.channelId != "1225188892748157049"){
    return interaction.reply({content: "You can't send messages outside of <#1225188892748157049>", ephemeral: true})
  }
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});


client.login(process.env.token);