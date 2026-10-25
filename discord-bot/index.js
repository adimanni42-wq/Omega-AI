
require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const required = [
  "DISCORD_TOKEN",
  "DISCORD_CLIENT_ID"
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show OMEGA AI commands"),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot response time"),

  new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Ask the OMEGA AI assistant")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Your question")
        .setRequired(true)
        .setMaxLength(1000)
    ),

  new SlashCommandBuilder()
    .setName("server")
    .setDescription("Show configured Minecraft server info"),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post a server announcement")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Announcement text")
        .setRequired(true)
        .setMaxLength(1800)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member")
    .addUserOption(option =>
      option.setName("member")
        .setDescription("Member to kick")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for the kick")
        .setMaxLength(500)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.KickMembers
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member")
    .addUserOption(option =>
      option.setName("member")
        .setDescription("Member to ban")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for the ban")
        .setMaxLength(500)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.BanMembers
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member")
    .addUserOption(option =>
      option.setName("member")
        .setDescription("Member to timeout")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("minutes")
        .setDescription("Timeout duration in minutes")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for timeout")
        .setMaxLength(500)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    )
].map(command => command.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const rest = new REST({ version: "10" })
  .setToken(process.env.DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`OMEGA AI connected as ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log("Slash commands registered.");
  } catch (error) {
    console.error("Command registration failed:", error.message);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === "ping") {
      return interaction.reply({
        content: `Pong! Gateway ping: ${client.ws.ping} ms`,
        ephemeral: true
      });
    }

    if (commandName === "help") {
      return interaction.reply({
        content: [
          "**OMEGA AI Commands**",
          "`/ping` — check response",
          "`/help` — show commands",
          "`/ai message:` — AI assistant (provider not connected)",
          "`/server` — Minecraft server information",
          "`/announce message:` — announcement",
          "`/kick member:` — kick a member",
          "`/ban member:` — ban a member",
          "`/timeout member: minutes:` — timeout a member"
        ].join("\n"),
        ephemeral: true
      });
    }

    if (commandName === "ai") {
      return interaction.reply({
        content:
          "The OMEGA AI chat provider isn't connected yet. " +
          "We'll connect it through a secure backend next.",
        ephemeral: true
      });
    }

    if (commandName === "server") {
      const address =
        process.env.MC_SERVER_ADDRESS || "Not configured";
      const edition =
        process.env.MC_SERVER_EDITION || "Not configured";

      return interaction.reply({
        content:
          `**Minecraft server**\n` +
          `Address: ${address}\n` +
          `Edition: ${edition}\n` +
          `Live status: Not checked yet`,
        ephemeral: true
      });
    }

    if (commandName === "announce") {
      if (!interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageGuild
      )) {
        return interaction.reply({
          content: "You need Manage Server permission.",
          ephemeral: true
        });
      }

      const message = interaction.options.getString("message", true);

      return interaction.reply({
        content: `📢 **Announcement**\n${message}`,
        allowedMentions: { parse: [] }
      });
    }

    const member = interaction.options.getMember("member");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    if (!member || !member.moderatable && commandName === "timeout") {
      return interaction.reply({
        content: "I can't moderate that member. Check role hierarchy and bot permissions.",
        ephemeral: true
      });
    }

    if (commandName === "kick") {
      if (!interaction.memberPermissions?.has(
        PermissionFlagsBits.KickMembers
      )) {
        return interaction.reply({
          content: "You need Kick Members permission.",
          ephemeral: true
        });
      }

      if (!member.kickable) {
        return interaction.reply({
          content: "That member cannot be kicked by this bot.",
          ephemeral: true
        });
      }

      await member.kick(reason);

      return interaction.reply({
        content: `Kicked ${member.user.tag}. Reason: ${reason}`,
        ephemeral: true
      });
    }

    if (commandName === "ban") {
      if (!interaction.memberPermissions?.has(
        PermissionFlagsBits.BanMembers
      )) {
        return interaction.reply({
          content: "You need Ban Members permission.",
          ephemeral: true
        });
      }

      if (!member.bannable) {
        return interaction.reply({
          content: "That member cannot be banned by this bot.",
          ephemeral: true
        });
      }

      await member.ban({ reason });

      return interaction.reply({
        content: `Banned ${member.user.tag}. Reason: ${reason}`,
        ephemeral: true
      });
    }

    if (commandName === "timeout") {
      if (!interaction.memberPermissions?.has(
        PermissionFlagsBits.ModerateMembers
      )) {
        return interaction.reply({
          content: "You need Timeout Members permission.",
          ephemeral: true
        });
      }

      const minutes = interaction.options.getInteger("minutes", true);

      await member.timeout(minutes * 60 * 1000, reason);

      return interaction.reply({
        content: `Timed out ${member.user.tag} for ${minutes} minutes.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error(`Command ${commandName} failed:`, error);

    const response = {
      content: "The command failed. Check bot permissions and configuration.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
