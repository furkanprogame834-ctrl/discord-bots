const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

const semboller = ['🍒', '🍋', '🍇', '⭐', '💎', '7️⃣'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Slot makinesi - uc sembol eslesirse jackpot!')
    .addIntegerOption(opt => opt.setName('bahis').setDescription('Bahis miktari').setRequired(true).setMinValue(1))
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const bahis = interaction.options.getInteger('bahis');
    if (bakiyeAl(interaction.user.id) < bahis) {
      return interaction.reply({ content: `:x: Yeterli paran yok! Bakiyen: **${bakiyeAl(interaction.user.id)} TL**`, ephemeral: true });
    }

    paraCikar(interaction.user.id, bahis);
    kumarSayacVeRol(interaction);

    const s1 = semboller[Math.floor(Math.random() * semboller.length)];
    const s2 = semboller[Math.floor(Math.random() * semboller.length)];
    const s3 = semboller[Math.floor(Math.random() * semboller.length)];

    let kazanc = 0;
    let sonuc = '';

    if (s1 === '7️⃣' && s2 === '7️⃣' && s3 === '7️⃣') {
      kazanc = bahis * 50;
      sonuc = ':fire: JACKPOT!!! :fire:';
    } else if (s1 === s2 && s2 === s3) {
      kazanc = bahis * 10;
      sonuc = ':tada: Uc Aynus!';
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      kazanc = bahis * 2;
      sonuc = ':small_blue_diamond: Iki Eslesme!';
    } else {
      sonuc = ':x: Kazanamadin';
    }

    if (kazanc > 0) bakiyEkle(interaction.user.id, kazanc);

    const embed = new EmbedBuilder()
      .setTitle(':slot_machine: Slot Makinesi')
      .setDescription(`\`\`\`\n[ ${s1} | ${s2} | ${s3} ]\n\`\`\`\n${sonuc}`)
      .addFields(
        { name: ':banknote: Bahis', value: `${bahis} TL`, inline: true },
        { name: kazanc > 0 ? ':moneybag: Kazanc' : ':x: Kaybettin', value: kazanc > 0 ? `**+${kazanc} TL**` : `**-${bahis} TL**`, inline: true },
      )
      .setColor(kazanc >= bahis * 10 ? 0xFFD700 : kazanc > 0 ? 0x00FF00 : 0xFF0000)
      .setFooter({ text: `Yeni bakiye: ${bakiyeAl(interaction.user.id)} TL` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
