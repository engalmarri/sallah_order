let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartSearch = document.getElementById("cartSearch");
const customerNameInput = document.getElementById("customerName");
const invoiceNoElement = document.getElementById("invoiceNo");
const invoiceDateElement = document.getElementById("invoiceDate");
const invoiceCustomerElement = document.getElementById("invoiceCustomer");
const invoiceProducts = document.getElementById("invoiceProducts");
const invoiceTotalElement = document.getElementById("invoiceTotal");
const invoiceQtyElement = document.getElementById("invoiceQty");
const invoiceTemplate = document.getElementById("invoiceTemplate");
const COLUMNS_PER_INVOICE_ROW = 3;

function escapeHTML(value){
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function getItemQty(item){
  const qty = parseInt(item.qty,10);
  return isNaN(qty) || qty < 1 ? 1 : qty;
}

function getProductImage(item){
  if(item.image && typeof item.image === "string" && item.image.trim() !== ""){
    return item.image;
  }
  return "images/noimg.jpg";
}

function saveCart(){
  localStorage.setItem("cart",JSON.stringify(cart));
}

function getCartTotalQty(){
  return cart.reduce((sum,item)=> sum + getItemQty(item),0);
}

function renderCart(){
  if(!cartItems) return;

  cartItems.innerHTML = "";

  const searchText = cartSearch ? cartSearch.value.trim().toLowerCase() : "";

  cart.forEach(item=>{
    const productText = `${item.name || ""} ${item.description || ""} ${item.code || ""}`.toLowerCase();

    if(searchText && !productText.includes(searchText)){
      return;
    }

    cartItems.insertAdjacentHTML("beforeend",`
      <div class="cart-item">
        <img src="${escapeHTML(getProductImage(item))}" alt="${escapeHTML(item.name || "Product")}" onerror="this.src='images/noimg.jpg'">

        <div class="info">
          <h3>${escapeHTML(item.name || "")}</h3>
          <p>${escapeHTML(item.description || "")}</p>
          <p>SKU : ${escapeHTML(item.code || "")}</p>

          <div class="qty-controls">
            <button type="button" data-action="decrease" data-id="${escapeHTML(item.id)}">-</button>
            <input type="number" min="1" value="${getItemQty(item)}" class="qty-input" data-id="${escapeHTML(item.id)}">
            <button type="button" data-action="increase" data-id="${escapeHTML(item.id)}">+</button>
          </div>
        </div>

        <button type="button" class="delete-cart-item" data-action="delete" data-id="${escapeHTML(item.id)}">حذف</button>
      </div>
    `);
  });

  if(cartTotal){
    cartTotal.textContent = getCartTotalQty();
  }

  saveCart();
}

function findItem(id){
  return cart.find(item => String(item.id) === String(id));
}

function increaseQty(id){
  const item = findItem(id);
  if(!item) return;
  item.qty = getItemQty(item) + 1;
  renderCart();
}

function decreaseQty(id){
  const item = findItem(id);
  if(!item) return;

  item.qty = getItemQty(item) - 1;

  if(item.qty <= 0){
    cart = cart.filter(product => String(product.id) !== String(id));
  }

  renderCart();
}

function updateQty(id,value){
  const item = findItem(id);
  if(!item) return;

  const qty = parseInt(value,10);
  item.qty = isNaN(qty) || qty < 1 ? 1 : qty;
  renderCart();
}

function deleteItem(id){
  cart = cart.filter(product => String(product.id) !== String(id));
  renderCart();
}

function makeInvoiceNumber(){
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2,"0");
  const day = String(now.getDate()).padStart(2,"0");
  const hours = String(now.getHours()).padStart(2,"0");
  const minutes = String(now.getMinutes()).padStart(2,"0");
  const seconds = String(now.getSeconds()).padStart(2,"0");
  return `INV-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function formatInvoiceDate(){
  return new Date().toLocaleString("ar-SA",{
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
    hour:"2-digit",
    minute:"2-digit"
  });
}

function getInvoiceCustomerName(){
  const name = customerNameInput ? customerNameInput.value.trim() : "";
  return name || "عميل مباشر";
}

function getItemDetails(item){
  const details = [];

  if(item.code){
    details.push(`SKU: ${escapeHTML(item.code)}`);
  }

  if(item.description){
    details.push(escapeHTML(item.description));
  }

  return details.join(" | ");
}

function createInvoiceCells(item,index){
  const details = getItemDetails(item);

  return `
    <td class="invoice-check-cell">
      <span class="invoice-check-box"></span>
    </td>
    <td class="invoice-product-cell">
      <div class="invoice-product-main">
        <span class="invoice-product-number">${index}</span>
        <strong>${escapeHTML(item.name || "")}</strong>
      </div>
      ${details ? `<div class="invoice-product-details">${details}</div>` : ""}
    </td>
    <td class="invoice-qty-cell">${getItemQty(item)}</td>
  `;
}

function createEmptyInvoiceCells(){
  return `
    <td class="invoice-check-cell invoice-empty-cell"></td>
    <td class="invoice-product-cell invoice-empty-cell"></td>
    <td class="invoice-qty-cell invoice-empty-cell"></td>
  `;
}

function renderInvoiceProducts(){
  if(!invoiceProducts) return;

  invoiceProducts.innerHTML = "";

  for(let index = 0; index < cart.length; index += COLUMNS_PER_INVOICE_ROW){
    const rowItems = cart.slice(index,index + COLUMNS_PER_INVOICE_ROW);
    let rowHTML = "";

    rowItems.forEach((item,rowIndex)=>{
      rowHTML += createInvoiceCells(item,index + rowIndex + 1);
    });

    for(let empty = rowItems.length; empty < COLUMNS_PER_INVOICE_ROW; empty++){
      rowHTML += createEmptyInvoiceCells();
    }

    invoiceProducts.insertAdjacentHTML("beforeend",`<tr>${rowHTML}</tr>`);
  }
}

function waitForImages(container){
  const images = container.querySelectorAll("img");

  return Promise.all(Array.from(images).map(img=>{
    return new Promise(resolve=>{
      if(img.complete){
        resolve();
        return;
      }

      img.onload = ()=>resolve();
      img.onerror = ()=>resolve();
      setTimeout(resolve,2000);
    });
  }));
}

async function createInvoice(){
  if(cart.length === 0){
    alert("السلة فارغة");
    return;
  }

  if(!invoiceTemplate || !invoiceNoElement || !invoiceDateElement || !invoiceCustomerElement || !invoiceTotalElement || !invoiceQtyElement){
    alert("قالب الفاتورة غير موجود في الصفحة");
    return;
  }

  const invoiceNo = makeInvoiceNumber();

  invoiceNoElement.textContent = invoiceNo;
  invoiceDateElement.textContent = formatInvoiceDate();
  invoiceCustomerElement.textContent = getInvoiceCustomerName();

  renderInvoiceProducts();

  invoiceTotalElement.textContent = cart.length;
  invoiceQtyElement.textContent = getCartTotalQty();

  await waitForImages(invoiceTemplate);

  const canvas = await html2canvas(invoiceTemplate,{
    scale:2,
    useCORS:true,
    backgroundColor:"#ffffff",
    windowWidth:invoiceTemplate.scrollWidth,
    windowHeight:invoiceTemplate.scrollHeight
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new window.jspdf.jsPDF("P","mm","A4");
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData,"PNG",0,position,imgWidth,imgHeight);
  heightLeft -= pageHeight;

  while(heightLeft > 0){
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData,"PNG",0,position,imgWidth,imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${invoiceNo}.pdf`);
}

if(cartItems){
  cartItems.addEventListener("click",event=>{
    const button = event.target.closest("button[data-action]");
    if(!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if(action === "increase") increaseQty(id);
    if(action === "decrease") decreaseQty(id);
    if(action === "delete") deleteItem(id);
  });

  cartItems.addEventListener("change",event=>{
    const input = event.target.closest(".qty-input");
    if(!input) return;
    updateQty(input.dataset.id,input.value);
  });
}

if(cartSearch){
  cartSearch.addEventListener("input",renderCart);
}

const createInvoiceButton = document.getElementById("createInvoice");

if(createInvoiceButton){
  createInvoiceButton.addEventListener("click",createInvoice);
}

const whatsappButton = document.getElementById("whatsappBtn");

if(whatsappButton){
  whatsappButton.addEventListener("click",()=>{
    window.open("https://wa.me/966538647362","_blank");
  });
}

renderCart();
