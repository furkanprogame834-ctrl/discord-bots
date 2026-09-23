const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, StreamType, entersState } = require('@discordjs/voice');
const playdl = require('play-dl');

global.__muzikAkis = global.__muzikAkis || {};

function sarkiEmbed(baslik, renk) {
  return new EmbedBuilder().setColor(renk).setTitle(baslik).setTimestamp();
}

function gotBut(player, buton) {
  if (!player) return null;
  return player.state.status === AudioPlayerStatus.Playing ? '⏸️ **Duraklat**' : '▶️ **Devam Et**';
}

async function oynat(interaction, song) {
  const kanal = interaction.member.voice.channel;
  if (!kanal) {
    return interaction.reply({ embeds: [sarkiEmbed('⚠️ Önce bir ses kanalına gir!', 0xFF0000)], flags: 64 });
  }

  await interaction.deferReply();

  let sikis = global.__muzikAkis[interaction.guild.id];
  if (!sikis) {
    const baglanti = joinVoiceChannel({
      channelId: kanal.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: false,
    });
    const player = createAudioPlayer();
    baglanti.subscribe(player);
    sikis = { baglanti, player, sira: [], suan: null };
    global.__muzikAkis[interaction.guild.id] = sikis;
  }

  const sarkilar = Array.isArray(song) ? song : [song];
  sikis.sira.push(...sarkilar);

  if (sikis.player.state.status === AudioPlayerStatus.Playing) {
    const ilk = sarkiEmbed('🎶 Sıraya Eklendi', 0x57F287)
      .setDescription(`${sarkilar.length === 1 ? `**${sarkilar[0].titulo}**` : `${sarkilar.length} şarkı`} sıraya eklendi.\nSırada **${sikis.sira.length}** şarkı var.`)
      .setFooter({ text: `İsteyen: ${interaction.user.username}` });
    return interaction.editReply({ embeds: [ilk] });
  }

  oynatSonraki(interaction.guild, sikis);

  const basladi = sarkiEmbed('▶️ Çalınıyor', 0x57F287)
    .setDescription(`🎵 **${sikis.suan.titulo}**\n\n⏱️ Süre: **${sikis.suan.formattedTime || '?'}**`)
    .setFooter({ text: `İsteyen: ${sikis.suan.isteyen}` });
  return interaction.editReply({ embeds: [basladi] });
}

async function oynatSonraki(guild, sikis) {
  if (sikis.sira.length === 0) {
    sikis.suan = null;
    if (sikis.player) sikis.player.stop();
    if (sikis.bosZamanlayici) clearTimeout(sikis.bosZamanlayici);
    sikis.bosZamanlayici = setTimeout(() => {
      try {
        sikis.baglanti.destroy();
      } catch (e) {}
      delete global.__muzikAkis[guild.id];
    }, 60000).unref?.();
    return;
  }
  const sarki = sikis.sira.shift();
  sikis.suan = sarki;

  try {
    const stream = await playdl.stream(sarki.url);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type === 'live' ? StreamType.WebmOpus : StreamType.Arbitrary,
    });
    sikis.player.play(resource);
  } catch (e) {
    console.error('Sarki oynatma hatasi (' + sarki.titulo + '):', e.message);
    sikis.suan = null;
    // Hatayi atla, baska sarki varsa gecektir
    sikis.player.play(createAudioResource(Buffer.from(''), { inputType: StreamType.OggOpus }));
    setTimeout(() => oynatSonraki(guild, sikis), 250);
    return;
  }

  sikis.bosZamanlayici && clearTimeout(sikis.bosZamanlayici);
  sikis.player.once(AudioPlayerStatus.Idle, () => {
    oynatSonraki(guild, sikis);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cal')
    .setDescription('Bot ses kanalında YouTube şarkısı çalar')
    .addStringOption(option => option.setName('sarki').setDescription('Şarkı adı veya link').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Connect),
  async execute(interaction) {
    const sorgu = interaction.options.getString('sarki');
    try {
      let sarkilar;
      if (sorgu.startsWith('http')) {
        const video = await playdl.video_info(sorgu);
        sarkilar = [{
          titulo: video.video_details.title,
          url: video.video_details.url,
          formattedTime: video.video_details.durationRaw,
          isteyen: interaction.user.username,
        }];
      } else {
        const sonuc = await playdl.search(sorgu, { limit: 1 });
        if (sonuc.length === 0) {
          return interaction.reply({ embeds: [sarkiEmbed('⚠️ Şarkı bulunamadı!', 0xFF0000)], flags: 64 });
        }
        sarkilar = [{
          titulo: sonuc[0].title,
          url: sonuc[0].url,
          formattedTime: sonuc[0].durationRaw,
          isteyen: interaction.user.username,
        }];
      }
      await oynat(interaction, sarkilar);
    } catch (e) {
      console.error('Çal hatası:', e.message);
      return interaction.reply({ embeds: [sarkiEmbed('⚠️ Şarkı çalınamadı, tekrar dene.', 0xFF0000)], flags: 64 }).catch(() => {});
    }
  },
};

module.exports.oynat = oynat;
module.exports.sarkiEmbed = sarkiEmbed;