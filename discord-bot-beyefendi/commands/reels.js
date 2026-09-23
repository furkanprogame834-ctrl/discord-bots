const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { execFile } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { promisify } = require('util');
const execFileP = promisify(execFile);

const YTDLP = path.join(__dirname, '..', 'yt-dlp.exe');
const FFMPEG = require('ffmpeg-static');

const ARAMA_HAVUZU = [
  'funny cat shorts', 'dog shorts', 'satisfying shorts', 'cooking shorts',
  'sports epic shorts', 'travel shorts', 'mrbeast shorts', 'funny moments shorts',
  'pets shorts', 'diy shorts', 'smart home shorts', 'amazing talent shorts',
];

function rastgeleDizi(a) { return a[Math.floor(Math.random() * a.length)]; }

function rastgeleShortAra() {
  return new Promise((resolve) => {
    const sorgu = `${rastgeleDizi(ARAMA_HAVUZU)} `;
    const dene = (kalan) => {
      if (kalan <= 0) return resolve(null);
      execFileP(YTDLP, ['--flat-playlist', '--dump-single-json', `ytsearch10:${sorgu}`], { maxBuffer: 10 * 1024 * 1024, timeout: 45000, windowsHide: true })
        .then(({ stdout }) => {
          const j = JSON.parse(stdout);
          // duration boş ise kabul (flat-playlist bazen süre döndürmez), varsa kısa video kuralını uygula
          const uygun = (j.entries || []).filter(e => e && e.id && ((!e.duration) || (e.duration >= 5 && e.duration <= 80)));
          if (!uygun.length) return dene(kalan - 1);
          const v = rastgeleDizi(uygun);
          resolve({
            id: v.id,
            title: (v.title || 'Başlıksız').slice(0, 90),
            channel: (v.channel || 'Bilinmiyor').slice(0, 50),
            durum: v.duration || 15,
            url: `https://www.youtube.com/watch?v=${v.id}`,
            thumbnail: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          });
        })
        .catch((e) => { console.error('reels arama hatasi:', e.message); dene(kalan - 1); });
    };
    dene(3);
  });
}

function videoIndir(url) {
  return new Promise((resolve) => {
    const cikti = path.join(os.tmpdir(), `reels-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`);
    execFile(YTDLP, [
      '--no-check-certificates',
      '--ffmpeg-location', FFMPEG,
      '-f', 'bv+ba/b',
      '-S', 'height:360',
      '--merge-output-format', 'mp4',
      '--max-filesize', '8M',
      '--no-warnings',
      '--newline',
      '-o', cikti,
      url,
    ], { maxBuffer: 1024 * 1024, timeout: 60000, windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        console.error('reels indirme hatasi:', err.message);
        try { if (fs.existsSync(cikti)) fs.unlinkSync(cikti); } catch (e) {}
        return resolve(null);
      }
      if (!fs.existsSync(cikti)) return resolve(null);
      const boyut = fs.statSync(cikti).size;
      if (boyut > 8 * 1024 * 1024 || boyut === 0) {
        try { fs.unlinkSync(cikti); } catch (e) {}
        return resolve(null);
      }
      resolve(cikti);
    });
  });
}

function embedYap(v, videoVar = false) {
  const dk = Math.floor(v.durum / 60);
  const sn = v.durum % 60;
  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('📱 Reels')
    .setDescription(`**${v.title}**\n\n🎬 ${v.channel} • ⏱ ${dk}:${sn.toString().padStart(2, '0')}`)
    .setURL(v.url);
  if (videoVar) {
    embed.setDescription(`**${v.title}**\n\n🎬 ${v.channel} • ⏱ ${dk}:${sn.toString().padStart(2, '0')}\n\n▶️ Videoyu başlatmak için aşağıdaki oynatıcıyı kullan.`);
  } else {
    embed.setImage(v.thumbnail);
  }
  embed.setTimestamp();
  return embed;
}

function satirYap() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('▶️ İzle')
      .setStyle(ButtonStyle.Link)
      .setURL('https://www.youtube.com'),
    new ButtonBuilder()
      .setCustomId('reels-sonraki')
      .setLabel('⏭️ Sıradaki')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('reels-kapat')
      .setLabel('🗑️ Kapat')
      .setStyle(ButtonStyle.Danger),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reels')
    .setDescription('Rastgele YouTube Short izle, butonla geç'),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const v = await rastgeleShortAra();
      if (!v) return interaction.editReply({ content: '❌ Şu an video bulunamadı. Biraz sonra tekrar dene!' });

      const dosya = await videoIndir(v.url);
      const satir = satirYap();
      satir.components[0].setURL(v.url);

      const mesajSecenek = {
        embeds: [embedYap(v, dosya !== null)],
        components: [satir],
      };
      if (dosya) {
        mesajSecenek.files = [{ attachment: dosya, name: 'reels.mp4' }];
      }

      const msg = await interaction.editReply(mesajSecenek);
      if (dosya) { try { fs.unlinkSync(dosya); } catch (e) {} }

      const filter = i => ['reels-sonraki', 'reels-kapat'].includes(i.customId);
      const collector = msg.createMessageComponentCollector({ filter, time: 300000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'reels-kapat') {
          await i.deferUpdate().catch(() => {});
          collector.stop('kapandi');
          try { await i.message.delete(); } catch (e) {}
          return;
        }
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: 'Bu akışı yalnızca komutu başlatan kişi geçebilir.', flags: 64 });
        }
        await i.deferUpdate();
        const yeni = await rastgeleShortAra();
        if (!yeni) return i.followUp({ content: '❌ Video bulunamadı, tekrar dene!', flags: 64 }).catch(() => {});

        const yeniDosya = await videoIndir(yeni.url);
        satir.components[0].setURL(yeni.url);

        const yeniSecenek = {
          embeds: [embedYap(yeni, yeniDosya !== null)],
          components: [satir],
        };
        if (yeniDosya) {
          yeniSecenek.files = [{ attachment: yeniDosya, name: 'reels.mp4' }];
        }

        await i.editReply(yeniSecenek).catch(() => {});
        if (yeniDosya) { try { fs.unlinkSync(yeniDosya); } catch (e) {} }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time' && interaction.channel) {
          interaction.channel.send({ content: '⏱️ Reels akışı 5 dakika sonra sona erdi. Tekrar izlemek için `/reels` kullan.' }).catch(() => {});
        }
      });
    } catch (hata) {
      console.error('reels hatasi:', hata);
      interaction.editReply({ content: '⚠️ Video oynatılırken bir sorun oldu. Tekrar dene!' }).catch(() => {});
    }
  },
};