const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { toplaIsimler } = require('./toplu-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol-ver')
    .setDescription('Belirtilen kullanicilara role ekler (ID/mention/isim veya rol)')
    .addRoleOption(opt => opt.setName('rol').setDescription('Verilecek rol').setRequired(true))
    .addStringOption(opt => opt.setName('kisiler').setDescription('Rollerine eklenecekler: ID veya kullanici adlari (boslukla)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Rolleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const rol = interaction.options.getRole('rol');
    if (rol.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: ':x: Bu rol, senin rolunden esit veya daha yuksek! Veremezsin.', ephemeral: true });
    }

    const hedefler = toplaIsimler(interaction.options.getString('kisiler'), interaction.guild);
    if (hedefler.length === 0) {
      return interaction.reply({ content: ':x: Hicbir kullanici bulunamadi!', ephemeral: true });
    }

    let basarili = 0;
    let basarisiz = 0;
    const sonuclar = [];

    for (const member of hedefler) {
      try {
        if (member.roles.cache.has(rol.id)) {
          sonuclar.push(`:grey_question: **${member.user.username}** zaten rolde`);
          continue;
        }
        await member.roles.add(rol.id);
        sonuclar.push(`:white_check_mark: **${member.user.username}** role eklendi`);
        basarili++;
      } catch (e) {
        sonuclar.push(`:x: **${member.user.username}** hata`);
        basarisiz++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(':label: Rol Ekle')
      .setDescription(`**${rol.name}** rolune islem\n:white_check_mark: **${basarili}** eklendi\n:x: **${basarisiz}** basarisiz`)
      .addFields({ name: ':page_facing_up: Detay', value: sonuclar.join('\n'), inline: false })
      .setColor(rol.color || 0x00FF00)
      .setTimestamp();

    try { await interaction.channel.send({ embeds: [embed] }); }
    catch (e) { await interaction.reply({ embeds: [embed] }); }
  },
};
