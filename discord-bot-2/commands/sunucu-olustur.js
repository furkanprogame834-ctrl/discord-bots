const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu-olustur')
    .setDescription('Yeni bir sunucu olusturur')
    .addStringOption(option => option.setName('isim').setDescription('Sunucu adi').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', ephemeral: true });
    }

    const isim = interaction.options.getString('isim');
    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = await interaction.client.guilds.create({ name: isim });

      await guild.roles.create({ name: 'Yonetici', color: 0xFF0000 });
      await guild.roles.create({ name: 'Moderator', color: 0xFFA500 });
      await guild.roles.create({ name: 'Uye', color: 0x00FF00 });
      await guild.roles.create({ name: 'Bot', color: 0x7289DA });
      await guild.roles.create({ name: 'VIP', color: 0xFFD700 });
      await guild.roles.create({ name: 'DJ', color: 0x9B59B6 });

      const genelKat = await guild.channels.create({ name: 'GENEL', type: 0 });
      await guild.channels.create({ name: 'genel', type: 0, parent: genelKat.id });
      await guild.channels.create({ name: 'sohbet', type: 0, parent: genelKat.id });
      await guild.channels.create({ name: 'giris-cikis', type: 0, parent: genelKat.id });
      await guild.channels.create({ name: 'memeler', type: 0, parent: genelKat.id });
      await guild.channels.create({ name: 'resimler', type: 0, parent: genelKat.id });
      await guild.channels.create({ name: 'videolar', type: 0, parent: genelKat.id });
      await guild.channels.create({ name: 'oyun', type: 0, parent: genelKat.id });

      const duyuruKat = await guild.channels.create({ name: 'DUYURULAR', type: 0 });
      await guild.channels.create({ name: 'duyuru', type: 0, parent: duyuruKat.id });
      await guild.channels.create({ name: 'kurallar', type: 0, parent: duyuruKat.id });
      await guild.channels.create({ name: 'cekilis', type: 0, parent: duyuruKat.id });
      await guild.channels.create({ name: 'anket', type: 0, parent: duyuruKat.id });
      await guild.channels.create({ name: 'etkinlik', type: 0, parent: duyuruKat.id });

      const botKat = await guild.channels.create({ name: 'BOT KANALLARI', type: 0 });
      await guild.channels.create({ name: 'bot-komutlari', type: 0, parent: botKat.id });
      await guild.channels.create({ name: 'bot-log', type: 0, parent: botKat.id });

      const destekKat = await guild.channels.create({ name: 'DESTEK', type: 0 });
      await guild.channels.create({ name: 'ticket-panel', type: 0, parent: destekKat.id });
      await guild.channels.create({ name: 'ticket-log', type: 0, parent: destekKat.id });

      const yonetimKat = await guild.channels.create({ name: 'YONETIM', type: 0 });
      await guild.channels.create({ name: 'mod-log', type: 0, parent: yonetimKat.id });
      await guild.channels.create({ name: 'raporlar', type: 0, parent: yonetimKat.id });

      const sesKat = await guild.channels.create({ name: 'SES KANALLARI', type: 4 });
      await guild.channels.create({ name: 'Genel Sohbet', type: 2, parent: sesKat.id });
      await guild.channels.create({ name: 'Muzik Dinle', type: 2, parent: sesKat.id });
      await guild.channels.create({ name: 'Oyun Oyna', type: 2, parent: sesKat.id });
      await guild.channels.create({ name: 'Calisma Odasi', type: 2, parent: sesKat.id });
      await guild.channels.create({ name: 'Sessiz Oda', type: 2, parent: sesKat.id });

      const sahneKat = await guild.channels.create({ name: 'SAHNE', type: 4 });
      await guild.channels.create({ name: 'Sahne 1', type: 2, parent: sahneKat.id });
      await guild.channels.create({ name: 'Sahne 2', type: 2, parent: sahneKat.id });
      await guild.channels.create({ name: 'Sahne 3', type: 2, parent: sahneKat.id });

      const genel = guild.channels.cache.find(c => c.name === 'genel');
      const kurallar = guild.channels.cache.find(c => c.name === 'kurallar');

      if (kurallar) {
        await kurallar.send({
          embeds: [new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(':scroll: SUNUCU KURALLARI')
            .setDescription('1. Saygili ol\n2. Spam yapma\n3. NSFW icerik paylasma\n4. Reklam yapma\n5. Butun kurallara uy')
            .setTimestamp()],
        });
      }

      const davet = genel ? await genel.createInvite({ maxAge: 0, maxUses: 0 }) : null;

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle(':white_check_mark: Sunucu Olusturuldu!')
          .setDescription(`**${isim}** basariyla olusturuldu!`)
          .addFields(
            { name: ':hash: Kanallar', value: '30 kanal olusturuldu', inline: true },
            { name: ':military_star: Roller', value: '6 rol olusturuldu', inline: true },
            ...(davet ? [{ name: ':link: Davet', value: `[Katil](${davet.url})` }] : []),
          )
          .setTimestamp()],
      });
    } catch (error) {
      console.error('Sunucu olusturma hatasi:', error.message, error.code);
      await interaction.editReply({
        content: ':x: Sunucu olusturulamadi!\n\n**Olasin nedenler:**\n- Bot 10+ sunucuda (sinir)\n- Botun yetkisi yetmiyor\n- API hatasi',
      });
    }
  },
};
