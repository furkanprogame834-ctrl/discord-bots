const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('durum-log')
    .setDescription('Sunucu aktivite logu gosterir')
    .addStringOption(opt =>
      opt.setName('tur')
        .setDescription('Log turu')
        .addChoices(
          { name: 'Son Mesajlar', value: 'mesaj' },
          { name: 'Son Giris/Cikis', value: 'uye' },
          { name: 'Son Moderasyon', value: 'mod' },
        )
    )
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac log gosterilecek').setMinValue(5).setMaxValue(25))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const tur = interaction.options.getString('tur') || 'uye';
    const adet = interaction.options.getInteger('adet') || 10;
    const guild = interaction.guild;

    if (tur === 'mesaj') {
      const kanal = guild.channels.cache.find(ch => ch.name === 'log' || ch.name === 'bot-log' || ch.name === 'mesaj-log');
      if (!kanal) {
        return interaction.reply({ content: ':x: Log kanali bulunamadi! (`log`, `bot-log` veya `mesaj-log` kanali gerekli)', ephemeral: true });
      }

      try {
        const mesajlar = await kanal.messages.fetch({ limit: Math.min(adet * 2, 100) });
        const botMesajlari = mesajlar.filter(m => m.author.bot).first(adet);

        if (botMesajlari.length === 0) {
          return interaction.reply({ content: 'Log kanalinda bot mesaji bulunamadi.', ephemeral: true });
        }

        const satirlar = botMesajlari.map(m => {
          const tarih = `<t:${Math.floor(m.createdTimestamp / 1000)}:R>`;
          return `> ${m.content.substring(0, 80)}${m.content.length > 80 ? '...' : ''}\n> ${tarih}`;
        });

        const embed = new EmbedBuilder()
          .setColor(0x00BFFF)
          .setTitle(':scroll: Son Mesaj Loglari')
          .setDescription(satirlar.join('\n\n'))
          .setFooter({ text: `${adet} log gosteriliyor` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (e) {
        await interaction.reply({ content: ':x: Loglar okunurken hata olustu!', ephemeral: true });
      }

    } else if (tur === 'uye') {
      const logKanal = guild.channels.cache.find(ch => ch.name === 'log' || ch.name === 'bot-log' || ch.name === 'hosgeldiniz');
      if (!logKanal) {
        return interaction.reply({ content: ':x: Log kanali bulunamadi!', ephemeral: true });
      }

      try {
        const mesajlar = await logKanal.messages.fetch({ limit: Math.min(adet * 3, 100) });
        const uyeMesajlari = mesajlar.filter(m =>
          m.embeds.length > 0 &&
          (m.embeds[0].title?.includes('Yeni Uye') || m.embeds[0].title?.includes('Uye Ayrildi') || m.embeds[0].title?.includes('HOS GELDIN'))
        ).first(adet);

        if (uyeMesajlari.length === 0) {
          return interaction.reply({ content: 'Son giris/cikis logu bulunamadi.', ephemeral: true });
        }

        const satirlar = uyeMesajlari.map(m => {
          const tarih = `<t:${Math.floor(m.createdTimestamp / 1000)}:R>`;
          const baslik = m.embeds[0]?.title || 'Bilinmiyor';
          const aciklama = m.embeds[0]?.description?.substring(0, 60) || '';
          return `> **${baslik}** - ${aciklama}\n> ${tarih}`;
        });

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle(':door: Son Giris/Cikis Loglari')
          .setDescription(satirlar.join('\n\n'))
          .setFooter({ text: `${adet} log gosteriliyor` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (e) {
        await interaction.reply({ content: ':x: Loglar okunurken hata olustu!', ephemeral: true });
      }

    } else if (tur === 'mod') {
      const modKanal = guild.channels.cache.find(ch => ch.name === 'log' || ch.name === 'bot-log' || ch.name === 'mod-log');
      if (!modKanal) {
        return interaction.reply({ content: ':x: Moderasyon kanali bulunamadi!', ephemeral: true });
      }

      try {
        const mesajlar = await modKanal.messages.fetch({ limit: Math.min(adet * 2, 100) });
        const modMesajlari = mesajlar.filter(m =>
          m.embeds.length > 0 &&
          (m.embeds[0].title?.includes('Atildi') || m.embeds[0].title?.includes('Yasaklandi') ||
           m.embeds[0].title?.includes('Mute') || m.embeds[0].title?.includes('Yavaslatildi') ||
           m.embeds[0].title?.includes('Temizlendi') || m.embeds[0].title?.includes('Yasak'))
        ).first(adet);

        if (modMesajlari.length === 0) {
          return interaction.reply({ content: 'Son moderasyon logu bulunamadi.', ephemeral: true });
        }

        const satirlar = modMesajlari.map(m => {
          const tarih = `<t:${Math.floor(m.createdTimestamp / 1000)}:R>`;
          const baslik = m.embeds[0]?.title || 'Bilinmiyor';
          return `> **${baslik}**\n> ${tarih}`;
        });

        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle(':shield: Son Moderasyon Loglari')
          .setDescription(satirlar.join('\n\n'))
          .setFooter({ text: `${adet} log gosteriliyor` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (e) {
        await interaction.reply({ content: ':x: Loglar okunurken hata olustu!', ephemeral: true });
      }
    }
  },
};
