const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription("Embed'li duyuru gonderir")
    .addStringOption(opt => opt.setName('baslik').setDescription('Duyuru basligi').setRequired(true))
    .addStringOption(opt => opt.setName('mesaj').setDescription('Duyuru metni').setRequired(true))
    .addChannelOption(opt => opt.setName('kanal').setDescription('Gonderilecek kanal (bos = bu kanal)'))
    .addRoleOption(opt => opt.setName('rol').setDescription('Etiketlenecek rol'))
    .addBooleanOption(opt => opt.setName('onemli').setDescription('Kirmizi renk (#onemli) kullan'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisi gerekir.', ephemeral: true });
    }

    const baslik = interaction.options.getString('baslik');
    const mesaj = interaction.options.getString('mesaj');
    const kanal = interaction.options.getChannel('kanal') || interaction.channel;
    const rol = interaction.options.getRole('rol');
    const onemli = interaction.options.getBoolean('onemli') || false;

    const embed = new EmbedBuilder()
      .setTitle(`:mega: ${baslik}`)
      .setDescription(mesaj)
      .setColor(onemli ? 0xED4245 : 0x7289DA)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const content = rol && rol.id !== interaction.guild.id ? `<@&${rol.id}>` : '';

    await kanal.send({ content, embeds: [embed] });

    const gecmisPath = path.join(__dirname, '..', 'duyuru-gecmis-db.json');
    try {
      let gecmis = [];
      try { gecmis = JSON.parse(fs.readFileSync(gecmisPath, 'utf8')); } catch {}
      gecmis.push({ guildId: interaction.guild.id, baslik, metin: mesaj, kanalId: kanal.id, zaman: Date.now() });
      fs.writeFileSync(gecmisPath, JSON.stringify(gecmis, null, 2));
    } catch (e) {}

    const onay = new EmbedBuilder()
      .setDescription(`:white_check_mark: Duyuru **${kanal.name}** kanalina gonderildi.`)
      .setColor(0x57F287);
    await interaction.reply({ embeds: [onay], ephemeral: true });
  },
};
