const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anket-duyuru')
    .setDescription('Oy butonlari olan duyuru/anket yapar')
    .addStringOption(opt => opt.setName('soru').setDescription('Anket/duyuru sorusu').setRequired(true))
    .addStringOption(opt => opt.setName('secenekler').setDescription('Varsayilan: Evet / Hayir'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisi gerekir.', ephemeral: true });
    }

    const soru = interaction.options.getString('soru');
    const secOption = interaction.options.getString('secenekler');
    const secenekler = secOption && secOption.includes(',')
      ? secOption.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5)
      : ['Evet', 'Hayir'];

    const turkce = ['\u{1F7E2}', '\u{1F534}', '\u{1F535}', '\u{1F7E1}', '\u{1F7E3}'];

    const embed = new EmbedBuilder()
      .setTitle(':bar_chart: Anket / Duyuru')
      .setDescription(`**${soru}**`)
      .setColor(0x7289DA)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setFooter({ text: 'Oy vermek icin bir butona tikla' })
      .setTimestamp();

    const row = new ActionRowBuilder();
    secenekler.forEach((s, i) => {
      row.addComponents(new ButtonBuilder().setCustomId(`anket_${i}`).setLabel(s).setStyle(i % 3 === 0 ? ButtonStyle.Success : i % 3 === 1 ? ButtonStyle.Danger : ButtonStyle.Primary).setEmoji(turkce[i]));
    });

    const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

    const oylar = new Map();

    const collector = msg.createMessageComponentCollector({ time: 12 * 60 * 60 * 1000 });

    collector.on('collect', async (i) => {
      const idx = parseInt(i.customId.replace('anket_', ''), 10);
      if (!oylar.has(i.user.id)) oylar.set(i.user.id, idx);
      await i.reply({ content: oylar.get(i.user.id) === idx ? `:white_check_mark: **${secenekler[idx]}** cevabina oy verdin.` : ':warning: Oyun zaten kayitli, degistiremezsin.', ephemeral: true });
    });

    collector.on('end', async () => {
      await msg.edit({ components: [] });
    });

    await interaction.reply({ content: `:white_check_mark: Anket baslatildi! (**${secenekler.length}** secenek)`, ephemeral: true });
  },
};
