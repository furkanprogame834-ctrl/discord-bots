const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'haber-kayit-db.json');

function load() {
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch { return {}; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('haber-kayit')
    .setDescription('Haberleri belirli kanala otomatik gonderir (her 6 saatte)')
    .addSubcommand(sub => sub.setName('ac').setDescription('Belirli kanala otomatik haber gonderimini ac')
      .addChannelOption(opt => opt.setName('kanal').setDescription('Haber gonderilecek kanal').setRequired(true)))
    .addSubcommand(sub => sub.setName('kapat').setDescription('Bu sunucuda otomatik haber gonderimini kapat'))
    .addSubcommand(sub => sub.setName('durum').setDescription('Otomatik haber gonderim durumunu goster'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisi gerekir.', ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const db = load();
    const sonKaydedilmis = db[interaction.guild.id];

    if (sub === 'ac') {
      const kanal = interaction.options.getChannel('kanal');
      db[interaction.guild.id] = { kanalId: kanal.id, zaman: Date.now() };
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      const embed = new EmbedBuilder()
        .setTitle(':newspaper: Otomatik Haber Açildi!')
        .setDescription(`Haberler her **6 saatte** <#${kanal.id}> kanalina otomatik gonderilecek.`)
        .setColor(0x57F287);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'kapat') {
      if (sonKaydedilmis) {
        delete db[interaction.guild.id];
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        return interaction.reply({ content: ':x: Otomatik haber gonderimi kapatildi.', ephemeral: true });
      }
      return interaction.reply({ content: ':grey_exclamation: Bu sunucuda otomatik haber acik degil.', ephemeral: true });
    }

    if (sub === 'durum') {
      if (sonKaydedilmis) {
        return interaction.reply({ content: `:newspaper: Otomatik haber **ACIK** — kanal: <#${sonKaydedilmis.kanalId}>` });
      }
      return interaction.reply({ content: ':grey_exclamation: Otomatik haber **KAPALI**.' });
    }
  },
};
