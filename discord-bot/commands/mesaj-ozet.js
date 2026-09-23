const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesaj-ozet')
    .setDescription('Belirtilen suredeki mesaj sayilarini listeler')
    .addStringOption(opt => opt.setName('donem').setDescription('Incelenecek donem (saat)')
      .addChoices(
        { name: 'Son 1 saat', value: '1' },
        { name: 'Son 3 saat', value: '3' },
        { name: 'Son 6 saat', value: '6' },
        { name: 'Son 12 saat', value: '12' },
        { name: 'Son 24 saat', value: '24' },
        { name: 'Son 3 gun', value: '72' },
        { name: 'Son 7 gun', value: '168' },
      ).setRequired(true))
    .addChannelOption(opt => opt.setName('kanal').setDescription('Sadece bu kanali incele').addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const saat = parseInt(interaction.options.getString('donem'));
    const kanal = interaction.options.getChannel('kanal');
    const sinirZaman = Date.now() - saat * 60 * 60 * 1000;

    const sayaclar = new Map();
    let toplam = 0;
    let okunanKanal = 0;

    const kanallar = kanal ? [kanal] : interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).values();

    for (const ch of kanallar) {
      try {
        okunanKanal++;
        let after = sinirZaman;
        const fetchLimit = 100;
        let mesajlar = await ch.messages.fetch({ limit: fetchLimit });
        mesajlar = mesajlar.filter(m => m.createdTimestamp >= sinirZaman);
        for (const m of mesajlar.values()) {
          if (m.author.bot) continue;
          toplam++;
          sayaclar.set(m.author.id, (sayaclar.get(m.author.id) || 0) + 1);
        }
      } catch (e) { continue; }
    }

    if (toplam === 0) {
      return interaction.reply({ content: `:x: Son **${saat}** saatte hic mesaj bulunamadi.`, ephemeral: true });
    }

    const sirala = [...sayaclar.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

    const satirlar = sirala.map(([id, n], i) => {
      const medal = i === 0 ? ':first_place:' : i === 1 ? ':second_place:' : i === 2 ? ':third_place:' : ':small_blue_diamond:';
      const uye = interaction.guild.members.cache.get(id);
      return `${medal} **${uye?.displayName || 'Bilinmeyen'}** — ${n} mesaj`;
    });

    const embed = new EmbedBuilder()
      .setTitle(':bar_chart: Mesaj Ozeti')
      .setDescription(`Son **${saat}** saatte **${toplam}** mesaj | **${okunanKanal}** kanal incelendi${kanal ? ` | Kanal: ${kanal}` : ''}`)
      .addFields({ name: ':trophy: En Aktif 15 Kisi', value: satirlar.join('\n'), inline: false })
      .setColor(0x00BFFF)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
