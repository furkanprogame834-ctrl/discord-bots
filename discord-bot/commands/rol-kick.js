const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol-kick')
    .setDescription('Bir roldeki herkesi toplu atar')
    .addRoleOption(opt => opt.setName('rol').setDescription('Atilacak rol').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Atma sebebi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri At** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const rol = interaction.options.getRole('rol');
    const sebep = interaction.options.getString('sebep') || 'Rol kick (sebep belirtilmedi)';

    const hedefler = [...interaction.guild.members.cache.values()].filter(m => m.roles.cache.has(rol.id));

    if (hedefler.length === 0) {
      return interaction.reply({ content: `:x: **${rol.name}** rolunde hic uye yok!`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(':warning: Rol Kick Onayi')
      .setDescription(`**${rol.name}** rolundeki **${hedefler.length}** kisi atilacak!\nSebep: ${sebep}\n\nDevam etmek istiyor musun?`)
      .setColor(0xFFA500)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rolk_onayla').setLabel('Evet, At').setStyle(ButtonStyle.Danger).setEmoji('✅'),
      new ButtonBuilder().setCustomId('rolk_iyptal').setLabel('Iptal').setStyle(ButtonStyle.Secondary).setEmoji('✖️'),
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 20000, max: 1 });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Sadece komutu kullanan kisi onaylayabilir!', ephemeral: true });
      }

      if (i.customId === 'rolk_iyptal') {
        await i.update({ content: ':x: Iptal edildi.', embeds: [], components: [] });
        return;
      }

      await i.deferUpdate();

      const hedefListe = [...interaction.guild.members.cache.values()].filter(m => m.roles.cache.has(rol.id));
      let basarili = 0;
      let basarisiz = 0;
      const sonuclar = [];

      for (const member of hedefListe) {
        try {
          if (!member.kickable) {
            sonuclar.push(`:no_entry: **${member.user.username}** atilamadi`);
            basarisiz++;
            continue;
          }
          if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            sonuclar.push(`:no_entry: **${member.user.username}** esit/yuksek rol`);
            basarisiz++;
            continue;
          }
          await member.kick(sebep);
          sonuclar.push(`:white_check_mark: **${member.user.username}** atildi`);
          basarili++;
        } catch (e) {
          sonuclar.push(`:x: **${member.user.username}** hata`);
          basarisiz++;
        }
      }

      const sonucEmbed = new EmbedBuilder()
        .setTitle(':boom: Rol Kick Tamamlandi')
        .setDescription(`**${rol.name}** rolundeki **${hedefListe.length}** kisi islendi\n:white_check_mark: **${basarili}** atildi\n:x: **${basarisiz}** basarisiz`)
        .addFields({ name: ':page_facing_up: Detay', value: sonuclar.join('\n'), inline: false })
        .setColor(basarisiz === 0 ? 0x00FF00 : 0xFFA500)
        .setFooter({ text: `Sebep: ${sebep}` })
        .setTimestamp();

      await i.editReply({ embeds: [sonucEmbed], components: [] });
    });

    collector.on('end', async (collected) => {
      if (!collected.size) {
        await interaction.editReply({ content: ':warning: Sure doldu, islem iptal.', embeds: [], components: [] });
      }
    });
  },
};
