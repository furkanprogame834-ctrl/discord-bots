const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu-patlat')
    .setDescription('Sunucudaki TUMSunucu-patlatsileri, kanallari, rolleri, emojileri siler')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', ephemeral: true });
    }

    await interaction.reply({ content: ':warning: Sunucu temizleniyor... Bu biraz surun.', ephemeral: true });

    const guild = interaction.guild;

    const { ButtonBuilder, ActionRowBuilder, ComponentType } = require('discord.js');

    const onayBtn = new ButtonBuilder()
      .setCustomId('patlat_onay')
      .setLabel('EVET, SIL!')
      .setStyle(4);

    const iptalBtn = new ButtonBuilder()
      .setCustomId('patlat_iptal')
      .setLabel('IPTAL')
      .setStyle(2);

    const row = new ActionRowBuilder().addComponents(onayBtn, iptalBtn);

    const onay = await interaction.followUp({
      content: ':skull: **DIKKAT!** Sunucudaki TUM kanallar, roller, emojiler, webhooklar ve davetler silinecek! Emin misin?',
      components: [row],
      fetchReply: true,
    });

    const collector = onay.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Bu butonu sadece komutu kullanan kisi kullanabilir!', ephemeral: true });
      }

      if (i.customId === 'patlat_iptal') {
        collector.stop('iptal');
        return i.update({ content: ':white_check_mark: Islem iptal edildi.', components: [] });
      }

      if (i.customId === 'patlat_onay') {
        collector.stop('onay');
        await i.update({ content: ':wastebasket: Temizleniyor...', components: [] });

        let silinenKanal = 0;
        let silinenRol = 0;
        let silinenEmoji = 0;

        for (const [_, kanal] of guild.channels.cache) {
          try {
            await kanal.delete('Sunucu temizlendi');
            silinenKanal++;
          } catch (e) {}
        }

        for (const [_, rol] of guild.roles.cache) {
          try {
            if (rol.id !== guild.id) {
              await rol.delete('Sunucu temizlendi');
              silinenRol++;
            }
          } catch (e) {}
        }

        for (const [_, emoji] of guild.emojis.cache) {
          try {
            await emoji.delete();
            silinenEmoji++;
          } catch (e) {}
        }

        try {
          const webhooklar = await guild.fetchWebhooks();
          for (const [_, webhook] of webhooklar) {
            try { await webhook.delete(); } catch (e) {}
          }
        } catch (e) {}

        try {
          const davetler = await guild.invites.fetch();
          for (const [_, davet] of davetler) {
            try { await davet.delete(); } catch (e) {}
          }
        } catch (e) {}

        const { ChannelType } = require('discord.js');
        const logKanal = await guild.channels.create({
          name: 'log',
          type: ChannelType.GuildText,
        });

        await logKanal.send(`:white_check_mark: **Sunucu temizlendi!**\n:shield: Kanal: ${silinenKanal}\n:memo: Rol: ${silinenRol}\n:art: Emoji: ${silinenEmoji}`);
      }
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'onay' && reason !== 'iptal') {
        interaction.editReply({ content: ':clock1: Islem suresi doldu, iptal edildi.', components: [] });
      }
    });
  },
};
