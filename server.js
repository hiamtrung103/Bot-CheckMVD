const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const stateFilePath = './state.json';

// Middleware để phục vụ các tệp tĩnh trong thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API để lấy thông tin đơn hàng từ state.json
app.get('/api/orders', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    res.json({ orders: state.orders });
  } catch (err) {
    res.status(500).json({ error: 'Unable to read state file.' });
  }
});

// Hàm để tự động cập nhật dữ liệu từ state.json và ghi log
const updateOrdersData = () => {
  try {
    const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));

    // Ghi log trạng thái cập nhật
    console.log(`Cập nhật dữ liệu đơn hàng vào lúc: ${new Date().toLocaleString()}`);
    
    // Nếu muốn cập nhật và xử lý thêm logic tại đây, bạn có thể thêm vào

  } catch (error) {
    console.error(`Lỗi khi cập nhật dữ liệu từ state.json: ${error.message}`);
  }
};

// Tự động cập nhật mỗi 15 phút
setInterval(updateOrdersData, 15 * 60 * 1000); // 15 phút

// Gọi hàm cập nhật ngay khi server khởi động
updateOrdersData();

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
