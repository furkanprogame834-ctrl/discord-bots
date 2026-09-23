const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'boost-db.json');

function loadDb() {
  try { if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch (e) {}
  return {};
}
function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function lastikEmojiler(adet) {
  const emoji = ['🚀', '🔥', '💎', '⚡', '🌟', '💥'];
  return Array.from({ length: Math.min(adet, 6) }, (_, i) => emoji[i]).join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boost')
    .setDescription('Bir üyeyi boostla')
    .addUserOption(opt => opt.setName('uye').setDescription('Boostlanacak üye').setRequired(true)),
  async execute(interaction) {
    const hedef = interaction.options.getUser('uye');

    if (hedef.bot) {
      return interaction.reply({ content: 'Botlar boostlanamaz!', flags: 64 });
    }
    if (hedef.id === interaction.user.id) {
      return interaction.reply({ content: 'Kendini boostlayamazsın! Başka birini seç.', flags: 64 });
    }

    const db = loadDb();
    if (!db[hedef.id]) db[hedef.id] = { boost: 0, sonBoost: {} };
    const son = db[hedef.id].sonBoost[interaction.user.id] || 0;
    const gecenSure = Date.now() - son;
    const birSaat = 60 * 60 * 1000;

    if (gecenSure < birSaat) {
      const kalanDk = Math.ceil((birSaat - gecenSure) / 60000);
      return interaction.reply({
        content: `💤 Bu üyeyi az önce boostladın! Aynı üyeyi tekrar boostlamak için **${kalanDk}** dakika bekle.`,
        flags: 64,
      });
    }

    db[hedef.id].boost += 1;
    db[hedef.id].sonBoost[interaction.user.id] = Date.now();
    saveDb(db);

    const embed = new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('🚀 BOOST!')
      .setDescription(
        `${interaction.user} ${hedef} kişisini boostladı!` +
        `\n\n${lastikEmojiler(db[hedef.id].boost)}` +
        `\n**${hedef.username}** toplam **${db[hedef.id].boost}** boost aldı!` +
        `\n\nCrowdşu an çok mutlu!`
      )
      .setThumbnail(hedef.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};