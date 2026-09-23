const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = 'C:\\Users\\user\\Documents\\Default Project\\discord-bot\\balans-db.json';

function loadDb() {
  try { if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch (e) {}
  return {};
}
function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function gunlukBonus(db, userId) {
  const suan = Date.now();
  if (!db[userId]) db[userId] = { para: 0, sonBonus: 0 };
  const sonBonus = db[userId].sonBonus || 0;
  const gecenSure = suan - sonBonus;
  const birGun = 24 * 60 * 60 * 1000;

  if (gecenSure < birGun) {
    const kalanDk = Math.ceil((birGun - gecenSure) / 60000);
    return { basarili: false, kalan: kalanDk };
  }

  const bonus = Math.floor(Math.random() * 200) + 100;
  db[userId].para += bonus;
  db[userId].sonBonus = suan;
  saveDb(db);
  return { basarili: true, miktar: bonus, toplam: db[userId].para };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balans')
    .setDescription('Sanal para sistemi')
    .addSubcommand(sub => sub.setName('bak').setDescription('Bakiyeni gör'))
    .addSubcommand(sub => sub.setName('bonus').setDescription('Günlük bonusunu al'))
    .addSubcommand(sub => sub.setName('transfer').setDescription('Başkasına para gönder')
      .addUserOption(opt => opt.setName('kisi').setDescription('Gönderecek kişi').setRequired(true))
      .addIntegerOption(opt => opt.setName('miktar').setDescription('Gönderilecek miktar').setRequired(true).setMinValue(1))),
  async execute(interaction) {
    const db = loadDb();
    const sub = interaction.options.getSubcommand();

    if (sub === 'bak') {
      const user = interaction.options.getUser('kullanici') || interaction.user;
      if (!db[user.id]) db[user.id] = { para: 0, sonBonus: 0 };

      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(':moneybag: Bakiye')
        .setDescription(`**${user.username}**\n\nCüzdan: **${db[user.id].para.toLocaleString('tr-TR')} TL**`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'bonus') {
      const sonuc = gunlukBonus(db, interaction.user.id);

      if (!sonuc.basarili) {
        return interaction.reply({ content: `:clock1: Günlük bonusunu zaten aldın! Kalan süre: **${sonuc.kalan}** dakika`, flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(':tada: Günlük Bonus!')
        .setDescription(`**${sonuc.miktar.toLocaleString('tr-TR')} TL** kazandın!\nToplam bakiye: **${sonuc.toplam.toLocaleString('tr-TR')} TL**`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // transfer
    const hedef = interaction.options.getUser('kisi');
    const miktar = interaction.options.getInteger('miktar');

    if (hedef.id === interaction.user.id) {
      return interaction.reply({ content: 'Kendine para gönderemezsin!', flags: 64 });
    }
    if (hedef.bot) {
      return interaction.reply({ content: 'Botlara para gönderemezsin!', flags: 64 });
    }

    if (!db[interaction.user.id]) db[interaction.user.id] = { para: 0, sonBonus: 0 };
    if (!db[hedef.id]) db[hedef.id] = { para: 0, sonBonus: 0 };

    if (db[interaction.user.id].para < miktar) {
      return interaction.reply({ content: `:x: Yeterli paran yok! Bakiyen: **${db[interaction.user.id].para.toLocaleString('tr-TR')} TL**`, flags: 64 });
    }

    db[interaction.user.id].para -= miktar;
    db[hedef.id].para += miktar;
    saveDb(db);

    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle(':white_check_mark: Transfer Başarılı!')
      .setDescription(`**${interaction.user.username}** → **${hedef.username}**\nMiktar: **${miktar.toLocaleString('tr-TR')} TL**\n\nKalan bakiyen: **${db[interaction.user.id].para.toLocaleString('tr-TR')} TL**`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};