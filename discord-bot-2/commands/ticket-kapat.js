const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ticketDbPath = path.join(__dirname, '..', 'ticket-db.json');
const ticketStatsPath = path.join(__dirname, '..', 'ticket-stats.json');
const configPath = path.join(__dirname, '..', 'guild-config.json');

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}

function saveJson(p, d) {
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-kapat')
    .setDescription('Ticketi kapatir ve log gonderir')
    .addStringOption(option => option.setName('sebep').setDescription('Kapatma sebebi')),
  async execute(interaction) {
    const kanal = interaction.channel;
    if (!kanal || (!kanal.name.startsWith('ticket-') && !kanal.name.startsWith('calisiliyor-'))) {
      return interaction.reply({ content: 'Bu bir ticket kanali degil!', ephemeral: true });
    }

    const sebep = interaction.options?.getString?.('sebep') || 'Buton ile kapatildi';
    const guildId = interaction.guild.id;

    let ticketDb = loadJson(ticketDbPath);
    let ticketStats = loadJson(ticketStatsPath);

    let ticketSahip = null;
    let ticketAcilis = null;
    if (ticketDb[guildId]) {
      for (const [userId, data] of Object.entries(ticketDb[guildId])) {
        if (data.channel === kanal.id) {
          ticketSahip = userId;
          ticketAcilis = data.created;
          break;
        }
      }
    }

    const kanalYetkili = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
    const config = loadJson(configPath);
    const destekRolId = (config[interaction.guild.id] || {}).ticketRole;
    const destekRol = interaction.guild.roles.cache.get(destekRolId);
    const destekYetkili = destekRol && interaction.member.roles.cache.has(destekRol.id);
    const sahibiMi = ticketSahip === interaction.user.id;

    if (!kanalYetkili && !destekYetkili && !sahibiMi) {
      return interaction.reply({ content: 'Bu kanali kapatmak icin yetkin yok! (Ticket sahibi, destek rolü veya Kanallari Yonet yetkisi gerekir)', ephemeral: true });
    }

    const yetkiliMi = kanalYetkili || destekYetkili;

    if (!yetkiliMi && sahibiMi) {
      ticketSil(ticketDb, guildId, ticketSahip, ticketDbPath);
      istatistikGuncelle(ticketStats, interaction.user.id, ticketSahip, ticketStatsPath);

      const basitKapat = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(':lock: Ticket Kapatildi')
        .addFields(
          { name: ':person_raising_hand: Kapanis', value: `${interaction.user}`, inline: true },
          { name: ':clock1: Kapanis Zamani', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [basitKapat] });
      setTimeout(async () => { try { await kanal.delete('Ticket kapatildi'); } catch (e) {} }, 5000);
      return;
    }

    const logKanallari = interaction.guild.channels.cache.filter(ch =>
      ch.type === 0 &&
      ch.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages) &&
      ch.name.includes('log')
    );

    function istatistikGuncelle() {
      if (!ticketStats[interaction.user.id]) ticketStats[interaction.user.id] = { acilan: 0, kapatilan: 0 };
      ticketStats[interaction.user.id].kapatilan += 1;
      if (ticketSahip) {
        if (!ticketStats[ticketSahip]) ticketStats[ticketSahip] = { acilan: 0, kapatilan: 0 };
        ticketStats[ticketSahip].acilan += 1;
      }
      saveJson(ticketStatsPath, ticketStats);
    }

    function ticketSil() {
      if (ticketSahip && ticketDb[guildId]) {
        delete ticketDb[guildId][ticketSahip];
        saveJson(ticketDbPath, ticketDb);
      }
    }

    if (logKanallari.size === 0) {
      ticketSil();
      istatistikGuncelle();

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(':lock: Ticket Kapatildi')
        .addFields(
          { name: ':person_raising_hand: Kapanis', value: `${interaction.user}`, inline: true },
          { name: ':page_facing_up: Sebep', value: sebep, inline: true },
          { name: ':clock1: Kapanis Zamani', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
        .setFooter({ text: 'Log kanali bulunamadi.' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      setTimeout(async () => { try { await kanal.delete('Ticket kapatildi'); } catch (e) {} }, 5000);
      return;
    }

    const secenekler = logKanallari.first(25).map(ch => ({
      label: ch.name.length > 100 ? ch.name.substring(0, 97) + '...' : ch.name,
      value: ch.id,
    }));

    secenekler.push({ label: 'Log Gonderme - Kapat', value: 'atla' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket-log-sec')
      .setPlaceholder('Log kanali secin...')
      .addOptions(secenekler);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const onayEmbed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle(':ticket: Ticket Kapatiliyor')
      .setDescription('Log gonderilecek kanali secin.\nLog gondermeden kapatmak icin **Atla** secenegini secin.')
      .addFields({ name: ':page_facing_up: Sebep', value: sebep })
      .setTimestamp();

    const response = await interaction.reply({ embeds: [onayEmbed], components: [row], ephemeral: true });

    const collector = response.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Bu menuyu sadece komutu kullanan kisi kullanabilir!', ephemeral: true });
      }

      const secilen = i.values[0];
      ticketSil();
      istatistikGuncelle();

      if (secilen === 'atla') {
        await i.update({ content: ':white_check_mark: Ticket log gonderilmeden kapatiliyor...', embeds: [], components: [] });

        const kapatEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle(':lock: Ticket Kapatildi')
          .addFields(
            { name: ':person_raising_hand: Kapanis', value: `${interaction.user}`, inline: true },
            { name: ':page_facing_up: Sebep', value: sebep, inline: true },
            { name: ':clock1: Kapanis Zamani', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          )
          .setTimestamp();

        await interaction.followUp({ embeds: [kapatEmbed] });
      } else {
        const logKanal = interaction.guild.channels.cache.get(secilen);
        const suan = Date.now();
        const acilisYazi = ticketAcilis ? `<t:${Math.floor(ticketAcilis / 1000)}:F>` : 'Bilinmiyor';
        const sureDk = ticketAcilis ? Math.floor((suan - ticketAcilis) / 60000) : 0;
        const sureStr = sureDk >= 60 ? `${Math.floor(sureDk / 60)}s ${sureDk % 60}dk` : `${sureDk} dakika`;

        const logEmbed = new EmbedBuilder()
          .setColor(0x00BFFF)
          .setTitle(':clipboard: Ticket Log')
          .addFields(
            { name: ':ticket: Kanal', value: kanal.name, inline: true },
            { name: ':bust_in_silhouette: Ticket Sahibi', value: ticketSahip ? `<@${ticketSahip}>` : 'Bilinmiyor', inline: true },
            { name: ':wrench: Kapanan Kisi', value: `${interaction.user}`, inline: true },
            { name: ':clock1: Acilis', value: acilisYazi, inline: true },
            { name: ':clock3: Kapanis', value: `<t:${Math.floor(suan / 1000)}:F>`, inline: true },
            { name: ':hourglass: Sure', value: sureStr, inline: true },
            { name: ':page_facing_up: Sebep', value: sebep, inline: false },
          )
          .setFooter({ text: 'Kingo bot - Ticket Log' })
          .setTimestamp();

        await i.update({ content: ':white_check_mark: Ticket log gonderildi ve kapatiliyor...', embeds: [], components: [] });

        if (logKanal) {
          try { await logKanal.send({ embeds: [logEmbed] }); } catch (e) {}
        }

        const kapatEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle(':lock: Ticket Kapatildi')
          .addFields(
            { name: ':page_facing_up: Sebep', value: sebep, inline: true },
            { name: ':clock1: Kapanis', value: `<t:${Math.floor(suan / 1000)}:F>`, inline: true },
          )
          .setTimestamp();

        await interaction.followUp({ embeds: [kapatEmbed] });
      }

      collector.stop();

      setTimeout(async () => { try { await kanal.delete('Ticket kapatildi'); } catch (e) {} }, 5000);
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({ content: ':warning: Ticket kapatma iptal edildi (sure asimi).', embeds: [], components: [] });
      }
    });
  },
};
