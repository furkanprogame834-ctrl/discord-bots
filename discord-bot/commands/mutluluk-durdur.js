const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const IZINLI_KULLANICI = '1466376396346490973';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mutluluk-durdur')
    .setDescription('Devam eden /mutluluk mesaj spamini durdurur'),
  async execute(interaction) {
    if (interaction.user.id !== IZINLI_KULLANICI) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('❌ Bu komutu sadece sahibim kullanabilir!')],
        ephemeral: true,
      });
    }

    if (!global.mutlulukAktif) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFFFF00).setDescription('⚠️ Şu anda aktif bir /mutluluk spam işlemi yok.')],
        ephemeral: true,
      });
    }

    global.mutlulukDurdur = true;
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('⏹️ Spam durduruluyor...')],
      ephemeral: true,
    });
  },
};