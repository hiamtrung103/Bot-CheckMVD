const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const { checkMVD, getOrderDetailsForCookie, getOrderDetail } = require("./Api/checkmvd");
const { REST } = require("@discordjs/rest");
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.DISCORD_TOKEN
const clientId = process.env.CLIENT_ID; // Thay bằng client ID của bot của bạn

// Đọc dữ liệu từ tệp JSON và đảm bảo các thuộc tính cần thiết
let state = {
  cookies: [],
  trackingMessageId: "",
  trackingChannelId: "",
  trackingList: [],
};
const stateFilePath = "./state.json";
if (fs.existsSync(stateFilePath)) {
  const loadedState = JSON.parse(fs.readFileSync(stateFilePath, "utf8"));
  // Kết hợp các thuộc tính mặc định và thuộc tính từ tệp JSON
  state = {
    cookies: [],
    trackingMessageId: "",
    trackingChannelId: "",
    trackingList: [],
    ordersMessageIds: [],
    ...loadedState,
  };
}

// Hàm lưu trạng thái vào tệp JSON
const saveState = () => {
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
};

// Tạo lệnh slash
const commands = [
  new SlashCommandBuilder()
    .setName("cookie")
    .setDescription("Quản lý cookies")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Thêm một cookie")
        .addStringOption((option) =>
          option
            .setName("cookie")
            .setDescription("Giá trị cookie")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Xóa một cookie")
        .addStringOption((option) =>
          option
            .setName("cookie")
            .setDescription("Giá trị cookie")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("Liệt kê tất cả cookies")
    ),
  new SlashCommandBuilder()
    .setName("checkmvd")
    .setDescription("Kiểm tra trạng thái MVD cho các mã vận đơn")
    .addStringOption((option) =>
      option
        .setName("tracking_list")
        .setDescription("Nhập các mã vận đơn, mỗi mã cách nhau bằng |")
        .setRequired(true)
    ),
];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Bắt đầu làm mới các lệnh (/) của ứng dụng.");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Đã làm mới thành công các lệnh (/) của ứng dụng.");
  } catch (error) {
    console.error("Lỗi khi làm mới các lệnh:", error);
  }
})();

