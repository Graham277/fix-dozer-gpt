// FIX NUMBER OPTION ?
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const dayjs = require("dayjs");
const axios = require("axios");
const { time } = require('discord.js');
const { table } = require('table');
const Canvas = require('@napi-rs/canvas');

// make it default to closest 2200 event
module.exports = {
    data: new SlashCommandBuilder()
        .setName("rankings")
        .setDescription("Gets the rankings for a competition")
        .addStringOption((option) =>
            option.setName('event-key')
                .setDescription('Event key (eg. 2023oncmp) defaults to closest 2200 match')
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
        let key = interaction.options.getString("event-key") || (await recentEvent(2200)).key;
        if (key == null) {
            return interaction.editReply("No events have started for team 2200");
        }
        let res;
        try{
            res = await axios.get(`https://www.thebluealliance.com/api/v3/event/${key}/rankings`, config);
        } catch (err) {
            if(err.response.data.Error){
                return interaction.editReply(err.response.data.Error);
            } else {
                return interaction.editReply("An error occured");
            }
        }

        let mobileVersion = interaction.options.getBoolean("mobile") || false;
        let embed;

        // console.log(res.data.rankings)

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
            
            for (let i = 0; i < ((sorted.length > 15) ? 15 : sorted.length); i++) {
                team = sorted[i];
                special = team.sort_orders[index];

                data.push([team.rank, team.team_key.substring(3), special, team.record.wins + "-" + team.record.losses + "-" + team.record.ties, team.matches_played]);
            }
            
            // Create a canvas element
            const canvas = Canvas.createCanvas(500, 300);
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = 500; // Set your desired width
            canvas.height = 300; // Set your desired height
            ctx.fillStyle = "#F79A2A";
ctx.        fillRect(0, 0, canvas.width, canvas.height);
            // Draw the table
            drawTable(ctx, data, tableConfig);
            
            // Convert canvas content to image
            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'rankings.png' });

            
            // Embed the image in your document or webpage
            embed = new EmbedBuilder()
                .setColor("#F79A2A")
                .setImage('attachment://rankings.png')
            return interaction.editReply({
                embeds: [embed],
                files: [attachment]
            });
            
            // Function to draw the table on canvas
            function drawTable(ctx, data, config) {
                const cellPadding = 5;
                const cellWidth = canvas.width / data[0].length;
                const cellHeight = 20; // Adjust as needed
                const tableWidth = cellWidth * data[0].length;
                const tableHeight = cellHeight * data.length;
            
                // Draw header
                ctx.fillStyle = '#000'; // Header text color
                ctx.font = 'bold 14px Arial'; // Header font
                ctx.textAlign = config.header.alignment;
                ctx.fillText(config.header.content, tableWidth / 2, cellHeight);
            
                // Draw table content
                for (let i = 0; i < data.length; i++) {
                    for (let j = 0; j < data[i].length; j++) {
                        const cellContent = data[i][j].toString();
                        const x = j * cellWidth+35;
                        const y = (i + 1) * cellHeight;
                        ctx.fillStyle = '#000'; // Cell text color
                        ctx.font = '12px Arial'; // Cell font
                        ctx.textAlign = config.columns[j].alignment;
                        ctx.fillText(cellContent, x + cellPadding, y + cellHeight - cellPadding);
                    }
                }
            }
            
            // let data = [
            //     ['Rank', 'Team', prettyMetric[index], 'W-L-T', 'Played']
            // ];

            // const tableConfig = {
            //     columns: [
            //         { alignment: 'center' },
            //         { alignment: 'center' },
            //         { alignment: 'center' },
            //         { alignment: 'left' },
            //         { alignment: 'center' },
            //     ],
            //     header: {
            //         alignment: 'center',
            //         content: 'Rankings for ' + key + ' by ' + prettyMetric[index],
            //     },
            // };

            // let special;
            // let team;
            // let sorted = res.data.rankings.sort((a, b) => {
            //     return b.sort_orders[index] - a.sort_orders[index];
            // });
        
            // for(let i = 0; i < ((sorted.length > 15) ? 15 : sorted.length); i++) {
                
            //     team = sorted[i];
            //     special = team.sort_orders[index]
                
            //     data.push([team.rank, team.team_key.substring(3), special, Object.values(team.record).join("-"), team.matches_played]);
            // };
            // embed = new EmbedBuilder()
            //     .setColor("#F79A2A")
            //     .setDescription("```" + table(data, tableConfig) + "```")
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

        async function recentEvent(team) {
            const response = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${dayjs().year()}/simple`, config);
      
            const currentDate = dayjs();
            
            const startedEvents = response.data.filter(event =>
                dayjs(event.start_date).diff(currentDate, 'milliseconds') <= 0
            );
        
            if (startedEvents.length === 0) {
                // console.log("No events have started for team", team);
                return null;
            }
      
            startedEvents.sort((a, b) => Math.abs(dayjs(a.start_date).diff(currentDate)) - Math.abs(dayjs(b.start_date).diff(currentDate)));
            // console.log("Started events for team", team, ":", startedEvents);
            return startedEvents[0];
          }
    },
};
