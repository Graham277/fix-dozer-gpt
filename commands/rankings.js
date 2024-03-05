const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');
const { table } = require('table');


module.exports = {
    data: new SlashCommandBuilder()
        .setName("rankings")
        .setDescription("Gets the EPA rankings"),
        // .addStringOption((option) =>
        //     option.setName('team')
        //         .setDescription('Team number (defaults to 2200)')
        //         .setRequired(false)
        // ),
    // option to narrow down locations canada world results amount etc.

    async execute(interaction) {
        await interaction.deferReply();

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            headers: { 
              'X-TBA-Auth-Key': process.env.TBA
            }
        };
        const res = await axios.get(`https://api.statbotics.io/v3/team_years?year=${dayjs().year()}&district=ont&metric=unitless_epa&limit=15
        `, config);

        let data = [
            ['Team', 'Name', 'EPA', 'World Rank'],
        ];

        const tableConfig = {
            columns: [
              { alignment: 'center' },
              { alignment: 'center' },
              { alignment: 'center' },
              { alignment: 'left' }
            ],
            header: {
                alignment: 'center',
                content: 'EPA Rankings for Ontario 2023',
              },
        };

        res.data.forEach(team => {
            data.push([team.team, team.name, team.epa.unitless, team.epa.ranks.total.rank]);
        });
        let embed = new EmbedBuilder()
            .setColor("#F79A2A")
            .setDescription("```"+table(data, tableConfig)+"```");

        interaction.editReply({
            embeds: [embed]
        })
    },
};
