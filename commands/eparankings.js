const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');
const { table } = require('table');


module.exports = {
    data: new SlashCommandBuilder()
        .setName("eparankings")
        .setDescription("Gets the EPA rankings")
        .addBooleanOption((option) =>
            option.setName('mobile')
                .setDescription('Mobile friendly results')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option.setName('sort-by')
                .setDescription('Metric to sort by (defaults to unitless EPA)')
                .setRequired(false)
                .addChoices(
					{ name: 'Normal EPA', value: 'norm_epa' },
					{ name: 'Total EPA', value: 'total_epa' },
					{ name: 'Auto EPA', value: 'auto_epa' },
					{ name: 'Teleop EPA', value: 'teleop_epa' },
					{ name: 'Endgame EPA', value: 'endgame_epa' },
					{ name: 'Melody RP', value: 'rp_1_epa' },
					{ name: 'Harmony RP', value: 'rp_2_epa' },
					{ name: 'Winrate', value: 'winrate' },
				)
        )
        .addStringOption((option) =>
            option.setName('region')
                .setDescription('Get only teams from a specific region (defaults to ontario)')
                .setRequired(false)
                .addChoices(
					{ name: 'Ontario', value: 'ont' },
					{ name: 'Canada', value: 'canada' },
					{ name: 'World', value: 'all' },
				)
        ),
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
        const prettyMetric = {
            "norm_epa": "Normal EPA",
            "total_epa": "Total EPA",
            "auto_epa": "Auto EPA",
            "teleop_epa": "Teleop EPA",
            "endgame_epa": "Endgame EPA",
            "rp_1_epa": "Melody RP",
            "rp_2_epa": "Harmony RP",
            "winrate": "Winrate",
          }

        let metric = interaction.options.getString("sort-by") || "unitless_epa";

        let regionRaw = interaction.options.getString("region");
        let region;
        switch(regionRaw){
            case "all":
                region = "";
                regionRaw = "the World"
                break;
            case "canada":
                region = "&country=Canada"
                regionRaw = "Canada"
                break;
            case "ont":
            default:
                region = "&district=ont"
                regionRaw = "Ontario"
                break;
        }

        const res = await axios.get(`https://api.statbotics.io/v3/team_years?year=${dayjs().year()}&metric=${metric}&limit=15${region}
        `, config);

        let mobileVersion = interaction.options.getBoolean("mobile") || false;

        let embed;

        if (mobileVersion) {
            let msg = '';
            res.data.forEach(team => {
                msg += `${team.epa.unitless} - ${team.name} (${team.team})\n`;
            });
            embed = new EmbedBuilder()
                .setColor("#F79A2A")
                .setTitle("EPA Rankings for "+regionRaw+" "+dayjs().year())
                .setDescription("```" + msg + "```")
        
        } else {
            let data = [
                ['Team', 'Name', prettyMetric[metric], 'WR*'],
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
                    content: 'EPA Rankings for '+regionRaw+" "+dayjs().year(),
                },
            };

            let special;
            res.data.forEach(team => {
                switch(metric){
                    case "norm_epa":
                        special = team.epa.norm_epa
                        break;
                    case "total_epa":
                        special = team.epa.breakdown.total_points.mean
                        break;
                    case "auto_epa":
                        special = team.epa.breakdown.auto_points.mean
                        break;           
                    case "teleop_epa":
                        special = team.epa.breakdown.teleop_points.mean
                        break;                   
                    case "endgame_epa":
                        special = team.epa.breakdown.endgame_points.mean
                        break;
                    case "melody_rp":
                        special = team.epa.breakdown.melody_rp.mean
                        break;
                    case "harmony_rp":
                        special = team.epa.breakdown.harmony_rp.mean
                        break;
                    case "winrate":
                        special = team.record.season.winrate
                        break;
                    case "epa_unitless":
                    default:
                        special = team.epa.unitless
                        break;
                }
                data.push([team.team, team.name, special, team.epa.ranks.total.rank]);
            });
            embed = new EmbedBuilder()
                .setColor("#F79A2A")
                .setDescription("```" + table(data, tableConfig) + "```")
                .setFooter({text: "*World Rank"})
        }

        interaction.editReply({
            embeds: [embed]
        })
    },
};