// Hàm lấy thông tin đơn hàng
const fetchOrderDetails = async (cookiesArray, interaction = null) => {
  try {
    const data = await getOrderDetailsForCookie(cookiesArray);
    if (data && data.allOrderDetails) {
      const newOrders = data.allOrderDetails.flatMap((order) =>
        order.orderDetails.map((detail) => ({
          ...detail,
          cookie: order.cookie,
        }))
      );

      // Tạo mảng các embed cho mỗi đơn hàng
      const embeds = newOrders.map((order, index) => {
        const productName =
          (order.product_info &&
            order.product_info.length > 0 &&
            order.product_info[0].name) ||
          order.product_name ||
          order.name ||
          "Không có tên sản phẩm";

        const description = order.tracking_info_description || "Chưa có mô tả";

        // Xác định màu sắc dựa trên mô tả theo dõi
        let color = 0x9b59b6; // Mặc định màu tím

        if (
          description.includes(
            "Đơn hàng sẽ sớm được giao, vui lòng chú ý điện thoại"
          )
        ) {
          color = 0x3498db; // Màu xanh nước
        } else if (description.includes("Giao hàng thành công")) {
          color = 0x2ecc71; // Màu xanh lá
        } else if (description.includes("Đơn hàng đã được tạo")) {
          color = 0xe67e22; // Màu cam
        } else if (description.includes("Đơn vị vận chuyển đã lấy hàng")) {
          color = 0xf1c40f; // Màu vàng
        }

        // Lấy hình ảnh sản phẩm
        let imageUrl = null;
        if (order.product_info && order.product_info.length > 0) {
          imageUrl = `https://cf.shopee.vn/file/${order.product_info[0].image}`;
        }

        const formatPrice = (price) => {
          return (price / 100000).toLocaleString("vi-VN") + " VND";
        };

        const embed = new EmbedBuilder()
          .setTitle(`Đơn hàng ${index + 1}`)
          .setColor(color)
          .addFields(
            {
              name: "Mã vận đơn",
              value: order.tracking_number || "Không có mã vận đơn",
              inline: true,
            },
            {
              name: "Tên",
              value: order.address.shipping_name || "Không có tên",
              inline: true,
            },
            {
              name: "Số điện thoại",
              value: order.address.shipping_phone || "Không có SĐT",
              inline: true,
            },
            {
              name: "Mô tả theo dõi",
              value: `\`\`\`${description}\`\`\`` || "Không có thông tin",
              inline: true,
            },
            {
              name: "Sản phẩm",
              value: `\`\`\`${productName}\`\`\``,
              inline: true,
            },
            {
              name: "Địa chỉ",
              value:
                `\`\`\`${order.address.shipping_address}\`\`\`` ||
                "Không có địa chỉ",
              inline: false,
            }
          );

        // Nếu có hình ảnh, thêm vào embed
        if (imageUrl) {
          embed.setThumbnail(imageUrl);
        }

        return embed;
      });

      // Tạo các components (buttons) cho từng đơn hàng
      const components = newOrders.map((order, index) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`copy_tracking_${index}`)
            .setLabel(`Copy Mã Vận Đơn`) // Thêm số thứ tự
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`copy_cookie_${index}`)
            .setLabel(`Copy Cookie`) // Thêm số thứ tự
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`delete_cookie_${index}`)
            .setLabel(`Xóa Cookie`) // Thêm số thứ tự
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`get_order_info_${index}`) // Nút mới để lấy toàn bộ thông tin
            .setLabel(`Lấy Data`) // Thêm số thứ tự cho nút mới
            .setStyle(ButtonStyle.Success)
        );
      });

      // Lưu trữ danh sách đơn hàng vào state để sử dụng sau
      state.orders = newOrders;

      // Xóa các tin nhắn cũ nếu có
      if (state.ordersMessageIds && state.ordersMessageIds.length > 0) {
        try {
          const channel = await client.channels.fetch(state.trackingChannelId);
          for (const messageId of state.ordersMessageIds) {
            try {
              const message = await channel.messages.fetch(messageId);
              await message.delete();
            } catch (err) {
              console.error(`Không thể xóa tin nhắn ${messageId}:`, err);
            }
          }
          // Xóa danh sách ID sau khi xóa
          state.ordersMessageIds = [];
        } catch (err) {
          console.error('Lỗi khi xóa các tin nhắn cũ:', err);
        }
      }

      // Gửi tin nhắn mới và lưu trữ ID
      if (state.trackingChannelId) {
        try {
          const channel = await client.channels.fetch(state.trackingChannelId);

          for (let i = 0; i < embeds.length; i++) {
            const embed = embeds[i];
            const actionRow = components[i];

            const message = await channel.send({ embeds: [embed], components: [actionRow] });
            // Lưu trữ ID của tin nhắn
            state.ordersMessageIds.push(message.id);
          }
          saveState();
        } catch (error) {
          console.error("Lỗi khi gửi các embed riêng lẻ:", error);
        }
      } else if (interaction) {
        const channel = interaction.channel;
        state.trackingChannelId = channel.id; // Lưu ID kênh
        for (let i = 0; i < embeds.length; i++) {
          const embed = embeds[i];
          const actionRow = components[i];

          const message = await channel.send({ embeds: [embed], components: [actionRow] });
          // Lưu trữ ID của tin nhắn
          state.ordersMessageIds.push(message.id);
        }
        saveState();
      } else {
        console.error(
          "Không có interaction để gửi tin nhắn ban đầu, và không có trackingChannelId."
        );
      }
    } else {
      if (interaction) {
        await interaction.reply("Lỗi: Dữ liệu phản hồi không hợp lệ.");
      } else {
        console.error("Lỗi: Dữ liệu phản hồi không hợp lệ.");
      }
    }
  } catch (error) {
    if (interaction) {
      await interaction.reply(
        "Lỗi khi lấy thông tin đơn hàng: " + error.message
      );
    } else {
      console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    }
  }
};

