const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const IZINLI_KULLANICI = '1466376396346490973';
const MAX_ADET = 400;
const GRUP = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mutluluk')
    .setDescription('Belirli sayida mesaj yazar (ozel kullanici icin)')
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac mesaj yazilsin (1-400)').setRequired(true).setMinValue(1).setMaxValue(MAX_ADET))
    .addStringOption(opt => opt.setName('mesaj').setDescription('Yazilacak mesaj').setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== IZINLI_KULLANICI) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('❌ Bu komutu sadece sahibim kullanabilir!')],
        ephemeral: true,
      });
    }

    const adet = interaction.options.getInteger('adet');
    const mesaj = interaction.options.getString('mesaj');

    global.mutlulukDurdur = false;
    global.mutlulukAktif = true;

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`✅ **${adet}** mesaj yaziliyor: \`${mesaj}\`\nDurdurmak icin: \`/mutluluk-durdur\``)],
      ephemeral: true,
    });

    for (let i = 0; i < adet; i += GRUP) {
      if (global.mutlulukDurdur) break;
      const kalan = Math.min(GRUP, adet - i);
      const istekler = [];
      for (let j = 0; j < kalan; j++) {
        istekler.push(interaction.channel.send(mesaj).catch(() => {}));
      }
      await Promise.all(istekler);
    }

    if (global.mutlulukDurdur) {
      global.mutlulukDurdur = false;
      global.mutlulukAktif = false;
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('⏹️ Mesaj spamini durduruldu.')],
      });
      return;
    }

    global.mutlulukAktif = false;
  },
};