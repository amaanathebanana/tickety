const config = require('../../config.json')
const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const ticketSchema = require('../schemas/ticket')
const { discordTranscripts } = require('discord-html-transcripts')
module.exports = {
    id: "application-ticket",
    async execute(interaction) {
        await interaction.reply({ content: `Creating a ticket for you! Please wait.`, ephemeral: true })
        let channel
        try {
            channel = await interaction.guild.channels.create({
                name: `application-${interaction.member.user.username}`,
                type: ChannelType.GuildText,
                parent: config.parentId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    {
                        id: interaction.member.id,
                        allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    {
                        id: config.applicationId,
                        allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                ]
            })
        } catch (error) {
            console.log(error)
            return interaction.editReply('There was an error while creating your ticket. Please report this to a staff member.')
        }
        const addDB = new ticketSchema({
            type: 'application',
            userId: interaction.member.id,
            channelId: channel.id,
            closed: false,
            claimed: false,
            username: interaction.member.user.username,
            supportRole: config.applicationId
        })
        await addDB.save()
        const embed = new EmbedBuilder()
            .setTitle(`Ticket`)
            .setDescription(`${interaction.member} wants to apply!`)
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim-ticket')
                    .setLabel('Claim Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📌'),
                new ButtonBuilder()
                    .setCustomId('close-ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔒')
            )
        await channel.send({ content: `<@&${config.applicationId}>`, embeds: [embed], components: [row] })
        await interaction.editReply(`A ticket has been created for you at ${channel}`)
        setTimeout(async (channel) => {
            const database = await ticketSchema.findOne({ channelId: channel.id })
            const messages = await channel.messages.fetch({ limit: 5 })
            if (messages.size > 1) return
            await interaction.reply('Creating Transcript. This ticket will be deleted soon.')
            const attachment = await discordTranscripts.createTranscript(interaction.channel)
            const embed = new EmbedBuilder()
                .setTitle('Ticket Transcript')
                .setColor('Blurple')
                .addFields({
                    name: `Ticket Creator`,
                    value: `<@${database.userId}> | ${database.userId}`,
                    inline: true
                }, {
                    name: `Channel ID`,
                    value: `${database.channelId}`,
                    inline: true
                })
            const channel = await interaction.guild.channels.cache.get(config.logId)
            await channel.send({ embeds: [embed], files: [attachment] })
            await interaction.editReply(`Transcript Made. Ticket deleting`)
            await interaction.channel.delete()
            await database.delete()
        }, 180000, channel)
    }
}