// Xử lý lệnh slash
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === "cookie") {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "add") {
        const cookieValue = interaction.options.getString("cookie");
        if (!state.cookies.includes(cookieValue)) {
          state.cookies.push(cookieValue);
          saveState();
          const replyMessage = await interaction.reply({
            content: "Đã thêm",
            fetchReply: true,
            ephemeral: true
          });

          // Tự động xóa tin nhắn sau 15 giây
          setTimeout(() => replyMessage.delete(), 15000);

          // Cập nhật thông tin đơn hàng
          await fetchOrderDetails(state.cookies, interaction);
        } else {
          const replyMessage = await interaction.reply({
            content: "Cookie đã tồn tại",
            fetchReply: true,
            ephemeral: true
          });
          // Tự động xóa tin nhắn sau 15 giây
          setTimeout(() => replyMessage.delete(), 15000);
        }
      } else if (subcommand === "remove") {
        const cookieValue = interaction.options.getString("cookie");
        const index = state.cookies.indexOf(cookieValue);
        if (index !== -1) {
          state.cookies.splice(index, 1);
          saveState();
          const replyMessage = await interaction.reply({
            content: "Đã xoá",
            fetchReply: true,
            ephemeral: true
          });

          // Tự động xóa tin nhắn sau 15 giây
          setTimeout(() => replyMessage.delete(), 15000);

          // Cập nhật thông tin đơn hàng
          await fetchOrderDetails(state.cookies, interaction);
        } else {
          const replyMessage = await interaction.reply({
            content: "Không tìm thấy cookie",
            fetchReply: true,
            ephemeral: true
          });
          // Tự động xóa tin nhắn sau 15 giây
          setTimeout(() => replyMessage.delete(), 15000);
        }
      } else if (subcommand === "list") {
        if (state.cookies.length > 0) {
          const replyMessage = await interaction.reply({
            content: `Các cookie hiện có:\n${state.cookies.join("\n")}`,
            fetchReply: true,
            ephemeral: true
          });
          // Tự động xóa tin nhắn sau 30 giây
          setTimeout(() => replyMessage.delete(), 30000);
        } else {
          const replyMessage = await interaction.reply({
            content: "Không có cookie nào được lưu trữ",
            fetchReply: true,
            ephemeral: true
          });
          // Tự động xóa tin nhắn sau 30 giây
          setTimeout(() => replyMessage.delete(), 30000);
        }
      }
    } else if (commandName === "checkmvd") {
      const trackingInput = interaction.options.getString("tracking_list");

      // Phân tích danh sách mã vận đơn
      const trackingList = trackingInput.split("\n").map((line) => {
        const [trackingID, cellphone] = line
          .split("|")
          .map((item) => item.trim());
        return cellphone ? { trackingID, cellphone } : { trackingID };
      });

      state.trackingList = trackingList;
      saveState();

      const response = await checkMVD(trackingList);

      if (
        response &&
        response.trackingResults &&
        Array.isArray(response.trackingResults)
      ) {
        const embed = new EmbedBuilder().setTitle("Check Mã Vận Đơn SPX");

        response.trackingResults.forEach((result, index) => {
          let trackingID = result.trackingID;
          let message = result.result?.message || "Không có mô tả";
          let time = result.result?.time || "Không có giờ";

          // Chuyển đổi định dạng ngày thành dd/MM/yyyy
          let date = result.result?.date ? new Date(result.result.date) : null;
          let formattedDate = date
            ? `${date.getDate().toString().padStart(2, "0")}/${(
                date.getMonth() + 1
              )
                .toString()
                .padStart(2, "0")}/${date.getFullYear()}`
            : "Không có ngày";

          // Kiểm tra chuỗi message để thay đổi màu sắc của embed
          if (message.includes("Nhân viên giao hàng đang tiến hành giao")) {
            embed.setColor(0x3498db); // Màu xanh nước
          } else if (message.includes("Đơn hàng đã giao thành công")) {
            embed.setColor(0x2ecc71); // Màu xanh lá
          } else if (message.includes("Đơn hàng đã được tạo")) {
            embed.setColor(0xe67e22); // Màu cam
          } else if (message.includes("Đơn vị vận chuyển đã lấy hàng")) {
            embed.setColor(0xf1c40f); // Màu vàng
          } else {
            embed.setColor(0x9b59b6); // Màu tím cho các mô tả khác
          }

          embed.addFields(
            { name: "STT", value: `${index + 1}`, inline: true },
            { name: "Mã vận đơn", value: trackingID, inline: true },
            {
              name: "Ngày Giờ",
              value: `${time} ${formattedDate}`,
              inline: true,
            },
            { name: "Mô tả", value: message, inline: false }
          );
        });

        const replyMessage = await interaction.reply({
          embeds: [embed],
          fetchReply: true,
        });

        // Tự động xóa tin nhắn sau 30 giây
        setTimeout(() => replyMessage.delete(), 30000);
      } else {
        const replyMessage = await interaction.reply({
          content: "Lỗi khi lấy kết quả theo dõi",
          fetchReply: true,
        });

        // Tự động xóa tin nhắn sau 30 giây
        setTimeout(() => replyMessage.delete(), 30000);
      }
    }
  } else if (interaction.isButton()) {
    // Xử lý sự kiện khi nhấn nút
    const customId = interaction.customId;
    const indexMatch = customId.match(/_(\d+)$/);
    if (indexMatch) {
      const index = parseInt(indexMatch[1], 10);
      const order = state.orders[index];
      if (!order) {
        return await interaction.reply({
          content: "Không tìm thấy đơn hàng.",
          ephemeral: true,
        });
      }

      if (customId.startsWith("copy_tracking_")) {
        // Xử lý copy mã vận đơn
        await interaction.reply({
          content: `${order.tracking_number}`,
          ephemeral: true,
        });
      } else if (customId.startsWith("copy_cookie_")) {
        // Xử lý copy cookie
        await interaction.reply({
          content: `${order.cookie}`,
          ephemeral: true,
        });
      } else if (customId.startsWith("get_order_info_")) {
        // Tính toán lại tên sản phẩm từ thông tin đơn hàng
        const productName =
          (order.product_info &&
            order.product_info.length > 0 &&
            order.product_info[0].name) ||
          order.product_name ||
          order.name ||
          "Không có tên sản phẩm";

        // Xử lý hiển thị toàn bộ thông tin đơn hàng
        await interaction.reply({
          content: `Thông tin đơn hàng:\n- Mã vận đơn: ${order.tracking_number}\n- Tên: ${order.address.shipping_name}\n- Số điện thoại: ${order.address.shipping_phone}\n- Địa chỉ: ${order.address.shipping_address}\n- Mô tả theo dõi: ${order.tracking_info_description}\n- Sản phẩm: ${productName}`,
          ephemeral: true,
        });
      } else if (customId.startsWith("delete_cookie_")) {
        // Xử lý xóa cookie
        const cookieIndex = state.cookies.indexOf(order.cookie);
        if (cookieIndex !== -1) {
          state.cookies.splice(cookieIndex, 1);
          saveState();
          await interaction.reply({
            content: "Đã xóa cookie.",
            ephemeral: true,
          });
          // Cập nhật thông tin đơn hàng sau khi xóa cookie
          await fetchOrderDetails(state.cookies);
        } else {
          await interaction.reply({
            content: "Không tìm thấy cookie để xóa.",
            ephemeral: true,
          });
        }
      } else {
        await interaction.reply({
          content: "Tác vụ không hợp lệ.",
          ephemeral: true,
        });
      }
    } else {
      await interaction.reply({
        content: "Tác vụ không hợp lệ.",
        ephemeral: true,
      });
    }
  }
});

