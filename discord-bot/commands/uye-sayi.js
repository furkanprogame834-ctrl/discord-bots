const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uye-sayi')
    .setDescription('Uye sayisi ses kanalini gunceller'),

  async execute(interaction) {
    const guild = interaction.guild;

    // Uye sayisi ses kanalini bul
    const kanal = guild.channels.cache.find(ch =>
      ch.type === 2 && (ch.name.includes('uye') || ch.name.includes('Uye') || ch.name.includes('member') || ch.name.includes('sayi'))
    );

    if (!kanal) {
      const hata = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(':x: Kanal Bulunamadi!')
        .setDescription('Uye sayisi icin bir ses kanali bulunamadi.\n\n**Yapman gereken:**\nSes kanali olustur ve adina `uye sayisi` veya `Uye Sayisi` yaz.')
        .setTimestamp();
      return interaction.reply({ embeds: [hata], ephemeral: true });
    }

    try {
      await kanal.setName(`👤 Üye Sayısı: ${guild.memberCount}`);
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(':white_check_mark: Guncellendi!')
        .setDescription(`Ses kanali guncellendi!\n\n**Kanal:** ${kanal}\n**Uye Sayisi:** ${guild.memberCount}`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      const hata = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(':x: Hata!')
        .setDescription('Kanal adi degistirilemedi. Botun izinlerini kontrol et.')
        .setTimestamp();
      await interaction.reply({ embeds: [hata], ephemeral: true });
    }
  }
};
