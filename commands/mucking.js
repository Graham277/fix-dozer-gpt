// const { UserSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder } = require("discord.js");


// module.exports = {
//   data: new SlashCommandBuilder()
//   .setName("mucking")
//   .setDescription("Goofin around"),

//   async execute(interaction) {
//     // await interaction.deferReply();

// 		const insta = new ButtonBuilder()
// 			.setEmoji('1214075388544819220')
//       .setURL('https://www.instagram.com/mmrambotics/')
// 			.setStyle(ButtonStyle.Link);
    
//     const website = new ButtonBuilder()
//       .setURL('https://www.mmrambotics.com')
//       .setStyle(ButtonStyle.Link)
//       .setEmoji('1214079235463979078');

//     const youtube = new ButtonBuilder()
//       .setURL('https://www.youtube.com/@mmrambotics2200')
//       .setStyle(ButtonStyle.Link)
//       .setEmoji('1214080821628112948');

//     const twitter = new ButtonBuilder()
//       .setURL('https://twitter.com/mmrambotics')
//       .setStyle(ButtonStyle.Link)
//       .setEmoji('1214080856642297906');

//     const select = new StringSelectMenuBuilder()
// 			.setCustomId('select')
// 			.setPlaceholder('Make a selection!')
// 			.addOptions(
// 				new StringSelectMenuOptionBuilder()
// 					.setLabel('Bulbasaur')
// 					.setDescription('The dual-type Grass/Poison Seed Pokémon.')
// 					.setValue('bulbasaur'),
// 				new StringSelectMenuOptionBuilder()
// 					.setLabel('Charmander')
// 					.setDescription('The Fire-type Lizard Pokémon.')
// 					.setValue('charmander'),
// 				new StringSelectMenuOptionBuilder()
// 					.setLabel('Squirtle')
// 					.setDescription('The Water-type Tiny Turtle Pokémon.')
// 					.setValue('squirtle'),
// 			);

//     const users = new UserSelectMenuBuilder()
//         .setCustomId('users')
//         .setPlaceholder('Select a user')
//         .setMinValues(3)
// 			  .setMaxValues(10);

//     const row = new ActionRowBuilder()
//       .addComponents(insta, youtube, twitter, website);

//     const row2 = new ActionRowBuilder()
//       .addComponents(select);

//     const row3 = new ActionRowBuilder()
//       .addComponents(users);

//     interaction.reply({ components: [row] });
//   },
// };
