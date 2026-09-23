const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Cekilis baslatir')
    .addStringOption(option => option.setName('odul').setDescription('Cekilis odulu').setRequired(true))
    .addIntegerOption(option => option.setName('sure').setDescription('Sure (dakika)').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addIntegerOption(option => option.setName('kazanan').setDescription('Kazanan sayisi').setMinValue(1).setMaxValue(20))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Sunucuyu Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const odul = interaction.options.getString('odul');
    const sure = interaction.options.getInteger('sure');
    const kazananSayisi = interaction.options.getInteger('kazanan') || 1;

    const bitis = Date.now() + sure * 60 * 1000;

    const embed = new EmbedBuilder()
      .setColor(0xFF00FF)
      .setTitle(':tada: CEKILIS!')
      .setDescription(`**Odul:** ${odul}\n**Sure:** ${sure} dakika\n**Kazanan:** ${kazananSayisi}\n**Bitis:** <t:${Math.floor(bitis / 1000)}:R>`)
      .setFooter({ text: `${interaction.user.username} tarafindan baslatildi` })
      .setTimestamp();

    const mesaj = await interaction.reply({ embeds: [embed], fetchReply: true });
    await mesaj.react('🎉');

    const filter = (reaction, user) => reaction.emoji.name === '🎉' && !user.bot;
    const collector = mesaj.createReactionCollector({ filter, time: sure * 60 * 1000 });

    const katilimcilar = new Set();

    collector.on('collect', (reaction, user) => {
      katilimcilar.add(user.id);
    });

    collector.on('remove', (reaction, user) => {
      katilimcilar.delete(user.id);
    });

    collector.on('end', async () => {
      const katilimciListesi = [...katilimcilar];

      if (katilimciListesi.length === 0) {
        await mesaj.edit({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle(':tada: CEKILIS BITTI!').setDescription('Katilimci yok! Cekilis iptal edildi.')] });
        return;
      }

      const kazananlar = [];
      const kalan = [...katilimciListesi];

      for (let i = 0; i < Math.min(kazananSayisi, katilimciListesi.length); i++) {
        const rastgele = Math.floor(Math.random() * kalan.length);
        kazananlar.push(kalan[rastgele]);
        kalan.splice(rastgele, 1);
      }

      const kazananMetin = kazananlar.map(id => `<@${id}>`).join(', ');

      await mesaj.edit({
        embeds: [new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle(':tada: CEKILIS BITTI!')
          .setDescription(`**Odul:** ${odul}\n**Kazananlar:** ${kazananMetin}`)
          .setTimestamp()],
      });

      await mesaj.reply(`:tada: **Tebrikler!** ${kazananMetin} kazandi! Odul: **${odul}**`);
    });
  },
};
