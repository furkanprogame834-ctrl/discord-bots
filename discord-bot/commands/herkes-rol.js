const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('herkes-rol')
    .setDescription('Sunucudaki HERKESE rol verir veya herkesten rol alir')
    .addSubcommand(sub => sub.setName('ver').setDescription('Tum uyelere rol ver')
      .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true))
      .addBooleanOption(opt => opt.setName('botlar').setDescription('Botlara da verilsin mi? (default: hayir)'))
      .addBooleanOption(opt => opt.setName('yuksek').setDescription('Yonetici rolune sahipleri de islesin mi? (default: hayir)')))
    .addSubcommand(sub => sub.setName('al').setDescription('Tum uyelerden rol al')
      .addRoleOption(opt => opt.setName('rol').setDescription('Alinacak rol').setRequired(true))
      .addBooleanOption(opt => opt.setName('botlar').setDescription('Botlardan da alinsin mi? (default: hayir)'))
      .addBooleanOption(opt => opt.setName('yuksek').setDescription('Yonetici rolune sahipleri de islesin mi? (default: hayir)')))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const rol = interaction.options.getRole('rol');
    const botlar = interaction.options.getBoolean('botlar') || false;
    const yuksek = interaction.options.getBoolean('yuksek') || false;

    if (rol.id === interaction.guild.id) {
      return interaction.reply({ content: ':x: @everyone rolune islem yapilamaz!', ephemeral: true });
    }
    if (!yuksek && rol.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: ':x: Bu rol senin rolunden esit veya yuksek! (Snirli uygulamak icin `yuksek:true` kullanabilirsin ama yapilamayabilir)', ephemeral: true });
    }

    let uyeler = [...interaction.guild.members.cache.values()];
    if (!botlar) uyeler = uyeler.filter(m => !m.user.bot);
    if (!yuksek) uyeler = uyeler.filter(m => m.roles.highest.position < interaction.member.roles.highest.position);

    if (uyeler.length === 0) {
      return interaction.reply({ content: ':x: Isleme alinacak uye yok! (Filtreler nedeniyle)', ephemeral: true });
    }

    const islem = sub === 'ver' ? 'verilecek' : 'alınacak';
    const fiil = sub === 'ver' ? 'eklen' : 'alın';

    const embed = new EmbedBuilder()
      .setTitle(sub === 'ver' ? ':label: Herkese Rol Verme Onayi' : ':pushpin: Herkesten Rol Alma Onayi')
      .setDescription(`**${uyeler.length}** uyeye **${rol.name}** rolü ${islem}.\n\nBu islem sunucudaki herkesi etkiler! Onayliyor musun?`)
      .setColor(0xFFA500)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('herkes_evet').setLabel(`Evet, ${fiil}`).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('herkes_hayir').setLabel('Iptal').setStyle(ButtonStyle.Secondary),
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 20000, max: 1 });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'Sadece komutu kullanan kisi!', ephemeral: true });
      if (i.customId === 'herkes_hayir') return i.update({ content: ':x: Iptal edildi.', embeds: [], components: [] });

      await i.deferUpdate();
      let basarili = 0;
      let hata = 0;
      for (const m of uyeler) {
        try {
          if (sub === 'ver') {
            if (!m.roles.cache.has(rol.id)) { await m.roles.add(rol.id); basarili++; }
          } else {
            if (m.roles.cache.has(rol.id)) { await m.roles.remove(rol.id); basarili++; }
          }
        } catch (e) { hata++; }
      }

      const sonuc = new EmbedBuilder()
        .setTitle(sub === 'ver' ? ':label: Herkese Rol Verildi' : ':pushpin: Herkesten Rol Alindi')
        .setDescription(`**${rol.name}** rolü için\n:white_check_mark: **${basarili}** uyede islendi\n:x: **${hata}** hata`)
        .setColor(hata === 0 ? 0x00FF00 : 0xFFA500)
        .setTimestamp();

      await i.editReply({ embeds: [sonuc], components: [] });
    });

    collector.on('end', async (c) => {
      if (!c.size) await interaction.editReply({ content: ':warning: Sure doldu, iptal.', embeds: [], components: [] });
    });
  },
};
