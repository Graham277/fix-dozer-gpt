const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');



module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Gets the scheduled matchups for a team")
        .addStringOption((option) =>
            option.setName('team')
                .setDescription('Team number (defaults to 2200)')
                .setRequired(false)
        ),
    // maybe add for current event only
    //   .addBooleanOption((option) =>
    //     option.setName('')
    //     .setDescription('')
    //     .setRequired(false)
    //   ),

    async execute(interaction) {
        await interaction.deferReply();

        let team = interaction.options.getString("team") || 2200;

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            headers: {
                'X-TBA-Auth-Key': process.env.TBA
            }
        };

        let res;
        try{
            res = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/matches/${dayjs().year()}`, config);
        } catch (err) {
            if(err.response.data.Error){
            return interaction.editReply(err.response.data.Error.substring(3));
            } else {
            return interaction.editReply("An error occured");
            }
        }
        let timeSorted = res.data.sort((a, b) => {
            return a.predicted_time - b.predicted_time;
        });

        let upcomingMatches = timeSorted//.filter(match => match.actual_time == null);

        const embed = new EmbedBuilder()
            .setTitle(`__Upcoming Matches for Team ${team}__`)
            .setURL(`https://www.thebluealliance.com/team/${team}`)
            .setColor("#F79A2A")

        const convert = {
            "qm": "Quals",
            "qf": "Quarter Finals",
            "sf": "Semi Finals",
            "f": "Finals",
            "ef": "Elimination Finals? (not sure)",

        }

        //for each that goes to a max of 25 entries before starting another for each
        for (let i = 0; i < Math.min(upcomingMatches.length, 25); i++) {
            let prefix = convert[upcomingMatches[i].comp_level];

            embed.addFields({
                name: `${prefix} (<t:${upcomingMatches[i].predicted_time}:R>)`,
                value: "```ansi\n\u001b[2;31m\u001b[0m\u001b[1;2m\u001b[1;31m" + upcomingMatches[i].alliances.blue.team_keys.map(team => team.slice(3)).join(" ") + "\u001b[0m\u001b[1;2m\u001b[0;2m\u001b[0;2m\u001b[1;2m vs\u001b[0m\u001b[0m\u001b[0m\u001b[0m \u001b[1;34m" + upcomingMatches[i].alliances.red.team_keys.map(team => team.slice(3)).join(" ") + "\u001b[0m\u001b[0m\u001b[2;34m\u001b[0m\n```"
            });
        }

        interaction.editReply({
            embeds: [embed],
        })
    },
};
