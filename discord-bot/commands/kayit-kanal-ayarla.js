const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadDb, saveDb } = require('../lib/kayit-sistemi-db.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayit-kanal-ayarla')
    .setDescription('Admin: Gelen üye kanalını ayarla (kayıt yetkilisi taglanır)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt => opt.setName('kanal').setDescription('Yeni üyenin duyurulacağı kanal').setRequired(true))
    .addStringOption(opt => opt.setName('mesaj').setDescription('Özel mesaj (opsiyonel)').setMaxLength(500)),
  async execute(interaction) {
    const db = loadDb();
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    const kanal = interaction.options.getChannel('kanal');
    const mesaj = interaction.options.getString('mesaj');

    db[interaction.guild.id].kanal = kanal.id;
    if (mesaj) db[interaction.guild.id].mesaj = mesaj;
    saveDb(db);

    const ayar = db[interaction.guild.id];
    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle('📢 Gelen Üye Kanalı Ayarlandı')
      .setDescription(
        `Kanal: <#${kanal.id}>\n` +
        `Özel mesaj: ${ayar.mesaj ? `\`${ayar.mesaj.slice(0, 80)}\`` : 'yok'}\n\n` +
        `Artık yeni üye girince burada kayıt yetkilisi rolü taglanacak.`
      )
      .setTimestamp();

    await kanal.send({ embeds: [embed] });
    return interaction.reply({ content: `✅ Kanal <#${kanal.id}> olarak ayarlandı ve test mesajı gönderildi.`, flags: 64 });
  },
};