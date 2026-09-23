const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucu-temizlik')
    .setDescription('Sunucuda temizlik yapar (bos kanallar / mesajlar)')
    .addStringOption(opt => opt.setName('tur').setDescription('Temizlik turu')
      .addChoices(
        { name: 'Bos Kanallari Sil', value: 'boskanal' },
        { name: 'Bot Mesajlarini Sil', value: 'botmesaj' },
        { name: 'Eski Mesajlari Sil', value: 'eskimesaj' },
      ).setRequired(true))
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac mesaj incelensin (default 100, max 500)').setMinValue(10).setMaxValue(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const tur = interaction.options.getString('tur');
    const adet = interaction.options.getInteger('adet') || 100;

    let ozet = '';

    if (tur === 'boskanal') {
      const bosKanallar = interaction.guild.channels.cache.filter(ch =>
        (ch.type === ChannelType.GuildText && ch.messages.cache.size === 0) ||
        (ch.type === ChannelType.GuildVoice && ch.members.size === 0));

      if (bosKanallar.size === 0) {
        return interaction.reply({ content: ':white_check_mark: Bos kanal yok, her sey temiz!', ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('temp_evet').setLabel(`Evet, ${bosKanallar.size} bos kanali sil`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('temp_hayir').setLabel('Iptal').setStyle(ButtonStyle.Secondary),
      );

      const msg = await interaction.reply({
        content: `**:warning:** **${bosKanallar.size}** bos kanal bulundu. Silinsin mi?\n${bosKanallar.first(10).map(k => `- ${k.name}`).join('\n')}${bosKanallar.size > 10 ? `\n+${bosKanallar.size - 10} daha` : ''}`,
        components: [row],
        fetchReply: true,
      });

      const collector = msg.createMessageComponentCollector({ time: 20000, max: 1 });
      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: 'Sadece komutu kullanan kisi!', ephemeral: true });
        if (i.customId === 'temp_hayir') {
          return i.update({ content: ':x: Iptal edildi.', components: [] });
        }
        let silinen = 0;
        for (const k of bosKanallar.values()) {
          try { await k.delete('Sunucu temizligi'); silinen++; } catch (e) {}
        }
        await i.update({ content: `:white_check_mark: **${silinen}** bos kanal silindi.`, components: [] });
      });
      return;
    }

    if (tur === 'botmesaj' || tur === 'eskimesaj') {
      const kanallar = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).values();
      let silinen = 0;

      for (const ch of kanallar) {
        try {
          const mesajlar = await ch.messages.fetch({ limit: adet });
          const hedef = tur === 'botmesaj' ? mesajlar.filter(m => m.author.bot) : mesajlar;
          const list = [...hedef.values()];
          for (let i = 0; i < list.length; i += 100) {
            const parca = list.slice(i, i + 100);
            await ch.bulkDelete(parca, true);
            silinen += parca.length;
          }
        } catch (e) {}
      }
      ozet = `:white_check_mark: **${silinen}** mesaj silindi. (${tur === 'botmesaj' ? 'bot mesajlari' : 'eski mesajlar'})`;
    }

    const embed = new EmbedBuilder()
      .setTitle(':broom: Sunucu Temizligi')
      .setDescription(ozet)
      .setColor(0x00FF00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
