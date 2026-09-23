const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const balansDbPath = path.join(__dirname, '..', 'balans-db.json');

function loadDb() {
  try { if (fs.existsSync(balansDbPath)) return JSON.parse(fs.readFileSync(balansDbPath, 'utf8')); } catch (e) {}
  return {};
}

function saveDb(db) {
  fs.writeFileSync(balansDbPath, JSON.stringify(db, null, 2));
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
    .addSubcommand(sub => sub.setName('bak').setDescription('Bakiyeni gor').addUserOption(opt => opt.setName('kullanici').setDescription('Baskasinin bakiyesine bak')))
    .addSubcommand(sub => sub.setName('bonus').setDescription('Gunluk bonusunu al'))
    .addSubcommand(sub => sub.setName('transfer').setDescription('Baskasina para gonder')
      .addUserOption(opt => opt.setName('kisi').setDescription('Gonderecek kisi').setRequired(true))
      .addIntegerOption(opt => opt.setName('miktar').setDescription('Gonderilecek miktar').setRequired(true).setMinValue(1)))
    .addSubcommand(sub => sub.setName('tablo').setDescription('En zengin 10 kisi')),
  async execute(interaction) {
    const db = loadDb();
    const sub = interaction.options.getSubcommand();

    if (sub === 'bak') {
      const user = interaction.options.getUser('kullanici') || interaction.user;
      if (!db[user.id]) db[user.id] = { para: 0, sonBonus: 0 };

      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(':moneybag: Bakiye')
        .setDescription(`**${user.username}**\n\nCuzdan: **${db[user.id].para}** TL`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'bonus') {
      const sonuc = gunlukBonus(db, interaction.user.id);

      if (!sonuc.basarili) {
        return interaction.reply({ content: `:clock1: Gunluk bonusunu zaten aldin! Kalan sure: **${sonuc.kalan}** dakika`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(':tada: Gunluk Bonus!')
        .setDescription(`**${sonuc.miktar} TL** kazandin!\nToplam bakiye: **${sonuc.toplam} TL**`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'transfer') {
      const hedef = interaction.options.getUser('kisi');
      const miktar = interaction.options.getInteger('miktar');

      if (hedef.id === interaction.user.id) {
        return interaction.reply({ content: 'Kendine para gonderemezsin!', ephemeral: true });
      }
      if (hedef.bot) {
        return interaction.reply({ content: 'Botlara para gonderemezsin!', ephemeral: true });
      }

      if (!db[interaction.user.id]) db[interaction.user.id] = { para: 0, sonBonus: 0 };
      if (!db[hedef.id]) db[hedef.id] = { para: 0, sonBonus: 0 };

      if (db[interaction.user.id].para < miktar) {
        return interaction.reply({ content: `:x: Yeterli paran yok! Bakiyen: **${db[interaction.user.id].para} TL**`, ephemeral: true });
      }

      db[interaction.user.id].para -= miktar;
      db[hedef.id].para += miktar;
      saveDb(db);

      const embed = new EmbedBuilder()
        .setColor(0x00BFFF)
        .setTitle(':white_check_mark: Transfer Basarili!')
        .setDescription(`**${interaction.user.username}** → **${hedef.username}**\nMiktar: **${miktar} TL**\n\nKalan bakiyen: **${db[interaction.user.id].para} TL**`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (sub === 'tablo') {
      const sirali = Object.entries(db)
        .filter(([_, v]) => (v.para || 0) > 0)
        .sort((a, b) => b[1].para - a[1].para)
        .slice(0, 10);

      if (sirali.length === 0) {
        return interaction.reply({ content: 'Henuz para verisi yok!', ephemeral: true });
      }

      const satirlar = sirali.map(([id, v], i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
        return `${medal} <@${id}> - **${v.para}** TL`;
      });

      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(':trophy: En Zenginler')
        .setDescription(satirlar.join('\n'))
        .setFooter({ text: 'Top 10 - Zenginler Tablosu' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
