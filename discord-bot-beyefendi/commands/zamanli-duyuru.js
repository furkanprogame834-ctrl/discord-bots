const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'zamanli-duyuru-db.json');

function load() {
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return {}; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('zamanli-duyuru')
    .setDescription('Belirli sure sonra otomatik duyuru gonderir')
    .addStringOption(opt => opt.setName('baslik').setDescription('Duyuru basligi').setRequired(true))
    .addStringOption(opt => opt.setName('mesaj').setDescription('Duyuru metni').setRequired(true))
    .addIntegerOption(opt => opt.setName('dakika').setDescription('Kac dakika sonra gonderilsin').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addRoleOption(opt => opt.setName('rol').setDescription('Etiketlenecek rol'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisi gerekir.', ephemeral: true });
    }

    const baslik = interaction.options.getString('baslik');
    const mesaj = interaction.options.getString('mesaj');
    const dakika = interaction.options.getInteger('dakika');
    const rol = interaction.options.getRole('rol');

    const gonderimZamani = Date.now() + dakika * 60 * 1000;

    const db = load();
    if (!db[interaction.guild.id]) db[interaction.guild.id] = [];
    db[interaction.guild.id].push({
      baslik,
      metin: mesaj,
      kanalId: interaction.channel.id,
      rolId: rol ? rol.id : null,
      zaman: gonderimZamani,
      calisiyor: false,
    });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    const embed = new EmbedBuilder()
      .setTitle(':alarm_clock: Zamanli Duyuru Kuruldu!')
      .setDescription(`**${baslik}**\n${mesaj}\n\n:clock1: **${dakika} dakika** sonra bu kanala otomatik gonderilecek.`)
      .setColor(0x7289DA)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
