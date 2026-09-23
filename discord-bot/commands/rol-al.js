const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { toplaIsimler } = require('./toplu-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol-al')
    .setDescription('Belirtilen kullanicilardan rolu toplu kaldirir (ID/mention/isim)')
    .addRoleOption(opt => opt.setName('rol').setDescription('Kaldirilacak rol').setRequired(true))
    .addStringOption(opt => opt.setName('kisiler').setDescription('Rolu kaldirilacaklar: ID veya kullanici adlari (boslukla)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Rolleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const rol = interaction.options.getRole('rol');
    if (rol.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: ':x: Bu rol, senin rolunden esit veya daha yuksek! Kaldiramazsin.', ephemeral: true });
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
        if (!member.roles.cache.has(rol.id)) {
          sonuclar.push(`:grey_question: **${member.user.username}** rolde degil`);
          continue;
        }
        await member.roles.remove(rol.id);
        sonuclar.push(`:white_check_mark: **${member.user.username}** rolu alindi`);
        basarili++;
      } catch (e) {
        sonuclar.push(`:x: **${member.user.username}** hata`);
        basarisiz++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(':pushpin: Rol Kaldir')
      .setDescription(`**${rol.name}** rolunden islem\n:white_check_mark: **${basarili}** alindi\n:x: **${basarisiz}** basarisiz`)
      .addFields({ name: ':page_facing_up: Detay', value: sonuclar.join('\n'), inline: false })
      .setColor(0xFFA500)
      .setTimestamp();

    try { await interaction.channel.send({ embeds: [embed] }); }
    catch (e) { await interaction.reply({ embeds: [embed] }); }
  },
};
