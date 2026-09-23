const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarPath = path.join(__dirname, '..', 'form-ayar.json');

function loadDb(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}
function saveDb(p, d) {
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('form-panel')
    .setDescription('Admin: Başvuru formu paneli oluşturur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName('baslik').setDescription('Form başlığı').setRequired(true).setMaxLength(80))
    .addRoleOption(opt => opt.setName('rol').setDescription('Onaylanınca verilecek rol').setRequired(true))
    .addStringOption(opt => opt.setName('soru').setDescription('Özel soru (opsiyonel)').setMaxLength(120))
    .addStringOption(opt => opt.setName('metin').setDescription('Panel açıklaması (opsiyonel)').setMaxLength(500)),

  async execute(interaction) {
    const baslik = interaction.options.getString('baslik');
    const soru = interaction.options.getString('soru');
    const rol = interaction.options.getRole('rol');
    const metin = interaction.options.getString('metin');

    const db = loadDb(ayarPath);
    db[interaction.guild.id] = {
      baslik,
      soru: soru || null,
      rol: rol.id,
      panelKanal: interaction.channel.id,
      sahibi: interaction.user.id,
      zaman: Date.now(),
    };
    saveDb(ayarPath, db);

    const acik = soru ? `\n**Ek soru:** ${soru}` : '';

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(baslik)
      .setDescription(
        (metin || `Aşağıdan **Başvuru** butonuna basarak formu doldurabilirsin.\nBaşvurun yetkililerce incelenecek ve sonuç sana bildirilecek.`) +
        `\n🎖️ Onaylanan üyeye verilecek rol: <@&${rol.id}>` + acik
      )
      .setFooter({ text: 'Başvuru Formu' })
      .setTimestamp();

    const buton = new ButtonBuilder()
      .setCustomId('form-basvuru-ac')
      .setLabel('📝 Başvuru')
      .setStyle(ButtonStyle.Primary);
    const satir = new ActionRowBuilder().addComponents(buton);

    const msg = await interaction.reply({ embeds: [embed], components: [satir], fetchReply: true });
    db[interaction.guild.id].panelMesaj = msg.id;
    saveDb(ayarPath, db);

    return interaction.followUp({ content: '✅ Form paneli hazır! Butona basan kişi kendi formunu ayrı ayrı dolduracak.', flags: 64 });
  },
};