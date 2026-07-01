let cart = [];

try {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
} catch {
  cart = [];
}

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartSearch = document.getElementById("cartSearch");
const invoiceTemplate = document.getElementById("invoiceTemplate");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function getProductImage(item) {
  if (item && typeof item.image === "string" && item.image.trim()) {
    return item.image;
  }
  return "images/noimg.jpg";
}

function formatDateTime() {
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
}

function renderCart() {
  if (!cartItems) return;

  cartItems.innerHTML = "";

  const searchText = cartSearch ? cartSearch.value.trim().toLowerCase() : "";
  let totalProducts = 0;

  const filteredCart = cart.filter((item) => {
    if (!searchText) return true;
    const haystack = `${item.name || ""} ${item.description || ""} ${item.code || ""}`.toLowerCase();
    return haystack.includes(searchText);
  });

  filteredCart.forEach((item) => {
    const qty = Number(item.qty || 1);
    totalProducts += qty;

    const image = getProductImage(item);
    const name = escapeHtml(item.name || "");
    const description = escapeHtml(item.description || "");
    const code = escapeHtml(item.code || "");
    const itemId = JSON.stringify(String(item.id ?? ""));

    cartItems.insertAdjacentHTML(
      "beforeend",
      `
        <article class="cart-item">
          <img src="${image}" alt="${name}" onerror="this.src='images/noimg.jpg'">
          <div class="info">
            <h3>${name}</h3>
            <p>${description}</p>
            <p>SKU : ${code}</p>
            <div class="qty-row">
              <button class="qty-btn" onclick='decreaseQty(${itemId})'>-</button>
              <input
                type="number"
                min="1"
                value="${qty}"
                class="qty-input"
                onchange='updateQty(${itemId}, this.value)'
              >
              <button class="qty-btn" onclick='increaseQty(${itemId})'>+</button>
            </div>
          </div>
          <button class="delete-btn" onclick='deleteItem(${itemId})'>🗑</button>
        </article>
      `
    );
  });

  cartTotal.textContent = totalProducts;
  localStorage.setItem("cart", JSON.stringify(cart));
}

window.increaseQty = function increaseQty(id) {
  const item = cart.find((product) => product.id === id);
  if (!item) return;
  item.qty = Number(item.qty || 1) + 1;
  renderCart();
};

window.decreaseQty = function decreaseQty(id) {
  const item = cart.find((product) => product.id === id);
  if (!item) return;

  item.qty = Number(item.qty || 1) - 1;
  if (item.qty <= 0) {
    cart = cart.filter((product) => product.id !== id);
  }

  renderCart();
};

window.updateQty = function updateQty(id, value) {
  const item = cart.find((product) => product.id === id);
  if (!item) return;

  const qty = parseInt(value, 10);
  item.qty = Number.isNaN(qty) || qty < 1 ? 1 : qty;
  renderCart();
};

window.deleteItem = function deleteItem(id) {
  cart = cart.filter((product) => product.id !== id);
  renderCart();
};

document.getElementById("whatsappBtn").addEventListener("click", () => {
  window.open("https://wa.me/966538647362", "_blank");
});

document.getElementById("createInvoice").addEventListener("click", async () => {
  if (!cart.length) {
    alert("السلة فارغة");
    return;
  }

  const invoiceNo = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  const invoiceNoEl = document.getElementById("invoiceNo");
  const invoiceDateEl = document.getElementById("invoiceDate");
  const invoiceCustomerEl = document.getElementById("invoiceCustomer");
  const invoiceProductsEl = document.getElementById("invoiceProducts");
  const invoiceTotalEl = document.getElementById("invoiceTotal");
  const invoiceQtyEl = document.getElementById("invoiceQty");

  invoiceNoEl.textContent = invoiceNo;
  invoiceDateEl.textContent = formatDateTime();
  invoiceCustomerEl.textContent = document.getElementById("customerName").value.trim() || "البيع المباشر";

  invoiceProductsEl.innerHTML = "";

  let totalQty = 0;

  cart.forEach((item, index) => {
    const qty = Number(item.qty || 1);
    totalQty += qty;

    const image = getProductImage(item);
    const name = escapeHtml(item.name || "");
    const description = escapeHtml(item.description || "");
    const code = escapeHtml(item.code || "");

    invoiceProductsEl.insertAdjacentHTML(
      "beforeend",
      `
        <tr>
          <td><span class="item-box"></span></td>
          <td>${index + 1}</td>
          <td class="invoice-product-name">
            ${name}
            ${description ? `<span class="invoice-product-desc">${description}</span>` : ""}
          </td>
          <td>${code || "-"}</td>
          <td>${qty}</td>
        </tr>
      `
    );
  });

  invoiceTotalEl.textContent = cart.length;
  invoiceQtyEl.textContent = totalQty;

  const images = invoiceTemplate.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map((img) => new Promise((resolve) => {
      if (img.complete) {
        resolve();
        return;
      }

      img.onload = () => resolve();
      img.onerror = () => {
        img.src = "images/noimg.jpg";
        resolve();
      };

      setTimeout(resolve, 2000);
    }))
  );

  const canvas = await html2canvas(invoiceTemplate.querySelector(".invoice-sheet"), {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${invoiceNo}.pdf`);
});

if (cartSearch) {
  cartSearch.addEventListener("input", renderCart);
}

renderCart();
