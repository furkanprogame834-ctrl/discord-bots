const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anket')
    .setDescription('Oy kullamali anket olusturur')
    .addStringOption(opt => opt.setName('soru').setDescription('Anket sorusu').setRequired(true))
    .addStringOption(opt => opt.setName('secenek1').setDescription('1. secenek').setRequired(true))
    .addStringOption(opt => opt.setName('secenek2').setDescription('2. secenek').setRequired(true))
    .addStringOption(opt => opt.setName('secenek3').setDescription('3. secenek'))
    .addStringOption(opt => opt.setName('secenek4').setDescription('4. secenek'))
    .addStringOption(opt => opt.setName('secenek5').setDescription('5. secenek')),
  async execute(interaction) {
    const soru = interaction.options.getString('soru');
    const secenekler = [
      interaction.options.getString('secenek1'),
      interaction.options.getString('secenek2'),
      interaction.options.getString('secenek3'),
      interaction.options.getString('secenek4'),
      interaction.options.getString('secenek5'),
    ].filter(Boolean);

    const emojiList = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    const description = secenekler.map((s, i) => `${emojiList[i]} **${s}** - Oy: 0`).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle(':ballot_box: ANKET')
      .setDescription(`**${soru}**\n\n${description}`)
      .setFooter({ text: `Anketi baslatan: ${interaction.user.username}` })
      .setTimestamp();

    const row = new ActionRowBuilder();
    secenekler.forEach((_, i) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`anket_${interaction.id}_${i}`)
          .setLabel(emojiList[i])
          .setStyle(ButtonStyle.Secondary)
      );
    });

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const oyVerileri = {};
    secenekler.forEach((_, i) => { oyVerileri[i] = new Set(); });

    const collector = msg.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async (i) => {
      const parts = i.customId.split('_');
      const secim = parseInt(parts[parts.length - 1]);
      const userId = i.user.id;

      secenekler.forEach((_, idx) => {
        if (oyVerileri[idx].has(userId)) oyVerileri[idx].delete(userId);
      });

      oyVerileri[secim].add(userId);

      const yeniDesc = secenekler.map((s, idx) => {
        const sayi = oyVerileri[idx].size;
        return `${emojiList[idx]} **${s}** - Oy: **${sayi}**`;
      }).join('\n');

      const toplamOy = Object.values(oyVerileri).reduce((a, b) => a + b.size, 0);

      const guncelEmbed = EmbedBuilder.from(embed)
        .setDescription(`**${soru}**\n\n${yeniDesc}`)
        .setFooter({ text: `Toplam Oy: ${toplamOy} | Anketi baslatan: ${interaction.user.username}` });

      await i.update({ embeds: [guncelEmbed] });
    });
  },
};
