const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ship-patlat')
    .setDescription('Iki kisiyi ship et ve sonucu goster!')
    .addUserOption(opt =>
      opt.setName('kisi1')
        .setDescription('Ilk kisi')
        .setRequired(true))
    .addUserOption(opt =>
      opt.setName('kisi2')
        .setDescription('Ikinci kisi')
        .setRequired(false)),

  async execute(interaction) {
    const kisi1 = interaction.options.getUser('kisi1');
    const kisi2 = interaction.options.getUser('kisi2') || interaction.user;

    // Kalp emoji setleri
    const kalpDolu = '❤️';
    const kalpBos = '🖤';
    const atesEmoji = '🔥';
    const gulEmoji = '🌹';
    const kalpKirik = '💔';

    // Rastgele uyumluluk orani
    const uyumluluk = Math.floor(Math.random() * 101);

    // Isimleri birlestir
    const isim1 = kisi1.username;
    const isim2 = kisi2.username;

    // Ship ismi olustur (isimlerin ilk harflerini birlestir)
    const shipAdi = isim1.slice(0, Math.ceil(isim1.length / 2)) + isim2.slice(Math.floor(isim2.length / 2));

    // Kalp progress bar
    const toplamKalp = 10;
    const doluKalp = Math.round((uyumluluk / 100) * toplamKalp);
    const kalpBar = kalpDolu.repeat(doluKalp) + kalpBos.repeat(toplamKalp - doluKalp);

    // Durum mesajlari
    let durum = '';
    let renk = 0;
    if (uyumluluk >= 90) {
      durum = `${atesEmoji} MUKEMMEL ES! Evlenme teklif et hemen! ${atesEmoji}`;
      renk = 0xFF0000;
    } else if (uyumluluk >= 70) {
      durum = `${gulEmoji} Cok iyi uyumluyunuz! Bir deneyin! ${gulEmoji}`;
      renk = 0xFF69B4;
    } else if (uyumluluk >= 50) {
      durum = `Umut var! Biraz daha tanisinlar.`;
      renk = 0xFFA500;
    } else if (uyumluluk >= 30) {
      durum = `Hmm, biraz zor ama imkansiz degil...`;
      renk = 0xFFFF00;
    } else if (uyumluluk >= 10) {
      durum = `${kalpKirik} Biraz uyumsuzlar ama denemeye deger!`;
      renk = 0x808080;
    } else {
      durum = `${kalpKirik} Hic uyumlu degiller! Cok uzgunum!`;
      renk = 0x000000;
    }

    const embed = new EmbedBuilder()
      .setColor(renk)
      .setTitle(`💕 SHIP PATLADI! 💕`)
      .setDescription(`**${isim1}** + **${isim2}** = **${shipAdi}**`)
      .addFields(
        {
          name: `Kalp Orani ${kalpDolu}`,
          value: `\`${kalpBar}\` **%${uyumluluk}**`,
          inline: false
        },
        {
          name: `Durum`,
          value: durum,
          inline: false
        },
        {
          name: `Bilgi`,
          value: `**${isim1}**: ${kisi1}\n**${isim2}**: ${kisi2}`,
          inline: true
        }
      )
      .setThumbnail(kisi1.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${interaction.user.username} ship patlatti! | ${interaction.guild.name}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
