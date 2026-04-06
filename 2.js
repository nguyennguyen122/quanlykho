// ✅ LINK API
const API = "https://script.google.com/macros/s/AKfycbz8niPLQwfK9jueW25wYlDY2qxUwt9pQQ73ojhhEePcQZ_B45Zes9_6GWoPZLL3hRkwrQ/exec";

// 🔥 1 bao = 50kg
const KG_PER_BAO = 50;


// 🔹 FORMAT NGÀY
function formatDate(dateStr) {
    if (!dateStr) return "Chưa cập nhật";

    if (typeof dateStr === "string" && dateStr.includes("/")) {
        return dateStr;
    }

    let d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Chưa cập nhật";

    return d.toLocaleString("vi-VN");
}


// 🔹 LOAD KHO
async function loadData() {
    try {
        let res = await fetch(API);
        let data = await res.json();

        let keyword = document.getElementById("search").value.toLowerCase();
        let table = document.getElementById("table");

        let totalKg = 0;
        let totalBao = 0;

        table.innerHTML = "";

        data.forEach(item => {
            let name = item.name || "";
            let quantity = Number(item.quantity) || 0;

            if (name.toLowerCase().includes(keyword)) {
                totalBao += quantity;
                totalKg += quantity * KG_PER_BAO;
            }
        });

        // 🔥 cập nhật tổng trên header
        document.getElementById("total").innerText =
            `Tổng: ${totalBao} bao (${totalKg.toLocaleString()} kg)`;

        let first = true;

        data.forEach(item => {
            let name = item.name || "";
            let quantity = Number(item.quantity) || 0;
            let location = item.location || "";
            let date = formatDate(item.date);

            let kg = quantity * KG_PER_BAO;

            if (name.toLowerCase().includes(keyword)) {

                table.innerHTML += `
                    <tr>
                        <td>${name}</td>
                        <td>${quantity}</td>
                        <td>${kg.toLocaleString()}</td>
                        <td>${location}</td>
                        <td>${date}</td>
                        <td>${first ? totalKg.toLocaleString() : ""}</td>
                    </tr>
                `;

                first = false;
            }
        });

    } catch (error) {
        console.error("Lỗi load data:", error);
        alert("Không lấy được dữ liệu!");
    }
}


// 🔹 LOAD LOG (LỊCH SỬ)
async function loadLog() {
    try {
        let res = await fetch(API + "?type=log");
        let data = await res.json();

        let table = document.getElementById("logTable");
        if (!table) return;

        table.innerHTML = "";

        data.reverse().forEach(item => {
            table.innerHTML += `
                <tr>
                    <td>${formatDate(item.date)}</td>
                    <td>${item.name}</td>
                    <td style="color:${item.type === "import" ? "green" : "red"}">
                        ${item.type}
                    </td>
                    <td>${item.quantity}</td>
                    <td>${item.location}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Lỗi load log:", err);
    }
}


// 🔹 NHẬP / XUẤT
async function handle(type) {
    let name = document.getElementById("name").value.trim();
    let quantity = parseInt(document.getElementById("quantity").value);
    let location = document.getElementById("location").value.trim();

    if (!name || isNaN(quantity) || quantity <= 0) {
        alert("Nhập dữ liệu hợp lệ!");
        return;
    }

    let now = new Date();
    let date = new Date().getTime(); // 🔥 dùng timestamp

    try {
        updateUIInstant(name, quantity, type, location, now);

        let res = await fetch(API, {
            method: "POST",
            body: JSON.stringify({
                name,
                quantity,
                type,
                location,
                date
            })
        });

        let text = await res.text();

        if (text === "not enough") {
            alert("Không đủ hàng!");
            loadData();
            return;
        }

        setTimeout(() => {
            loadData();
            loadLog(); // 🔥 cập nhật log luôn
        }, 500);

    } catch (error) {
        console.error("Lỗi gửi dữ liệu:", error);
        alert("Lỗi kết nối API!");
    }
}


// 🔥 UPDATE UI NGAY
function updateUIInstant(name, quantity, type, location, dateObj) {
    let table = document.getElementById("table");
    let rows = table.querySelectorAll("tr");

    for (let row of rows) {
        let cellName = row.children[0]?.innerText;

        if (cellName === name) {
            let currentQty = parseInt(row.children[1].innerText) || 0;

            currentQty += (type === "import" ? quantity : -quantity);

            let kg = currentQty * KG_PER_BAO;

            row.children[1].innerText = currentQty;
            row.children[2].innerText = kg.toLocaleString();
            row.children[3].innerText = location;
            row.children[4].innerText = dateObj.toLocaleString("vi-VN");

            return;
        }
    }

    let kg = quantity * KG_PER_BAO;

    table.innerHTML += `
        <tr style="background:#d4edda">
            <td>${name}</td>
            <td>${quantity}</td>
            <td>${kg.toLocaleString()}</td>
            <td>${location}</td>
            <td>${dateObj.toLocaleString("vi-VN")}</td>
            <td></td>
        </tr>
    `;
}


// 🔹 BÁO CÁO
async function report() {
    let res = await fetch(API + "?type=log");
    let data = await res.json();

    let importTotal = 0;
    let exportTotal = 0;

    data.forEach(item => {
        if (item.type === "import") importTotal += item.quantity;
        else exportTotal += item.quantity;
    });

    alert(`
📊 BÁO CÁO

Tổng nhập: ${importTotal}
Tổng xuất: ${exportTotal}
Tồn: ${importTotal - exportTotal}
    `);
}


// 🔥 LOAD KHI MỞ WEB
window.onload = () => {
    loadData();
    loadLog();
};