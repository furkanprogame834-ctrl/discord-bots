const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

const IZINLI_KULLANICILAR = ['1490360716341805146', '1466376396346490973'];
const MAX_ADET = 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mutlulukbaba')
    .setDescription('Belirli sayida kanal olusturur (ozel kullanici icin)')
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac kanal olusturulsun (1-1000)').setRequired(true).setMinValue(1).setMaxValue(MAX_ADET))
    .addStringOption(opt => opt.setName('isim').setDescription('Kanal adi (temel ad)').setRequired(true)),
  async execute(interaction) {
    if (!IZINLI_KULLANICILAR.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription('❌ Bu komutu sadece sahibim kullanabilir!')],
        ephemeral: true,
      });
    }

    const adet = interaction.options.getInteger('adet');
    const isim = interaction.options.getString('isim').toLowerCase().replace(/[^a-z0-9ğüşıöç-]/gi, '-').replace(/-+/g, '-').slice(0, 30);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`✅ **${adet}** kanal oluşturuluyor...\nAd: \`${isim}-1\`, \`${isim}-2\` ... \`${isim}-${adet}\``)],
      ephemeral: true,
    });

    let olusan = 0;
    for (let i = 1; i <= adet; i++) {
      const ad = `${isim}-${i}`;
      if (interaction.guild.channels.cache.some(c => c.name === ad)) continue;
      try {
        await interaction.guild.channels.create({ name: ad, type: ChannelType.GuildText });
        olusan++;
      } catch (e) {
        console.error('Kanal olusturma hatasi:', e.message);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✅ Kanallar Oluşturuldu')
      .setDescription(`Oluşturulan: **${olusan}** kanal${olusan !== adet ? ` (zaten var olan ${adet - olusan} kanal atlandı)` : ''}`)
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  },
};