// Cài đặt tự động cập nhật mỗi 15 phút
setInterval(async () => {
  if (
    state.trackingMessageId &&
    state.trackingChannelId &&
    state.cookies.length > 0
  ) {
    try {
      await fetchOrderDetails(state.cookies);

      // Ghi ra console thời gian cập nhật
      console.log(`Cập nhật vào lúc: ${new Date().toLocaleString()}`);
    } catch (error) {
      console.error("Lỗi khi cập nhật tin nhắn:", error);
    }
  }
}, 15 * 60 * 1000); // Mỗi 15 phút (15 * 60 * 1000)

// const logFullOrderDetails = async (cookiesArray) => {
//   try {
//     const data = await getOrderDetailsForCookie(cookiesArray);
//     console.log("Full Order Details:", JSON.stringify(data, null, 2));
//   } catch (error) {
//     console.error("Error fetching full order details:", error);
//   }
// };

// Khi bot sẵn sàng
client.once("ready", () => {
  console.log(`Đăng nhập thành công với tên ${client.user.tag}!`);
  
  if (state.cookies.length > 0) {
    // logFullOrderDetails(state.cookies); // Gọi hàm để in toàn bộ thông tin ra console
    
    if (state.trackingChannelId && state.ordersMessageIds.length > 0) {
      // Xóa tin nhắn cũ khi khởi động
      setImmediate(async () => {
        try {
          const channel = await client.channels.fetch(state.trackingChannelId);
          for (const messageId of state.ordersMessageIds) {
            try {
              const message = await channel.messages.fetch(messageId);
              await message.delete();
            } catch (err) {
              console.error(`Không thể xóa tin nhắn ${messageId}:`, err);
            }
          }
          // Xóa danh sách ID sau khi xóa
          state.ordersMessageIds = [];
          saveState();

          // Sau đó, cập nhật thông tin đơn hàng
          await fetchOrderDetails(state.cookies);

          console.log(`Cập nhật vào lúc: ${new Date().toLocaleString()}`);
        } catch (error) {
          console.error("Lỗi khi cập nhật tin nhắn khi khởi động:", error);
        }
      });
    } else {
      // Nếu không có tin nhắn cũ, chỉ cần cập nhật thông tin đơn hàng
      fetchOrderDetails(state.cookies);
    }
  }
});

client.login(token);
