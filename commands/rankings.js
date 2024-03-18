// FIX NUMBER OPTION ?
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');
const { table } = require('table');

// make it default to closest 2200 event
module.exports = {
    data: new SlashCommandBuilder()
        .setName("rankings")
        .setDescription("Gets the rankings for a competition")
        .addStringOption((option) =>
            option.setName('event-key')
                .setDescription('Event key (eg. 2023oncmp) defaults to closest 2200 match')
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option.setName('mobile')
                .setDescription('Mobile friendly results (sort-by is ignored)')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option.setName('sort-by')
                .setDescription('Metric to sort by (defaults to ranking score)')
                .setRequired(false)
                .addChoices(
                    { name: 'Ranking Avg', value: "0" },
                    { name: 'Avg Coop', value: "1" },
                    { name: 'Avg Match', value: "2" },
                    { name: 'Avg Auto', value: "3" },
                    { name: 'Avg Stage', value: "4" },
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();


        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            headers: {
                'X-TBA-Auth-Key': process.env.TBA
            }
        };
        const prettyMetric =[
            'Ranking Avg',
            'Avg Coop',
            'Avg Match',
            'Avg Auto',
            'Avg Stage'
        ]

        let index = parseInt(interaction.options.getString("sort-by")) || 0;
        (index > prettyMetric.length) ? index = 0 : index;
        let key = interaction.options.getString("event-key");

        const res = await axios.get(`https://www.thebluealliance.com/api/v3/event/${key}/rankings`, config);

        let mobileVersion = interaction.options.getBoolean("mobile") || false;
        let embed;

        console.log(res.data.rankings)

        if (mobileVersion) {
            let msg = '*Rank - Team - '+prettyMetric[index]+'*\n';
            for(let i = 0; i < ((res.data.rankings.length > 10) ? 10 : res.data.rankings.length); i++) {
                msg += `${emojify(res.data.rankings[i].rank)} - **${res.data.rankings[i].team_key.substring(3)}** - ${res.data.rankings[i].sort_orders[index].toFixed(2)}\n`;
            }
            embed = new EmbedBuilder()
                .setColor("#F79A2A")
                .setTitle("Rankings at "+key)
                .setDescription(msg)

        } else {
            let data = [
                ['Rank', 'Team', prettyMetric[index], 'W-L-T', 'Played']
            ];

            const tableConfig = {
                columns: [
                    { alignment: 'center' },
                    { alignment: 'center' },
                    { alignment: 'center' },
                    { alignment: 'left' },
                    { alignment: 'center' },
                ],
                header: {
                    alignment: 'center',
                    content: 'Rankings for ' + key + ' by ' + prettyMetric[index],
                },
            };

            let special;
            let team;
            let sorted = res.data.rankings.sort((a, b) => {
                return b.sort_orders[index] - a.sort_orders[index];
            });
        
            for(let i = 0; i < ((sorted.length > 15) ? 15 : sorted.length); i++) {
                
                team = sorted[i];
                special = team.sort_orders[index]
                
                data.push([team.rank, team.team_key.substring(3), special, Object.values(team.record).join("-"), team.matches_played]);
            };
            embed = new EmbedBuilder()
                .setColor("#F79A2A")
                .setDescription("```" + table(data, tableConfig) + "```")
        }

        interaction.editReply({
            embeds: [embed]
        })

        function emojify(rank) {
            switch (rank) {
                case 1:
                    return ":first_place:";
                case 2:
                    return ":second_place:";
                case 3:
                    return ":third_place:";
                case 4:
                    return ":four:";
                case 5:
                    return ":five:";
                case 6:
                    return ":six:";
                case 7:
                    return ":seven:";
                case 8:
                    return ":eight:";
                case 9:
                    return ":nine:";
                case 10:
                    return ":keycap_ten:";
                default:
                    return rank;
            }
        }
    },
};
